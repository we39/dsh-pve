import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";

import {
  apply,
  generateSourceId,
  internals,
  normalizeSourceName,
  passwordRefForId,
  secretRefForId,
} from "../index.js";

const LEGACY_AK = "PVE_API_TOKEN_SECRET";
const LEGACY_SK = "PVE_API_PASSWORD";

function toolByName(tools, name) {
  const tool = tools.find((candidate) => candidate.name === name);
  assert.ok(tool, `missing tool ${name}`);
  return tool;
}

const execution = () => ({ signal: new AbortController().signal });

// 启动一个记录每次收到的请求（method/path/headers）的真实本地 HTTP server，
// 并按配置好的 { path: response } 规则返回数据。用真实网络栈而不是 mock
// node:http/https，这样能验证 rawRequest 的实际行为而不只是调用约定。
async function startServer(responder) {
  const calls = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      calls.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body,
      });
      const reply = responder ? responder(req, body) : { status: 200, data: {} };
      res.writeHead(reply.status ?? 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: reply.data ?? {} }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    calls,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// 模拟 0.2.0 宿主：settings 服务只有 describe/update/mutate，没有 register。
// state.value 是宿主解析后的实时配置，update 做浅合并并推进 revision。
function createHost({
  value = {},
  creds = {},
  failUpdate = null,
  hasRegister = false,
  emptyDescribes = 0,
} = {}) {
  const tools = [];
  const listeners = new Map();
  const updates = [];
  const state = { value: { ...value }, revision: 1 };
  const credState = { ...creds };
  let remainingEmpty = emptyDescribes;
  const settings = {
    describe: () => {
      if (remainingEmpty > 0) {
        remainingEmpty -= 1;
        return [];
      }
      return [{ ns: "pve", value: { ...state.value }, revision: state.revision }];
    },
    async update(ns, patch, revision) {
      updates.push({ ns, patch, revision });
      if (failUpdate) throw new Error(failUpdate);
      state.value = { ...state.value, ...patch };
      state.revision += 1;
    },
  };
  if (hasRegister) {
    settings.register = (_ns, schema, options = {}) => ({
      get: () => schema({ ...options.base, ...state.value }),
    });
  }
  const ctx = {
    credentials: {
      async resolve(ref) {
        return credState[ref] ? { value: credState[ref] } : undefined;
      },
    },
    inject(services, callback) {
      if (!services.includes("settings")) return;
      callback({
        ...ctx,
        effect(setup) {
          setup();
        },
        settings,
      });
    },
    on(name, listener) {
      listeners.set(name, listener);
      return () => listeners.delete(name);
    },
    systemPrompt: { section() {} },
    tools: {
      register(tool) {
        tools.push(tool);
        return () => {};
      },
    },
  };
  return { ctx, tools, listeners, state, updates, credState };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function twoTokenSources(baseA, baseB) {
  return {
    sources: [
      {
        id: "id-prod",
        name: "prod",
        baseUrl: baseA,
        authMode: "token",
        tokenId: "root@pam!prod",
        akRef: "AK_PROD",
      },
      {
        id: "id-stg",
        name: "staging",
        baseUrl: baseB,
        authMode: "token",
        tokenId: "root@pam!stg",
        akRef: "AK_STG",
      },
    ],
    defaultSource: "id-prod",
  };
}

// ── 源站选择与隔离（真实本地 HTTP server）────────────────────────────

test("each source is routed to its own URL and signed with its own token", async () => {
  const serverA = await startServer();
  const serverB = await startServer();
  try {
    const host = createHost({
      value: twoTokenSources(serverA.baseUrl, serverB.baseUrl),
      creds: { AK_PROD: "secret-prod", AK_STG: "secret-stg" },
    });
    apply(host.ctx, {});
    const list = toolByName(host.tools, "pve_version");
    await list.execute({ source: "prod" }, execution());
    await list.execute({ source: "staging" }, execution());
    assert.equal(serverA.calls.length, 1);
    assert.equal(serverB.calls.length, 1);
    assert.match(serverA.calls[0].headers.authorization, /PVEAPIToken root@pam!prod=secret-prod/);
    assert.match(serverB.calls[0].headers.authorization, /PVEAPIToken root@pam!stg=secret-stg/);
  } finally {
    await serverA.close();
    await serverB.close();
  }
});

test("omitting source uses the configured default; a source can be selected by id too", async () => {
  const serverA = await startServer();
  const serverB = await startServer();
  try {
    const host = createHost({
      value: twoTokenSources(serverA.baseUrl, serverB.baseUrl) && {
        ...twoTokenSources(serverA.baseUrl, serverB.baseUrl),
        defaultSource: "id-stg",
      },
      creds: { AK_PROD: "secret-prod", AK_STG: "secret-stg" },
    });
    apply(host.ctx, {});
    const list = toolByName(host.tools, "pve_version");
    await list.execute({}, execution());
    await list.execute({ source: "id-prod" }, execution());
    assert.equal(serverB.calls.length, 1, "default (staging) got the first call");
    assert.equal(serverA.calls.length, 1, "explicit id-prod got the second call");
  } finally {
    await serverA.close();
    await serverB.close();
  }
});

test("concurrent calls to different sources never cross credentials or base URLs", async () => {
  const serverA = await startServer((_req) => {
    return { status: 200, data: {} };
  });
  const serverB = await startServer();
  try {
    const host = createHost({
      value: twoTokenSources(serverA.baseUrl, serverB.baseUrl),
      creds: { AK_PROD: "secret-prod", AK_STG: "secret-stg" },
    });
    apply(host.ctx, {});
    const list = toolByName(host.tools, "pve_version");
    await Promise.all([
      list.execute({ source: "prod" }, execution()),
      list.execute({ source: "staging" }, execution()),
      list.execute({ source: "prod" }, execution()),
    ]);
    assert.equal(serverA.calls.length, 2);
    assert.equal(serverB.calls.length, 1);
    for (const call of serverA.calls)
      assert.match(call.headers.authorization, /prod=secret-prod/);
    for (const call of serverB.calls)
      assert.match(call.headers.authorization, /stg=secret-stg/);
  } finally {
    await serverA.close();
    await serverB.close();
  }
});

test("an unknown source fails fast and names the configured ones; no request is sent", async () => {
  const serverA = await startServer();
  try {
    const host = createHost({
      value: twoTokenSources(serverA.baseUrl, serverA.baseUrl),
      creds: { AK_PROD: "a", AK_STG: "b" },
    });
    apply(host.ctx, {});
    await assert.rejects(
      toolByName(host.tools, "pve_version").execute({ source: "nope" }, execution()),
      /Unknown Proxmox VE source "nope".*"prod".*"staging".*pve_sources/,
    );
    assert.equal(serverA.calls.length, 0);
  } finally {
    await serverA.close();
  }
});

test("several sources and no default: omitting source is an error, not a guess", async () => {
  const host = createHost({
    value: { ...twoTokenSources("http://a", "http://b"), defaultSource: "" },
    creds: { AK_PROD: "a", AK_STG: "b" },
  });
  apply(host.ctx, {});
  await assert.rejects(
    toolByName(host.tools, "pve_version").execute({}, execution()),
    /Multiple Proxmox VE sources are configured/,
  );
});

test("a token-mode source without a configured secret reports which source is missing it", async () => {
  const host = createHost({
    value: twoTokenSources("http://a.example", "http://b.example"),
    creds: { AK_PROD: "a" },
  });
  apply(host.ctx, {});
  await assert.rejects(
    toolByName(host.tools, "pve_version").execute({ source: "staging" }, execution()),
    /AK_STG \(API token secret\) is not configured for source "staging"/,
  );
});

test("every tool except pve_sources accepts an optional source argument", () => {
  const host = createHost({
    value: twoTokenSources("http://a", "http://b"),
    creds: { AK_PROD: "a", AK_STG: "b" },
  });
  apply(host.ctx, {});
  for (const tool of host.tools) {
    const has = Boolean(tool.parameters?.properties?.source);
    assert.equal(has, tool.name !== "pve_sources", tool.name);
  }
});

// ── password 模式：按源站隔离的 ticket 缓存 ──────────────────────────

test("password-mode sources authenticate independently and cache their own ticket", async () => {
  let loginCount = 0;
  const server = await startServer((req, body) => {
    if (req.url === "/api2/json/access/ticket") {
      loginCount += 1;
      return { status: 200, data: { ticket: `T${loginCount}`, CSRFPreventionToken: "csrf" } };
    }
    return { status: 200, data: {} };
  });
  try {
    const host = createHost({
      value: {
        sources: [
          {
            id: "id-a",
            name: "a",
            baseUrl: server.baseUrl,
            authMode: "password",
            username: "root@pam",
            skRef: "PW_A",
          },
          {
            id: "id-b",
            name: "b",
            baseUrl: server.baseUrl,
            authMode: "password",
            username: "root@pam2",
            skRef: "PW_B",
          },
        ],
        defaultSource: "id-a",
      },
      creds: { PW_A: "pw-a", PW_B: "pw-b" },
    });
    apply(host.ctx, {});
    const list = toolByName(host.tools, "pve_version");
    await list.execute({ source: "a" }, execution());
    await list.execute({ source: "b" }, execution());
    // 两次登录（各源站各一次），随后各自命中缓存不重复登录。
    await list.execute({ source: "a" }, execution());
    await list.execute({ source: "b" }, execution());
    const loginCalls = server.calls.filter((c) => c.url === "/api2/json/access/ticket");
    assert.equal(loginCalls.length, 2, "each source logs in exactly once, cached afterwards");
  } finally {
    await server.close();
  }
});

// ── pve_sources ────────────────────────────────────────────────────

test("pve_sources lists sources with configured flags and never returns credentials", async () => {
  const host = createHost({
    value: twoTokenSources("http://a", "http://b"),
    creds: { AK_PROD: "ak-prod-SECRET" },
  });
  apply(host.ctx, {});
  const out = await toolByName(host.tools, "pve_sources").execute({}, execution());
  assert.match(out, /name="prod".*default=true.*secretConfigured=true/);
  assert.match(out, /name="staging".*default=false.*secretConfigured=false/);
  assert.doesNotMatch(out, /SECRET|ak-prod/);
});

// ── 审批绑定 ────────────────────────────────────────────────────────

const allow = async () => ({ kind: "allow" });

function startTwoSources(extra = {}) {
  const host = createHost({
    value: { ...twoTokenSources("http://a", "http://b"), ...extra },
    creds: { AK_PROD: "a", AK_STG: "b" },
  });
  apply(host.ctx, {});
  return host;
}

test("with several sources the approval prompt names the target source", async () => {
  const { listeners } = startTwoSources();
  const gate = listeners.get("tools/pre-execute");
  const decision = await gate(
    { name: "pve_vm_delete", arguments: { node: "pve1", vmid: "100", source: "staging" } },
    allow,
  );
  assert.equal(decision.kind, "ask");
  assert.match(decision.reason, /Proxmox VE 源站「staging」：/);
});

test("with a single source the approval prompt stays unchanged (no source prefix)", async () => {
  const host = createHost({
    value: { sources: [twoTokenSources("http://a", "http://b").sources[0]], defaultSource: "id-prod" },
    creds: { AK_PROD: "a" },
  });
  apply(host.ctx, {});
  const decision = await host.listeners.get("tools/pre-execute")(
    { name: "pve_vm_delete", arguments: { node: "pve1", vmid: "100" } },
    allow,
  );
  assert.equal(decision.kind, "ask");
  assert.doesNotMatch(decision.reason, /源站/);
});

test("a write aimed at an unknown source is denied at approval time, not after the user clicks yes", async () => {
  const { listeners } = startTwoSources();
  const decision = await listeners.get("tools/pre-execute")(
    { name: "pve_vm_delete", arguments: { node: "pve1", vmid: "100", source: "typo" } },
    allow,
  );
  assert.equal(decision.kind, "deny");
  assert.match(decision.reason, /Unknown Proxmox VE source "typo"/);
});

test("a write approved for one source is refused if the default changes before it runs", async () => {
  const serverA = await startServer();
  const serverB = await startServer();
  try {
    const host = createHost({
      value: twoTokenSources(serverA.baseUrl, serverB.baseUrl),
      creds: { AK_PROD: "a", AK_STG: "b" },
    });
    apply(host.ctx, {});
    const exec = {
      name: "pve_vm_delete",
      arguments: { node: "pve1", vmid: "100" },
      signal: new AbortController().signal,
    };
    const decision = await host.listeners.get("tools/pre-execute")(exec, allow);
    assert.match(decision.reason, /「prod」/);
    host.state.value = { ...host.state.value, defaultSource: "id-stg" };
    await assert.rejects(
      toolByName(host.tools, "pve_vm_delete").execute(exec.arguments, exec),
      /approved for has changed.*"prod".*"staging".*Nothing was written/,
    );
    assert.equal(serverA.calls.length, 0);
    assert.equal(serverB.calls.length, 0);
  } finally {
    await serverA.close();
    await serverB.close();
  }
});

// ── 旧配置迁移 ──────────────────────────────────────────────────────

async function quietly(run) {
  const original = console.error;
  const logged = [];
  console.error = (line) => logged.push(String(line));
  try {
    return await run(logged);
  } finally {
    console.error = original;
  }
}

test("a legacy single-source setup keeps working before any migration happens", async () => {
  const server = await startServer();
  try {
    const host = createHost({
      value: { baseUrl: server.baseUrl, tokenId: "root@pam!dsh" },
      creds: { [LEGACY_AK]: "legacy-secret" },
      failUpdate: "boom",
    });
    await quietly(async () => {
      apply(host.ctx, {});
      await tick();
    });
    await toolByName(host.tools, "pve_version").execute({}, execution());
    assert.equal(server.calls.length, 1);
    assert.match(server.calls[0].headers.authorization, /root@pam!dsh=legacy-secret/);
  } finally {
    await server.close();
  }
});

test("startup migration turns the legacy config into one default source, reusing the old refs", async () => {
  const host = createHost({
    value: { baseUrl: "https://legacy.example.com", tokenId: "root@pam!dsh" },
    creds: { [LEGACY_AK]: "legacy-secret" },
  });
  apply(host.ctx, {});
  await tick();
  assert.equal(host.updates.length, 1);
  const { patch, revision } = host.updates[0];
  assert.equal(revision, 1);
  assert.equal(patch.sources.length, 1);
  const [source] = patch.sources;
  assert.equal(source.name, "default");
  assert.equal(source.baseUrl, "https://legacy.example.com");
  assert.equal(source.tokenId, "root@pam!dsh");
  assert.equal(source.akRef, LEGACY_AK, "old credential refs are reused — no secret is moved");
  assert.equal(patch.defaultSource, source.id);
});

test("migration does nothing when sources already exist, or when there is nothing to migrate", async () => {
  const configured = startTwoSources();
  await tick();
  assert.equal(configured.updates.length, 0);

  const empty = createHost({});
  apply(empty.ctx, {});
  await tick();
  assert.equal(empty.updates.length, 0);
});

test("a rejected migration write (e.g. revision conflict) never breaks plugin start-up", async () => {
  const host = createHost({
    value: { baseUrl: "https://legacy.example.com" },
    creds: { [LEGACY_AK]: "a" },
    failUpdate: "settings revision changed since read",
  });
  const logged = await quietly(async (lines) => {
    apply(host.ctx, {});
    await tick();
    return lines;
  });
  assert.ok(host.tools.length > 0);
  assert.ok(logged.some((line) => /\[pve-migrate\] sources failed reason=revision-conflict/.test(line)));
  assert.ok(logged.every((line) => !/legacy\.example\.com/.test(line)));
});

test("migration waits until the host has registered the plugin instead of misreading an empty describe", async () => {
  const host = createHost({
    value: { baseUrl: "https://legacy.example.com" },
    creds: { [LEGACY_AK]: "a" },
    emptyDescribes: 2,
  });
  apply(host.ctx, {});
  await tick();
  assert.equal(host.updates.length, 0);
  await new Promise((resolve) => setTimeout(resolve, 700));
  assert.equal(host.updates.length, 1);
  assert.equal(host.updates[0].patch.sources[0].baseUrl, "https://legacy.example.com");
  assert.equal(host.updates[0].patch.legacyMigrated, true);
  assert.equal(host.updates[0].patch.baseUrl, "");
});

test("once migrated, removing every source does not resurrect an implicit legacy source", async () => {
  const host = createHost({
    value: { legacyMigrated: true, sources: [], baseUrl: "", defaultSource: "" },
    creds: { [LEGACY_AK]: "a" },
  });
  apply(host.ctx, {});
  await tick();
  assert.equal(host.updates.length, 0);
  await assert.rejects(
    toolByName(host.tools, "pve_version").execute({}, execution()),
    /No Proxmox VE source is configured/,
  );
  assert.equal(
    await toolByName(host.tools, "pve_sources").execute({}, execution()),
    "(no Proxmox VE sources configured)",
  );
});

test("an older host that still offers settings.register keeps working", async () => {
  const server = await startServer();
  try {
    const host = createHost({
      value: {
        sources: [{ ...twoTokenSources(server.baseUrl, "http://unused").sources[0] }],
        defaultSource: "id-prod",
      },
      creds: { AK_PROD: "a" },
      hasRegister: true,
    });
    apply(host.ctx, {});
    await toolByName(host.tools, "pve_version").execute({}, execution());
    assert.equal(server.calls.length, 1);
  } finally {
    await server.close();
  }
});

// ── 纯函数 ──────────────────────────────────────────────────────────

test("credential refs derived from a source id are stable, valid and distinct per id, and distinct per auth mode", () => {
  const id = "4d0e1971-52f8-48a5-867c-e5506fc2cf73";
  assert.equal(secretRefForId(id), "PVE_SECRET_4d0e197152f848a5867ce5506fc2cf73");
  assert.equal(passwordRefForId(id), "PVE_PASSWORD_4d0e197152f848a5867ce5506fc2cf73");
  assert.equal(secretRefForId(id), secretRefForId(id));
  assert.notEqual(secretRefForId(id), secretRefForId("another-id"));
  assert.notEqual(secretRefForId(id), passwordRefForId(id));
  assert.match(secretRefForId(id), /^[A-Za-z_][A-Za-z0-9_]*$/);
});

test("normalizeSourceName trims, and rejects empty or over-long names", () => {
  assert.equal(normalizeSourceName("  生产  "), "生产");
  assert.throws(() => normalizeSourceName("   "), /non-empty/);
  assert.throws(() => normalizeSourceName("x".repeat(101)), /must not exceed 100/);
});

test("generateSourceId produces distinct, non-empty ids", () => {
  const a = generateSourceId();
  const b = generateSourceId();
  assert.ok(a && b && a !== b);
});

test("config validation rejects duplicate names, duplicate ids, bad refs, bad authMode and dangling defaults", () => {
  const { validateConfigValue } = internals;
  const base = { akRef: LEGACY_AK, skRef: LEGACY_SK };
  const ok = (sources, defaultSource = "") =>
    validateConfigValue({ ...base, sources, defaultSource });
  ok([{ id: "a", name: "one" }, { id: "b", name: "two" }], "b");
  assert.throws(
    () => ok([{ id: "a", name: "x" }, { id: "b", name: "x" }]),
    /Duplicate Proxmox VE source name/,
  );
  assert.throws(
    () => ok([{ id: "a", name: "x" }, { id: "a", name: "y" }]),
    /Duplicate Proxmox VE source id/,
  );
  assert.throws(
    () => ok([{ id: "a", name: "x", akRef: "bad ref" }]),
    /Invalid API token secret credential reference/,
  );
  assert.throws(
    () => ok([{ id: "a", name: "x", authMode: "bogus" }]),
    /authMode must be "token" or "password"/,
  );
  assert.throws(() => ok([{ id: "a", name: "x" }], "zzz"), /does not match any configured/);
  assert.throws(() => ok([{ id: "", name: "x" }]), /Invalid Proxmox VE source id/);
  assert.throws(() => ok([{ id: "a", name: "" }]), /non-empty name/);
  assert.throws(
    () => ok([{ id: "a", name: "x", baseUrl: "ftp://nope" }]),
    /absolute HTTP\(S\) URL/,
  );
  assert.throws(
    () => ok(Array.from({ length: 51 }, (_, i) => ({ id: `s${i}`, name: `n${i}` }))),
    /At most 50/,
  );
});
