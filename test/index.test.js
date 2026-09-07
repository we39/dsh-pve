import test from "node:test";
import assert from "node:assert/strict";
import { internals } from "../index.js";

const {
  normalizeBaseUrl,
  toFormValue,
  sanitize,
  resolveArgs,
  formatResult,
  ticketHeaders,
  apiUrl,
  PASSWORD_REF,
  CATALOG,
} = internals;

test("normalizeBaseUrl accepts http(s), strips trailing slash", () => {
  assert.equal(
    normalizeBaseUrl("https://10.0.0.1:8006/"),
    "https://10.0.0.1:8006",
  );
  assert.equal(
    normalizeBaseUrl("  http://localhost:8006  "),
    "http://localhost:8006",
  );
});

test("normalizeBaseUrl rejects malformed or credential-bearing URLs", () => {
  assert.throws(() => normalizeBaseUrl(""), /not configured/);
  assert.throws(
    () => normalizeBaseUrl("ftp://x.example"),
    /absolute HTTP\(S\)/,
  );
  assert.throws(
    () => normalizeBaseUrl("https://user:pass@h.example"),
    /credentials/,
  );
  assert.throws(
    () => normalizeBaseUrl("https://h.example/path?x=1"),
    /query string/,
  );
  assert.throws(() => normalizeBaseUrl("https://h.example/#frag"), /fragment/);
});

test("toFormValue encodes arrays/booleans/numbers for form bodies", () => {
  assert.equal(toFormValue(["a", "b"]), "a,b");
  assert.equal(toFormValue(true), "1");
  assert.equal(toFormValue(false), "0");
  assert.equal(toFormValue(42), "42");
  assert.equal(toFormValue("x"), "x");
});

test("sanitize redacts sensitive keys recursively", () => {
  const out = sanitize({
    password: "x",
    secret: "y",
    keep: 1,
    nested: { token: "z", ok: 2 },
    list: [{ privkey: "k", name: "n" }],
  });
  assert.equal(out.password, "[REDACTED]");
  assert.equal(out.secret, "[REDACTED]");
  assert.equal(out.keep, 1);
  assert.equal(out.nested.token, "[REDACTED]");
  assert.equal(out.nested.ok, 2);
  assert.equal(out.list[0].privkey, "[REDACTED]");
  assert.equal(out.list[0].name, "n");
});

test("resolveArgs fills path placeholders and splits remaining params", () => {
  const def = { path: "/nodes/{node}/qemu/{vmid}/status/{action}", params: {} };
  const { path, params } = resolveArgs(def, {
    node: "pve1",
    vmid: "100",
    action: "start",
    options: '{"timeout":"30"}',
  });
  assert.equal(path, "/nodes/pve1/qemu/100/status/start");
  assert.equal(params.timeout, "30");
});

test("resolveArgs requires path params and validates options JSON", () => {
  assert.throws(
    () => resolveArgs({ path: "/nodes/{node}" }, {}),
    /Required parameter "node"/,
  );
  assert.throws(
    () => resolveArgs({ path: "/x" }, { options: "not-json" }),
    /valid JSON object/,
  );
  assert.throws(
    () => resolveArgs({ path: "/x" }, { options: "[]" }),
    /JSON object/,
  );
});

test("formatResult adds task-polling hint for write results", () => {
  const s = formatResult("UPID:pve1:0000ABCD:1:2:", { write: true });
  assert.match(s, /Task started: UPID:/);
  assert.match(s, /pve_task_status/);
});

test("formatResult pretty-prints objects and sanitizes them", () => {
  const s = formatResult({ a: 1, password: "x" }, { write: false });
  assert.equal(s, JSON.stringify({ a: 1, password: "[REDACTED]" }, null, 2));
});

test("ticketHeaders: cookie always, CSRF only for non-GET", () => {
  assert.deepEqual(ticketHeaders("TICKET", "CSRF", "GET"), {
    Cookie: "PVEAuthCookie=TICKET",
  });
  assert.deepEqual(ticketHeaders("TICKET", "CSRF", "POST"), {
    Cookie: "PVEAuthCookie=TICKET",
    CSRFPreventionToken: "CSRF",
  });
  assert.equal(PASSWORD_REF, "PVE_API_PASSWORD");
});

test("apiUrl prepends /api2/json; normalizeBaseUrl strips a trailing one", () => {
  assert.equal(
    apiUrl("https://h:8006", "/version"),
    "https://h:8006/api2/json/version",
  );
  assert.equal(
    apiUrl("https://h:8006", "/access/ticket"),
    "https://h:8006/api2/json/access/ticket",
  );
  assert.equal(normalizeBaseUrl("https://h:8006/api2/json"), "https://h:8006");
});

test("catalog integrity: unique names, path params declared, spot-check write flags", () => {
  const seen = new Set();
  const writeNames = [];
  for (const d of CATALOG) {
    assert.ok(!seen.has(d.name), `duplicate tool name ${d.name}`);
    seen.add(d.name);
    assert.ok(d.method, `${d.name} missing method`);
    assert.ok(
      typeof d.description === "string" && d.description.length > 0,
      `${d.name} missing description`,
    );
    for (const p of [...d.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1])) {
      assert.ok(
        d.params[p],
        `${d.name}: path placeholder {${p}} has no matching param`,
      );
    }
    if (d.write) writeNames.push(d.name);
  }
  assert.ok(CATALOG.find((d) => d.name === "pve_vm_delete")?.write === true);
  assert.ok(CATALOG.find((d) => d.name === "pve_version")?.write === false);
  assert.ok(writeNames.length > 0, "expected some write tools");
  assert.ok(
    !writeNames.some((n) => n.startsWith("pve_") === false),
    "write tools should be pve_ prefixed",
  );
});
