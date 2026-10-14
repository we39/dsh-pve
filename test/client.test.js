import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// ── 浏览器 bundle 加载与最小 React 替身 ────────────────────────────────

// 在 vm 沙箱里加载浏览器 bundle。react 参数用于注入 useState/useEffect 替身。
function loadBrowserModule(react = {}) {
  let definition;
  const window = {
    __ModuleLoader__: {
      load(value) {
        definition = value;
      },
    },
    confirm: () => window.confirmAnswer ?? true,
  };
  vm.runInNewContext(readFileSync(new URL("../client.js", import.meta.url), "utf8"), {
    URL,
    window,
    queueMicrotask,
    crypto: globalThis.crypto,
  });
  const runtime = definition.factory((id) => {
    if (id === "react/jsx-runtime") {
      const node = (type, props) => ({ type, props });
      return { jsx: node, jsxs: node };
    }
    if (id === "react")
      return { createElement: (type, props) => ({ type, props }), ...react };
    throw new Error(`Unexpected browser dependency: ${id}`);
  });
  return { definition, runtime, window };
}

// 模拟宿主的槛位系统：declared 里有的槛位 inject 时立刻触发回调；
// 之后 declare()/undeclare() 可以模拟迟到声明与撤销。
function buildCtx({ declared = {}, withSpec = true, remote = {} } = {}) {
  const specs = new Map(Object.entries(declared));
  const waiting = new Map();
  const live = new Map();
  const registered = [];
  const slots = {
    inject(name, callback) {
      const entry = { callback, cleanup: undefined };
      waiting.set(name, [...(waiting.get(name) ?? []), entry]);
      if (specs.has(name)) entry.cleanup = callback();
      return () => {
        entry.cleanup?.();
        entry.cleanup = undefined;
        waiting.set(
          name,
          (waiting.get(name) ?? []).filter((item) => item !== entry),
        );
      };
    },
    register(options, component) {
      const row = { options, component };
      registered.push(row);
      live.set(row, true);
      return () => live.delete(row);
    },
  };
  if (withSpec) slots.spec = (name) => specs.get(name);
  const ctx = {
    slots,
    effect(fn) {
      return fn();
    },
    get(name) {
      return name.startsWith("remote.") ? remote[name.slice(7)] : undefined;
    },
  };
  return {
    ctx,
    registered,
    liveNames: () => [...live.keys()].map((row) => row.options.name),
    declare(name, spec) {
      specs.set(name, spec);
      for (const entry of waiting.get(name) ?? []) entry.cleanup = entry.callback();
    },
    undeclare(name) {
      specs.delete(name);
      for (const entry of waiting.get(name) ?? []) {
        entry.cleanup?.();
        entry.cleanup = undefined;
      }
    },
  };
}

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

const SECTION = { kind: "list", scope: "root" };
const TAB = { kind: "list", scope: "root" };
const ITEM = { kind: "keyed" };

// ── inject 面：缺服务不能让插件卡死 ───────────────────────────────────

test("client inject only needs slots, so a missing remote service cannot park the plugin", () => {
  const { runtime } = loadBrowserModule();
  assert.equal(JSON.stringify(runtime.inject), JSON.stringify(["slots"]));
});

// ── 设置入口注册：按宿主代际选择唯一槛位 ──────────────────────────────

test("0.2.0 host: registers the standalone settings.section entry only", async () => {
  const { runtime } = loadBrowserModule();
  const host = buildCtx({
    declared: { "settings.section": SECTION, "settings.plugins.tab": TAB },
  });
  runtime.apply(host.ctx);
  await tick();
  assert.equal(JSON.stringify(host.liveNames()), JSON.stringify(["settings.section"]));
  const row = host.registered[0];
  assert.equal(row.options.id, "pve");
  assert.equal(row.options.label, "Proxmox VE");
});

test("0.1.7 host: falls back to the settings.plugins.tab entry", async () => {
  const { runtime } = loadBrowserModule();
  const host = buildCtx({ declared: { "settings.plugins.tab": TAB } });
  runtime.apply(host.ctx);
  await tick();
  assert.equal(JSON.stringify(host.liveNames()), JSON.stringify(["settings.plugins.tab"]));
});

test("legacy host that only declares the keyed settings.plugin.item slot still gets the card", async () => {
  const { runtime } = loadBrowserModule();
  const host = buildCtx({ declared: { "settings.plugin.item": ITEM } });
  runtime.apply(host.ctx);
  await tick();
  assert.equal(JSON.stringify(host.liveNames()), JSON.stringify(["settings.plugin.item"]));
  assert.equal(host.registered[0].options.key, "pve");
});

test("slot kind mismatch is not treated as an available entry", async () => {
  const { runtime } = loadBrowserModule();
  const host = buildCtx({ declared: { "settings.section": { kind: "keyed" } } });
  runtime.apply(host.ctx);
  await tick();
  assert.equal(host.liveNames().length, 0);
});

test("a late settings.section declaration replaces the tab entry without duplicating", async () => {
  const { runtime } = loadBrowserModule();
  const host = buildCtx({ declared: { "settings.plugins.tab": TAB } });
  runtime.apply(host.ctx);
  await tick();
  host.declare("settings.section", SECTION);
  await tick();
  assert.equal(JSON.stringify(host.liveNames()), JSON.stringify(["settings.section"]));
  host.undeclare("settings.section");
  await tick();
  assert.equal(JSON.stringify(host.liveNames()), JSON.stringify(["settings.plugins.tab"]));
});

test("host without slots.spec keeps the legacy single registration", () => {
  const { runtime } = loadBrowserModule();
  const host = buildCtx({
    withSpec: false,
    declared: { "settings.plugins.tab": TAB, "settings.plugin.item": ITEM },
  });
  runtime.apply(host.ctx);
  // 没有 spec 探测能力的老宿主：按候选顺序逐个尝试注册（跳过 settings.section，
  // 因为它不在旧式候选列表里），settings.plugins.tab 与 settings.plugin.item 都注册。
  assert.equal(
    JSON.stringify(host.liveNames().sort()),
    JSON.stringify(["settings.plugin.item", "settings.plugins.tab"]),
  );
});

// ── face：remote 服务缺失时的报错而非静默失败 ─────────────────────────

async function faceFrom(remote) {
  const { runtime } = loadBrowserModule();
  const host = buildCtx({ declared: { "settings.section": SECTION }, remote });
  runtime.apply(host.ctx);
  await tick();
  return host.registered[0].component().props.pveCard;
}

test("describe throws HOST_UNSUPPORTED when remote.settings/credentials are absent", async () => {
  const face = await faceFrom({});
  await assert.rejects(() => face.describe(), /HOST_UNSUPPORTED/);
});

test("describe succeeds and reports configured flags when remote services are present", async () => {
  const remote = {
    credentials: {
      async describe(refs) {
        assert.equal(JSON.stringify(refs), JSON.stringify(["PVE_API_TOKEN_SECRET", "PVE_API_PASSWORD"]));
        return { ok: true, value: { PVE_API_TOKEN_SECRET: { configured: true } } };
      },
    },
    settings: {
      async describe() {
        return {
          ok: true,
          value: {
            namespaces: [
              {
                ns: "pve",
                value: { baseUrl: "https://pve.example.com", tokenId: "root@pam!dsh" },
              },
            ],
          },
        };
      },
    },
  };
  const face = await faceFrom(remote);
  const r = await face.describe();
  assert.equal(r.baseConfigured, true);
  assert.equal(r.tokenConfigured, true);
  assert.equal(r.secretConfigured, true);
  assert.equal(r.passwordConfigured, false);
});
