-- ============================================================
-- 林天策 Blog - D1 数据库建表 SQL
-- ============================================================
-- 数据库：rin-blog-db
-- 用途：仅存储文章元数据（标题、标签、发布时间、摘要）
-- 注意：文章正文存在 Markdown 文件中，编译为静态 HTML，不入 D1
-- ============================================================

-- ----------------------------------------------------------
-- 文章元数据表
-- 仅存储元数据用于排序、标签筛选
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,          -- URL 友好标识符，对应 Markdown 文件名
    title       TEXT    NOT NULL,                  -- 文章标题
    summary     TEXT    DEFAULT '',                -- 文章摘要（短文本，非正文）
    tags        TEXT    DEFAULT '[]',              -- JSON 数组格式标签，如 ["Astro","Cloudflare"]
    cover_image TEXT    DEFAULT '',                -- 封面图片路径（相对 public/assets/images/）
    is_ascii    INTEGER DEFAULT 0,                 -- 封面是否为 ASCII 字符画（0=图片, 1=ASCII）
    published   INTEGER DEFAULT 0,                 -- 是否已发布（0=草稿, 1=已发布）
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),  -- 创建时间
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),  -- 更新时间
    word_count  INTEGER DEFAULT 0                  -- 文章字数（用于展示）
);

-- 索引：按发布时间倒序
CREATE INDEX IF NOT EXISTS idx_posts_published_created
    ON posts(published, created_at DESC);

-- 索引：按 slug 快速查找
CREATE INDEX IF NOT EXISTS idx_posts_slug
    ON posts(slug);

-- ----------------------------------------------------------
-- 标签表（可选，用于标签统计）
-- 也可直接从 posts.tags JSON 字段解析
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE,
    count INTEGER DEFAULT 0
);

-- ----------------------------------------------------------
-- 初始化示例数据（可选，部署后可手动清理）
-- ----------------------------------------------------------
INSERT OR IGNORE INTO posts (slug, title, summary, tags, cover_image, published, created_at)
VALUES (
    'hello-world',
    'Hello World - 欢迎来到我的博客',
    '这是第一篇博客文章，用于测试 D1 数据库与 Cloudflare Pages 的集成。',
    '["博客","Astro","Cloudflare"]',
    '',
    1,
    datetime('now')
);