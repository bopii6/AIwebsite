/**
 * 本地代理服务器
 * 解决浏览器 CORS 跨域问题
 *
 * 使用方法：
 * 1. 安装 Node.js
 * 2. 运行: node proxy-server.js
 * 3. 浏览器打开: http://localhost:8080
 */

const http = require('http');

const PORT = 8080;
const AI_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// 系统提示词
const SYSTEM_PROMPT = `你是一个个人网站的 AI 助手，由阿里云百炼大模型驱动。

关于这个网站的信息：
- 网站主人：王帅，是一名教编程的 AI 老师
- 网站内容：包含个人介绍、作品展示、学员作品集、联系方式四个部分
- 技术栈：纯静态 HTML + CSS，使用 Apple 风格的设计系统
- 设计风格：深色主题，简约精致，注重细节和交互体验
- 特色功能：环境光效、视差效果、滚动动画、AI 助手

王帅的背景：
- 过去一年深度探索 AI 编程技术
- 从零开始逐步掌握最前沿的方法
- 希望帮助每个人将 AI 融入工作与生活
- 相信个人能力强的人也可以从事教学和盈利工作

请用友好、专业的语气回答用户关于网站的任何问题。回答要简洁明了，一般不超过200字。`;

const server = http.createServer(async (req, res) => {
    // 设置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 主页 - 提供 index.html
    if (req.url === '/' || req.url === '/index.html') {
        const fs = require('fs');
        const path = require('path');

        let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        // 修改 API 地址为本地代理
        html = html.replace(
            "localStorage.getItem('worker_url') || ''",
            "'http://localhost:8080/api/chat'"
        );
        // 强制使用代理模式
        html = html.replace(
            "localStorage.getItem('ai_chat_mode') || 'worker'",
            "'worker'"
        );

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
    }

    // CSS 文件
    if (req.url === '/style.css') {
        const fs = require('fs');
        const path = require('path');
        const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(css);
        return;
    }

    // AI 代理接口
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { message, apiKey } = JSON.parse(body);

                if (!apiKey) {
                    console.log('❌ 缺少 API Key');
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing API Key' }));
                    return;
                }

                console.log(`\n📨 收到消息: ${message}`);

                // 调用阿里云 API
                const aiResponse = await fetch(AI_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'X-DashScope-SSE': 'disable'
                    },
                    body: JSON.stringify({
                        model: 'qwen-max',
                        input: {
                            messages: [
                                { role: 'system', content: SYSTEM_PROMPT },
                                { role: 'user', content: message }
                            ]
                        },
                        parameters: {
                            max_tokens: 1500,
                            temperature: 0.7,
                            top_p: 0.9
                        }
                    })
                });

                console.log(`📡 API 状态码: ${aiResponse.status}`);

                const data = await aiResponse.json();
                console.log(`📦 API 响应:`, JSON.stringify(data, null, 2));

                // 阿里云 API 返回格式: output.text
                if (data.output && data.output.text) {
                    const reply = data.output.text;
                    console.log(`✅ 回复: ${reply.substring(0, 50)}...`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ reply }));
                } else {
                    console.log('❌ API 响应格式异常');
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Invalid API response',
                        debug: data
                    }));
                }

            } catch (error) {
                console.error('❌ 错误:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`\n✅ 代理服务器已启动！`);
    console.log(`🌐 请在浏览器中打开: http://localhost:${PORT}`);
    console.log(`\n按 Ctrl+C 停止服务器\n`);
});
