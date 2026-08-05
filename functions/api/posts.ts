/**
 * ============================================================
 * GET /api/posts - 文章列表接口
 * ============================================================
 * 从 D1 读取文章元数据，支持分页、标签筛选
 * 仅 GET 只读，禁止 POST/PUT/DELETE
 * ============================================================
 * 将在模块2中实现完整逻辑
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const tag = url.searchParams.get('tag');
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM posts WHERE published = 1';
    const params = [];

    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await env.BLOG_DB.prepare(query).bind(...params).all();
    const countResult = await env.BLOG_DB.prepare(
      'SELECT COUNT(*) as total FROM posts WHERE published = 1'
    ).first();

    return new Response(JSON.stringify({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit),
      },
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch posts',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}