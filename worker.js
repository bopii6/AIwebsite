/**
 * Cloudflare Worker for AI Assistant
 * 代理调用阿里云百炼大模型 API
 *
 * 部署后获取 Worker URL，填入网页的 API 地址配置中
 */

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

export default {
  async fetch(request, env) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 只处理 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();
      const { message, apiKey } = body;

      if (!message || typeof message !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid message' }),
          {
            status: 400,
            headers: getCorsHeaders(),
          }
        );
      }

      // 优先使用请求中的 API Key，如果没有则使用环境变量
      const keyToUse = apiKey || env.DASHSCOPE_API_KEY;

      if (!keyToUse) {
        return new Response(
          JSON.stringify({
            error: 'API Key missing',
            reply: '请在网页中配置 API Key，或联系管理员配置服务端 API Key。'
          }),
          {
            status: 401,
            headers: getCorsHeaders(),
          }
        );
      }

      // 调用阿里云百炼 API
      const reply = await callDashScopeAPI(message, keyToUse);

      return new Response(
        JSON.stringify({ reply }),
        {
          status: 200,
          headers: getCorsHeaders(),
        }
      );

    } catch (error) {
      console.error('Worker Error:', error);
      return new Response(
        JSON.stringify({
          error: error.message,
          reply: '抱歉，AI 服务暂时不可用。错误：' + error.message
        }),
        {
          status: 500,
          headers: getCorsHeaders(),
        }
      );
    }
  },
};

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

async function callDashScopeAPI(userMessage, apiKey) {
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  const requestBody = {
    model: 'qwen-max',
    input: {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ]
    },
    parameters: {
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 0.9,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-SSE': 'disable'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DashScope API error:', response.status, errorText);
    throw new Error(`API 返回错误 ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // 阿里云 API 返回格式: output.text
  if (data.output && data.output.text) {
    return data.output.text;
  }

  throw new Error('API 返回格式异常');
}
