/**
 * ============================================================
 * GET /api/posts/:slug - 单篇文章详情接口
 * ============================================================
 * 从 D1 读取单篇文章元数据（正文已编译为静态 HTML，不在此接口返回）
 * 仅 GET 只读，禁止 POST/PUT/DELETE
 * ============================================================
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop();

  try {
    const post = await env.BLOG_DB.prepare(
      'SELECT * FROM posts WHERE slug = ? AND published = 1'
    ).bind(slug).first();

    if (!post) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Post not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: post,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch post',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}