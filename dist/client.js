"use strict";
(() => {
  // src/client.ts
  var sectionId = "dsh-remote-access";
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
        await call("changePassword", { currentPassword, newPassword });
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
  function createClientModule(React) {
    return {
      inject: ["slots", "locale"],
      apply(ctx) {
        const disposeStyles = ctx.styles?.insert(css);
        if (disposeStyles && ctx.effect) ctx.effect(() => disposeStyles);
        const t = ctx.locale.bind("dsh-remote-access");
        ctx.slots.inject("settings.section", () => ctx.slots.register({
          name: "settings.section",
          id: sectionId,
          order: 80,
          label: () => t("title"),
          inject: () => ({ t, call: (method, args) => ctx.host.call(`dshRemoteAccess.${method}`, args), React })
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
