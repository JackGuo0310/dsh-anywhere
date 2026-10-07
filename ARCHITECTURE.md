# DSH Remote Access：架构与威胁模型

## 已确认的 DSH 边界

DSH Web 的 `dsh-host-webserver` 是进程内 HTTP/升级路由注册器；它只有一个 SPA fallback，不能由插件替换成全站认证网关。它能注册额外的 HTTP 与 WebSocket 路径，但不能把现有 fallback/API/WebSocket 路由透明地拦截到另一个监听器。

因此插件采用**独立监听端口**：DSH 原 Web 服务继续仅绑定 `127.0.0.1`；远程网关在用户配置的地址/端口监听，通过认证后将 HTTP、SSE 和 WebSocket 转发到 loopback DSH。插件不改变 DSH 原始监听器，也不安装到当前 DSH profile。

## 组件

```text
四个独立入口，共用同一个端口号 listenPort
  ├─ 本机        → 127.0.0.1:listenPort
  ├─ 局域网      → 每个非 Tailscale IPv4 网卡地址 :listenPort
  ├─ Tailscale   → 100.64.0.0/10 内的地址 :listenPort
  └─ 公网隧道    → frpc（出站）→ frps → HTTPS 域名
        │
        └─ 登录网关 RemoteGateway（每个入口一个 socket，共享同一处理器）
            ├─ 登录、会话、退出 CSRF、限速、Host/Origin 校验
            ├─ 会话按入口隔离；仅公网 HTTPS 入口的 cookie 带 Secure
            ├─ Connection 启动令牌 → 私有上游 DSH Cookie（浏览器不可见）
            ├─ HTTP / SSE / API：认证后逐流代理
            ├─ WebSocket：认证后 upgrade 与双向转发
            └─ TunnelProvider（FRP / 将来的 Cloudflare / 自定义命令）
                  └─ 127.0.0.1:listenPort（网关自身，绝不是 DSH 原始端口）
```

禁用某个入口只是关闭它对应的 socket：其余入口不受影响，且不需要改动端口号。公网隧道的转发目标是网关本机监听，因此本机入口必须保持启用（配置校验会拒绝关闭它），否则隧道会绕过认证直接暴露上游 DSH。

配置携带 secret **引用**而非值；FRP token 等通过 DSH credentials 服务按操作读取。密码哈希、会话记录与上游认证 Cookie 是本机受限权限运行时数据，不进入普通设置、日志或诊断输出。插件通过 Connection 的 `authenticatedUrl()` 在网关→loopback DSH 的私下链路兑换 Cookie；代理请求只转发与网关会话关联的上游 Cookie，绝不向浏览器转发 DSH 的 `Set-Cookie` 或启动令牌。保存配置经 configEditor 持久化并等待 Loader 重挂载；故禁用、修改端口、目标与密码策略不要求重启进程。

## 安全不变量

3. 四种访问方式独立启停并共用同一端口号。本机/局域网/Tailscale 各绑定自己的地址；公网隧道是出站连接，且必须保留本机监听作为转发目标。
4. 会话按入口隔离：会话记录它是在哪个 authority 上创建的，其他入口的请求即使带着该 cookie 也不被接受。仅公网 HTTPS 入口的 cookie 带 `Secure`。
5. 公网隧道要求 HTTPS 声明和隧道提供商；反向代理场景要求可信代理显式 allowlist，不信任任意 `X-Forwarded-*`。
6. 登录网关位于所有入口之前；认证在代理前发生，HTTP、SSE、API 与 WebSocket 共用同一会话判定。
7. Cookie 使用 `HttpOnly`、`SameSite=Strict`、host-only。网关的退出操作校验 CSRF token；DSH 原生 HTTP 写请求必须同源 Origin/Fetch Metadata/Referer，WebSocket upgrade 检查 Host/Origin 与会话。LAN HTTP 与直连 Tailscale HTTP 不能提供传输加密，不能在不可信网络使用。
8. 管理员密码使用 Node `scrypt` 哈希且至少 10 字符；不明文持久化。
9. 限制请求体、登录次数、会话存活期和最多 1024 个保留会话（容量达到上限时淘汰最早会话）；支持撤销全部会话。
10. 日志脱敏 Authorization、Cookie、token、password、secret 等字段。
11. 自定义隧道命令默认禁用，且不会将 shell 字符串隐式执行。
12. 卸载/禁用清理全部监听器与受管隧道子进程；启用时上游 DSH 目标仅允许 loopback HTTP，避免启动令牌流向外部地址。

## 威胁边界

插件抵御未认证网络访问、常见暴力登录、CSRF、Host-header 路由混淆、未经允许的代理头伪造与日志泄密。它不能保护已被本机恶意软件或同一 OS 用户攻陷的主机；DSH credentials 的本地文件存储也不隔离同一 OS 用户的进程。

公网 TLS 终止于 FRP/Caddy/Nginx 等反向代理时，运营者必须把终止节点地址填入可信代理列表，且隧道到网关的链路必须受控。可信代理必须覆盖或删除客户端自带 `X-Forwarded-*` 头，并发送单一可信值；网关拒绝逗号分隔转发链。Cookie 不按端口隔离，原始 DSH 端口须保持 loopback/防火墙隔离。插件不会自动修改防火墙、DNS、Tailscale ACL 或隧道服务账号。
