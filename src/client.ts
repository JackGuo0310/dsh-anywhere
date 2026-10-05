const title = '远程访问网关'

/**
 * The host-facing UI is intentionally declarative. The actual slot and renderer
 * API varies between DSH releases, so this describes the page to the client
 * bridge rather than importing React or mutating the DOM directly.
 */
export const remoteAccessSettingsPage = {
  id: 'dsh-remote-access',
  title,
  order: 80,
  description: '通过认证网关安全访问仅限本机的 DSH Web GUI。',
  sections: [
    { title: '远程访问总览', message: '默认关闭；启用前先创建管理员账号。', actions: ['重新检测', '重启网关'] },
    { title: '直连与局域网', fields: ['访问模式', '监听地址', '监听端口'], message: '不要暴露原始 DSH Web 端口。' },
    { title: 'Tailscale', message: '只读取本机状态，不请求账号、认证密钥或 ACL 修改。', actions: ['检测 Tailscale'] },
    { title: '公网域名与隧道', message: '公网入口必须使用 HTTPS；FRP 是首个适配器。', fields: ['域名', 'frpc 可执行文件'], actions: ['生成 FRP 配置示例'] },
    { title: '登录与安全', message: '密码不会显示或写入普通配置；会话使用 HttpOnly、SameSite=Strict、CSRF token 和登录限速。', actions: ['创建或修改管理员密码', '撤销全部会话'] },
    { title: '运行状态及诊断', message: '日志自动隐藏 password、token、cookie 和 Authorization 等敏感字段。' },
    { title: '高级设置', message: '仅信任已验证的 TLS 终止代理；自定义隧道命令默认关闭。' }
  ]
} as const

export function apply(ctx: { slots?: { register?: (slot: string, entry: unknown) => (() => void) | void } }): void {
  ctx.slots?.register?.('settings.section', remoteAccessSettingsPage)
}
