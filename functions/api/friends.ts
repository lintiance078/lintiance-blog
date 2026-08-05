/**
 * ============================================================
 * GET /api/friends - 友链列表接口
 * ============================================================
 * 从 KV 读取友链列表
 * 仅 GET 只读
 * ============================================================
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const friends = await env.BLOG_KV.get('friends_list', { type: 'json' });

    return new Response(JSON.stringify({
      success: true,
      data: friends || [],
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      data: [],
      error: 'Failed to fetch friends',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}