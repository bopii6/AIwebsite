/**
 * Cloudflare Pages Function
 * 路径: /api/chat
 * 用于调用阿里云百炼大模型
 */

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

export async function onRequest(context) {
  // 处理 CORS 预检请求
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // 只处理 POST 请求
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message } = await context.request.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        {
          status: 400,
          headers: getCorsHeaders(),
        }
      );
    }

    // 从环境变量获取 API Key
    const apiKey = context.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'API configuration error',
          reply: '抱歉，AI 服务配置错误。请联系网站管理员配置 API Key。'
        }),
        {
          status: 500,
          headers: getCorsHeaders(),
        }
      );
    }

    // 调用阿里云百炼 API
    const reply = await callDashScopeAPI(message, apiKey);

    return new Response(
      JSON.stringify({ reply }),
      {
        status: 200,
        headers: getCorsHeaders(),
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        reply: '抱歉，服务暂时不可用。请稍后再试。'
      }),
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
}

async function callDashScopeAPI(userMessage, apiKey) {
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  const requestBody = {
    model: 'qwen-max', // 使用通义千问大模型
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
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();

  // 解析响应
  if (data.output && data.output.choices && data.output.choices.length > 0) {
    return data.output.choices[0].message.content;
  }

  throw new Error('Invalid API response format');
}
