/**
 * ============================================================
 * GET /api/config - 站点全局配置接口
 * ============================================================
 * 从 KV 读取站点全局配置，作为 localStorage 缺失时的默认值
 * 仅 GET 只读，网页不能修改 KV 配置
 * ============================================================
 */

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const [siteConfig, themeConfig, layoutConfig, featuresConfig, footerConfig] =
      await Promise.all([
        env.BLOG_KV.get('site_config', { type: 'json' }),
        env.BLOG_KV.get('theme_config', { type: 'json' }),
        env.BLOG_KV.get('layout_config', { type: 'json' }),
        env.BLOG_KV.get('features_config', { type: 'json' }),
        env.BLOG_KV.get('footer_config', { type: 'json' }),
      ]);

    return new Response(JSON.stringify({
      success: true,
      data: {
        site: siteConfig,
        theme: themeConfig,
        layout: layoutConfig,
        features: featuresConfig,
        footer: footerConfig,
      },
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
      error: 'Failed to fetch config',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}