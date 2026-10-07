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
      "initializePasswordTitle": "Set initial administrator password",
      "initializePasswordBody": "No current password is required the first time. Set a password of at least 10 characters to enable remote access.",
      "initializePassword": "Set password",
      "passwordInitialized": "Administrator password configured.",
      "changePasswordTitle": "Change administrator password",
      "changePasswordBody": "Verify the current password, save its replacement, and revoke all remote sessions.",
      "currentPassword": "Current password",
      "newPassword": "New password (minimum 10 characters)",
      "confirmPassword": "Confirm new password",
      "changePassword": "Change password",
      "passwordTooShort": "The new password must be at least 10 characters.",
      "passwordMismatch": "New passwords do not match.",
      "passwordChanged": "Password changed. All remote sessions were revoked.",
      "configurationTitle": "Access configuration",
      "configurationBody": "Saving applies these settings through DSH configuration. LAN and Tailscale modes listen on all network interfaces.",
      "enableGateway": "Enable access gateway",
      "accessMode": "Access mode",
      "modeLoopback": "This computer only",
      "modeLan": "Local network",
      "modeTailscale": "Tailscale",
      "modeTunnel": "Public tunnel",
      "listenHostField": "Listen address",
      "gatewayPort": "Gateway port",
      "targetHost": "DSH target host",
      "targetPort": "DSH original port",
      "targetProtocol": "DSH target protocol",
      "protocolHttp": "HTTP",
      "protocolHttps": "HTTPS",
      "publicBaseUrl": "Public HTTPS URL",
      "trustedProxyCidrs": "Trusted proxy IP/CIDR entries (one per line)",
      "sessionTtlMinutes": "Session lifetime (minutes)",
      "maxRequestBodyBytes": "Maximum request body (bytes)",
      "adminPasswordSecretRef": "Administrator credential reference",
      "tunnelConfiguration": "Tunnel provider",
      "tunnelProvider": "Provider",
      "providerNone": "None",
      "providerFrp": "FRP",
      "providerCustom": "Custom command",
      "frpExecutablePath": "frpc executable path",
      "frpServerAddress": "FRP server address",
      "frpServerPort": "FRP server port",
      "frpAuthMethod": "FRP authentication",
      "authToken": "Token",
      "authOidc": "OIDC",
      "authNone": "None",
      "frpTransport": "FRP transport",
      "transportStcp": "STCP",
      "frpCustomDomain": "Public domain",
      "frpTlsEnabled": "Enable FRP TLS",
      "frpStartWithDsh": "Start tunnel with DSH",
      "frpTokenSecretRef": "FRP token credential reference",
      "frpToken": "New FRP token (leave blank to keep current)",
      "frpStcpSecretRef": "STCP credential reference",
      "frpStcpSecret": "New STCP secret (leave blank to keep current)",
      "customCommand": "Command executable",
      "customArgs": "Arguments (one per line)",
      "saveAndApply": "Save and apply",
      "configurationSaved": "Configuration saved and applied.",
      "invalidPort": "Ports must be integers from 1 through 65535.",
      "invalidSessionTtl": "Session lifetime must be from 5 through 43200 minutes.",
      "invalidBodyLimit": "Request body limit must be from 1024 through 1073741824 bytes.",
      "hostRequired": "Listen address and DSH target host are required.",
      "passwordFirst": "Set the administrator password before saving access settings.",
      "publicUrlHttpsRequired": "Public tunnel mode requires an HTTPS public URL.",
      "tunnelProviderRequired": "Public tunnel mode requires a tunnel provider.",
      "frpRequired": "FRP requires the frpc path and server address.",
      "frpTokenRefRequired": "Token authentication requires a credential reference.",
      "frpDomainRequired": "HTTP/HTTPS FRP requires a public domain.",
      "stcpRefRequired": "STCP requires a secret credential reference.",
      "customCommandRequired": "A custom tunnel requires a command executable."
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
      "initializePasswordTitle": "\u8BBE\u7F6E\u521D\u59CB\u7BA1\u7406\u5458\u5BC6\u7801",
      "initializePasswordBody": "\u9996\u6B21\u4F7F\u7528\u65E0\u9700\u5F53\u524D\u5BC6\u7801\u3002\u8BF7\u8BBE\u7F6E\u81F3\u5C11 10 \u4E2A\u5B57\u7B26\u7684\u5BC6\u7801\uFF0C\u4FDD\u5B58\u540E\u5373\u53EF\u542F\u7528\u8FDC\u7A0B\u8BBF\u95EE\u3002",
      "initializePassword": "\u8BBE\u7F6E\u5BC6\u7801",
      "passwordInitialized": "\u7BA1\u7406\u5458\u5BC6\u7801\u5DF2\u8BBE\u7F6E\u3002",
      "changePasswordTitle": "\u4FEE\u6539\u7BA1\u7406\u5458\u5BC6\u7801",
      "changePasswordBody": "\u9A8C\u8BC1\u5F53\u524D\u5BC6\u7801\u540E\u4FDD\u5B58\u65B0\u5BC6\u7801\uFF0C\u5E76\u64A4\u9500\u6240\u6709\u8FDC\u7A0B\u4F1A\u8BDD\u3002",
      "currentPassword": "\u5F53\u524D\u5BC6\u7801",
      "newPassword": "\u65B0\u5BC6\u7801\uFF08\u81F3\u5C11 10 \u4E2A\u5B57\u7B26\uFF09",
      "confirmPassword": "\u786E\u8BA4\u65B0\u5BC6\u7801",
      "changePassword": "\u4FEE\u6539\u5BC6\u7801",
      "passwordTooShort": "\u65B0\u5BC6\u7801\u81F3\u5C11\u9700\u8981 10 \u4E2A\u5B57\u7B26\u3002",
      "passwordMismatch": "\u4E24\u6B21\u8F93\u5165\u7684\u65B0\u5BC6\u7801\u4E0D\u4E00\u81F4\u3002",
      "passwordChanged": "\u5BC6\u7801\u5DF2\u4FEE\u6539\uFF0C\u6240\u6709\u8FDC\u7A0B\u4F1A\u8BDD\u5DF2\u64A4\u9500\u3002",
      "configurationTitle": "\u8BBF\u95EE\u914D\u7F6E",
      "configurationBody": "\u4FDD\u5B58\u540E\u4F1A\u901A\u8FC7 DSH \u914D\u7F6E\u7CFB\u7EDF\u81EA\u52A8\u5E94\u7528\u3002\u5C40\u57DF\u7F51\u4E0E Tailscale \u6A21\u5F0F\u5C06\u76D1\u542C\u6240\u6709\u7F51\u7EDC\u63A5\u53E3\u3002",
      "enableGateway": "\u542F\u7528\u8BBF\u95EE\u7F51\u5173",
      "accessMode": "\u8BBF\u95EE\u65B9\u5F0F",
      "modeLoopback": "\u4EC5\u672C\u673A",
      "modeLan": "\u5C40\u57DF\u7F51",
      "modeTailscale": "Tailscale",
      "modeTunnel": "\u516C\u7F51\u96A7\u9053",
      "listenHostField": "\u76D1\u542C\u5730\u5740",
      "gatewayPort": "\u7F51\u5173\u7AEF\u53E3",
      "targetHost": "DSH \u76EE\u6807\u4E3B\u673A",
      "targetPort": "DSH \u539F\u59CB\u7AEF\u53E3",
      "targetProtocol": "DSH \u76EE\u6807\u534F\u8BAE",
      "protocolHttp": "HTTP",
      "protocolHttps": "HTTPS",
      "publicBaseUrl": "\u516C\u7F51 HTTPS \u5730\u5740",
      "trustedProxyCidrs": "\u53EF\u4FE1\u4EE3\u7406 IP/CIDR\uFF08\u6BCF\u884C\u4E00\u6761\uFF09",
      "sessionTtlMinutes": "\u4F1A\u8BDD\u6709\u6548\u671F\uFF08\u5206\u949F\uFF09",
      "maxRequestBodyBytes": "\u8BF7\u6C42\u4F53\u4E0A\u9650\uFF08\u5B57\u8282\uFF09",
      "adminPasswordSecretRef": "\u7BA1\u7406\u5458\u51ED\u636E\u5F15\u7528",
      "tunnelConfiguration": "\u96A7\u9053\u63D0\u4F9B\u5546",
      "tunnelProvider": "\u63D0\u4F9B\u5546",
      "providerNone": "\u4E0D\u4F7F\u7528",
      "providerFrp": "FRP",
      "providerCustom": "\u81EA\u5B9A\u4E49\u547D\u4EE4",
      "frpExecutablePath": "frpc \u7A0B\u5E8F\u8DEF\u5F84",
      "frpServerAddress": "FRP \u670D\u52A1\u5668\u5730\u5740",
      "frpServerPort": "FRP \u670D\u52A1\u5668\u7AEF\u53E3",
      "frpAuthMethod": "FRP \u8BA4\u8BC1\u65B9\u5F0F",
      "authToken": "Token",
      "authOidc": "OIDC",
      "authNone": "\u65E0\u8BA4\u8BC1",
      "frpTransport": "FRP \u4F20\u8F93\u7C7B\u578B",
      "transportStcp": "STCP",
      "frpCustomDomain": "\u516C\u7F51\u57DF\u540D",
      "frpTlsEnabled": "\u542F\u7528 FRP TLS",
      "frpStartWithDsh": "\u968F DSH \u542F\u52A8\u96A7\u9053",
      "frpTokenSecretRef": "FRP Token \u51ED\u636E\u5F15\u7528",
      "frpToken": "\u65B0 FRP Token\uFF08\u7559\u7A7A\u5219\u4FDD\u7559\uFF09",
      "frpStcpSecretRef": "STCP \u51ED\u636E\u5F15\u7528",
      "frpStcpSecret": "\u65B0 STCP \u5BC6\u94A5\uFF08\u7559\u7A7A\u5219\u4FDD\u7559\uFF09",
      "customCommand": "\u547D\u4EE4\u7A0B\u5E8F",
      "customArgs": "\u547D\u4EE4\u53C2\u6570\uFF08\u6BCF\u884C\u4E00\u9879\uFF09",
      "saveAndApply": "\u4FDD\u5B58\u5E76\u5E94\u7528",
      "configurationSaved": "\u914D\u7F6E\u5DF2\u4FDD\u5B58\u5E76\u5E94\u7528\u3002",
      "invalidPort": "\u7AEF\u53E3\u5FC5\u987B\u662F 1\u201365535 \u4E4B\u95F4\u7684\u6574\u6570\u3002",
      "invalidSessionTtl": "\u4F1A\u8BDD\u6709\u6548\u671F\u5FC5\u987B\u662F 5\u201343200 \u5206\u949F\u3002",
      "invalidBodyLimit": "\u8BF7\u6C42\u4F53\u4E0A\u9650\u5FC5\u987B\u662F 1024\u20131073741824 \u5B57\u8282\u3002",
      "hostRequired": "\u76D1\u542C\u5730\u5740\u548C DSH \u76EE\u6807\u4E3B\u673A\u4E0D\u80FD\u4E3A\u7A7A\u3002",
      "passwordFirst": "\u8BF7\u5148\u8BBE\u7F6E\u7BA1\u7406\u5458\u5BC6\u7801\uFF0C\u518D\u4FDD\u5B58\u8BBF\u95EE\u914D\u7F6E\u3002",
      "publicUrlHttpsRequired": "\u516C\u7F51\u96A7\u9053\u6A21\u5F0F\u5FC5\u987B\u586B\u5199 HTTPS \u516C\u7F51\u5730\u5740\u3002",
      "tunnelProviderRequired": "\u516C\u7F51\u96A7\u9053\u6A21\u5F0F\u5FC5\u987B\u9009\u62E9\u96A7\u9053\u63D0\u4F9B\u5546\u3002",
      "frpRequired": "FRP \u9700\u8981\u586B\u5199 frpc \u8DEF\u5F84\u548C\u670D\u52A1\u5668\u5730\u5740\u3002",
      "frpTokenRefRequired": "Token \u8BA4\u8BC1\u9700\u8981\u586B\u5199\u51ED\u636E\u5F15\u7528\u3002",
      "frpDomainRequired": "HTTP/HTTPS FRP \u9700\u8981\u586B\u5199\u516C\u7F51\u57DF\u540D\u3002",
      "stcpRefRequired": "STCP \u9700\u8981\u586B\u5199\u5BC6\u94A5\u51ED\u636E\u5F15\u7528\u3002",
      "customCommandRequired": "\u81EA\u5B9A\u4E49\u96A7\u9053\u9700\u8981\u586B\u5199\u547D\u4EE4\u7A0B\u5E8F\u3002"
    }
  };

  // src/client-module.ts
  var sectionId = "dsh-remote-access";
  var remoteNamespace = "dshRemoteAccess";
  var pluginVersion = "0.1.19";
  var defaults = {
    enabled: false,
    mode: "loopback",
    listenHost: "127.0.0.1",
    listenPort: "4173",
    targetHost: "127.0.0.1",
    targetPort: "3080",
    targetProtocol: "http",
    publicBaseUrl: "",
    trustedProxyCidrs: "",
    sessionTtlMinutes: "1440",
    maxRequestBodyBytes: "52428800",
    adminPasswordSecretRef: "DSH_REMOTE_ADMIN_HASH",
    tunnelProvider: "none",
    frpExecutablePath: "",
    frpServerAddress: "",
    frpServerPort: "7000",
    frpAuthMethod: "token",
    frpTokenSecretRef: "DSH_REMOTE_FRP_TOKEN",
    frpToken: "",
    frpStcpSecretRef: "DSH_REMOTE_FRP_STCP_SECRET",
    frpStcpSecret: "",
    frpTransport: "https",
    frpCustomDomain: "",
    frpTlsEnabled: true,
    frpStartWithDsh: false,
    customCommand: "",
    customArgs: ""
  };
  var css = `
.dsh-remote-access{max-width:840px;padding:4px 0 28px;color:var(--dsw-alias-label-primary)}.dsh-remote-heading{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.dsh-remote-intro{margin:0;color:var(--dsw-alias-label-secondary);line-height:1.55}.dsh-remote-version{display:inline-flex;align-items:center;min-height:24px;padding:1px 9px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}.dsh-remote-card{margin-top:16px;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}.dsh-remote-card h2{margin:0 0 8px;font-size:16px}.dsh-remote-card p{margin:0;color:var(--dsw-alias-label-secondary);line-height:1.5}.dsh-remote-note{padding:14px 16px;border-radius:9px;background:var(--dsw-alias-bg-layer-2)}.dsh-remote-status-grid,.dsh-remote-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 20px;margin-top:16px}.dsh-remote-row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}.dsh-remote-value{color:var(--dsw-alias-label-secondary);text-align:right}.dsh-remote-value[data-state=success]{color:var(--dsw-alias-state-success-primary)}.dsh-remote-fields label{display:grid;gap:7px;font-size:14px}.dsh-remote-fields .wide{grid-column:1/-1}.dsh-remote-fields input,.dsh-remote-fields select,.dsh-remote-fields textarea{min-height:44px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit}.dsh-remote-fields textarea{min-height:76px;resize:vertical}.dsh-remote-check{display:flex!important;align-items:center;gap:10px!important}.dsh-remote-check input{min-height:auto;width:18px;height:18px}.dsh-remote-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.dsh-remote-button{min-height:44px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer}.dsh-remote-button-primary{border-color:transparent;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}.dsh-remote-button:disabled{opacity:.5;cursor:wait}.dsh-remote-button:focus-visible,.dsh-remote-fields :focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.dsh-remote-feedback{margin-top:12px;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2)}.dsh-remote-feedback[data-tone=success]{color:var(--dsw-alias-state-success-primary)}.dsh-remote-feedback[data-tone=error]{color:#c62828!important;border:1px solid #d32f2f;background:#ffebee}.dsh-remote-actions+.dsh-remote-feedback{margin-top:10px}.dsh-remote-subtitle{grid-column:1/-1;margin:8px 0 0;font-size:14px;font-weight:650}@media(max-width:640px){.dsh-remote-status-grid,.dsh-remote-fields{grid-template-columns:1fr}.dsh-remote-fields .wide,.dsh-remote-subtitle{grid-column:auto}}
`;
  function objectOf(value) {
    return value && typeof value === "object" ? value : {};
  }
  function text(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }
  function validateForm(form, administratorConfigured, t) {
    const portKeys = ["listenPort", "targetPort", ...form.tunnelProvider === "frp" ? ["frpServerPort"] : []];
    if (portKeys.some((key) => !Number.isInteger(Number(form[key])) || Number(form[key]) < 1 || Number(form[key]) > 65535)) return t("invalidPort");
    const ttl = Number(form.sessionTtlMinutes);
    if (!Number.isInteger(ttl) || ttl < 5 || ttl > 43200) return t("invalidSessionTtl");
    const body = Number(form.maxRequestBodyBytes);
    if (!Number.isInteger(body) || body < 1024 || body > 1073741824) return t("invalidBodyLimit");
    if (!String(form.listenHost).trim() || !String(form.targetHost).trim()) return t("hostRequired");
    if (!administratorConfigured) return t("passwordFirst");
    if (form.mode === "tunnel" && !String(form.publicBaseUrl).startsWith("https://")) return t("publicUrlHttpsRequired");
    if (form.mode === "tunnel" && form.tunnelProvider === "none") return t("tunnelProviderRequired");
    if (form.tunnelProvider === "frp" && (!form.frpExecutablePath || !form.frpServerAddress)) return t("frpRequired");
    if (form.tunnelProvider === "frp" && form.frpAuthMethod === "token" && !form.frpTokenSecretRef) return t("frpTokenRefRequired");
    if (form.tunnelProvider === "frp" && form.frpTransport !== "stcp" && !form.frpCustomDomain) return t("frpDomainRequired");
    if (form.tunnelProvider === "frp" && form.frpTransport === "stcp" && !form.frpStcpSecretRef) return t("stcpRefRequired");
    if (form.tunnelProvider === "custom" && !String(form.customCommand).trim()) return t("customCommandRequired");
    return void 0;
  }
  function SettingsSection({ t, call, React }) {
    const h = React.createElement;
    const [status, setStatus] = React.useState({});
    const [form, setForm] = React.useState({ ...defaults });
    const [busy, setBusy] = React.useState("");
    const [feedback, setFeedback] = React.useState(void 0);
    const [feedbackArea, setFeedbackArea] = React.useState("overview");
    const [currentPassword, setCurrentPassword] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
    const populate = (value) => {
      const c = objectOf(value.configured), target = objectOf(c.target), frp = objectOf(c.frp), command = objectOf(c.customCommand);
      setStatus(value);
      setForm((previous) => ({ ...previous, enabled: c.enabled === true, mode: text(c.mode, "loopback"), listenHost: text(c.listenHost, "127.0.0.1"), listenPort: String(c.listenPort ?? 4173), targetHost: text(target.host, "127.0.0.1"), targetPort: String(target.port ?? 3080), targetProtocol: text(target.protocol, "http"), publicBaseUrl: text(c.publicBaseUrl), trustedProxyCidrs: Array.isArray(c.trustedProxyCidrs) ? c.trustedProxyCidrs.join("\n") : "", sessionTtlMinutes: String(c.sessionTtlMinutes ?? 1440), maxRequestBodyBytes: String(c.maxRequestBodyBytes ?? 52428800), adminPasswordSecretRef: text(c.adminPasswordSecretRef, "DSH_REMOTE_ADMIN_HASH"), tunnelProvider: c.frp ? "frp" : c.customCommandEnabled ? "custom" : "none", frpExecutablePath: text(frp.executablePath), frpServerAddress: text(frp.serverAddress), frpServerPort: String(frp.serverPort ?? 7e3), frpAuthMethod: text(frp.authMethod, "token"), frpTokenSecretRef: text(frp.tokenSecretRef, "DSH_REMOTE_FRP_TOKEN"), frpStcpSecretRef: text(frp.stcpSecretRef, "DSH_REMOTE_FRP_STCP_SECRET"), frpTransport: text(frp.transport, "https"), frpCustomDomain: text(frp.customDomain), frpTlsEnabled: frp.tlsEnabled !== false, frpStartWithDsh: frp.startWithDsh === true, customCommand: text(command.command), customArgs: Array.isArray(command.args) ? command.args.join("\n") : "" }));
    };
    const invoke = React.useCallback(async (method) => {
      setFeedbackArea("overview");
      setBusy(method);
      setFeedback(void 0);
      try {
        const value = objectOf(await call(method));
        if (method === "status") populate(value);
        else if (method === "discoverNetwork") {
          const addresses = Array.isArray(value.lanIpv4) ? value.lanIpv4.join("\u3001") : "";
          setFeedback({ tone: "success", message: addresses ? `${t("lanFound")} ${addresses}:${String(value.gatewayPort ?? "")}` : t("lanNotFound") });
        } else if (method === "detectTailscale") {
          const details = [value.magicDnsName, ...value.ipv4 ?? [], ...value.ipv6 ?? []].filter(Boolean).join(" \xB7 ");
          setFeedback({ tone: value.connected ? "success" : "error", message: value.installed === false ? t("tailscaleNotInstalled") : value.connected === false ? t("tailscaleDisconnected") : `${t("tailscaleFound")} ${details}` });
        } else {
          setFeedback({ tone: "success", message: t(method === "revokeAllSessions" ? "sessionsRevoked" : method === "restartTunnel" ? "tunnelRestarted" : "tunnelStarted") });
        }
      } catch (error) {
        setFeedback({ tone: "error", message: error instanceof Error ? error.message : String(error) });
      } finally {
        setBusy("");
      }
    }, [call, t]);
    React.useEffect(() => {
      void invoke("status");
    }, [invoke]);
    const save = React.useCallback(async () => {
      setFeedbackArea("save");
      const validationError = validateForm(form, !!status.administratorConfigured, t);
      if (validationError) {
        setFeedback({ tone: "error", message: validationError });
        return;
      }
      setBusy("saveConfig");
      setFeedback(void 0);
      try {
        const tunnelProvider = String(form.tunnelProvider);
        const frp = tunnelProvider === "frp" ? { executablePath: form.frpExecutablePath, serverAddress: form.frpServerAddress, serverPort: Number(form.frpServerPort), authMethod: form.frpAuthMethod, tokenSecretRef: form.frpAuthMethod === "token" ? form.frpTokenSecretRef : void 0, stcpSecretRef: form.frpTransport === "stcp" ? form.frpStcpSecretRef : void 0, transport: form.frpTransport, customDomain: form.frpTransport === "stcp" ? void 0 : form.frpCustomDomain, tlsEnabled: form.frpTlsEnabled, startWithDsh: form.frpStartWithDsh } : void 0;
        const config = { enabled: form.enabled, mode: form.mode, listenHost: form.listenHost, listenPort: Number(form.listenPort), target: { host: form.targetHost, port: Number(form.targetPort), protocol: form.targetProtocol }, publicBaseUrl: form.publicBaseUrl || void 0, trustedProxyCidrs: String(form.trustedProxyCidrs).split(/\r?\n|,/).map((v) => v.trim()).filter(Boolean), sessionTtlMinutes: Number(form.sessionTtlMinutes), maxRequestBodyBytes: Number(form.maxRequestBodyBytes), adminPasswordSecretRef: form.adminPasswordSecretRef, frp, customCommandEnabled: tunnelProvider === "custom", customCommand: tunnelProvider === "custom" ? { command: form.customCommand, args: String(form.customArgs).split(/\r?\n/).filter(Boolean) } : void 0 };
        await call("saveCommonConfig", { request: { config, secrets: { frpToken: form.frpToken, stcpSecret: form.frpStcpSecret } } });
        try {
          populate(objectOf(await call("status")));
        } catch {
          setStatus((previous) => ({ ...previous, configured: config, running: config.enabled }));
        }
        setFeedback({ tone: "success", message: t("configurationSaved") });
        set("frpToken", "");
        set("frpStcpSecret", "");
      } catch (error) {
        setFeedback({ tone: "error", message: error instanceof Error ? error.message : String(error) });
      } finally {
        setBusy("");
      }
    }, [call, form, t]);
    const changePassword = React.useCallback(async () => {
      if (newPassword.length < 10 || newPassword !== confirmPassword) {
        setFeedback({ tone: "error", message: t(newPassword.length < 10 ? "passwordTooShort" : "passwordMismatch") });
        return;
      }
      setBusy("password");
      try {
        await call("changePassword", { request: { currentPassword, newPassword } });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFeedback({ tone: "success", message: t(status.administratorConfigured ? "passwordChanged" : "passwordInitialized") });
        populate(objectOf(await call("status")));
      } catch (error) {
        setFeedback({ tone: "error", message: error instanceof Error ? error.message : String(error) });
      } finally {
        setBusy("");
      }
    }, [call, confirmPassword, currentPassword, newPassword, status.administratorConfigured, t]);
    const input = (key, label, type = "text", wide = false) => h("label", { className: wide ? "wide" : "" }, t(label), h("input", { type, value: form[key], disabled: !!busy, onWheel: type === "number" ? (e) => e.currentTarget.blur() : void 0, onChange: (e) => set(key, e.target.value) }));
    const select = (key, label, options) => h("label", null, t(label), h("select", { value: form[key], disabled: !!busy, onChange: (e) => set(key, e.target.value) }, ...options.map(([value, labelKey]) => h("option", { value, key: value }, t(labelKey)))));
    const check = (key, label) => h("label", { className: "dsh-remote-check" }, h("input", { type: "checkbox", checked: form[key] === true, disabled: !!busy, onChange: (e) => set(key, e.target.checked) }), t(label));
    const configured = objectOf(status.configured), tunnel = objectOf(status.tunnel);
    return h(
      "main",
      { className: "dsh-remote-access" },
      h("div", { className: "dsh-remote-heading" }, h("p", { className: "dsh-remote-intro" }, t("summary")), h("span", { className: "dsh-remote-version", title: `@dsh-community/dsh-remote-access v${pluginVersion}` }, `v${pluginVersion}`)),
      h("section", { className: "dsh-remote-note" }, h("p", null, t("safetyBody"))),
      h("section", { className: "dsh-remote-card" }, h("h2", null, t("overviewTitle")), h("div", { className: "dsh-remote-status-grid" }, ...[[t("gatewayRunning"), status.running ? t("yes") : t("no")], [t("administratorReady"), status.administratorConfigured ? t("yes") : t("no")], [t("listenAddress"), `${configured.listenHost ?? "\u2014"}:${configured.listenPort ?? "\u2014"}`], [t("tunnelState"), status.tunnel ? tunnel.state ?? tunnel.id : t("notConfigured")]].map(([label, value]) => h("div", { className: "dsh-remote-row", key: label }, h("span", null, label), h("span", { className: "dsh-remote-value" }, value)))), h("div", { className: "dsh-remote-actions" }, ...[["status", "refreshStatus"], ["discoverNetwork", "discoverNetwork"], ["detectTailscale", "detectTailscale"]].map(([method, label]) => h("button", { className: "dsh-remote-button", disabled: !!busy, onClick: () => invoke(method), key: method }, t(label)))), feedback && feedbackArea === "overview" ? h("div", { className: "dsh-remote-feedback wide", "data-tone": feedback.tone, role: feedback.tone === "error" ? "alert" : "status" }, feedback.message) : null),
      h("section", { className: "dsh-remote-card" }, h("h2", null, t("configurationTitle")), h("p", null, t("configurationBody")), h("div", { className: "dsh-remote-fields" }, check("enabled", "enableGateway"), select("mode", "accessMode", [["loopback", "modeLoopback"], ["lan", "modeLan"], ["tailscale", "modeTailscale"], ["tunnel", "modeTunnel"]]), input("listenHost", "listenHostField"), input("listenPort", "gatewayPort", "number"), input("targetHost", "targetHost"), input("targetPort", "targetPort", "number"), select("targetProtocol", "targetProtocol", [["http", "protocolHttp"], ["https", "protocolHttps"]]), input("publicBaseUrl", "publicBaseUrl", "url"), input("sessionTtlMinutes", "sessionTtlMinutes", "number"), input("maxRequestBodyBytes", "maxRequestBodyBytes", "number"), input("adminPasswordSecretRef", "adminPasswordSecretRef"), h("label", { className: "wide" }, t("trustedProxyCidrs"), h("textarea", { value: form.trustedProxyCidrs, disabled: !!busy, onChange: (e) => set("trustedProxyCidrs", e.target.value) })), h("div", { className: "dsh-remote-subtitle" }, t("tunnelConfiguration")), select("tunnelProvider", "tunnelProvider", [["none", "providerNone"], ["frp", "providerFrp"], ["custom", "providerCustom"]]), form.tunnelProvider === "frp" ? [input("frpExecutablePath", "frpExecutablePath"), input("frpServerAddress", "frpServerAddress"), input("frpServerPort", "frpServerPort", "number"), select("frpAuthMethod", "frpAuthMethod", [["token", "authToken"], ["oidc", "authOidc"], ["none", "authNone"]]), select("frpTransport", "frpTransport", [["https", "protocolHttps"], ["http", "protocolHttp"], ["stcp", "transportStcp"]]), input("frpCustomDomain", "frpCustomDomain"), check("frpTlsEnabled", "frpTlsEnabled"), check("frpStartWithDsh", "frpStartWithDsh"), form.frpAuthMethod === "token" ? input("frpTokenSecretRef", "frpTokenSecretRef") : null, form.frpAuthMethod === "token" ? input("frpToken", "frpToken", "password") : null, form.frpTransport === "stcp" ? input("frpStcpSecretRef", "frpStcpSecretRef") : null, form.frpTransport === "stcp" ? input("frpStcpSecret", "frpStcpSecret", "password") : null] : null, form.tunnelProvider === "custom" ? [input("customCommand", "customCommand", "text", true), h("label", { className: "wide" }, t("customArgs"), h("textarea", { value: form.customArgs, disabled: !!busy, onChange: (e) => set("customArgs", e.target.value) }))] : null), h("div", { className: "dsh-remote-actions" }, h("button", { className: "dsh-remote-button dsh-remote-button-primary", disabled: !!busy || !status.administratorConfigured, onClick: save }, busy === "saveConfig" ? t("working") : t("saveAndApply"))), feedback && feedbackArea === "save" ? h("div", { className: "dsh-remote-feedback wide", "data-tone": feedback.tone, role: feedback.tone === "error" ? "alert" : "status" }, feedback.message) : null),
      h("section", { className: "dsh-remote-card" }, h("h2", null, t(status.administratorConfigured ? "changePasswordTitle" : "initializePasswordTitle")), h("p", null, t(status.administratorConfigured ? "changePasswordBody" : "initializePasswordBody")), h("div", { className: "dsh-remote-fields" }, status.administratorConfigured ? h("label", null, t("currentPassword"), h("input", { type: "password", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value) })) : null, h("label", null, t("newPassword"), h("input", { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value) })), h("label", null, t("confirmPassword"), h("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }))), h("div", { className: "dsh-remote-actions" }, h("button", { className: "dsh-remote-button dsh-remote-button-primary", disabled: !!busy, onClick: changePassword }, t(status.administratorConfigured ? "changePassword" : "initializePassword")))),
      h("section", { className: "dsh-remote-card" }, h("h2", null, t("tunnelTitle")), h("p", null, t("tunnelBody")), h("div", { className: "dsh-remote-actions" }, h("button", { className: "dsh-remote-button dsh-remote-button-primary", disabled: !!busy, onClick: () => invoke("startTunnel") }, t("startTunnel")), h("button", { className: "dsh-remote-button", disabled: !!busy, onClick: () => invoke("restartTunnel") }, t("restartTunnel")), h("button", { className: "dsh-remote-button", disabled: !!busy || !status.running, onClick: () => invoke("revokeAllSessions") }, t("revokeSessions"))))
    );
  }
  async function callRemoteHost(ctx, method, args = {}) {
    const result = await ctx.connection.rpc.call("/api", `${remoteNamespace}/${method}`, { args });
    if (result.ok) return result.value;
    throw new Error(result.error?.message ?? `Remote call ${method} failed.`);
  }
  function insertStyles() {
    if (typeof document === "undefined" || !document.head) return;
    const existing = document.head.querySelector("style[data-dsh-remote-access-styles]");
    if (existing) return;
    const style = document.createElement("style");
    style.dataset.dshRemoteAccessStyles = "";
    style.textContent = css;
    document.head.append(style);
    return () => style.remove();
  }
  function createClientModule(React) {
    return { inject: ["slots", "locale", "connection"], apply(ctx) {
      ctx.effect(() => insertStyles());
      ctx.effect(() => ctx.locale.register(localeNamespace, dictionaries));
      const t = ctx.locale.bind(localeNamespace);
      const call = (method, args) => callRemoteHost(ctx, method, args ?? {});
      ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: sectionId, order: 80, label: () => t("title"), inject: () => ({ t, call, React }) }, SettingsSection)));
    } };
  }

  // src/client-entry.ts
  window.__ModuleLoader__?.load({
    id: "@dsh-community/dsh-remote-access",
    factory(require2) {
      return createClientModule(require2("react"));
    }
  });
})();
