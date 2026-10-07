// Self-contained login page: never loads scripts, fonts or styles from the proxied DSH app.
// All text and paths are fixed; untrusted URLs are handled only by the URL API in the browser.
export const loginPage = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>登录 · DSH 远程访问</title>
<style>
:root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:light dark;background:#f6f7fb;color:#18223a}
*{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 18% 15%,#e6eeff 0,transparent 48%),#f6f7fb}
main{width:min(100%,400px);padding:34px;border:1px solid #dce3ee;border-radius:18px;background:#fff;box-shadow:0 16px 48px #192e5117}
mark{display:inline-block;border-radius:8px;padding:6px 10px;background:#ebf1ff;color:#294777;font-size:13px;font-weight:650}h1{margin:18px 0 8px;font-size:26px;letter-spacing:-.02em}p{margin:0 0 25px;line-height:1.55;color:#4b5870}
label{display:block;margin:18px 0 7px;font-weight:600}input{width:100%;height:46px;padding:0 13px;border:1px solid #aebbd0;border-radius:9px;background:#fff;color:#18223a;font:inherit}
input:focus-visible,button:focus-visible{outline:3px solid #567edd;outline-offset:2px}button{width:100%;min-height:46px;margin-top:24px;border:0;border-radius:9px;background:#305ed3;color:#fff;font:inherit;font-weight:650;cursor:pointer}button:hover{background:#244fb9}button:disabled{opacity:.6;cursor:wait}
#error{min-height:1.5em;margin:12px 0 0;color:#ae1936;font-size:14px}
@media(prefers-color-scheme:dark){:root{background:#101626;color:#eff3ff}body{background:radial-gradient(ellipse at 18% 15%,#1c3053 0,transparent 48%),#101626}main{background:#19243a;border-color:#34445e;box-shadow:none}p{color:#b9c8de}mark{background:#29406e;color:#e2edff}input{background:#111a2c;border-color:#657894;color:#eff3ff}#error{color:#ff9db0}}
</style>
</head>
<body>
<main>
<mark>DSH · Remote Access</mark>
<h1>登录远程访问网关</h1>
<p>验证管理员密码后，才能打开 DSH。请勿将 DSH 原始端口暴露到公网。</p>
<form id="login-form">
<label for="username">用户名</label><input id="username" name="username" autocomplete="username" value="admin" required>
<label for="password">管理员密码</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
<button id="submit" type="submit">登录并进入 DSH</button><div id="error" role="alert" aria-live="polite"></div>
</form>
</main>
<script>
'use strict';
const form=document.getElementById('login-form'),error=document.getElementById('error'),button=document.getElementById('submit');
function destination(){const value=new URLSearchParams(location.search).get('next');if(!value||!value.startsWith('/')||value.startsWith('//')||value.includes('\\\\')||/[\\x00-\\x1f\\x7f]/.test(value)||value.startsWith('/_dsh_remote/'))return '/';return value}
form.addEventListener('submit',async event=>{event.preventDefault();error.textContent='';button.disabled=true;try{const response=await fetch('/_dsh_remote/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({username:form.elements.username.value,password:form.elements.password.value})});if(!response.ok){error.textContent=response.status===429?'密码不正确或尝试过于频繁，请稍后再试。':'登录失败，请稍后重试。';return}location.replace(destination())}catch{error.textContent='网络连接失败，请检查网关是否正常运行。'}finally{button.disabled=false}});
</script>
</body>
</html>`;
//# sourceMappingURL=login-page.js.map