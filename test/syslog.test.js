import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

import { apply, internals } from "../index.js";

const {
  planSyslog,
  parseLogTime,
  formatSyslog,
  syslogLines,
  SYSLOG_DEFAULT_LIMIT,
  SYSLOG_MAX_LIMIT,
  SYSLOG_FETCH_CAP,
} = internals;

const execution = () => ({ signal: new AbortController().signal });
const NOW = Date.UTC(2026, 9, 27, 14, 30, 0); // 2026-10-27 14:30:00 UTC
const NOW_S = NOW / 1000;

// ── 日期解析 ────────────────────────────────────────────────────────

test("parseLogTime accepts the formats a model is likely to send and returns epoch seconds", () => {
  const want = Date.UTC(2026, 9, 27, 8, 30, 0) / 1000;
  assert.equal(parseLogTime("2026-10-27 08:30:00", "since"), want);
  assert.equal(parseLogTime("2026-10-27 08:30", "since"), want);
  assert.equal(parseLogTime("2026-10-27T08:30:00Z", "since"), want);
  assert.equal(parseLogTime("2026-10-27T16:30:00+08:00", "since"), want, "zone offsets are honoured");
  assert.equal(parseLogTime(String(want), "since"), want, "epoch seconds");
  assert.equal(parseLogTime(String(want * 1000), "since"), want, "epoch milliseconds");
  assert.equal(parseLogTime("2026-10-27", "since"), Date.UTC(2026, 9, 27) / 1000);
  assert.equal(parseLogTime("", "since"), undefined);
  assert.equal(parseLogTime(undefined, "since"), undefined);
});

test("parseLogTime rejects garbage with an actionable message", () => {
  assert.throws(() => parseLogTime("yesterday", "since"), /since must be a date such as "2026-10-27".*"yesterday"/);
  assert.throws(() => parseLogTime("2026-13-45", "until"), /until must be a date/);
});

// ── 规划：走哪个后端 ────────────────────────────────────────────────

test("no filters: ask the journal for the LATEST N lines (the case that used to time out)", () => {
  const plan = planSyslog({ node: "n1" }, NOW);
  assert.equal(plan.backend, "journal");
  assert.equal(plan.path, "/journal");
  assert.equal(JSON.stringify(plan.params), JSON.stringify({ lastentries: String(SYSLOG_DEFAULT_LIMIT) }));
  assert.equal(plan.tail, false, "the server already returns the tail");
});

test("limit means the latest N lines, is validated, and is capped", () => {
  assert.equal(planSyslog({ limit: 40 }, NOW).params.lastentries, "40");
  assert.equal(planSyslog({ limit: "25" }, NOW).params.lastentries, "25");
  assert.equal(planSyslog({ limit: 3.9 }, NOW).params.lastentries, "3");
  const capped = planSyslog({ limit: 99999 }, NOW);
  assert.equal(capped.params.lastentries, String(SYSLOG_MAX_LIMIT));
  assert.ok(capped.notes.some((n) => /capped at 1000/.test(n)));
  assert.throws(() => planSyslog({ limit: 0 }, NOW), /positive number/);
  assert.throws(() => planSyslog({ limit: -5 }, NOW), /positive number/);
  assert.throws(() => planSyslog({ limit: "abc" }, NOW), /positive number/);
});

test("a time window without a service uses the journal with epoch bounds and trims locally (lastentries conflicts with a range)", () => {
  const plan = planSyslog({ since: "2026-10-27 08:00", until: "2026-10-27 09:00", limit: 10 }, NOW);
  assert.equal(plan.backend, "journal");
  assert.equal(plan.params.lastentries, undefined, "PVE rejects lastentries together with since/until");
  assert.equal(plan.params.since, String(Date.UTC(2026, 9, 27, 8) / 1000));
  assert.equal(plan.params.until, String(Date.UTC(2026, 9, 27, 9) / 1000));
  assert.equal(plan.tail, true);
  assert.equal(plan.limit, 10);
});

test("since must precede until", () => {
  assert.throws(() => planSyslog({ since: "2026-10-27 09:00", until: "2026-10-27 08:00" }, NOW), /earlier than until/);
});

test("a service filter uses the syslog endpoint with a bounded window and PVE's date format", () => {
  const plan = planSyslog({ service: "pveproxy", limit: 40 }, NOW);
  assert.equal(plan.backend, "syslog");
  assert.equal(plan.path, "/syslog");
  assert.equal(plan.params.service, "pveproxy");
  assert.equal(plan.params.since, "2026-10-26 14:30:00", "defaults to the last 24 hours");
  assert.match(plan.params.since, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, "the format the syslog endpoint validates");
  assert.equal(plan.params.limit, String(SYSLOG_FETCH_CAP), "fetch the whole window, trim locally");
  assert.ok(plan.notes.some((n) => /last 24 hours/.test(n)));
});

test("an explicit since on a service query is honoured and no default-window note is added", () => {
  const plan = planSyslog({ service: "pveproxy", since: "2026-10-01", until: "2026-10-02" }, NOW);
  assert.equal(plan.params.since, "2026-10-01 00:00:00");
  assert.equal(plan.params.until, "2026-10-02 00:00:00");
  assert.equal(plan.notes.length, 0);
});

test("with only until and a service, the default 24h window ends at until (not at now)", () => {
  const plan = planSyslog({ service: "sshd", until: "2026-10-20 00:00:00" }, NOW);
  assert.equal(plan.params.since, "2026-10-19 00:00:00");
});

// ── 格式化 ──────────────────────────────────────────────────────────

test("syslogLines normalises both response shapes and drops syslog's 'no content' placeholder", () => {
  assert.equal(JSON.stringify(syslogLines(["a", "b"])), JSON.stringify(["a", "b"]));
  assert.equal(JSON.stringify(syslogLines([{ n: 1, t: "x" }, { n: 2, t: "y" }])), JSON.stringify(["x", "y"]));
  assert.equal(JSON.stringify(syslogLines([{ n: 1, t: "no content" }])), JSON.stringify([]));
  assert.equal(JSON.stringify(syslogLines(null)), JSON.stringify([]));
  assert.equal(JSON.stringify(syslogLines("oops")), JSON.stringify([]), "a non-array body is not treated as lines");
});

test("formatSyslog trims to the latest N, says what it omitted, and states the order", () => {
  const plan = planSyslog({ since: "2026-10-27", limit: 3 }, NOW);
  const out = formatSyslog(plan, ["l1", "l2", "l3", "l4", "l5"]);
  const rows = out.split("\n");
  assert.match(rows[0], /^# 3 log line\(s\), oldest first — since 2026-10-27 00:00:00 UTC; 2 older line\(s\) in this window omitted \(showing the latest 3\)/);
  assert.equal(JSON.stringify(rows.slice(1)), JSON.stringify(["l3", "l4", "l5"]));
});

test("formatSyslog reports an empty window plainly instead of an empty string", () => {
  const out = formatSyslog(planSyslog({ since: "2026-10-27" }, NOW), [{ n: 1, t: "no content" }]);
  assert.match(out, /# 0 log line\(s\)/);
  assert.match(out, /\(no log lines in this window\)/);
});

test("formatSyslog warns when a syslog window may have been cut at the fetch cap", () => {
  const plan = planSyslog({ service: "x" }, NOW);
  const huge = Array.from({ length: SYSLOG_FETCH_CAP }, (_, i) => `line ${i}`);
  assert.match(formatSyslog(plan, huge), /may be missing — narrow the window/);
  assert.doesNotMatch(formatSyslog(plan, huge.slice(0, 10)), /may be missing/);
});

// ── 集成：忠实模拟 PVE 两个接口的真实语义 ────────────────────────────────
//
// 模拟依据 pve-manager / pve-common 源码（PVE::API2::Nodes、PVE::Tools::dump_journal）：
//   · syslog：正序；start 跳过前 N 行、limit 取 N 行（缺省 50）；since/until 必须匹配
//     ^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$，否则 400；没有内容时返回 "no content" 占位；
//     并且要把整个 journal 流一遍——这里用 streamed 计数来体现，超过预算就“超时”。
//   · journal：lastentries 返回末尾 N 行；与 since/until 同用报 400；since/until 为 epoch 整数。

const JOURNAL_SIZE = 5000; // 一个很长的 journal（用 1 行代表约 1 分钟 → 约 3.5 天的数据足够演示）
const T0 = Date.UTC(2026, 1, 16) / 1000; // 最旧一行：2026-02-16
const STEP = 60 * 60 * 24 * 8 * 30 / JOURNAL_SIZE | 0; // 约 8 个月均匀铺开
const ALL = Array.from({ length: JOURNAL_SIZE }, (_, i) => {
  const epoch = T0 + i * STEP;
  const unit = i % 3 === 0 ? "pveproxy" : "pvedaemon";
  return { epoch, unit, text: `${new Date(epoch * 1000).toISOString().slice(0, 19)} pve ${unit}[1]: entry ${i}` };
});
const LAST = ALL[ALL.length - 1];

async function startFakePve({ streamBudget = 2000 } = {}) {
  const calls = [];
  const SYSLOG_DATE = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/;
  const parseSyslogDate = (s) => Date.parse(`${s.replace(" ", "T")}${s.length === 10 ? "T00:00:00" : s.length === 16 ? ":00" : ""}Z`) / 1000;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    calls.push({ path: url.pathname.replace("/api2/json", ""), query: Object.fromEntries(url.searchParams), url: req.url });
    const send = (status, data, message) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(message ? { data: null, errors: message } : { data }));
    };
    const q = url.searchParams;
    if (url.pathname.endsWith("/syslog")) {
      for (const k of Object.keys(Object.fromEntries(q))) {
        if (!["start", "limit", "since", "until", "service"].includes(k)) {
          return send(400, null, { [k]: "property is not defined in schema and the schema does not allow additional properties" });
        }
      }
      for (const k of ["since", "until"]) {
        if (q.has(k) && !SYSLOG_DATE.test(q.get(k))) return send(400, null, { [k]: `value does not match the regex pattern` });
      }
      let rows = ALL;
      if (q.get("service")) rows = rows.filter((r) => r.unit === q.get("service"));
      if (q.get("since")) rows = rows.filter((r) => r.epoch >= parseSyslogDate(q.get("since")));
      if (q.get("until")) rows = rows.filter((r) => r.epoch < parseSyslogDate(q.get("until")));
      // 无时间窗口 = 要流过整个 journal；超过预算视为超时（真实环境是 20s 请求超时）。
      const streamed = q.get("since") ? rows.length : ALL.length;
      if (streamed > streamBudget) return; // 永不应答 → 触发客户端超时
      const start = Number(q.get("start") ?? 0);
      const limit = Number(q.get("limit") || 50);
      const page = rows.slice(start, start + limit).map((r, i) => ({ n: start + i + 1, t: r.text }));
      return send(200, page.length ? page : [{ n: 1, t: "no content" }]);
    }
    if (url.pathname.endsWith("/journal")) {
      for (const k of q.keys()) {
        if (!["since", "until", "lastentries", "startcursor", "endcursor"].includes(k)) {
          return send(400, null, { [k]: "property is not defined in schema and the schema does not allow additional properties" });
        }
      }
      if (q.has("lastentries") && (q.has("since") || q.has("until"))) return send(400, null, { lastentries: "conflicts with a range" });
      let rows = ALL;
      if (q.has("since")) rows = rows.filter((r) => r.epoch >= Number(q.get("since")));
      if (q.has("until")) rows = rows.filter((r) => r.epoch < Number(q.get("until")));
      if (q.has("lastentries")) rows = rows.slice(-Number(q.get("lastentries")));
      return send(200, rows.map((r) => r.text));
    }
    send(200, {});
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { baseUrl: `http://127.0.0.1:${server.address().port}`, calls, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }) };
}

function hostFor(baseUrl) {
  const tools = [];
  const ctx = {
    credentials: { async resolve() { return { value: "secret" }; } },
    inject() {},
    on() { return () => {}; },
    systemPrompt: { section() {} },
    tools: { register(t) { tools.push(t); return () => {}; } },
  };
  apply(ctx, { baseUrl, tokenId: "root@pam!t" });
  return tools.find((t) => t.name === "pve_node_syslog");
}

test("integration: the reported failure — no filters on a long journal — now returns the NEWEST lines instead of timing out", async () => {
  const server = await startFakePve();
  try {
    const out = await hostFor(server.baseUrl).execute({ node: "pve1" }, execution());
    const rows = out.split("\n");
    assert.match(rows[0], /^# 100 log line\(s\), oldest first — the most recent entries/);
    assert.equal(rows.length, 101);
    assert.equal(rows[rows.length - 1], LAST.text, "the newest line is last");
    assert.equal(rows[1], ALL[ALL.length - 100].text);
    assert.equal(server.calls.length, 1);
    assert.equal(server.calls[0].path, "/nodes/pve1/journal");
    assert.equal(JSON.stringify(server.calls[0].query), JSON.stringify({ lastentries: "100" }));
  } finally {
    await server.close();
  }
});

test("integration: limit selects the latest N, not the oldest N (the other reported symptom)", async () => {
  const server = await startFakePve();
  try {
    const out = await hostFor(server.baseUrl).execute({ node: "pve1", limit: 40 }, execution());
    const lines = out.split("\n").slice(1);
    assert.equal(lines.length, 40);
    assert.equal(lines[39], LAST.text);
    assert.ok(!lines.includes(ALL[0].text), "none of the oldest (February) lines");
  } finally {
    await server.close();
  }
});

test("integration: service + limit (the exact call that returned February lines) now returns recent pveproxy lines", async () => {
  const server = await startFakePve();
  try {
    // 用一个覆盖“最近 24h”窗口的小窗口，并让 now 之内确有 pveproxy 行：
    // 这里直接给 since，使窗口落在 journal 末尾。
    const sinceEpoch = ALL[ALL.length - 400].epoch;
    const since = new Date(sinceEpoch * 1000).toISOString().slice(0, 19).replace("T", " ");
    const out = await hostFor(server.baseUrl).execute({ node: "pve1", service: "pveproxy", limit: 40, since }, execution());
    const lines = out.split("\n").filter((l) => !l.startsWith("#"));
    assert.equal(lines.length, 40);
    assert.ok(lines.every((l) => l.includes("pveproxy")), "service filter applied");
    const newestProxy = [...ALL].reverse().find((r) => r.unit === "pveproxy");
    assert.equal(lines[lines.length - 1], newestProxy.text, "ends at the newest pveproxy line");
    assert.ok(!lines.includes(ALL[0].text), "not the February lines");
    // 走的是 syslog，且 since 用了 PVE 校验的格式（模拟端对格式不对会返回 400）。
    assert.equal(server.calls[0].path, "/nodes/pve1/syslog");
    assert.match(server.calls[0].query.since, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  } finally {
    await server.close();
  }
});

test("integration: ISO and epoch inputs are converted — they used to be sent verbatim and rejected by PVE", async () => {
  const server = await startFakePve();
  try {
    const tool = hostFor(server.baseUrl);
    const target = ALL[ALL.length - 50].epoch;
    await tool.execute({ node: "pve1", since: new Date(target * 1000).toISOString() }, execution());
    await tool.execute({ node: "pve1", since: String(target) }, execution());
    for (const call of server.calls) {
      assert.equal(call.path, "/nodes/pve1/journal");
      assert.equal(call.query.since, String(target), "epoch seconds for the journal endpoint");
      assert.equal(call.query.lastentries, undefined, "never combined with a range");
    }
  } finally {
    await server.close();
  }
});

test("integration: a service query with no since is bounded to 24h and says so (no unbounded stream)", async () => {
  const server = await startFakePve({ streamBudget: 10 }); // 任何无窗口的全量流都会“超时”
  try {
    const tool = hostFor(server.baseUrl);
    const out = await tool.execute({ node: "pve1", service: "pveproxy" }, execution());
    assert.match(out, /# note: no since was given, so only the last 24 hours/);
    assert.ok(server.calls[0].query.since, "a window was always sent");
  } finally {
    await server.close();
  }
});

test("integration: an empty window is reported plainly", async () => {
  const server = await startFakePve();
  try {
    const out = await hostFor(server.baseUrl).execute({ node: "pve1", since: "2030-01-01", until: "2030-01-02" }, execution());
    assert.match(out, /\(no log lines in this window\)/);
  } finally {
    await server.close();
  }
});

test("integration: node is required, and bad input fails before any request", async () => {
  const server = await startFakePve();
  try {
    const tool = hostFor(server.baseUrl);
    // 工具层的 schema 校验先于 execute 拦截缺失的 node。
    await assert.rejects(tool.execute({}, execution()), /missing required property "node"/);
    await assert.rejects(tool.execute({ node: "pve1", since: "garbage" }, execution()), /since must be a date/);
    await assert.rejects(tool.execute({ node: "pve1", limit: 0 }, execution()), /positive number/);
    // 第二层防御：绕过 schema 直接调用目录条目的 execute 钩子，同样不会发请求。
    const entry = internals.CATALOG.find((e) => e.name === "pve_node_syslog");
    const neverCalled = () => { throw new Error("api must not be called"); };
    await assert.rejects(entry.execute({}, neverCalled), /"node" is missing/);
    await assert.rejects(entry.execute({ node: "   " }, neverCalled), /"node" is missing/);
    assert.equal(server.calls.length, 0);
  } finally {
    await server.close();
  }
});

test("pve_node_syslog is still a read-only catalog tool: the approval gate and tool count are unchanged", () => {
  const entry = internals.CATALOG.find((e) => e.name === "pve_node_syslog");
  assert.equal(entry.write, false);
  assert.equal(entry.method, "GET");
  assert.equal(typeof entry.execute, "function");
  assert.match(entry.description, /LATEST N lines/);
  assert.match(entry.params.since.description, /YYYY-MM-DD/);
  assert.ok(!/epoch or ISO/.test(entry.params.since.description), "the misleading old wording is gone");
});
