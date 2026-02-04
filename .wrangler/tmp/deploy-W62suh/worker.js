var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var SYSTEM_PROMPT = `\u4F60\u662F\u4E00\u4E2A\u4E2A\u4EBA\u7F51\u7AD9\u7684 AI \u52A9\u624B\uFF0C\u7531\u963F\u91CC\u4E91\u767E\u70BC\u5927\u6A21\u578B\u9A71\u52A8\u3002

\u5173\u4E8E\u8FD9\u4E2A\u7F51\u7AD9\u7684\u4FE1\u606F\uFF1A
- \u7F51\u7AD9\u4E3B\u4EBA\uFF1A\u738B\u5E05\uFF0C\u662F\u4E00\u540D\u6559\u7F16\u7A0B\u7684 AI \u8001\u5E08
- \u7F51\u7AD9\u5185\u5BB9\uFF1A\u5305\u542B\u4E2A\u4EBA\u4ECB\u7ECD\u3001\u4F5C\u54C1\u5C55\u793A\u3001\u5B66\u5458\u4F5C\u54C1\u96C6\u3001\u8054\u7CFB\u65B9\u5F0F\u56DB\u4E2A\u90E8\u5206
- \u6280\u672F\u6808\uFF1A\u7EAF\u9759\u6001 HTML + CSS\uFF0C\u4F7F\u7528 Apple \u98CE\u683C\u7684\u8BBE\u8BA1\u7CFB\u7EDF
- \u8BBE\u8BA1\u98CE\u683C\uFF1A\u6DF1\u8272\u4E3B\u9898\uFF0C\u7B80\u7EA6\u7CBE\u81F4\uFF0C\u6CE8\u91CD\u7EC6\u8282\u548C\u4EA4\u4E92\u4F53\u9A8C
- \u7279\u8272\u529F\u80FD\uFF1A\u73AF\u5883\u5149\u6548\u3001\u89C6\u5DEE\u6548\u679C\u3001\u6EDA\u52A8\u52A8\u753B\u3001AI \u52A9\u624B

\u738B\u5E05\u7684\u80CC\u666F\uFF1A
- \u8FC7\u53BB\u4E00\u5E74\u6DF1\u5EA6\u63A2\u7D22 AI \u7F16\u7A0B\u6280\u672F
- \u4ECE\u96F6\u5F00\u59CB\u9010\u6B65\u638C\u63E1\u6700\u524D\u6CBF\u7684\u65B9\u6CD5
- \u5E0C\u671B\u5E2E\u52A9\u6BCF\u4E2A\u4EBA\u5C06 AI \u878D\u5165\u5DE5\u4F5C\u4E0E\u751F\u6D3B
- \u76F8\u4FE1\u4E2A\u4EBA\u80FD\u529B\u5F3A\u7684\u4EBA\u4E5F\u53EF\u4EE5\u4ECE\u4E8B\u6559\u5B66\u548C\u76C8\u5229\u5DE5\u4F5C

\u8BF7\u7528\u53CB\u597D\u3001\u4E13\u4E1A\u7684\u8BED\u6C14\u56DE\u7B54\u7528\u6237\u5173\u4E8E\u7F51\u7AD9\u7684\u4EFB\u4F55\u95EE\u9898\u3002\u56DE\u7B54\u8981\u7B80\u6D01\u660E\u4E86\uFF0C\u4E00\u822C\u4E0D\u8D85\u8FC7200\u5B57\u3002`;
var worker_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    try {
      const body = await request.json();
      const { message, apiKey } = body;
      if (!message || typeof message !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid message" }),
          {
            status: 400,
            headers: getCorsHeaders()
          }
        );
      }
      const keyToUse = apiKey || env.DASHSCOPE_API_KEY;
      if (!keyToUse) {
        return new Response(
          JSON.stringify({
            error: "API Key missing",
            reply: "\u8BF7\u5728\u7F51\u9875\u4E2D\u914D\u7F6E API Key\uFF0C\u6216\u8054\u7CFB\u7BA1\u7406\u5458\u914D\u7F6E\u670D\u52A1\u7AEF API Key\u3002"
          }),
          {
            status: 401,
            headers: getCorsHeaders()
          }
        );
      }
      const reply = await callDashScopeAPI(message, keyToUse);
      return new Response(
        JSON.stringify({ reply }),
        {
          status: 200,
          headers: getCorsHeaders()
        }
      );
    } catch (error) {
      console.error("Worker Error:", error);
      return new Response(
        JSON.stringify({
          error: error.message,
          reply: "\u62B1\u6B49\uFF0CAI \u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\u3002\u9519\u8BEF\uFF1A" + error.message
        }),
        {
          status: 500,
          headers: getCorsHeaders()
        }
      );
    }
  }
};
function getCorsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
async function callDashScopeAPI(userMessage, apiKey) {
  const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
  const requestBody = {
    model: "qwen-max",
    input: {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ]
    },
    parameters: {
      max_tokens: 1500,
      temperature: 0.7,
      top_p: 0.9
    }
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-DashScope-SSE": "disable"
    },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("DashScope API error:", response.status, errorText);
    throw new Error(`API \u8FD4\u56DE\u9519\u8BEF ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  if (data.output && data.output.text) {
    return data.output.text;
  }
  throw new Error("API \u8FD4\u56DE\u683C\u5F0F\u5F02\u5E38");
}
__name(callDashScopeAPI, "callDashScopeAPI");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
