# Contributing

## Rules

- 每个小阶段都做本地 Git commit；除非用户明确要求，不推送。
- 不在开发中安装、启用或修改活动 DSH profile。
- 不提交 secrets、token、真实域名、IP、FRP 配置或运行时状态。
- 任何外部监听功能必须保持认证、CSRF、Host/Origin 和速率限制测试。

## Validation

```powershell
npm ci
npm run check
npm run build
npm test
```

提交前确认 `git status --short` 不含 `dist/`、`node_modules/`、`.env` 或研究目录内容。
