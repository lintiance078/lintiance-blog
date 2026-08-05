# Rin Blog

基于 Astro + Cloudflare Pages 的 Rin UI 风格个人博客系统。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Astro v4 |
| 部署 | Cloudflare Pages |
| 数据库 | Cloudflare D1（文章元数据） |
| 存储 | Cloudflare KV（站点配置、友链） |
| 搜索 | Pagefind（构建期索引） |
| 本地工具 | Windows TUI（Node.js + blessed） |

## 项目结构

```
rin-blog/
├── astro.config.mjs          # Astro 配置文件
├── package.json              # 项目依赖与脚本
├── tsconfig.json             # TypeScript 配置
├── wrangler.toml             # Cloudflare Wrangler 配置（D1 + KV 绑定）
├── .gitignore
├── kv-seed.json              # KV 初始化数据（脚本生成）
│
├── sql/
│   └── schema.sql            # D1 建表 SQL
│
├── scripts/
│   ├── build-check.js        # 构建前自检脚本
│   └── kv-seed.js            # KV 初始化脚本
│
├── functions/                # Pages Functions（仅 GET 接口）
│   └── api/
│       ├── posts.ts          # GET /api/posts      - 文章列表
│       ├── posts/[id].ts     # GET /api/posts/:id  - 文章详情
│       ├── tags.ts           # GET /api/tags       - 标签列表
│       ├── config.ts         # GET /api/config     - 站点配置
│       └── friends.ts        # GET /api/friends    - 友链列表
│
├── src/
│   ├── config/
│   │   ├── site.config.ts    # 站点默认配置
│   │   └── kv-defaults.json  # KV 默认值
│   ├── content/
│   │   └── posts/            # Markdown 博客文章
│   ├── pages/                # Astro 页面
│   ├── layouts/              # 布局组件
│   ├── components/           # UI 组件
│   ├── styles/               # CSS 样式
│   └── lib/                  # 工具函数
│
├── public/
│   └── assets/
│       └── images/           # 图片资源（跟随 Git 提交）
│
├── tui/                      # Windows TUI 终端工具
│   ├── index.js              # 入口
│   ├── menus/                # 菜单模块
│   ├── modules/              # 功能模块
│   └── utils/                # 工具函数
│
└── docs/                     # 文档
```

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建
npm run build

# 启动 TUI 工具
npm run tui
```

## 部署

1. 在 Cloudflare 后台创建 D1 数据库和 KV 命名空间
2. 将 ID 填入 `wrangler.toml`
3. 初始化 D1 表结构：`npx wrangler d1 execute BLOG_DB --local --file=sql/schema.sql`
4. 初始化 KV 配置：`node scripts/kv-seed.js && npx wrangler kv:bulk put --binding=BLOG_KV --local kv-seed.json`
5. 推送至 GitHub，触发 Cloudflare Pages 自动部署

## 降级方案

删除 `functions/` 文件夹后，项目自动退化为纯静态博客，无需 D1/KV。