/**
 * ============================================================
 * POST /api/verify-hacker-key - 验证黑客模式访问密钥
 * ============================================================
 * 密钥存储在环境变量 HACKER_SECRET_KEY 中
 * 前端 JS 无法直接获取密钥，只能通过此接口服务端验证
 * 仅接受 POST 请求
 * ============================================================
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const submittedKey = body.key || '';

    // 从环境变量读取密钥（Cloudflare Pages 环境变量或本地 .env）
    const secretKey = env?.HACKER_SECRET_KEY || '';

    if (!secretKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Secret key not configured',
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const isValid = submittedKey === secretKey;

    return new Response(JSON.stringify({
      success: isValid,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request',
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// 处理 OPTIONS 预检请求
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}