# DSH Remote Access

用于 DeepSeek Harness Web GUI 的认证远程访问插件：原始 DSH Web 继续只监听 loopback；插件开启独立网关端口，经过登录认证后才反向代理 HTTP、SSE 和 WebSocket。

> 本仓库默认 `enabled: false`，开发过程没有安装或启用到当前 DSH profile。

## 访问能力与统一安全边界

所有路径都先经过**登录网关**，网关在 HTTP、SSE、WebSocket upgrade 和 API 请求到达 DSH 前统一执行会话认证、Host/Origin 校验，以及对写请求的 CSRF 校验；原始 DSH Web 端口始终保持 loopback，不会被直接公开。

- **直连能力（IP + 端口 / Tailscale）**：局域网、受控网络或 Tailnet 用户直接访问认证网关的 IP 加端口。Tailscale 仅用于发现本机 Tailnet 地址；本插件不管理 Tailscale 登录、ACL 或 DNS。
- **公网隧道能力（域名 + FRP）**：FRP 将部署者控制的 HTTPS 自定义域名转发到认证网关。插件生成/运行受管 `frpc` 配置；FRP 服务端、TLS、DNS 与防火墙由部署者控制。
- **扩展点**：`TunnelProvider` 接口允许实现 Cloudflare Tunnel 或其他受控命令适配器。

## 安全设计

- 默认关闭、默认 loopback，外部监听必须已有管理员账户。
- 登录采用版本化 `scrypt` 哈希；密码不写普通配置或日志。
- `HttpOnly`、`SameSite=Strict` session cookie；公网模式使用 `Secure` cookie。
- CSRF、Host/Origin 校验、可信代理 allowlist 和登录限速。
- 登录网关在 HTTP/SSE 流式转发、WebSocket upgrade 和 API 请求前统一认证；客户端断开会终止上游请求。
- 请求体上限、会话过期、撤销所有会话、敏感日志字段脱敏。
- 自定义命令隧道默认关闭，并始终以 argv 执行，禁止 shell 插值。

详细模型见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 管理员密码

首次使用可在设置页直接设置管理员密码；之后修改密码必须输入当前密码。初始密码和新密码均至少 10 个字符，并以 scrypt 哈希保存到 `adminPasswordSecretRef` 指向的 DSH credential。改密成功后会立即撤销全部远程会话；原始密码不会写入配置、状态或日志。

## 界面配置

设置页可直接启用网关、选择仅本机/局域网/Tailscale 模式，并配置网关端口与 DSH 原始端口。保存操作通过 DSH `configEditor` 持久化并应用，无需手工编辑 `cordis.patch.yml`。公网隧道及凭据引用等高级参数仍保留在配置文件中。

## 版本兼容性

当前 `v0.1.11` 锁定 DeepSeek Harness `0.2.1-alpha.1` 运行时：

- `@deepseek-ai/cordis`：`~4.0.5-alpha.1`
- `@deepseek-ai/dsh-credentials`：`0.2.1-alpha.1`
- `@deepseek-ai/dsh-typert-protocol`：`0.2.1-alpha.1`

安装前请确认目标 DSH profile 提供这些 peer 版本；不兼容的版本不应通过忽略 peer 依赖警告强行安装。

## 安装（Git tag）

`v0.1.11` 尚未发布到 npm。可在目标机器使用 Git tag 安装：

```powershell
# dsh 会将 bundle 安装到指定 profile；按你的实际 profile 名替换 web。
dsh plugin --profile web add https://github.com/JackGuo0310/dsh-anywhere.git#v0.1.11
```

也可先克隆该 tag 并从本地目录安装：

```powershell
git clone --branch v0.1.11 --depth 1 https://github.com/JackGuo0310/dsh-anywhere.git
dsh plugin --profile web add .\dsh-anywhere
```

安装前，目标 DSH 环境需要已经具备上述 peer 依赖。安装操作会修改指定 profile；本开发过程没有安装或启用到当前 DSH profile。

安装后，通过 DSH 设置页配置 `dsh-remote-access`。管理员密码必须先以 `scrypt$v1$...` 哈希写入 DSH credentials 服务，并将对应 credential reference 填入 `adminPasswordSecretRef`；原始密码不会写入 YAML、日志或插件状态。

1. 通过 DSH credential 管理界面或部署自动化保存管理员密码哈希，切勿将原始密码写入 YAML。
2. 保持 DSH Web 监听 `127.0.0.1`，配置插件网关监听端口，例如 `4173`。
3. 局域网：显式选择 `0.0.0.0` 或指定 LAN IP；浏览器访问 `http://<LAN-IP>:4173`。
4. Tailscale：启用受控监听后使用检测到的 `100.x.y.z:4173` 或 MagicDNS。
5. FRP：设置 `frpc` 路径、frps 地址、token secret reference、HTTPS 自定义域名；只允许来自可信 TLS 终止代理的 forwarded headers。

## FRP 先决条件

- 你自己控制的 `frps` 实例和 DNS 域名；公网使用 HTTPS。
- 在插件 secrets 中保存 FRP token 的**引用**，不要提交 token。
- 将网关保留在 loopback 或仅允许来自受管隧道的地址；不要把原始 DSH port 映射进公网。

## 开发

```powershell
npm ci
npm run check
npm run build
npm test
```

测试覆盖配置拒绝规则、密码哈希、会话、限速、日志脱敏、FRP 配置、Tailscale 解析、IPv6 URL、认证 HTTP 代理、CSRF 登出和认证 WebSocket 代理。

## 平台验证

- **Windows**：在 Windows Node 环境执行了 `npm run check`、`npm run build` 与 `npm test`，18/18 测试通过。
- **Linux**：代码只依赖 Node 22 的跨平台模块；`spawn(..., { windowsHide: true })` 在 Linux 被 Node 忽略。尚未在真实 Linux host 上运行集成测试，发布前应执行同一命令并测试 `frpc` 生命周期。
- 已由用户在真实 `web` profile 中安装并验证：客户端模块可正常启动，设置页可见，状态与网络诊断 RPC 可用。

## 已知限制

- DSH 当前 Webserver 的 SPA fallback 不能由插件截获；安全设计因此使用独立网关端口，而不是劫持原 DSH listener。
- 设置页客户端产物采用 DSH Module Loader，并通过 `dshRemoteAccess` Typert RPC 调用状态、网络发现、Tailscale 检测、会话撤销与隧道操作；已在真实 `web` profile 中验证客户端启动和设置页 RPC。
- 公网 TLS、FRP 服务端、防火墙、DNS、Tailscale ACL 属于部署者责任。

## 许可证与来源

MIT，见 [LICENSE](LICENSE)。设计来源和许可证边界见 [REFERENCES.md](REFERENCES.md)。
