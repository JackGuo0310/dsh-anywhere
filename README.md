# DSH Remote Access

用于 DeepSeek Harness Web GUI 的认证远程访问插件：原始 DSH Web 继续只监听 loopback；插件开启独立网关端口，经过登录认证后才反向代理 HTTP、SSE 和 WebSocket。

> 本仓库默认 `enabled: false`，开发过程没有安装或启用到当前 DSH profile。

## 访问能力与统一安全边界

所有 DSH 页面与 API 路径都先经过**登录网关**；未登录的浏览器导航显示中文登录页，API 返回 401，`favicon.ico` 由网关直接响应。网关对 HTTP、SSE、WebSocket upgrade 和 API 统一执行会话认证与 Host 校验；写请求按浏览器 Origin/Fetch Metadata/Referer 判定同源，网关自己的退出操作另用 CSRF token。网关使用 DSH Connection 的启动令牌在本机**私下**交换上游认证 Cookie，不向浏览器转发令牌或上游 Cookie。原始 DSH Web 端口必须保持 loopback/防火墙隔离；插件启用时目标限定为本地 HTTP 监听器；浏览器仍可能直接访问同一主机的不同端口，Cookie 本身不受端口隔离。

- **直连能力（IP + 端口 / Tailscale）**：局域网、受控网络或 Tailnet 用户直接访问认证网关的 IP 加端口。Tailscale 仅用于发现本机 Tailnet 地址；本插件不管理 Tailscale 登录、ACL 或 DNS。
- **公网隧道能力（域名 + FRP）**：FRP 将部署者控制的 HTTPS 自定义域名转发到认证网关。插件生成/运行受管 `frpc` 配置；FRP 服务端、TLS、DNS 与防火墙由部署者控制。
- **扩展点**：`TunnelProvider` 接口允许实现 Cloudflare Tunnel 或其他受控命令适配器。

## 安全设计

- 默认关闭、默认 loopback，外部监听必须已有管理员账户。
- 登录采用版本化 `scrypt` 哈希；密码不写普通配置或日志。
- `HttpOnly`、`SameSite=Strict`、仅当前主机的 session cookie；公网隧道模式使用 `Secure` cookie。普通 LAN HTTP/Tailscale HTTP 会明文传输登录凭据和 Cookie，应仅在受信网络使用，建议通过受管 HTTPS/TLS 终止访问。
- 网关退出接口使用 CSRF token；DSH 原生写请求按同源 Origin/Fetch Metadata/Referer 限制，不要求 DSH 前端注入额外 CSRF header。Host 校验、可信代理 allowlist 和登录限速。
- 登录网关在 HTTP/SSE 流式转发、WebSocket upgrade 和 API 请求前统一认证；客户端断开会终止上游请求。
- 请求体上限、最多 1024 个并发保留会话、会话过期、撤销所有会话、敏感日志字段脱敏。
- 自定义命令隧道默认关闭，并始终以 argv 执行，禁止 shell 插值。

详细模型见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 管理员密码

首次使用可在设置页直接设置管理员密码；之后修改密码必须输入当前密码。初始密码和新密码均至少 10 个字符，并以 scrypt 哈希保存到 `adminPasswordSecretRef` 指向的 DSH credential。改密成功后会立即撤销全部远程会话；原始密码不会写入配置、状态或日志。

## 界面配置

所有部署配置都可在设置页完成，无需手工编辑 `cordis.patch.yml`：网关开关与监听、DSH 目标、仅本机/局域网/Tailscale/公网隧道模式、HTTPS 公网地址、可信代理、会话期限、请求体限制、FRP、自定义命令及凭据引用。FRP Token 与 STCP 密钥可直接在界面安全写入 DSH credentials，读取时只返回是否已配置，不会把密钥回显到浏览器。保存操作通过 DSH `configEditor` 校验、持久化并应用。

## 版本兼容性

当前 `v0.1.21` 锁定 DeepSeek Harness `0.2.1-alpha.1` 运行时：

- `@deepseek-ai/cordis`：`~4.0.5-alpha.1`
- `@deepseek-ai/dsh-credentials`：`0.2.1-alpha.1`
- `@deepseek-ai/dsh-typert-protocol`：`0.2.1-alpha.1`

安装前请确认目标 DSH profile 提供这些 peer 版本；不兼容的版本不应通过忽略 peer 依赖警告强行安装。

## 安装（Git tag）

`v0.1.21` 尚未发布到 npm。可在目标机器使用 Git tag 安装：

```powershell
# dsh 会将 bundle 安装到指定 profile；按你的实际 profile 名替换 web。
dsh plugin --profile web add https://github.com/JackGuo0310/dsh-anywhere.git#v0.1.21
```

也可先克隆该 tag 并从本地目录安装：

```powershell
git clone --branch v0.1.21 --depth 1 https://github.com/JackGuo0310/dsh-anywhere.git
dsh plugin --profile web add .\dsh-anywhere
```

安装前，目标 DSH 环境需要已经具备上述 peer 依赖。安装操作会修改指定 profile；本开发过程没有安装或启用到当前 DSH profile。

安装后，进入 DSH 设置页的“远程访问网关”：

1. 首次使用先设置至少 10 个字符的管理员密码。
2. 保持 DSH 目标为 `127.0.0.1`，填入实际原始端口（例如 `3080`）。
3. 局域网：选择“局域网”，监听 `0.0.0.0` 或指定 LAN IP；浏览器访问 `http://<LAN-IP>:4173`。
4. Tailscale：选择对应模式，保存后使用检测到的 `100.x.y.z:4173` 或 MagicDNS。
5. FRP：在界面选择公网隧道和 FRP，填写 `frpc`、frps、HTTPS 域名及 Token；密钥直接保存到 DSH credentials。
6. 点击“保存并应用”：`configEditor` 持久化配置并等待 Loader 重新挂载插件；网关配置与开关即时生效，不要求重启 DSH。保存成功后界面重新读取状态。随后访问网关地址，输入管理员密码并进入 DSH。

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

测试覆盖配置拒绝规则、密码哈希、会话、限速、日志脱敏、FRP 配置、Tailscale 解析、IPv6 URL、登录页面/图标、私下上游认证交换与撤销竞态、原生 RPC 同源写请求、CSRF 登出、上游重定向包含、HTTP 代理、认证 WebSocket 代理以及保存后网关在新端口重挂载。

## 平台验证

- **Windows**：在 Windows Node 环境执行了 `npm run check`、`npm run build` 与 `npm test`，37/37 测试通过。
- **Linux**：代码只依赖 Node 22 的跨平台模块；`spawn(..., { windowsHide: true })` 在 Linux 被 Node 忽略。尚未在真实 Linux host 上运行集成测试，发布前应执行同一命令并测试 `frpc` 生命周期。
- 用户已在真实 `web` profile 中验证旧版本的设置页与配置保存；本版本网关的登录及 DSH 页面/RPC 为本地模拟上游集成测试，**尚未在真实 DSH 浏览器中端到端验证**，也没有将本开发 checkout 安装进活动 profile。

## 已知限制

- DSH 当前 Webserver 的 SPA fallback 不能由插件截获；安全设计因此使用独立网关端口，而不是劫持原 DSH listener。
- 设置页客户端产物采用 DSH Module Loader，并通过 `dshRemoteAccess` Typert RPC 调用状态、网络发现、Tailscale 检测、会话撤销与隧道操作；已在真实 `web` profile 中验证客户端启动和设置页 RPC。
- 公网 TLS、FRP 服务端、防火墙、DNS、Tailscale ACL 属于部署者责任。目标 DSH 地址不能由不可信用户修改；若网关与原始 DSH 共用 hostname，原始端口必须继续只绑定 loopback/由防火墙隔离。

## 许可证与来源

MIT，见 [LICENSE](LICENSE)。设计来源和许可证边界见 [REFERENCES.md](REFERENCES.md)。
