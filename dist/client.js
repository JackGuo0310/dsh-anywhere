"use strict";
(() => {
  // src/locale.generated.ts
  var localeNamespace = "dsh-remote-access";
  var dictionaries = {
    "en": {
      "title": "Remote Access Gateway",
      "summary": "Manage LAN, Tailscale, and public-tunnel access. Every external request passes through the login gateway.",
      "safetyBody": "Do not expose DSH's original port directly. Publish only this gateway and require HTTPS for public access.",
      "overviewTitle": "Status",
      "gatewayRunning": "Access gateway",
      "administratorReady": "Administrator password",
      "listenAddress": "Listen address",
      "tunnelState": "Public tunnel",
      "yes": "Enabled",
      "no": "Disabled",
      "configured": "Configured",
      "notConfigured": "Not configured",
      "working": "Working\u2026",
      "refreshStatus": "Refresh status",
      "discoverNetwork": "Detect LAN",
      "detectTailscale": "Detect Tailscale",
      "lanFound": "Available on the LAN at:",
      "lanNotFound": "No usable LAN IPv4 address was detected.",
      "tailscaleFound": "Tailscale detected:",
      "tailscaleNotFound": "No usable Tailscale address was detected.",
      "tailscaleNotInstalled": "Tailscale is not installed, or its command is not on PATH.",
      "tailscaleDisconnected": "Tailscale is installed but not connected.",
      "tunnelTitle": "Connections and sessions",
      "tunnelBody": "Configure a provider before starting or restarting the tunnel. Revoking sessions signs out every remote device.",
      "tunnelNeedsConfiguration": "No tunnel provider is configured. Complete the tunnel settings in the configuration file first.",
      "startTunnel": "Start tunnel",
      "restartTunnel": "Restart tunnel",
      "revokeSessions": "Revoke all sessions",
      "tunnelStarted": "Tunnel started.",
      "tunnelRestarted": "Tunnel restarted.",
      "sessionsRevoked": "All remote sessions were revoked.",
      "changePasswordTitle": "Change administrator password",
      "changePasswordBody": "Verify the current password, save its replacement, and revoke all remote sessions.",
      "currentPassword": "Current password",
      "newPassword": "New password (minimum 12 characters)",
      "confirmPassword": "Confirm new password",
      "changePassword": "Change password",
      "passwordMismatch": "New passwords do not match.",
      "passwordChanged": "Password changed. All remote sessions were revoked.",
      "configurationTitle": "Advanced configuration",
      "configurationBody": "Use \u201COpen configuration file\u201D in the top-right corner for listener, credential-reference, and tunnel settings."
    },
    "zh": {
      "title": "\u8FDC\u7A0B\u8BBF\u95EE\u7F51\u5173",
      "summary": "\u7BA1\u7406\u5C40\u57DF\u7F51\u3001Tailscale \u548C\u516C\u7F51\u96A7\u9053\u8BBF\u95EE\u3002\u6240\u6709\u5916\u90E8\u8BF7\u6C42\u90FD\u4F1A\u5148\u7ECF\u8FC7\u767B\u5F55\u7F51\u5173\u3002",
      "safetyBody": "\u8BF7\u52FF\u76F4\u63A5\u66B4\u9732 DSH \u539F\u59CB\u7AEF\u53E3\uFF1B\u5BF9\u5916\u53EA\u5F00\u653E\u6B64\u7F51\u5173\uFF0C\u5E76\u4E3A\u516C\u7F51\u8BBF\u95EE\u542F\u7528 HTTPS\u3002",
      "overviewTitle": "\u8FD0\u884C\u72B6\u6001",
      "gatewayRunning": "\u8BBF\u95EE\u7F51\u5173",
      "administratorReady": "\u7BA1\u7406\u5458\u5BC6\u7801",
      "listenAddress": "\u76D1\u542C\u5730\u5740",
      "tunnelState": "\u516C\u7F51\u96A7\u9053",
      "yes": "\u5DF2\u542F\u7528",
      "no": "\u672A\u542F\u7528",
      "configured": "\u5DF2\u914D\u7F6E",
      "notConfigured": "\u672A\u914D\u7F6E",
      "working": "\u5904\u7406\u4E2D\u2026",
      "refreshStatus": "\u5237\u65B0\u72B6\u6001",
      "discoverNetwork": "\u68C0\u6D4B\u5C40\u57DF\u7F51",
      "detectTailscale": "\u68C0\u6D4B Tailscale",
      "lanFound": "\u53EF\u901A\u8FC7\u4EE5\u4E0B\u5C40\u57DF\u7F51\u5730\u5740\u8BBF\u95EE\uFF1A",
      "lanNotFound": "\u672A\u68C0\u6D4B\u5230\u53EF\u7528\u7684\u5C40\u57DF\u7F51 IPv4 \u5730\u5740\u3002",
      "tailscaleFound": "\u5DF2\u68C0\u6D4B\u5230 Tailscale\uFF1A",
      "tailscaleNotFound": "\u672A\u68C0\u6D4B\u5230\u53EF\u7528\u7684 Tailscale \u5730\u5740\u3002",
      "tailscaleNotInstalled": "\u672A\u5B89\u88C5 Tailscale\uFF0C\u6216 tailscale \u547D\u4EE4\u4E0D\u5728 PATH \u4E2D\u3002",
      "tailscaleDisconnected": "Tailscale \u5DF2\u5B89\u88C5\uFF0C\u4F46\u5F53\u524D\u672A\u8FDE\u63A5\u3002",
      "tunnelTitle": "\u8FDE\u63A5\u4E0E\u4F1A\u8BDD",
      "tunnelBody": "\u542F\u52A8\u6216\u91CD\u542F\u96A7\u9053\u524D\u9700\u5148\u5B8C\u6210\u63D0\u4F9B\u5546\u914D\u7F6E\u3002\u64A4\u9500\u4F1A\u8BDD\u4F1A\u8BA9\u6240\u6709\u8FDC\u7A0B\u8BBE\u5907\u91CD\u65B0\u767B\u5F55\u3002",
      "tunnelNeedsConfiguration": "\u5C1A\u672A\u914D\u7F6E\u96A7\u9053\u63D0\u4F9B\u5546\uFF0C\u8BF7\u5148\u5728\u914D\u7F6E\u6587\u4EF6\u4E2D\u5B8C\u6210\u8BBE\u7F6E\u3002",
      "startTunnel": "\u542F\u52A8\u96A7\u9053",
      "restartTunnel": "\u91CD\u542F\u96A7\u9053",
      "revokeSessions": "\u64A4\u9500\u6240\u6709\u4F1A\u8BDD",
      "tunnelStarted": "\u96A7\u9053\u5DF2\u542F\u52A8\u3002",
      "tunnelRestarted": "\u96A7\u9053\u5DF2\u91CD\u542F\u3002",
      "sessionsRevoked": "\u6240\u6709\u8FDC\u7A0B\u4F1A\u8BDD\u5DF2\u64A4\u9500\u3002",
      "changePasswordTitle": "\u4FEE\u6539\u7BA1\u7406\u5458\u5BC6\u7801",
      "changePasswordBody": "\u9A8C\u8BC1\u5F53\u524D\u5BC6\u7801\u540E\u4FDD\u5B58\u65B0\u5BC6\u7801\uFF0C\u5E76\u64A4\u9500\u6240\u6709\u8FDC\u7A0B\u4F1A\u8BDD\u3002",
      "currentPassword": "\u5F53\u524D\u5BC6\u7801",
      "newPassword": "\u65B0\u5BC6\u7801\uFF08\u81F3\u5C11 12 \u4E2A\u5B57\u7B26\uFF09",
      "confirmPassword": "\u786E\u8BA4\u65B0\u5BC6\u7801",
      "changePassword": "\u4FEE\u6539\u5BC6\u7801",
      "passwordMismatch": "\u4E24\u6B21\u8F93\u5165\u7684\u65B0\u5BC6\u7801\u4E0D\u4E00\u81F4\u3002",
      "passwordChanged": "\u5BC6\u7801\u5DF2\u4FEE\u6539\uFF0C\u6240\u6709\u8FDC\u7A0B\u4F1A\u8BDD\u5DF2\u64A4\u9500\u3002",
      "configurationTitle": "\u9AD8\u7EA7\u914D\u7F6E",
      "configurationBody": "\u76D1\u542C\u5730\u5740\u3001\u51ED\u636E\u5F15\u7528\u548C\u96A7\u9053\u53C2\u6570\u8BF7\u901A\u8FC7\u53F3\u4E0A\u89D2\u201C\u6253\u5F00\u914D\u7F6E\u6587\u4EF6\u201D\u8FDB\u884C\u8BBE\u7F6E\u3002"
    }
  };

  // src/client-module.ts
  var sectionId = "dsh-remote-access";
  var remoteNamespace = "dshRemoteAccess";
  var css = `
.dsh-remote-access{max-width:760px;padding:4px 0 24px;color:var(--dsw-alias-label-primary)}
.dsh-remote-intro{margin:0 0 18px;color:var(--dsw-alias-label-secondary);line-height:1.55}
.dsh-remote-card{margin-top:16px;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.dsh-remote-card h2{margin:0 0 14px;font-size:15px;font-weight:650}.dsh-remote-card p{margin:0;color:var(--dsw-alias-label-secondary);line-height:1.5}
.dsh-remote-note{padding:14px 16px;border-radius:9px;background:var(--dsw-alias-bg-layer-2)}
.dsh-remote-status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px}
.dsh-remote-row{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:48px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-remote-row:nth-last-child(-n+2){border-bottom:0}.dsh-remote-label{font-size:14px}.dsh-remote-value{color:var(--dsw-alias-label-secondary);font-size:14px;text-align:right;overflow-wrap:anywhere}
.dsh-remote-value[data-state=success]{color:var(--dsw-alias-state-success-primary)}.dsh-remote-value[data-state=idle]{color:var(--dsw-alias-state-idle-primary)}
.dsh-remote-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.dsh-remote-button{min-height:44px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;cursor:pointer}
.dsh-remote-button:hover{background:var(--dsw-alias-bg-layer-2)}.dsh-remote-button:focus-visible,.dsh-remote-fields input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.dsh-remote-button-primary{border-color:transparent;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}.dsh-remote-button-primary:hover{opacity:.88}.dsh-remote-button:disabled{opacity:.5;cursor:wait}
.dsh-remote-feedback{margin-top:12px;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-size:14px}.dsh-remote-feedback[data-tone=success]{color:var(--dsw-alias-state-success-primary)}.dsh-remote-feedback[data-tone=error]{color:var(--dsw-alias-state-error-primary)}
.dsh-remote-fields{display:grid;gap:14px;margin-top:16px}.dsh-remote-fields label{display:grid;gap:7px;font-size:14px}.dsh-remote-fields input{min-height:44px;padding:0 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;outline:none}.dsh-remote-fields input:focus{border-color:var(--dsw-alias-brand-primary)}
@media(max-width:640px){.dsh-remote-status-grid{grid-template-columns:1fr}.dsh-remote-row:nth-last-child(2){border-bottom:1px solid var(--dsw-alias-border-l1)}}
`;
  function objectOf(value) {
    return value !== null && typeof value === "object" ? value : {};
  }
  function textOf(value, fallback) {
    return typeof value === "string" && value.trim() ? value : fallback;
  }
  function yesNo(value, t) {
    return value ? t("yes") : t("no");
  }
  function SettingsSection(props) {
    const { t, call, React } = props;
    const h = React.createElement;
    const [gatewayStatus, setGatewayStatus] = React.useState(void 0);
    const [feedback, setFeedback] = React.useState(void 0);
    const [busy, setBusy] = React.useState(void 0);
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const invoke = React.useCallback(async (method) => {
      setBusy(method);
      setFeedback(void 0);
      try {
        const result = await call(method);
        const value = objectOf(result);
        if (method === "status") setGatewayStatus(value);
        if (method === "discoverNetwork") {
          const addresses = Array.isArray(value.lanIpv4) ? value.lanIpv4.join("\u3001") : "";
          setFeedback({ tone: "success", message: addresses ? `${t("lanFound")} ${addresses}:${String(value.gatewayPort ?? "")}` : t("lanNotFound") });
        } else if (method === "detectTailscale") {
          const ipv4 = Array.isArray(value.ipv4) ? value.ipv4.join("\u3001") : "";
          const ipv6 = Array.isArray(value.ipv6) ? value.ipv6.join("\u3001") : "";
          const dns = textOf(value.magicDnsName, "");
          const details = [dns, ipv4, ipv6].filter(Boolean).join(" \xB7 ");
          const message = value.installed === false ? t("tailscaleNotInstalled") : value.connected === false ? t("tailscaleDisconnected") : details ? `${t("tailscaleFound")} ${details}` : t("tailscaleNotFound");
          setFeedback({ tone: value.connected ? "success" : "error", message });
        } else if (method === "startTunnel") setFeedback({ tone: "success", message: t("tunnelStarted") });
        else if (method === "restartTunnel") setFeedback({ tone: "success", message: t("tunnelRestarted") });
        else if (method === "revokeAllSessions") setFeedback({ tone: "success", message: t("sessionsRevoked") });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const missingTunnel = (method === "startTunnel" || method === "restartTunnel") && message === "No tunnel provider is configured.";
        setFeedback({ tone: "error", message: missingTunnel ? t("tunnelNeedsConfiguration") : message });
      } finally {
        setBusy(void 0);
      }
    }, [call, t]);
    React.useEffect(() => {
      void invoke("status");
    }, [invoke]);
    const changePassword = React.useCallback(async () => {
      if (newPassword !== confirmPassword) {
        setFeedback({ tone: "error", message: t("passwordMismatch") });
        return;
      }
      setBusy("changePassword");
      setFeedback(void 0);
      try {
        await call("changePassword", { request: { currentPassword, newPassword } });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFeedback({ tone: "success", message: t("passwordChanged") });
      } catch (error) {
        setFeedback({ tone: "error", message: error instanceof Error ? error.message : String(error) });
      } finally {
        setBusy(void 0);
      }
    }, [call, confirmPassword, currentPassword, newPassword, t]);
    const configured = objectOf(gatewayStatus?.configured);
    const tunnel = objectOf(gatewayStatus?.tunnel);
    const statusRows = [
      [t("gatewayRunning"), yesNo(gatewayStatus?.running, t), gatewayStatus?.running ? "success" : "idle"],
      [t("administratorReady"), yesNo(gatewayStatus?.administratorConfigured, t), gatewayStatus?.administratorConfigured ? "success" : "idle"],
      [t("listenAddress"), `${textOf(configured.listenHost, "\u2014")}:${String(configured.listenPort ?? "\u2014")}`, ""],
      [t("tunnelState"), gatewayStatus?.tunnel ? textOf(tunnel.state, textOf(tunnel.id, t("configured"))) : t("notConfigured"), gatewayStatus?.tunnel ? "success" : "idle"]
    ];
    return h(
      "main",
      { className: "dsh-remote-access" },
      h("p", { className: "dsh-remote-intro" }, t("summary")),
      h("section", { className: "dsh-remote-note" }, h("p", null, t("safetyBody"))),
      h(
        "section",
        { className: "dsh-remote-card" },
        h("h2", null, t("overviewTitle")),
        h("div", { className: "dsh-remote-status-grid" }, ...statusRows.map(([label, value, state]) => h("div", { className: "dsh-remote-row", key: label }, h("span", { className: "dsh-remote-label" }, label), h("span", { className: "dsh-remote-value", "data-state": state }, value)))),
        h(
          "div",
          { className: "dsh-remote-actions" },
          h("button", { className: "dsh-remote-button", type: "button", disabled: !!busy, onClick: () => invoke("status") }, busy === "status" ? t("working") : t("refreshStatus")),
          h("button", { className: "dsh-remote-button", type: "button", disabled: !!busy, onClick: () => invoke("discoverNetwork") }, t("discoverNetwork")),
          h("button", { className: "dsh-remote-button", type: "button", disabled: !!busy, onClick: () => invoke("detectTailscale") }, t("detectTailscale"))
        )
      ),
      h(
        "section",
        { className: "dsh-remote-card" },
        h("h2", null, t("tunnelTitle")),
        h("p", null, t("tunnelBody")),
        h(
          "div",
          { className: "dsh-remote-actions" },
          h("button", { className: "dsh-remote-button dsh-remote-button-primary", type: "button", disabled: !!busy, onClick: () => invoke("startTunnel") }, t("startTunnel")),
          h("button", { className: "dsh-remote-button", type: "button", disabled: !!busy, onClick: () => invoke("restartTunnel") }, t("restartTunnel")),
          h("button", { className: "dsh-remote-button", type: "button", disabled: !!busy || !gatewayStatus?.running, onClick: () => invoke("revokeAllSessions") }, t("revokeSessions"))
        ),
        feedback ? h("div", { className: "dsh-remote-feedback", "data-tone": feedback.tone, role: feedback.tone === "error" ? "alert" : "status" }, feedback.message) : null
      ),
      h(
        "section",
        { className: "dsh-remote-card" },
        h("h2", null, t("changePasswordTitle")),
        h("p", null, t("changePasswordBody")),
        h(
          "div",
          { className: "dsh-remote-fields" },
          h("label", null, t("currentPassword"), h("input", { type: "password", autoComplete: "current-password", value: currentPassword, disabled: !!busy, onChange: (event) => setCurrentPassword(event.target.value) })),
          h("label", null, t("newPassword"), h("input", { type: "password", autoComplete: "new-password", value: newPassword, disabled: !!busy, onChange: (event) => setNewPassword(event.target.value) })),
          h("label", null, t("confirmPassword"), h("input", { type: "password", autoComplete: "new-password", value: confirmPassword, disabled: !!busy, onChange: (event) => setConfirmPassword(event.target.value) }))
        ),
        h("div", { className: "dsh-remote-actions" }, h("button", { className: "dsh-remote-button dsh-remote-button-primary", type: "button", disabled: !!busy || !currentPassword || !newPassword || !confirmPassword, onClick: changePassword }, t("changePassword")))
      ),
      h("section", { className: "dsh-remote-card" }, h("h2", null, t("configurationTitle")), h("p", null, t("configurationBody")))
    );
  }
  async function callRemoteHost(ctx, method, args = {}) {
    const result = await ctx.connection.rpc.call("/api", `${remoteNamespace}/${method}`, { args });
    if (result.ok) return result.value;
    throw new Error(result.error?.message ?? `Remote call ${method} failed.`);
  }
  function insertStyles() {
    if (typeof document === "undefined" || document.head === null) return;
    const selector = "style[data-dsh-remote-access-styles]";
    const existing = document.head.querySelector(selector);
    if (existing) return;
    const style = document.createElement("style");
    style.dataset.dshRemoteAccessStyles = "";
    style.textContent = css;
    document.head.append(style);
    return () => style.remove();
  }
  function createClientModule(React) {
    return {
      inject: ["slots", "locale", "connection"],
      apply(ctx) {
        ctx.effect(() => insertStyles());
        for (const [locale, dict] of Object.entries(dictionaries)) ctx.effect(() => ctx.locale.register(localeNamespace, locale, dict));
        const t = ctx.locale.bind(localeNamespace);
        const call = (method, args) => callRemoteHost(ctx, method, args ?? {});
        ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({
          name: "settings.section",
          id: sectionId,
          order: 80,
          label: () => t("title"),
          inject: () => ({ t, call, React })
        }, SettingsSection)));
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
