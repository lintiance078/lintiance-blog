/**
 * ============================================================
 * 站点配置模板 - 本地默认值
 * ============================================================
 * 优先级：localStorage > KV 云端配置 > 此默认值
 * 此文件作为本地构建时的默认配置，云端部署后会读取 KV 覆盖
 * ============================================================
 */

export const SITE_CONFIG = {
  // 站点基本信息
  title: '林天策 Blog',
  subtitle: 'A personal blog',
  description: '记录技术、生活与思考',
  author: 'Blog Author',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',

  // 主题配置
  theme: {
    default: 'light',       // 默认主题：light | dark | auto
    primaryColor: '#6366f1', // Rin 风格主色调（紫色系）
    accentColor: '#818cf8',
  },

  // 布局配置
  layout: {
    postsPerPage: 10,       // 每页文章数
    showCoverImage: true,   // 是否显示封面图
    cardStyle: 'rounded',   // 文章卡片样式：rounded | flat
  },

  // 功能开关
  features: {
    search: true,           // Pagefind 搜索
    healthCheck: true,      // 站点健康检测
    settingsPanel: true,    // 侧边设置面板
    tagFilter: true,        // 标签筛选
    localLike: true,        // 本地收藏（localStorage）
  },

  // 页脚
  footer: {
    copyright: '© 2025 林天策 Blog. All rights reserved.',
    icp: '',                // ICP 备案号（可选）
    poweredBy: 'Astro + Cloudflare Pages',
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;