// dsh-pve 浏览器设置卡片（多源站）。
// 每个源站有自己的名称、URL、鉴权模式（token / password）：
// 名称、URL、authMode、tokenId/username、defaultSource 存 settings namespace
// （pve，非 secret，明文回显）；token secret / 登录密码走 remote.credentials
// （凭证库），仅写不读，describe 只返回 configured 布尔，客户端永远不会读回明文，
// 故以星号占位。默认简体中文，仅当 GUI 明确选择英文时切换。
// 只 inject slots。远端门面（remote.settings / remote.credentials）刻意不写进 inject：
// cordis 4.0.2 中任一 inject 项缺席都会让整个插件永久停在 INACTIVE，卡片连同
// 其它功能一起消失；改为调用时用 ctx.get 按需解析，缺席时只让卡片报错。
window.__ModuleLoader__.load({
  id: "dsh-pve",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react_jsx_runtime = require("react/jsx-runtime");
    let react = require("react");

    const LEGACY_SECRET_REF = "PVE_API_TOKEN_SECRET";
    const LEGACY_PASSWORD_REF = "PVE_API_PASSWORD";
    const SECRET_REF_PREFIX = "PVE_SECRET_";
    const PASSWORD_REF_PREFIX = "PVE_PASSWORD_";
    const SETTINGS_NS = "pve";
    const DEFAULT_SOURCE_NAME = "default";
    const MAX_SOURCES = 50;
    const MAX_SOURCE_NAME_CHARS = 100;
    const MASK = "*".repeat(28);
    const inject = ["slots"];

    const STRINGS = {
      zh: {
        title: "Proxmox VE 助手",
        desc: "让 DSH 连接多个 Proxmox VE 源站；人类讲需求，AI 去干活，检查并管理节点、VM/CT、存储、网络、集群与权限。",
        sourcesHeading: "Proxmox VE 源站",
        sourcesNote: "凭证库可能由多个 profile 共用。移除源站时只会清除该源站专属的 Token Secret / 登录密码；若仍被其它源站共用则会保留。",
        sourcesEmpty: "尚未配置源站。点击“新增源站”添加一个。",
        addSource: "新增源站",
        sourceNameLabel: "源站名称",
        sourceNamePlaceholder: "例如：生产 / 测试",
        uidLabel: "UID（自动生成、全球唯一、不可修改）",
        urlLabel: "Base URL",
        urlPlaceholder: "https://pve.example.com",
        urlHint: "支持 HTTP 与 HTTPS（内网自签名证书部署可开启下方“跳过 TLS 校验”）。",
        authLabel: "鉴权方式",
        authToken: "API Token（PVE 6.0+）",
        authPassword: "账号密码（兼容 PVE 5.x）",
        tokenLabel: "Token ID",
        tokenPlaceholder: "user@realm!tokenid，例如 monitoring@pve!dsh",
        secretLabel: "Token Secret",
        userLabel: "用户名",
        userPlaceholder: "例如 root@pam",
        passwordLabel: "密码",
        tlsLabel: "跳过 TLS 校验",
        tlsHint: "自签名证书的内网 PVE 需勾选。5.x/6.0+ 均支持。",
        configured: "已配置",
        notConfigured: "未配置",
        secretPlaceholder: "留空则保留当前值；输入新 Token Secret 以替换",
        passwordPlaceholder: "留空则保留当前值；输入新密码以替换",
        hintConfigured: "已配置。星号只是占位符，并非存储的值。",
        hintEmpty: "存储在本地 DSH 凭证库中，凭证值永远不会被读回。",
        defaultBadge: "默认",
        unsavedBadge: "未保存",
        setDefault: "设为默认",
        removeSource: "移除源站",
        saveCurrentSource: "保存当前源站",
        saving: "保存中…",
        saved: "已保存。新会话将使用更新后的配置。",
        reload: "重新读取",
        importLegacyTitle: "检测到旧版单源配置",
        importLegacyDesc: "发现此前保存的单个 Proxmox VE 配置，尚未出现在源站列表中。导入后将沿用原有的凭证，不会重新输入或搬运密钥/密码。",
        importLegacy: "导入为源站",
        nameRequired: "源站名称不能为空。",
        nameDuplicate: "源站名称必须唯一。",
        nameTooLong: "源站名称不能超过 100 个字符。",
        tooManySources: "源站数量不能超过 50 个。",
        invalidUrl: "Proxmox VE URL 必须是不含凭证、查询参数或片段的绝对 HTTP(S) 地址。",
        confirmRemoveSource: "确定要移除该源站吗？其专用的 Token Secret / 登录密码会一并清除；若仍被其它源站共用则会保留。",
        notLoaded: "尚未成功读取配置，为避免覆盖已有源站，保存已停用。请点击“重新读取”。",
        unconfirmedRead: "宿主返回的配置数据无法解析（不是合法的源站列表）。为避免覆盖已存源站或误删凭证，已暂停写入；请点击“重新读取”。",
        cleanupFailed: "源站“{name}”已移除，但其凭证未能清除（{ref}）：",
        stagedCleanupFailed: "保存未生效，暂存的新凭证（{ref}）未能回收：",
        hostTooOld: "当前 DSH 宿主版本过旧（缺少 remote.settings 远端门面），无法读写 Proxmox VE 源站配置。请升级后重新打开设置页。",
      },
      en: {
        title: "Proxmox VE assistant",
        desc: "Let DSH talk to several Proxmox VE sources: you describe the goal, the AI inspects and manages nodes, VMs/CTs, storage, networking, cluster and access.",
        sourcesHeading: "Proxmox VE sources",
        sourcesNote: "The credential store may be shared by several profiles. Removing a source clears only that source's own token secret / login password; they are kept if another source still uses them.",
        sourcesEmpty: "No sources yet. Click “Add source” to create one.",
        addSource: "Add source",
        sourceNameLabel: "Source name",
        sourceNamePlaceholder: "e.g. production / staging",
        uidLabel: "UID (auto-generated, globally unique, read-only)",
        urlLabel: "Base URL",
        urlPlaceholder: "https://pve.example.com",
        urlHint: "HTTP and HTTPS are both supported (enable “Skip TLS verification” below for self-signed internal deployments).",
        authLabel: "Authentication",
        authToken: "API Token (PVE 6.0+)",
        authPassword: "Username / password (PVE 5.x compatible)",
        tokenLabel: "Token ID",
        tokenPlaceholder: "user@realm!tokenid, e.g. monitoring@pve!dsh",
        secretLabel: "Token Secret",
        userLabel: "Username",
        userPlaceholder: "e.g. root@pam",
        passwordLabel: "Password",
        tlsLabel: "Skip TLS verification",
        tlsHint: "Enable for internal PVE hosts with self-signed certificates. Works on 5.x and 6.0+.",
        configured: "Configured",
        notConfigured: "Not configured",
        secretPlaceholder: "Leave blank to keep the current value; enter a new Token Secret to replace it",
        passwordPlaceholder: "Leave blank to keep the current value; enter a new password to replace it",
        hintConfigured: "Configured. The stars are a placeholder, not the stored value.",
        hintEmpty: "Stored in the local DSH credential store; the value is never read back.",
        defaultBadge: "Default",
        unsavedBadge: "Unsaved",
        setDefault: "Set as default",
        removeSource: "Remove source",
        saveCurrentSource: "Save this source",
        saving: "Saving…",
        saved: "Saved. New conversations will use the updated configuration.",
        reload: "Reload",
        importLegacyTitle: "Legacy single-source configuration found",
        importLegacyDesc: "A previously saved single Proxmox VE configuration is not in the source list yet. Importing it reuses the existing credentials — nothing is re-entered or moved.",
        importLegacy: "Import as a source",
        nameRequired: "A source name is required.",
        nameDuplicate: "Source names must be unique.",
        nameTooLong: "A source name must not exceed 100 characters.",
        tooManySources: "At most 50 sources can be configured.",
        invalidUrl: "Proxmox VE URL must be an absolute HTTP(S) URL without credentials, query, or fragment.",
        confirmRemoveSource: "Remove this source? Its own token secret / login password are cleared too, unless another source still uses them.",
        notLoaded: "The configuration has not been read successfully, so saving is disabled to avoid overwriting existing sources. Click “Reload”.",
        unconfirmedRead: "The host returned configuration data that could not be parsed (not a valid source list). Writes are paused to avoid overwriting stored sources or deleting credentials; click “Reload”.",
        cleanupFailed: "Source “{name}” was removed, but its credential could not be cleared ({ref}): ",
        stagedCleanupFailed: "The save did not take effect and the staged new credential ({ref}) could not be reclaimed: ",
        hostTooOld: "This DSH host is too old (no remote.settings facade), so Proxmox VE sources cannot be read or written. Upgrade and reopen the settings page.",
      },
    };

    const HOST_UNSUPPORTED = "HOST_UNSUPPORTED";

    function generateSourceId() {
      const c = typeof crypto !== "undefined" ? crypto : undefined;
      if (c && c.randomUUID) return String(c.randomUUID());
      if (c && c.getRandomValues) {
        const bytes = c.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join("");
        return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
      }
      return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    }
    function cleanId(id) {
      return String(id == null ? "" : id).replace(/[^A-Za-z0-9_]/g, "").slice(0, 64);
    }
    function secretRefForId(id) {
      return SECRET_REF_PREFIX + cleanId(id);
    }
    function passwordRefForId(id) {
      return PASSWORD_REF_PREFIX + cleanId(id);
    }

    function storedRow(s) {
      return {
        id: s.id,
        name: String(s.name == null ? "" : s.name),
        baseUrl: String(s.baseUrl == null ? "" : s.baseUrl),
        authMode: s.authMode === "password" ? "password" : "token",
        tokenId: String(s.tokenId == null ? "" : s.tokenId),
        akRef: s.akRef || secretRefForId(s.id),
        username: String(s.username == null ? "" : s.username),
        skRef: s.skRef || passwordRefForId(s.id),
        allowInsecureTls: s.allowInsecureTls === true,
      };
    }

    function validateSources(rows, m) {
      if (rows.length > MAX_SOURCES) throw new Error(m.tooManySources);
      const seen = new Set();
      for (const s of rows) {
        const name = String(s.name == null ? "" : s.name).trim();
        if (!name) throw new Error(m.nameRequired);
        if (name.length > MAX_SOURCE_NAME_CHARS) throw new Error(m.nameTooLong);
        if (seen.has(name)) throw new Error(m.nameDuplicate);
        seen.add(name);
        const url = String(s.baseUrl == null ? "" : s.baseUrl).trim();
        if (url) {
          let u;
          try {
            u = new URL(url);
          } catch {
            throw new Error(m.invalidUrl);
          }
          if (!["https:", "http:"].includes(u.protocol) || u.username || u.password || u.search || u.hash) {
            throw new Error(m.invalidUrl);
          }
        }
      }
    }

    function rowDirty(draft, storedById) {
      const st = storedById.get(draft.id);
      if (!st) return true;
      if (String(draft.secretDraft || "").trim() !== "" || String(draft.passwordDraft || "").trim() !== "") return true;
      const a = storedRow({
        ...draft,
        name: String(draft.name || "").trim(),
        baseUrl: String(draft.baseUrl || "").trim(),
        tokenId: String(draft.tokenId || "").trim(),
        username: String(draft.username || "").trim(),
      });
      const b = storedRow(st);
      return (
        a.name !== b.name ||
        a.baseUrl !== b.baseUrl ||
        a.authMode !== b.authMode ||
        a.tokenId !== b.tokenId ||
        a.username !== b.username ||
        a.allowInsecureTls !== b.allowInsecureTls ||
        a.akRef !== b.akRef ||
        a.skRef !== b.skRef
      );
    }

    function mergeDrafts(described, drafts, committedIds) {
      const describedIds = new Set(described.map((s) => s.id));
      const draftById = new Map(drafts.map((s) => [s.id, s]));
      const merged = described.map((s) => {
        const d = draftById.get(s.id);
        const base = { ...s, secretDraft: "", passwordDraft: "", secretFocus: false, passwordFocus: false };
        if (!d) return base;
        if (committedIds && committedIds.has(s.id)) return base;
        return {
          ...base,
          name: d.name,
          baseUrl: d.baseUrl,
          authMode: d.authMode,
          tokenId: d.tokenId,
          username: d.username,
          allowInsecureTls: d.allowInsecureTls,
          secretDraft: d.secretDraft || "",
          passwordDraft: d.passwordDraft || "",
          secretFocus: !!d.secretFocus,
          passwordFocus: !!d.passwordFocus,
        };
      });
      for (const d of drafts) if (!describedIds.has(d.id) && !d.persisted) merged.push({ ...d });
      return merged;
    }

    function pickDefault(candidates, preferred) {
      return candidates.some((s) => s.id === preferred) ? preferred : candidates[0] ? candidates[0].id : "";
    }

    function languageFor(preference) {
      return preference === "en" ? "en" : "zh";
    }

    const S = {
      card: { border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "12px", background: "var(--dsw-alias-bg-layer-3)", marginBottom: "12px" },
      cardOpen: { background: "var(--dsw-alias-bg-layer-2)" },
      header: { display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "16px", margin: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" },
      headerText: { display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 auto", minWidth: 0 },
      chevron: { flexShrink: 0, display: "inline-flex", transition: "transform .16s", color: "var(--dsw-alias-label-tertiary)" },
      body: { borderTop: "1px solid var(--dsw-alias-border-l2)", margin: "0 16px", padding: "16px 0", display: "flex", flexDirection: "column", gap: "12px" },
      title: { margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" },
      desc: { margin: 0, fontSize: "13px", color: "var(--dsw-alias-label-secondary)" },
      heading: { margin: "4px 0 0", fontSize: "14px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" },
      source: { border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", background: "var(--dsw-alias-bg-layer-3)" },
      row: { display: "flex", flexDirection: "column", gap: "6px" },
      head: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
      label: { fontSize: "13px", fontWeight: 500, color: "var(--dsw-alias-label-primary)" },
      inputRow: { display: "flex", alignItems: "center", gap: "8px" },
      input: { border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", height: "34px", color: "var(--dsw-alias-label-primary)", borderRadius: "8px", padding: "0 12px", fontSize: "13px", flex: "1 1 auto", minWidth: 0 },
      select: { border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", height: "34px", color: "var(--dsw-alias-label-primary)", borderRadius: "8px", padding: "0 12px", fontSize: "13px", width: "100%" },
      hint: { margin: 0, fontSize: "12px", color: "var(--dsw-alias-label-tertiary)" },
      mono: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
      badge: { whiteSpace: "nowrap", borderRadius: "999px", padding: "1px 8px", fontSize: "11px", fontWeight: 500, background: "var(--dsw-alias-bg-module-platform)", color: "var(--dsw-alias-label-secondary)", display: "inline-block" },
      badgeOk: { color: "#2f9e44" },
      spacer: { flex: "1 1 auto" },
      footer: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
      button: { border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)", color: "var(--dsw-alias-label-primary)", borderRadius: "8px", height: "32px", padding: "0 14px", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
      msg: { margin: 0, fontSize: "12px", color: "var(--dsw-alias-label-secondary)" },
      err: { margin: 0, fontSize: "12px", color: "var(--dsw-alias-label-error)" },
      notice: { border: "1px dashed var(--dsw-alias-border-l2)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" },
      checkbox: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--dsw-alias-label-primary)" },
    };

    function h(type, props, children, key) {
      const list = children === undefined ? undefined : Array.isArray(children) ? children : [children];
      return react_jsx_runtime.jsxs(type, list === undefined ? props || {} : { ...(props || {}), children: list }, key);
    }

    function PveCard(props) {
      const face = props.pveCard;
      const [sources, setSources] = react.useState([]);
      const [stored, setStored] = react.useState([]);
      const [defaultSource, setDefaultSource] = react.useState("");
      const [legacy, setLegacy] = react.useState(null);
      const [saving, setSaving] = react.useState(false);
      const [saved, setSaved] = react.useState(false);
      const [error, setError] = react.useState("");
      const [lang, setLang] = react.useState("zh");
      const [loaded, setLoaded] = react.useState(false);
      const [revision, setRevision] = react.useState(null);
      const [open, setOpen] = react.useState(props.defaultOpen === true);
      const [notes, setNotes] = react.useState([]);
      const T = STRINGS[lang] || STRINGS.zh;
      const storedById = new Map(stored.map((s) => [s.id, s]));
      const effectiveDefault =
        defaultSource && sources.some((s) => s.id === defaultSource)
          ? defaultSource
          : sources.length === 1
            ? sources[0].id
            : "";

      function msg(e) {
        const message = String(e && e.message ? e.message : e);
        return message === HOST_UNSUPPORTED ? T.hostTooOld : message;
      }

      function applyDescribed(r) {
        if (r && r.hostUnsupported) {
          setError(T.hostTooOld);
          return;
        }
        if (r && r.unconfirmed) {
          setError(T.unconfirmedRead);
          return;
        }
        const described = (r && r.sources) || [];
        setSources(
          described.map((s) => ({
            ...s,
            persisted: true,
            secretDraft: "",
            passwordDraft: "",
            secretFocus: false,
            passwordFocus: false,
          })),
        );
        setStored(described);
        setDefaultSource((r && r.defaultSource) || "");
        setRevision(Number.isInteger(r && r.revision) ? r.revision : null);
        setLegacy((r && r.legacy) || null);
        setLoaded(true);
      }

      react.useEffect(() => {
        let alive = true;
        face
          .describe()
          .then((r) => {
            if (alive) applyDescribed(r);
          })
          .catch((e) => {
            if (alive) setError(msg(e));
          });
        return () => {
          alive = false;
        };
      }, [face]);

      react.useEffect(() => {
        let alive = true;
        face
          .localePreference()
          .then((p) => {
            if (alive) setLang(languageFor(p));
          })
          .catch(() => {});
        return () => {
          alive = false;
        };
      }, [face]);

      function patchSource(id, patch) {
        setSources((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
      }

      function onAdd() {
        if (!loaded) {
          setError(T.notLoaded);
          return;
        }
        const id = generateSourceId();
        setSources((prev) => [
          ...prev,
          {
            id,
            name: "",
            baseUrl: "",
            authMode: "token",
            tokenId: "",
            akRef: secretRefForId(id),
            username: "",
            skRef: passwordRefForId(id),
            allowInsecureTls: false,
            secretConfigured: false,
            passwordConfigured: false,
            secretDraft: "",
            passwordDraft: "",
            secretFocus: false,
            passwordFocus: false,
            persisted: false,
          },
        ]);
      }

      function onImportLegacy() {
        if (!loaded || !legacy) return;
        const id = generateSourceId();
        setSources((prev) => [
          ...prev,
          {
            id,
            name: DEFAULT_SOURCE_NAME,
            baseUrl: legacy.baseUrl || "",
            authMode: legacy.authMode === "password" ? "password" : "token",
            tokenId: legacy.tokenId || "",
            akRef: legacy.akRef,
            username: legacy.username || "",
            skRef: legacy.skRef,
            allowInsecureTls: legacy.allowInsecureTls === true,
            secretConfigured: !!legacy.secretConfigured,
            passwordConfigured: !!legacy.passwordConfigured,
            secretDraft: "",
            passwordDraft: "",
            secretFocus: false,
            passwordFocus: false,
            persisted: false,
          },
        ]);
      }

      async function reread(committedIds) {
        const r = await face.describe();
        if (r && r.unconfirmed) throw new Error(T.unconfirmedRead);
        const described = (r && r.sources) || [];
        setSources((prev) => mergeDrafts(described.map((s) => ({ ...s, persisted: true })), prev, committedIds));
        setStored(described);
        setDefaultSource((r && r.defaultSource) || "");
        setRevision(Number.isInteger(r && r.revision) ? r.revision : null);
        setLegacy((r && r.legacy) || null);
      }

      async function reload() {
        setSaving(true);
        setSaved(false);
        setError("");
        setNotes([]);
        try {
          applyDescribed(await face.describe());
        } catch (e) {
          setError(msg(e));
        } finally {
          setSaving(false);
        }
      }

      async function onSaveOne(id) {
        if (!loaded) {
          setError(T.notLoaded);
          return;
        }
        const draft = sources.find((s) => s.id === id);
        if (!draft) return;
        const row = storedRow({
          ...draft,
          name: String(draft.name || "").trim(),
          baseUrl: String(draft.baseUrl || "").trim(),
          tokenId: String(draft.tokenId || "").trim(),
          username: String(draft.username || "").trim(),
        });
        const nextSources = storedById.has(id)
          ? stored.map((s) => (s.id === id ? row : storedRow(s)))
          : [...stored.map(storedRow), row];
        const nextDefault = pickDefault(nextSources, defaultSource);
        const secrets = [];
        if (String(draft.secretDraft || "").trim() !== "") secrets.push({ ref: row.akRef, value: String(draft.secretDraft).trim() });
        if (String(draft.passwordDraft || "").trim() !== "") secrets.push({ ref: row.skRef, value: String(draft.passwordDraft).trim() });
        setSaving(true);
        setSaved(false);
        setError("");
        setNotes([]);
        const staged = [];
        try {
          validateSources(nextSources, T);
          for (const secret of secrets) {
            await face.setSecret(secret.ref, secret.value);
            if (!storedById.has(id)) staged.push(secret.ref);
          }
          try {
            await face.writeSources(nextSources, nextDefault, revision);
          } catch (writeError) {
            const rejected = !!(writeError && writeError.remoteRejected);
            if (rejected) {
              for (const ref of staged) {
                try {
                  await face.unsetSecret(ref);
                } catch (cleanupError) {
                  setNotes((prev) => [...prev, T.stagedCleanupFailed.replace("{ref}", ref) + msg(cleanupError)]);
                }
              }
            }
            throw writeError;
          }
          let readError = null;
          try {
            await reread(new Set([id]));
          } catch (e) {
            readError = e;
            await reread().catch(() => {});
          }
          if (readError === null) setSaved(true);
          else setError(msg(readError));
        } catch (e) {
          setError(msg(e));
          await reread().catch(() => {});
        } finally {
          setSaving(false);
        }
      }

      async function onRemove(id) {
        if (!loaded) {
          setError(T.notLoaded);
          return;
        }
        if (!window.confirm(T.confirmRemoveSource)) return;
        const target = sources.find((s) => s.id === id);
        if (!target) return;
        if (!storedById.has(id)) {
          setSources((prev) => prev.filter((s) => s.id !== id));
          return;
        }
        const nextSources = stored.filter((s) => s.id !== id).map(storedRow);
        const nextDefault = pickDefault(nextSources, defaultSource === id ? "" : defaultSource);
        setSaving(true);
        setSaved(false);
        setError("");
        setNotes([]);
        try {
          await face.writeSources(nextSources, nextDefault, revision);
          const inUse = new Set(nextSources.flatMap((s) => [s.akRef, s.skRef]));
          for (const ref of [target.akRef || secretRefForId(id), target.skRef || passwordRefForId(id)]) {
            if (inUse.has(ref)) continue;
            try {
              await face.unsetSecret(ref);
            } catch (cleanupError) {
              setNotes((prev) => [...prev, T.cleanupFailed.replace("{name}", target.name).replace("{ref}", ref) + msg(cleanupError)]);
            }
          }
          setSources((prev) => prev.filter((s) => s.id !== id));
          setStored(nextSources);
          setDefaultSource(nextDefault);
          try {
            await reread();
            setSaved(true);
          } catch (e) {
            setError(msg(e));
          }
        } catch (e) {
          setError(msg(e));
          await reread().catch(() => {});
        } finally {
          setSaving(false);
        }
      }

      async function onSetDefault(id) {
        if (!loaded) {
          setError(T.notLoaded);
          return;
        }
        if (!storedById.has(id)) return;
        setSaving(true);
        setSaved(false);
        setError("");
        setNotes([]);
        try {
          await face.writeSources(stored.map(storedRow), id, revision);
          await reread();
          setSaved(true);
        } catch (e) {
          setError(msg(e));
          await reread().catch(() => {});
        } finally {
          setSaving(false);
        }
      }

      function secretField(s) {
        const draft = s.secretDraft;
        const focus = s.secretFocus;
        const configured = s.secretConfigured;
        const value = configured && !focus && draft === "" ? MASK : draft;
        return h("div", { style: S.row }, [
          h("div", { style: S.head }, [
            h("label", { style: S.label }, T.secretLabel),
            h("span", { style: { ...S.badge, ...(configured ? S.badgeOk : {}) } }, configured ? T.configured : T.notConfigured),
          ]),
          h("input", {
            type: "password",
            style: S.input,
            placeholder: T.secretPlaceholder,
            value,
            onFocus: () => patchSource(s.id, { secretFocus: true }),
            onBlur: () => {
              if (draft === "") patchSource(s.id, { secretFocus: false });
            },
            onChange: (e) => {
              let v = e.target.value;
              if (v.startsWith(MASK)) v = v.slice(MASK.length);
              patchSource(s.id, { secretDraft: v });
            },
          }),
          h("p", { style: S.hint }, configured ? T.hintConfigured : T.hintEmpty),
        ]);
      }

      function passwordField(s) {
        const draft = s.passwordDraft;
        const focus = s.passwordFocus;
        const configured = s.passwordConfigured;
        const value = configured && !focus && draft === "" ? MASK : draft;
        return h("div", { style: S.row }, [
          h("div", { style: S.head }, [
            h("label", { style: S.label }, T.passwordLabel),
            h("span", { style: { ...S.badge, ...(configured ? S.badgeOk : {}) } }, configured ? T.configured : T.notConfigured),
          ]),
          h("input", {
            type: "password",
            style: S.input,
            placeholder: T.passwordPlaceholder,
            value,
            onFocus: () => patchSource(s.id, { passwordFocus: true }),
            onBlur: () => {
              if (draft === "") patchSource(s.id, { passwordFocus: false });
            },
            onChange: (e) => {
              let v = e.target.value;
              if (v.startsWith(MASK)) v = v.slice(MASK.length);
              patchSource(s.id, { passwordDraft: v });
            },
          }),
          h("p", { style: S.hint }, configured ? T.hintConfigured : T.hintEmpty),
        ]);
      }

      function authFields(s) {
        if (s.authMode === "password") {
          return h("div", { style: S.row }, [
            h("div", { style: S.row }, [
              h("label", { style: S.label }, T.userLabel),
              h("input", {
                type: "text",
                style: S.input,
                placeholder: T.userPlaceholder,
                value: s.username,
                onChange: (e) => patchSource(s.id, { username: e.target.value }),
              }),
            ]),
            passwordField(s),
          ]);
        }
        return h("div", { style: S.row }, [
          h("div", { style: S.row }, [
            h("label", { style: S.label }, T.tokenLabel),
            h("input", {
              type: "text",
              style: S.input,
              placeholder: T.tokenPlaceholder,
              value: s.tokenId,
              onChange: (e) => patchSource(s.id, { tokenId: e.target.value }),
            }),
          ]),
          secretField(s),
        ]);
      }

      function sourceCard(s) {
        const isStored = storedById.has(s.id);
        const dirty = rowDirty(s, storedById);
        const isDefault = isStored && s.id === effectiveDefault;
        return h(
          "div",
          { style: S.source },
          [
            h("div", { style: S.head }, [
              h("span", { style: S.label }, T.sourceNameLabel),
              isDefault ? h("span", { style: { ...S.badge, ...S.badgeOk } }, T.defaultBadge) : null,
              !isStored ? h("span", { style: S.badge }, T.unsavedBadge) : null,
              h("span", { style: S.spacer }),
              isStored && !isDefault
                ? h("button", { type: "button", style: S.button, disabled: saving, onClick: () => onSetDefault(s.id) }, T.setDefault)
                : null,
              h("button", { type: "button", style: S.button, disabled: saving, onClick: () => onRemove(s.id) }, T.removeSource),
            ]),
            h("input", {
              type: "text",
              style: S.input,
              placeholder: T.sourceNamePlaceholder,
              value: s.name,
              onChange: (e) => patchSource(s.id, { name: e.target.value }),
            }),
            h("p", { style: { ...S.hint, ...S.mono } }, T.uidLabel + "  " + s.id),
            h("div", { style: S.row }, [
              h("label", { style: S.label }, T.urlLabel),
              h("input", {
                type: "url",
                style: S.input,
                placeholder: T.urlPlaceholder,
                value: s.baseUrl,
                onChange: (e) => patchSource(s.id, { baseUrl: e.target.value }),
              }),
              h("p", { style: S.hint }, T.urlHint),
            ]),
            h("div", { style: S.row }, [
              h("label", { style: S.label }, T.authLabel),
              h(
                "select",
                { style: S.select, value: s.authMode, onChange: (e) => patchSource(s.id, { authMode: e.target.value }) },
                [h("option", { value: "token" }, T.authToken), h("option", { value: "password" }, T.authPassword)],
              ),
            ]),
            authFields(s),
            h("div", { style: S.row }, [
              h("label", { style: S.checkbox }, [
                h("input", {
                  type: "checkbox",
                  checked: s.allowInsecureTls,
                  onChange: (e) => patchSource(s.id, { allowInsecureTls: e.target.checked }),
                }),
                h("span", {}, T.tlsLabel),
              ]),
              h("p", { style: S.hint }, T.tlsHint),
            ]),
            h("div", { style: S.footer }, [
              h(
                "button",
                { type: "button", style: S.button, disabled: saving || !loaded || !dirty, onClick: () => onSaveOne(s.id) },
                saving ? T.saving : T.saveCurrentSource,
              ),
            ]),
          ],
          s.id,
        );
      }

      const hasLegacyDraft = sources.some((s) => legacy && s.akRef === legacy.akRef && s.skRef === legacy.skRef);
      return h(
        "section",
        { style: open ? { ...S.card, ...S.cardOpen } : S.card },
        [
          h(
            "button",
            { type: "button", style: S.header, "aria-expanded": open, onClick: () => setOpen(!open) },
            [
              h("span", { style: S.headerText }, [h("span", { style: S.title }, T.title), h("span", { style: S.desc }, T.desc)]),
              react_jsx_runtime.jsx("svg", {
                width: 14,
                height: 14,
                viewBox: "0 0 14 14",
                fill: "none",
                "aria-hidden": "true",
                style: { ...S.chevron, transform: open ? "rotate(180deg)" : "none" },
                children: react_jsx_runtime.jsx("path", {
                  d: "M3.5 5.25 7 8.75 10.5 5.25",
                  stroke: "currentColor",
                  strokeWidth: 1.4,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                }),
              }),
            ],
          ),
          open
            ? h(
                "div",
                { style: S.body },
                [
                  h("p", { style: S.heading }, T.sourcesHeading),
                  h("p", { style: S.hint }, T.sourcesNote),
                  loaded && legacy && !hasLegacyDraft
                    ? h("div", { style: S.notice }, [
                        h("span", { style: S.label }, T.importLegacyTitle),
                        h("p", { style: S.hint }, T.importLegacyDesc),
                        h("div", { style: S.footer }, [
                          h("button", { type: "button", style: S.button, disabled: saving, onClick: onImportLegacy }, T.importLegacy),
                        ]),
                      ])
                    : null,
                  loaded && sources.length === 0 && !legacy ? h("p", { style: S.hint }, T.sourcesEmpty) : null,
                  ...sources.map(sourceCard),
                  h("div", { style: S.footer }, [
                    h("button", { type: "button", style: S.button, disabled: saving || !loaded, onClick: onAdd }, T.addSource),
                    !loaded ? h("button", { type: "button", style: S.button, disabled: saving, onClick: reload }, T.reload) : null,
                    saved ? h("p", { style: S.msg }, T.saved) : null,
                    error ? h("p", { style: S.err }, error) : null,
                  ]),
                  ...notes.map((note, i) => h("p", { style: S.err }, note, "note-" + i)),
                ].filter((node) => node !== null),
              )
            : null,
        ].filter((node) => node !== null),
      );
    }

    function remoteNamespace(ctx, ns) {
      return typeof ctx.get === "function" ? ctx.get("remote." + ns) : undefined;
    }

    function unwrap(res, what) {
      if (res && typeof res === "object" && res.ok === true) return res.value;
      const message = (res && typeof res === "object" && res.error && res.error.message) || what + " failed";
      const error = new Error(message);
      if (res && typeof res === "object" && res.ok === false) error.remoteRejected = true;
      throw error;
    }

    function requireNamespace(ctx, ns) {
      const api = remoteNamespace(ctx, ns);
      if (!api) throw new Error(HOST_UNSUPPORTED);
      return api;
    }

    function settingsNamespacesOf(value) {
      const list = value && value.namespaces;
      return Array.isArray(list) ? list : [];
    }

    function normalizeSource(raw) {
      if (!raw || typeof raw !== "object") return null;
      const id = typeof raw.id === "string" ? raw.id.trim() : "";
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      if (!id || !name) return null;
      return {
        id,
        name,
        baseUrl: typeof raw.baseUrl === "string" ? raw.baseUrl : "",
        authMode: raw.authMode === "password" ? "password" : "token",
        tokenId: typeof raw.tokenId === "string" ? raw.tokenId : "",
        akRef: typeof raw.akRef === "string" && raw.akRef ? raw.akRef : secretRefForId(id),
        username: typeof raw.username === "string" ? raw.username : "",
        skRef: typeof raw.skRef === "string" && raw.skRef ? raw.skRef : passwordRefForId(id),
        allowInsecureTls: raw.allowInsecureTls === true,
      };
    }

    function registerSettingsEntry(ctx, face) {
      const candidates = [
        {
          name: "settings.section",
          kind: "list",
          scope: "root",
          options: { name: "settings.section", id: "pve", order: 18, label: "Proxmox VE" },
          component: () => react.createElement(PveCard, { pveCard: face, defaultOpen: true }),
        },
        {
          name: "settings.plugins.tab",
          kind: "list",
          scope: "root",
          options: { name: "settings.plugins.tab", id: "pve", order: 102, label: "Proxmox VE" },
          component: () => react.createElement(PveCard, { pveCard: face }),
        },
        {
          name: "settings.plugin.item",
          kind: "keyed",
          options: { name: "settings.plugin.item", key: "pve", inject: () => ({ pveCard: face }) },
          component: PveCard,
        },
      ];
      if (typeof ctx.slots.spec !== "function") {
        for (const candidate of candidates.slice(1)) {
          ctx.slots.inject(candidate.name, () => ctx.slots.register(candidate.options, candidate.component));
        }
        return;
      }
      ctx.effect(() => {
        const available = new Map();
        const waits = [];
        let active;
        let unregister;
        let queued = false;
        let stopped = false;
        const reconcile = () => {
          if (stopped || queued) return;
          queued = true;
          queueMicrotask(() => {
            queued = false;
            if (stopped) return;
            const next = candidates.map((candidate) => available.get(candidate.name)).find(Boolean);
            if (next === active) return;
            unregister?.();
            unregister = void 0;
            active = void 0;
            if (next) {
              try {
                unregister = ctx.slots.register(next.options, next.component);
                active = next;
              } catch (error) {
                if (error?.code !== "INACTIVE_EFFECT") throw error;
                stop();
              }
            }
          });
        };
        const stop = () => {
          if (stopped) return;
          stopped = true;
          const disposeActive = unregister;
          unregister = void 0;
          active = void 0;
          disposeActive?.();
          for (const dispose of waits.reverse()) dispose?.();
          available.clear();
        };
        try {
          for (const candidate of candidates)
            waits.push(
              ctx.slots.inject(candidate.name, () => {
                const spec = ctx.slots.spec(candidate.name);
                if (spec?.kind !== candidate.kind || (candidate.scope && spec.scope !== candidate.scope)) return;
                const lifetime = { ...candidate };
                available.set(candidate.name, lifetime);
                reconcile();
                return () => {
                  if (available.get(candidate.name) === lifetime) available.delete(candidate.name);
                  reconcile();
                };
              }),
            );
        } catch (error) {
          stop();
          throw error;
        }
        return stop;
      }, "dsh-pve: settings navigation");
    }

    function apply(ctx) {
      let describedRevision = null;
      const face = {
        describe: async () => {
          const settings = remoteNamespace(ctx, "settings");
          if (!settings || !settings.describe) return { hostUnsupported: true, sources: [], defaultSource: "", unconfirmed: true };
          const described = unwrap(await settings.describe(), "settings.describe");
          const ns = settingsNamespacesOf(described).find((n) => n && n.ns === SETTINGS_NS);
          const rawValue = ns && ns.value;
          const value = rawValue && typeof rawValue === "object" && !Array.isArray(rawValue) ? rawValue : {};
          const rawSources = Array.isArray(value.sources) ? value.sources : null;
          const sources = rawSources === null ? [] : rawSources.map(normalizeSource).filter(Boolean);
          const unconfirmed =
            !Array.isArray(described && described.namespaces) || !ns || rawSources === null || sources.length !== rawSources.length;
          const revision = ns && Number.isInteger(ns.revision) ? ns.revision : null;
          describedRevision = revision;
          const legacyAk = typeof value.akRef === "string" && value.akRef ? value.akRef : LEGACY_SECRET_REF;
          const legacySk = typeof value.skRef === "string" && value.skRef ? value.skRef : LEGACY_PASSWORD_REF;
          const refs = Array.from(new Set([...sources.flatMap((s) => [s.akRef, s.skRef]), legacyAk, legacySk]));
          let creds = {};
          const credentials = remoteNamespace(ctx, "credentials");
          if (credentials && credentials.describe) {
            creds = unwrap(await credentials.describe(refs), "credentials.describe") || {};
          }
          const configured = (ref) => Boolean(creds[ref] && creds[ref].configured);
          const legacyUrl = typeof value.baseUrl === "string" ? value.baseUrl : "";
          const legacyPending =
            value.legacyMigrated !== true && sources.length === 0 && Boolean(legacyUrl || configured(legacyAk) || configured(legacySk));
          return {
            hostUnsupported: false,
            unconfirmed,
            sources: sources.map((s) => ({ ...s, secretConfigured: configured(s.akRef), passwordConfigured: configured(s.skRef) })),
            defaultSource: typeof value.defaultSource === "string" ? value.defaultSource : "",
            legacy: legacyPending
              ? {
                  baseUrl: legacyUrl,
                  authMode: value.authMode === "password" ? "password" : "token",
                  tokenId: typeof value.tokenId === "string" ? value.tokenId : "",
                  akRef: legacyAk,
                  username: typeof value.username === "string" ? value.username : "",
                  skRef: legacySk,
                  allowInsecureTls: value.allowInsecureTls === true,
                  secretConfigured: configured(legacyAk),
                  passwordConfigured: configured(legacySk),
                }
              : null,
            revision,
          };
        },
        setSecret: async (ref, value) => unwrap(await requireNamespace(ctx, "credentials").set(ref, value), "credentials.set"),
        unsetSecret: async (ref) => unwrap(await requireNamespace(ctx, "credentials").unset(ref), "credentials.unset"),
        writeSources: async (rows, defaultSource, expectedRevision) => {
          const settings = requireNamespace(ctx, "settings");
          const normalized = rows.map((s) => ({
            id: s.id,
            name: s.name,
            baseUrl: s.baseUrl,
            authMode: s.authMode === "password" ? "password" : "token",
            tokenId: s.tokenId,
            akRef: s.akRef || secretRefForId(s.id),
            username: s.username,
            skRef: s.skRef || passwordRefForId(s.id),
            allowInsecureTls: s.allowInsecureTls === true,
          }));
          unwrap(
            await settings.mutate(
              SETTINGS_NS,
              [
                { op: "set", path: ["sources"], value: normalized },
                { op: "set", path: ["defaultSource"], value: defaultSource },
                { op: "set", path: ["legacyMigrated"], value: true },
              ],
              Number.isInteger(expectedRevision) ? expectedRevision : Number.isInteger(describedRevision) ? describedRevision : void 0,
            ),
            "settings.mutate",
          );
        },
        localePreference: async () => {
          const settings = remoteNamespace(ctx, "settings");
          if (!settings || !settings.describe) return "";
          try {
            const described = unwrap(await settings.describe(), "settings.describe");
            const locale = settingsNamespacesOf(described).find((n) => n && n.ns === "locale");
            const pref = locale && locale.value && locale.value.preference;
            return typeof pref === "string" ? pref : "";
          } catch {
            return "";
          }
        },
      };

      registerSettingsEntry(ctx, face);
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
