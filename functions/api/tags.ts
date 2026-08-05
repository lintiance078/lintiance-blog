/**
 * ============================================================
 * GET /api/tags - 标签列表接口
 * ============================================================
 * 从 D1 读取所有标签及对应文章数量
 * 仅 GET 只读
 * ============================================================
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.BLOG_DB.prepare(
      'SELECT * FROM tags ORDER BY count DESC'
    ).all();

    return new Response(JSON.stringify({
      success: true,
      data: results,
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
      error: 'Failed to fetch tags',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}