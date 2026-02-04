# 部署指南

将个人网站和 AI 助手部署到 Cloudflare Pages。

---

## 快速开始

### 1. 获取阿里云百炼 API Key

访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)，创建并保存 API Key。

### 2. 部署到 Cloudflare Pages

#### 方式一：GitHub 部署（推荐）

1. 将代码推送到 GitHub
2. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
3. 创建项目 → 连接 GitHub 仓库
4. 构建设置留空，直接部署

#### 方式二：直接上传

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 发布
wrangler pages publish . --project-name=wangshuai-website
```

### 3. 设置 API Key

在 Cloudflare Pages 项目设置中：

1. 进入 **Settings** → **Environment variables**
2. 添加变量：
   - **变量名**: `DASHSCOPE_API_KEY`
   - **变量值**: 你的阿里云百炼 API Key

或使用 CLI：
```bash
wrangler pages secret put DASHSCOPE_API_KEY --project-name=wangshuai-website
```

### 4. 重新部署

设置环境变量后，需要重新部署项目才能生效。

---

## 项目结构

```
个人网站/
├── index.html              # 主页面
├── style.css               # 样式文件
├── functions/              # Cloudflare Pages Functions
│   └── api/
│       └── chat.js         # AI 助手 API (/api/chat)
├── wrangler.toml           # 配置文件
└── DEPLOY.md               # 本文档
```

---

## API 端点

部署后，AI 助手 API 地址为：

```
https://你的项目名.pages.dev/api/chat
```

前端代码已配置为相对路径 `/api/chat`，无需修改。

---

## 常见问题

**Q: AI 助手没有响应？**
- 检查环境变量是否正确设置
- 确认 API Key 有效且有余额
- 查看浏览器控制台错误信息

**Q: 如何修改 AI 的回复风格？**
- 编辑 `functions/api/chat.js` 中的 `SYSTEM_PROMPT` 变量
- 重新部署项目

**Q: 阿里云百炼如何计费？**
- 有免费额度，超出后按量计费
- 详情查看：https://help.aliyun.com/zh/dashscope/

---

## 本地测试

部署前可以本地测试网站（AI 功能除外）：

直接双击 `index.html` 在浏览器中打开。
