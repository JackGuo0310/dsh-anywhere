# 调研来源与借鉴边界

| 来源 | 许可证 | 实际借鉴 |
| --- | --- | --- |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | MIT | 插件 bundle 结构、`dsh-host-webserver` 的路由边界、credentials/settings 约定；未复制源码。 |
| [unjs/httpxy](https://github.com/unjs/httpxy) | MIT | 将 HTTP 与 WebSocket 代理视作统一但可独立测试的边界；本项目使用 Node 标准库自行实现最小转发。 |
| [FRP](https://github.com/fatedier/frp) | Apache-2.0 | FRPC 配置由用户自行安装的二进制驱动；本项目只生成兼容配置和管理进程，不复制 FRP 代码。 |
| [Tailscale](https://tailscale.com/kb/) | 文档 | 仅调用本地 `tailscale status --json` / `tailscale ip` 读取状态；不会使用 API token 或修改 tailnet。 |

`otherRepo/` 专供研究且被 Git 忽略。没有复制任何第三方实现；引用的设计会在对应实现处保留说明。
