"use strict";
(() => {
  // src/locale.generated.ts
  var localeNamespace = "dsh-remote-access";
  var dictionaries = {
    "en": {
      "title": "Remote Access Gateway",
      "summary": "A login gateway before every direct or public-tunnel path to a loopback-only DSH Web GUI, including HTTP, SSE, WebSocket, and API traffic.",
      "safetyTitle": "Security boundary",
      "safetyBody": "Do not expose DSH's original port. External access requires an administrator password, session protection, CSRF checks, and origin validation.",
      "operationsTitle": "Read-only diagnostics and controls",
      "operationsBody": "These controls disclose no password, token, cookie, or secret reference.",
      "status": "Gateway status",
      "discoverNetwork": "Discover LAN addresses",
      "detectTailscale": "Detect Tailscale",
      "startTunnel": "Start tunnel",
      "restartTunnel": "Restart tunnel",
      "revokeSessions": "Revoke all sessions",
      "changePasswordTitle": "Change administrator password",
      "changePasswordBody": "The current password is verified before the replacement is saved as a scrypt hash. All active remote sessions will be revoked.",
      "currentPassword": "Current password",
      "newPassword": "New password (minimum 12 characters)",
      "confirmPassword": "Confirm new password",
      "changePassword": "Change password",
      "passwordMismatch": "New passwords do not match.",
      "passwordChanged": "Password changed. All remote sessions were revoked.",
      "configurationTitle": "Configuration",
      "configurationBody": "Set passwords and tunnel secrets through the host credential flow. Keep public deployments HTTPS-only and trust forwarding headers only from explicit proxies."
    },
    "zh": {
      "title": "\u8FDC\u7A0B\u8BBF\u95EE\u7F51\u5173",
      "summary": "\u5728\u6240\u6709\u76F4\u8FDE\u4E0E\u516C\u7F51\u96A7\u9053\u8DEF\u5F84\u524D\u63D0\u4F9B\u767B\u5F55\u7F51\u5173\uFF0C\u7EDF\u4E00\u4FDD\u62A4\u4EC5\u9650\u672C\u673A DSH Web GUI \u7684 HTTP\u3001SSE\u3001WebSocket \u4E0E API \u8BF7\u6C42\u3002",
      "safetyTitle": "\u5B89\u5168\u8FB9\u754C",
      "safetyBody": "\u4E0D\u8981\u66B4\u9732 DSH \u539F\u59CB\u7AEF\u53E3\u3002\u5916\u90E8\u8BBF\u95EE\u9700\u8981\u7BA1\u7406\u5458\u5BC6\u7801\u3001\u4F1A\u8BDD\u4FDD\u62A4\u3001CSRF \u68C0\u67E5\u548C\u6765\u6E90\u6821\u9A8C\u3002",
      "operationsTitle": "\u53EA\u8BFB\u8BCA\u65AD\u4E0E\u63A7\u5236",
      "operationsBody": "\u8FD9\u4E9B\u64CD\u4F5C\u4E0D\u4F1A\u8FD4\u56DE\u5BC6\u7801\u3001\u4EE4\u724C\u3001Cookie \u6216 secret \u5F15\u7528\u3002",
      "status": "\u7F51\u5173\u72B6\u6001",
      "discoverNetwork": "\u68C0\u6D4B\u5C40\u57DF\u7F51\u5730\u5740",
      "detectTailscale": "\u68C0\u6D4B Tailscale",
      "startTunnel": "\u542F\u52A8\u96A7\u9053",
      "restartTunnel": "\u91CD\u542F\u96A7\u9053",
      "revokeSessions": "\u64A4\u9500\u6240\u6709\u4F1A\u8BDD",
      "changePasswordTitle": "\u4FEE\u6539\u7BA1\u7406\u5458\u5BC6\u7801",
      "changePasswordBody": "\u7CFB\u7EDF\u4F1A\u5148\u9A8C\u8BC1\u5F53\u524D\u5BC6\u7801\uFF0C\u518D\u5C06\u65B0\u5BC6\u7801\u4FDD\u5B58\u4E3A scrypt \u54C8\u5E0C\uFF1B\u6240\u6709\u8FDC\u7A0B\u4F1A\u8BDD\u5C06\u88AB\u64A4\u9500\u3002",
      "currentPassword": "\u5F53\u524D\u5BC6\u7801",
      "newPassword": "\u65B0\u5BC6\u7801\uFF08\u81F3\u5C11 12 \u4E2A\u5B57\u7B26\uFF09",
      "confirmPassword": "\u786E\u8BA4\u65B0\u5BC6\u7801",
      "changePassword": "\u4FEE\u6539\u5BC6\u7801",
      "passwordMismatch": "\u4E24\u6B21\u8F93\u5165\u7684\u65B0\u5BC6\u7801\u4E0D\u4E00\u81F4\u3002",
      "passwordChanged": "\u5BC6\u7801\u5DF2\u4FEE\u6539\uFF0C\u6240\u6709\u8FDC\u7A0B\u4F1A\u8BDD\u5DF2\u64A4\u9500\u3002",
      "configurationTitle": "\u914D\u7F6E",
      "configurationBody": "\u901A\u8FC7 Host \u51ED\u636E\u6D41\u7A0B\u8BBE\u7F6E\u5BC6\u7801\u548C\u96A7\u9053 secret\u3002\u516C\u7F51\u90E8\u7F72\u5FC5\u987B\u4F7F\u7528 HTTPS\uFF0C\u4E14\u4EC5\u4FE1\u4EFB\u663E\u5F0F\u4EE3\u7406\u53D1\u9001\u7684\u8F6C\u53D1\u8BF7\u6C42\u5934\u3002"
    }
  };

  // src/client-module.ts
  var sectionId = "dsh-remote-access";
  var remoteNamespace = "dshRemoteAccess";
  var css = `
.dsh-remote-access{max-width:840px;padding:24px;color:var(--dsh-color-text,#e9f0ec)}
.dsh-remote-access h1{margin:0 0 6px;font-size:28px}.dsh-remote-access h2{margin:0;font-size:18px}
.dsh-remote-access p{color:var(--dsh-color-text-muted,#a9bbb1)}.dsh-remote-card{margin-top:16px;padding:18px;border:1px solid var(--dsh-color-border,#3d5046);border-radius:12px;background:var(--dsh-color-surface,#18221d)}
.dsh-remote-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.dsh-remote-access button{min-height:38px;padding:0 12px;border:0;border-radius:8px;background:var(--dsh-color-primary,#2c8462);color:#fff;font:inherit;font-weight:650;cursor:pointer}.dsh-remote-access button:disabled{opacity:.55;cursor:wait}
.dsh-remote-status{margin-top:12px;padding:10px;border-radius:8px;background:var(--dsh-color-surface-raised,#223129);white-space:pre-wrap}.dsh-remote-password-fields{display:grid;gap:10px}.dsh-remote-password-fields label{display:grid;gap:5px;font-weight:600}.dsh-remote-password-fields input{padding:9px;border:1px solid var(--dsh-color-border,#3d5046);border-radius:8px;background:var(--dsh-color-surface-raised,#223129);color:inherit;font:inherit}.dsh-remote-warning{border-left:4px solid #e0a547}.dsh-remote-error{border-left:4px solid #db5b58}
`;
  function SettingsSection(props) {
    const { t, call, React } = props;
    const h = React.createElement;
    const [status, setStatus] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const invoke = React.useCallback(async (method) => {
      setBusy(true);
      setStatus("");
      try {
        const result = await call(method);
        setStatus(JSON.stringify(result, null, 2));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    }, [call]);
    const changePassword = React.useCallback(async () => {
      if (newPassword !== confirmPassword) {
        setStatus(t("passwordMismatch"));
        return;
      }
      setBusy(true);
      setStatus("");
      try {
        await call("changePassword", { request: { currentPassword, newPassword } });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setStatus(t("passwordChanged"));
      } catch (error) {
        setStatus(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    }, [call, confirmPassword, currentPassword, newPassword, t]);
    return h(
      "main",
      { className: "dsh-remote-access" },
      h("h1", null, t("title")),
      h("p", null, t("summary")),
      h(
        "section",
        { className: "dsh-remote-card dsh-remote-warning" },
        h("h2", null, t("safetyTitle")),
        h("p", null, t("safetyBody"))
      ),
      h(
        "section",
        { className: "dsh-remote-card" },
        h("h2", null, t("operationsTitle")),
        h("p", null, t("operationsBody")),
        h(
          "div",
          { className: "dsh-remote-actions" },
          h("button", { type: "button", disabled: busy, onClick: () => invoke("status") }, t("status")),
          h("button", { type: "button", disabled: busy, onClick: () => invoke("discoverNetwork") }, t("discoverNetwork")),
          h("button", { type: "button", disabled: busy, onClick: () => invoke("detectTailscale") }, t("detectTailscale")),
          h("button", { type: "button", disabled: busy, onClick: () => invoke("startTunnel") }, t("startTunnel")),
          h("button", { type: "button", disabled: busy, onClick: () => invoke("restartTunnel") }, t("restartTunnel")),
          h("button", { type: "button", disabled: busy, onClick: () => invoke("revokeAllSessions") }, t("revokeSessions"))
        ),
        status ? h("pre", { className: "dsh-remote-status", role: "status" }, status) : null
      ),
      h(
        "section",
        { className: "dsh-remote-card" },
        h("h2", null, t("changePasswordTitle")),
        h("p", null, t("changePasswordBody")),
        h(
          "div",
          { className: "dsh-remote-password-fields" },
          h("label", null, t("currentPassword"), h("input", { type: "password", autoComplete: "current-password", value: currentPassword, disabled: busy, onChange: (event) => setCurrentPassword(event.target.value) })),
          h("label", null, t("newPassword"), h("input", { type: "password", autoComplete: "new-password", value: newPassword, disabled: busy, onChange: (event) => setNewPassword(event.target.value) })),
          h("label", null, t("confirmPassword"), h("input", { type: "password", autoComplete: "new-password", value: confirmPassword, disabled: busy, onChange: (event) => setConfirmPassword(event.target.value) }))
        ),
        h(
          "div",
          { className: "dsh-remote-actions" },
          h("button", { type: "button", disabled: busy || !currentPassword || !newPassword || !confirmPassword, onClick: changePassword }, t("changePassword"))
        )
      ),
      h(
        "section",
        { className: "dsh-remote-card" },
        h("h2", null, t("configurationTitle")),
        h("p", null, t("configurationBody"))
      )
    );
  }
  async function callRemoteHost(ctx, method, args = {}) {
    const result = await ctx.connection.rpc.call("/api", `${remoteNamespace}/${method}`, { args });
    if (result.ok) return result.value;
    throw new Error(result.error?.message ?? `Remote call ${method} failed.`);
  }
  function insertStyles() {
    if (typeof document === "undefined" || document.head === null) return;
    const style = document.createElement("style");
    style.dataset.dshRemoteAccessStyles = "";
    style.textContent = css;
    document.head.append(style);
  }
  function createClientModule(React) {
    return {
      inject: ["slots", "locale", "connection"],
      apply(ctx) {
        insertStyles();
        for (const [locale, dict] of Object.entries(dictionaries)) ctx.locale.register(localeNamespace, locale, dict);
        const t = ctx.locale.bind(localeNamespace);
        const call = (method, args) => callRemoteHost(ctx, method, args ?? {});
        ctx.slots.inject("settings.section", () => ctx.slots.register({
          name: "settings.section",
          id: sectionId,
          order: 80,
          label: () => t("title"),
          inject: () => ({ t, call, React })
        }, SettingsSection));
      }
    };
  }

  // src/client-entry.ts
  window.__ModuleLoader__?.load({
    id: "@dsh-community/dsh-remote-access",
    factory(require2) {
      return createClientModule(require2("react"));
    }
  });
})();
