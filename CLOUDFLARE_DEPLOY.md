# Cloudflare 部署指南

让 AI 助手在线上工作，全球用户都可以访问。

---

## 📋 准备工作

1. **阿里云百炼 API Key**
   - 访问：https://bailian.console.aliyun.com/
   - 创建并保存 API Key（sk-开头）

2. **Cloudflare 账号**
   - 访问：https://dash.cloudflare.com/sign-up
   - 免费注册

3. **安装 Wrangler CLI**
```bash
npm install -g wrangler
```

---

## 步骤一：部署 Worker（API 代理）

### 1. 登录 Cloudflare
```bash
wrangler login
```
浏览器会打开，授权登录。

### 2. 部署 Worker
```bash
cd E:\个人网站
wrangler deploy worker.js --name=wangshuai-ai-api
```

部署成功后会显示：
```
Published wangshuai-ai-api (X.X sec)
  https://wangshuai-ai-api.your-subdomain.workers.dev
```

**复制这个 URL**，后面会用到。

### 3. 设置 API Key 环境变量
```bash
wrangler secret put DASHSCOPE_API_KEY --name=wangshuai-ai-api
```
提示时输入你的阿里云 API Key。

---

## 步骤二：部署网站到 Cloudflare Pages

### 方式一：通过 GitHub（推荐）

1. **创建 GitHub 仓库**
   - 在 GitHub 创建新仓库
   - 将代码推送：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

2. **连接到 Cloudflare Pages**
   - 访问：https://dash.cloudflare.com/
   - 进入 "Workers & Pages" → "Create application" → "Pages" → "Connect to Git"
   - 选择你的仓库
   - 构建设置留空
   - 点击 "Save and Deploy"

3. **获取网站 URL**
   部署成功后会显示：
   ```
   https://你的项目名.pages.dev
   ```

### 方式二：直接上传

```bash
wrangler pages publish . --project-name=wangshuai-website
```

---

## 步骤三：配置网站连接 Worker

### 1. 修改 HTML（只需一次）

打开 `index.html`，找到大约第 730 行，修改默认 Worker URL：

```javascript
// 将这行：
let config = {
    mode: localStorage.getItem('ai_chat_mode') || 'worker',
    apiKey: localStorage.getItem('dashscope_api_key') || '',
    workerUrl: localStorage.getItem('worker_url') || ''
};

// 改成（填入你的 Worker URL）：
let config = {
    mode: localStorage.getItem('ai_chat_mode') || 'worker',
    apiKey: localStorage.getItem('dashscope_api_key') || '',
    workerUrl: localStorage.getItem('worker_url') || 'https://wangshuai-ai-api.your-subdomain.workers.dev'
};
```

### 2. 重新部署网站

如果是 GitHub 方式：推送代码即可自动重新部署。
如果是直接上传：再次运行 `wrangler pages publish` 命令。

---

## ✅ 完成！

访问你的网站 URL，测试 AI 助手：

```
https://你的项目名.pages.dev
```

点击右下角聊天按钮，输入问题测试。

---

## 🔧 测试 Worker API

直接访问 Worker URL 测试：
```
https://wangshuai-ai-api.your-subdomain.workers.dev
```

应该显示：`Method not allowed`（正常，因为需要 POST 请求）

---

## 📊 费用说明

| 服务 | 免费额度 | 超出后 |
|------|----------|--------|
| Cloudflare Workers | 每天 100,000 次请求 | $5/百万次请求 |
| Cloudflare Pages | 无限带宽 | 免费 |
| 阿里云百炼 | 每月一定免费额度 | 按量计费 |

个人网站使用基本不会超出免费额度。

---

## ❓ 常见问题

**Q: AI 助手没有响应？**
- 检查 Worker 是否正确部署
- 检查环境变量是否设置
- 打开浏览器控制台查看错误

**Q: 如何修改 Worker 代码？**
```bash
# 修改 worker.js 后重新部署
wrangler deploy worker.js --name=wangshuai-ai-api
```

**Q: 如何查看 Worker 日志？**
- 在 Cloudflare Dashboard → Workers → 你的 Worker → Logs
- 或运行：`wrangler tail --name=wangshuai-ai-api`
