# DSH Remote Access：架构与威胁模型

## 已确认的 DSH 边界

DSH Web 的 `dsh-host-webserver` 是进程内 HTTP/升级路由注册器；它只有一个 SPA fallback，不能由插件替换成全站认证网关。它能注册额外的 HTTP 与 WebSocket 路径，但不能把现有 fallback/API/WebSocket 路由透明地拦截到另一个监听器。

因此插件采用**独立监听端口**：DSH 原 Web 服务继续仅绑定 `127.0.0.1`；远程网关在用户配置的地址/端口监听，通过认证后将 HTTP、SSE 和 WebSocket 转发到 loopback DSH。插件不改变 DSH 原始监听器，也不安装到当前 DSH profile。

## 组件

```text
直连：LAN IP + port / Tailscale IP + port
公网：HTTPS 自定义域名 + FRP
  └─ 登录网关 RemoteGateway : 独立监听端口
      ├─ 登录、会话、退出 CSRF、限速、Host/Origin 校验
      ├─ Connection 启动令牌 → 私有上游 DSH Cookie（浏览器不可见）
      ├─ HTTP / SSE / API：认证后逐流代理
      ├─ WebSocket：认证后 upgrade 与双向转发
      └─ TunnelProvider（FRP / 将来的 Cloudflare / 自定义命令）
            └─ 127.0.0.1:<DSH Web 端口>
```

配置携带 secret **引用**而非值；FRP token 等通过 DSH credentials 服务按操作读取。密码哈希、会话记录与上游认证 Cookie 是本机受限权限运行时数据，不进入普通设置、日志或诊断输出。插件通过 Connection 的 `authenticatedUrl()` 在网关→loopback DSH 的私下链路兑换 Cookie；代理请求只转发与网关会话关联的上游 Cookie，绝不向浏览器转发 DSH 的 `Set-Cookie` 或启动令牌。保存配置经 configEditor 持久化并等待 Loader 重挂载；故禁用、修改端口、目标与密码策略不要求重启进程。

## 安全不变量

1. 默认关闭；默认绑定 `127.0.0.1`。
2. 非 loopback 监听在管理员账号未配置时拒绝启动。
3. 访问方式只有 `direct`（直连私有网络）与 `tunnel`（公网隧道）两类；旧配置中的 `loopback`/`lan`/`tailscale` 迁移为 `direct`。可达范围完全由监听地址决定，不由模式决定。公网隧道模式要求 HTTPS 声明和可信代理显式 allowlist；不信任任意 `X-Forwarded-*`。
4. 登录网关位于直连能力（IP + port / Tailscale）与公网隧道能力（域名 + FRP）之前；认证在代理前发生，HTTP、SSE、API 与 WebSocket 共用同一会话判定。
5. Cookie 使用 `HttpOnly`、`SameSite=Strict`、host-only；公网 HTTPS 使用 `Secure`。网关的退出操作校验 CSRF token；DSH 原生 HTTP 写请求必须同源 Origin/Fetch Metadata/Referer，WebSocket upgrade 检查 Host/Origin 与会话。LAN HTTP 与直连 Tailscale HTTP 不能提供传输加密，不能在不可信网络使用。
6. 管理员密码使用 Node `scrypt` 哈希且至少 10 字符；不明文持久化。
7. 限制请求体、登录次数、会话存活期和最多 1024 个保留会话（容量达到上限时淘汰最早会话）；支持撤销全部会话。
8. 日志脱敏 Authorization、Cookie、token、password、secret 等字段。
9. 自定义隧道命令默认禁用，且不会将 shell 字符串隐式执行。
10. 卸载/禁用清理监听器和受管隧道子进程；启用时上游 DSH 目标仅允许 loopback HTTP，避免启动令牌流向外部地址。

## 威胁边界

插件抵御未认证网络访问、常见暴力登录、CSRF、Host-header 路由混淆、未经允许的代理头伪造与日志泄密。它不能保护已被本机恶意软件或同一 OS 用户攻陷的主机；DSH credentials 的本地文件存储也不隔离同一 OS 用户的进程。

公网 TLS 终止于 FRP/Caddy/Nginx 等反向代理时，运营者必须把终止节点地址填入可信代理列表，且隧道到网关的链路必须受控。可信代理必须覆盖或删除客户端自带 `X-Forwarded-*` 头，并发送单一可信值；网关拒绝逗号分隔转发链。Cookie 不按端口隔离，原始 DSH 端口须保持 loopback/防火墙隔离。插件不会自动修改防火墙、DNS、Tailscale ACL 或隧道服务账号。
