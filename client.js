// dsh-pve 浏览器设置卡片。
// DSH 0.1.2：API Token 的 secret 走 ctx.remote.credentials（凭证库 Remote），仅写不读，
// describe 只返回 configured 布尔；baseUrl / tokenId / allowInsecureTls 不是敏感信息，
// 存 settings namespace（pve），settings.describe 对非 secret 字段返回明文 value，可回显核对。
window.__ModuleLoader__.load({
  id: "dsh-pve",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    const react_jsx_runtime = require("react/jsx-runtime");
    const react = require("react");

    const SECRET_REF = "PVE_API_TOKEN_SECRET";
    const SETTINGS_NS = "pve";
    const MASK = "*".repeat(28);
    const inject = ["slots", "remote", "remote.credentials", "remote.settings"];

    const STRINGS = {
      zh: {
        title: "Proxmox VE 控制",
        desc: "通过对话检查和操控 Proxmox VE。API Token 密钥仅保存在本地，永远不会被显示。",
        urlLabel: "Base URL",
        tokenLabel: "Token ID",
        secretLabel: "Token Secret",
        tlsLabel: "跳过 TLS 校验",
        configured: "已配置",
        notConfigured: "未配置",
        urlPlaceholderConfigured: "输入新 URL 以替换",
        urlPlaceholderEmpty: "https://pve.example.com",
        tokenPlaceholder: "user@realm!tokenid，例如 monitoring@pve!dsh",
        secretPlaceholder: "留空则保留当前值；输入新 Secret 以替换",
        tlsHint: "自签名证书的内网 PVE 需勾选。",
        urlHint:
          "支持 HTTP 与 HTTPS。URL 保存在设置中，保存后会在此显示以便核对。",
        hintConfigured: "已配置。星号只是占位符，并非存储的值。",
        hintEmpty: "存储在本地 DSH 凭证库中，凭证值永远不会被读回。",
        removeUrl: "移除 URL",
        removeToken: "移除 Token ID",
        removeSecret: "移除 Secret",
        saving: "保存中…",
        save: "保存",
        saved: "已保存。新会话将使用更新后的配置。",
        invalidUrl:
          "PVE URL 必须是不含凭证、查询参数或片段的绝对 HTTP(S) 地址。",
        confirmRemoveUrl: "确定要移除已存储的 PVE URL 吗？",
        confirmRemoveToken: "确定要移除已存储的 Token ID 吗？",
        confirmRemoveSecret: "确定要移除已存储的 Token Secret 吗？",
      },
      en: {
        title: "Proxmox VE control",
        desc: "Inspect and manage Proxmox VE through conversation. The API token secret is stored locally and never displayed.",
        urlLabel: "Base URL",
        tokenLabel: "Token ID",
        secretLabel: "Token Secret",
        tlsLabel: "Skip TLS verification",
        configured: "Configured",
        notConfigured: "Not configured",
        urlPlaceholderConfigured: "Enter a new URL to replace it",
        urlPlaceholderEmpty: "https://pve.example.com",
        tokenPlaceholder: "user@realm!tokenid, e.g. monitoring@pve!dsh",
        secretPlaceholder:
          "Leave blank to keep the current value; enter a new Secret to replace it",
        tlsHint: "Enable for internal PVE hosts with self-signed certificates.",
        urlHint:
          "HTTP and HTTPS are both supported. The URL is stored in settings and shown here after saving.",
        hintConfigured:
          "Configured. The stars are a placeholder, not the stored value.",
        hintEmpty:
          "Stored in the local DSH credential store; the value is never read back.",
        removeUrl: "Remove URL",
        removeToken: "Remove Token ID",
        removeSecret: "Remove Secret",
        saving: "Saving…",
        save: "Save",
        saved: "Saved. New conversations will use the updated configuration.",
        invalidUrl:
          "PVE URL must be an absolute HTTP(S) URL without credentials, query, or fragment.",
        confirmRemoveUrl: "Remove the stored PVE URL?",
        confirmRemoveToken: "Remove the stored Token ID?",
        confirmRemoveSecret: "Remove the stored Token Secret?",
      },
    };

    function detectLanguage() {
      try {
        if (
          typeof navigator !== "undefined" &&
          String(navigator.language || "")
            .toLowerCase()
            .startsWith("zh")
        )
          return "zh";
      } catch {
        /* 忽略，走默认。 */
      }
      return "en";
    }

    const S = {
      card: {
        border: "1px solid var(--dsw-alias-border-l2)",
        borderRadius: "12px",
        background: "var(--dsw-alias-bg-layer-3)",
        marginBottom: "12px",
      },
      cardOpen: { background: "var(--dsw-alias-bg-layer-2)" },
      header: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "16px",
        margin: 0,
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        font: "inherit",
        color: "inherit",
      },
      headerText: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        flex: "1 1 auto",
        minWidth: 0,
      },
      chevron: {
        flexShrink: 0,
        display: "inline-flex",
        transition: "transform .16s",
        color: "var(--dsw-alias-label-tertiary)",
      },
      body: {
        borderTop: "1px solid var(--dsw-alias-border-l2)",
        margin: "0 16px",
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      },
      title: {
        margin: 0,
        fontSize: "15px",
        fontWeight: 600,
        color: "var(--dsw-alias-label-primary)",
      },
      desc: {
        margin: 0,
        fontSize: "13px",
        color: "var(--dsw-alias-label-secondary)",
      },
      row: { display: "flex", flexDirection: "column", gap: "6px" },
      head: { display: "flex", alignItems: "center", gap: "8px" },
      label: {
        fontSize: "13px",
        fontWeight: 500,
        color: "var(--dsw-alias-label-primary)",
      },
      inputRow: { display: "flex", alignItems: "center", gap: "8px" },
      input: {
        border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-bg-layer-3)",
        height: "34px",
        color: "var(--dsw-alias-label-primary)",
        borderRadius: "8px",
        padding: "0 12px",
        fontSize: "13px",
        flex: "1 1 auto",
        minWidth: 0,
      },
      hint: {
        margin: 0,
        fontSize: "12px",
        color: "var(--dsw-alias-label-tertiary)",
      },
      badge: {
        whiteSpace: "nowrap",
        borderRadius: "999px",
        padding: "1px 8px",
        fontSize: "11px",
        fontWeight: 500,
        background: "var(--dsw-alias-bg-module-platform)",
        color: "var(--dsw-alias-label-secondary)",
        display: "inline-block",
      },
      badgeOk: { color: "#2f9e44" },
      footer: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
      },
      button: {
        border: "1px solid var(--dsw-alias-border-l2)",
        background: "var(--dsw-alias-bg-layer-3)",
        color: "var(--dsw-alias-label-primary)",
        borderRadius: "8px",
        height: "32px",
        padding: "0 14px",
        fontSize: "13px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
      },
      msg: {
        margin: 0,
        fontSize: "12px",
        color: "var(--dsw-alias-label-secondary)",
      },
      err: {
        margin: 0,
        fontSize: "12px",
        color: "var(--dsw-alias-label-error)",
      },
      checkbox: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        color: "var(--dsw-alias-label-primary)",
      },
    };

    function PveCard(props) {
      const face = props.pveCard;
      const [status, setStatus] = react.useState({
        loaded: false,
        base: false,
        token: false,
        secret: false,
        tls: false,
      });
      const [baseDraft, setBaseDraft] = react.useState("");
      const [tokenDraft, setTokenDraft] = react.useState("");
      const [secretDraft, setSecretDraft] = react.useState("");
      const [tlsDraft, setTlsDraft] = react.useState(false);
      const [saving, setSaving] = react.useState(false);
      const [saved, setSaved] = react.useState(false);
      const [error, setError] = react.useState("");
      const [secretFocus, setSecretFocus] = react.useState(false);
      const [lang, setLang] = react.useState(detectLanguage);
      const [open, setOpen] = react.useState(false);
      const T = STRINGS[lang] ?? STRINGS.en;

      const secretValue =
        status.secret && !secretFocus && secretDraft === ""
          ? MASK
          : secretDraft;

      react.useEffect(() => {
        let alive = true;
        face
          .describe()
          .then((r) => {
            if (!alive) return;
            setStatus({
              loaded: true,
              base: r.baseConfigured,
              token: r.tokenConfigured,
              secret: r.secretConfigured,
              tls: r.allowInsecureTls === true,
            });
            if (r.baseUrl) setBaseDraft(r.baseUrl);
            if (r.tokenId) setTokenDraft(r.tokenId);
            setTlsDraft(r.allowInsecureTls === true);
          })
          .catch(() => {});
        return () => {
          alive = false;
        };
      }, [face]);

      react.useEffect(() => {
        let alive = true;
        face
          .localePreference()
          .then((p) => {
            if (alive && (p === "zh" || p === "en")) setLang(p);
          })
          .catch(() => {});
        return () => {
          alive = false;
        };
      }, [face]);

      async function onSave() {
        setSaving(true);
        setSaved(false);
        setError("");
        try {
          const secret = secretDraft.trim();
          const b = baseDraft.trim();
          const t = tokenDraft.trim();
          if (b !== "") {
            const url = new URL(b);
            if (
              !["https:", "http:"].includes(url.protocol) ||
              url.username ||
              url.password ||
              url.search ||
              url.hash
            ) {
              throw new Error(T.invalidUrl);
            }
            await face.setBaseUrl(b);
          }
          if (t !== "") await face.setTokenId(t);
          if (secret !== "") await face.setSecret(secret);
          await face.setAllowInsecureTls(tlsDraft);
          const r = await face.describe();
          setStatus({
            loaded: true,
            base: r.baseConfigured,
            token: r.tokenConfigured,
            secret: r.secretConfigured,
            tls: r.allowInsecureTls === true,
          });
          setBaseDraft(r.baseConfigured ? r.baseUrl : "");
          setTokenDraft(r.tokenConfigured ? r.tokenId : "");
          setSecretDraft("");
          setSecretFocus(false);
          setTlsDraft(r.allowInsecureTls === true);
          setSaved(true);
        } catch (e) {
          setError(String(e?.message ?? e));
        } finally {
          setSaving(false);
        }
      }

      async function onClear(kind) {
        const message =
          kind === "base"
            ? T.confirmRemoveUrl
            : kind === "token"
              ? T.confirmRemoveToken
              : T.confirmRemoveSecret;
        if (!window.confirm(message)) return;
        setSaving(true);
        setSaved(false);
        setError("");
        try {
          if (kind === "base") await face.unsetBaseUrl();
          else if (kind === "token") await face.unsetTokenId();
          else await face.unsetSecret();
          const r = await face.describe();
          setStatus({
            loaded: true,
            base: r.baseConfigured,
            token: r.tokenConfigured,
            secret: r.secretConfigured,
            tls: r.allowInsecureTls === true,
          });
          if (kind === "base") setBaseDraft("");
          if (kind === "token") setTokenDraft("");
          if (kind === "secret") {
            setSecretDraft("");
            setSecretFocus(false);
          }
          setSaved(true);
        } catch (e) {
          setError(String(e?.message ?? e));
        } finally {
          setSaving(false);
        }
      }

      return (0, react_jsx_runtime.jsxs)("section", {
        style: open ? { ...S.card, ...S.cardOpen } : S.card,
        children: [
          (0, react_jsx_runtime.jsxs)("button", {
            type: "button",
            style: S.header,
            "aria-expanded": open,
            onClick: () => setOpen(!open),
            children: [
              (0, react_jsx_runtime.jsxs)("span", {
                style: S.headerText,
                children: [
                  (0, react_jsx_runtime.jsx)("span", {
                    style: S.title,
                    children: T.title,
                  }),
                  (0, react_jsx_runtime.jsx)("span", {
                    style: S.desc,
                    children: T.desc,
                  }),
                ],
              }),
              (0, react_jsx_runtime.jsx)("svg", {
                width: 14,
                height: 14,
                viewBox: "0 0 14 14",
                fill: "none",
                "aria-hidden": "true",
                style: {
                  ...S.chevron,
                  transform: open ? "rotate(180deg)" : "none",
                },
                children: (0, react_jsx_runtime.jsx)("path", {
                  d: "M3.5 5.25 7 8.75 10.5 5.25",
                  stroke: "currentColor",
                  strokeWidth: 1.4,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                }),
              }),
            ],
          }),
          open
            ? (0, react_jsx_runtime.jsxs)("div", {
                style: S.body,
                children: [
                  (0, react_jsx_runtime.jsxs)("div", {
                    style: S.row,
                    children: [
                      (0, react_jsx_runtime.jsxs)("div", {
                        style: S.head,
                        children: [
                          (0, react_jsx_runtime.jsx)("label", {
                            style: S.label,
                            children: T.urlLabel,
                          }),
                          status.loaded
                            ? (0, react_jsx_runtime.jsx)("span", {
                                style: {
                                  ...S.badge,
                                  ...(status.base ? S.badgeOk : {}),
                                },
                                children: status.base
                                  ? T.configured
                                  : T.notConfigured,
                              })
                            : null,
                        ],
                      }),
                      (0, react_jsx_runtime.jsxs)("div", {
                        style: S.inputRow,
                        children: [
                          (0, react_jsx_runtime.jsx)("input", {
                            type: "url",
                            style: S.input,
                            placeholder: status.base
                              ? T.urlPlaceholderConfigured
                              : T.urlPlaceholderEmpty,
                            value: baseDraft,
                            onChange: (e) => setBaseDraft(e.target.value),
                          }),
                          status.base
                            ? (0, react_jsx_runtime.jsx)("button", {
                                style: S.button,
                                disabled: saving,
                                onClick: () => onClear("base"),
                                children: T.removeUrl,
                              })
                            : null,
                        ],
                      }),
                      (0, react_jsx_runtime.jsx)("p", {
                        style: S.hint,
                        children: T.urlHint,
                      }),
                    ],
                  }),
                  (0, react_jsx_runtime.jsxs)("div", {
                    style: S.row,
                    children: [
                      (0, react_jsx_runtime.jsxs)("div", {
                        style: S.head,
                        children: [
                          (0, react_jsx_runtime.jsx)("label", {
                            style: S.label,
                            children: T.tokenLabel,
                          }),
                          status.loaded
                            ? (0, react_jsx_runtime.jsx)("span", {
                                style: {
                                  ...S.badge,
                                  ...(status.token ? S.badgeOk : {}),
                                },
                                children: status.token
                                  ? T.configured
                                  : T.notConfigured,
                              })
                            : null,
                        ],
                      }),
                      (0, react_jsx_runtime.jsxs)("div", {
                        style: S.inputRow,
                        children: [
                          (0, react_jsx_runtime.jsx)("input", {
                            type: "text",
                            style: S.input,
                            placeholder: T.tokenPlaceholder,
                            value: tokenDraft,
                            onChange: (e) => setTokenDraft(e.target.value),
                          }),
                          status.token
                            ? (0, react_jsx_runtime.jsx)("button", {
                                style: S.button,
                                disabled: saving,
                                onClick: () => onClear("token"),
                                children: T.removeToken,
                              })
                            : null,
                        ],
                      }),
                      (0, react_jsx_runtime.jsx)("p", {
                        style: S.hint,
                        children: T.tokenPlaceholder,
                      }),
                    ],
                  }),
                  (0, react_jsx_runtime.jsxs)("div", {
                    style: S.row,
                    children: [
                      (0, react_jsx_runtime.jsxs)("div", {
                        style: S.head,
                        children: [
                          (0, react_jsx_runtime.jsx)("label", {
                            style: S.label,
                            children: T.secretLabel,
                          }),
                          status.loaded
                            ? (0, react_jsx_runtime.jsx)("span", {
                                style: {
                                  ...S.badge,
                                  ...(status.secret ? S.badgeOk : {}),
                                },
                                children: status.secret
                                  ? T.configured
                                  : T.notConfigured,
                              })
                            : null,
                        ],
                      }),
                      (0, react_jsx_runtime.jsxs)("div", {
                        style: S.inputRow,
                        children: [
                          (0, react_jsx_runtime.jsx)("input", {
                            type: "password",
                            style: S.input,
                            placeholder: T.secretPlaceholder,
                            value: secretValue,
                            onFocus: () => setSecretFocus(true),
                            onBlur: () => {
                              if (secretDraft === "") setSecretFocus(false);
                            },
                            onChange: (e) => {
                              let v = e.target.value;
                              if (v.startsWith(MASK)) v = v.slice(MASK.length);
                              setSecretDraft(v);
                            },
                          }),
                          status.secret
                            ? (0, react_jsx_runtime.jsx)("button", {
                                style: S.button,
                                disabled: saving,
                                onClick: () => onClear("secret"),
                                children: T.removeSecret,
                              })
                            : null,
                        ],
                      }),
                      (0, react_jsx_runtime.jsx)("p", {
                        style: S.hint,
                        children: status.secret
                          ? T.hintConfigured
                          : T.hintEmpty,
                      }),
                    ],
                  }),
                  (0, react_jsx_runtime.jsxs)("div", {
                    style: S.row,
                    children: [
                      (0, react_jsx_runtime.jsxs)("label", {
                        style: S.checkbox,
                        children: [
                          (0, react_jsx_runtime.jsx)("input", {
                            type: "checkbox",
                            checked: tlsDraft,
                            onChange: (e) => setTlsDraft(e.target.checked),
                          }),
                          (0, react_jsx_runtime.jsx)("span", {
                            children: T.tlsLabel,
                          }),
                        ],
                      }),
                      (0, react_jsx_runtime.jsx)("p", {
                        style: S.hint,
                        children: T.tlsHint,
                      }),
                    ],
                  }),
                  (0, react_jsx_runtime.jsxs)("div", {
                    style: S.footer,
                    children: [
                      (0, react_jsx_runtime.jsx)("button", {
                        style: S.button,
                        disabled: saving,
                        onClick: onSave,
                        children: saving ? T.saving : T.save,
                      }),
                      saved
                        ? (0, react_jsx_runtime.jsx)("p", {
                            style: S.msg,
                            children: T.saved,
                          })
                        : null,
                      error
                        ? (0, react_jsx_runtime.jsx)("p", {
                            style: S.err,
                            children: error,
                          })
                        : null,
                    ],
                  }),
                ],
              })
            : null,
        ],
      });
    }

    function apply(ctx) {
      const mustOk = (res) => {
        if (!res || res.ok === false)
          throw (res && res.error) ?? new Error("remote call failed");
        return res.value;
      };
      const face = {
        describe: async () => {
          const [credRes, setRes] = await Promise.all([
            ctx.remote.credentials.describe([SECRET_REF]),
            ctx.remote.settings.describe(),
          ]);
          const creds = credRes?.ok ? (credRes.value ?? {}) : {};
          const namespaces = setRes?.ok ? (setRes.value?.namespaces ?? []) : [];
          const jsNs = namespaces.find((n) => n?.ns === SETTINGS_NS);
          const baseUrl =
            typeof jsNs?.value?.baseUrl === "string" ? jsNs.value.baseUrl : "";
          const tokenId =
            typeof jsNs?.value?.tokenId === "string" ? jsNs.value.tokenId : "";
          const allowInsecureTls = jsNs?.value?.allowInsecureTls === true;
          return {
            secretConfigured: creds[SECRET_REF]?.configured ?? false,
            baseConfigured: Boolean(baseUrl),
            baseUrl,
            tokenConfigured: Boolean(tokenId),
            tokenId,
            allowInsecureTls,
          };
        },
        setSecret: (value) =>
          ctx.remote.credentials.set(SECRET_REF, value).then(mustOk),
        setBaseUrl: (value) =>
          ctx.remote.settings
            .update(SETTINGS_NS, { baseUrl: value }, undefined)
            .then(mustOk),
        setTokenId: (value) =>
          ctx.remote.settings
            .update(SETTINGS_NS, { tokenId: value }, undefined)
            .then(mustOk),
        setAllowInsecureTls: (value) =>
          ctx.remote.settings
            .update(SETTINGS_NS, { allowInsecureTls: value }, undefined)
            .then(mustOk),
        unsetSecret: () =>
          ctx.remote.credentials.unset(SECRET_REF).then(mustOk),
        unsetBaseUrl: () =>
          ctx.remote.settings
            .mutate(
              SETTINGS_NS,
              [{ op: "unset", path: ["baseUrl"] }],
              undefined,
            )
            .then(mustOk),
        unsetTokenId: () =>
          ctx.remote.settings
            .mutate(
              SETTINGS_NS,
              [{ op: "unset", path: ["tokenId"] }],
              undefined,
            )
            .then(mustOk),
        localePreference: async () => {
          const res = await ctx.remote.settings.describe();
          if (!res?.ok) return "";
          const namespaces = res.value?.namespaces ?? [];
          const locale = namespaces.find((n) => n?.ns === "locale");
          const pref = locale?.value?.preference;
          return typeof pref === "string" ? pref : "";
        },
      };

      ctx.slots.inject("settings.plugin.item", () =>
        ctx.slots.register(
          {
            name: "settings.plugin.item",
            key: "pve",
            inject: () => ({ pveCard: face }),
          },
          PveCard,
        ),
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
