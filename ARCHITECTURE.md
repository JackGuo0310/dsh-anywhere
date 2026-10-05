# DSH Remote Access：架构与威胁模型

## 已确认的 DSH 边界

DSH Web 的 `dsh-host-webserver` 是进程内 HTTP/升级路由注册器；它只有一个 SPA fallback，不能由插件替换成全站认证网关。它能注册额外的 HTTP 与 WebSocket 路径，但不能把现有 fallback/API/WebSocket 路由透明地拦截到另一个监听器。

因此插件采用**独立监听端口**：DSH 原 Web 服务继续仅绑定 `127.0.0.1`；远程网关在用户配置的地址/端口监听，通过认证后将 HTTP、SSE 和 WebSocket 转发到 loopback DSH。插件不改变 DSH 原始监听器，也不安装到当前 DSH profile。

## 组件

```text
远程浏览器
  └─ TLS（公网模式由受信任边界终止）
      └─ RemoteGateway : 独立监听端口
          ├─ 登录、会话、CSRF、限速、Host/Origin 校验
          ├─ HTTP/SSE 逐流代理
          ├─ WebSocket 认证与字节转发
          └─ TunnelProvider（FRP / 将来的 Cloudflare / 自定义命令）
                └─ 127.0.0.1:<DSH Web 端口>
```

配置携带 secret **引用**而非值；FRP token 等通过 DSH credentials 服务按操作读取。密码哈希、会话记录与加密状态是本机受限权限运行时数据，不进入普通设置、日志或诊断输出。

## 安全不变量

1. 默认关闭；默认绑定 `127.0.0.1`。
2. 非 loopback 监听在管理员账号未配置时拒绝启动。
3. 公网隧道模式要求 HTTPS 声明和可信代理显式 allowlist；不信任任意 `X-Forwarded-*`。
4. 认证在代理前发生，HTTP、SSE、WebSocket 共用同一会话判定。
5. Cookie 使用 `HttpOnly`、`SameSite=Strict`，公网 HTTPS 使用 `Secure`；CSRF 校验用于变更方法。
6. 密码使用 Argon2id（运行时可用）或 Node `scrypt` 的受控安全降级；不明文持久化。
7. 限制请求体、登录次数、会话存活期；支持撤销全部会话。
8. 日志脱敏 Authorization、Cookie、token、password、secret 等字段。
9. 自定义隧道命令默认禁用，且不会将 shell 字符串隐式执行。
10. 卸载/禁用清理监听器和受管隧道子进程。

## 威胁边界

插件抵御未认证网络访问、常见暴力登录、CSRF、Host-header 路由混淆、未经允许的代理头伪造与日志泄密。它不能保护已被本机恶意软件或同一 OS 用户攻陷的主机；DSH credentials 的本地文件存储也不隔离同一 OS 用户的进程。

公网 TLS 终止于 FRP/Caddy/Nginx 等反向代理时，运营者必须把终止节点地址填入可信代理列表，且隧道到网关的链路必须受控。插件不会自动修改防火墙、DNS、Tailscale ACL 或隧道服务账号。
