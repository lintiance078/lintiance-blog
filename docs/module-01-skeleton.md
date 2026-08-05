# 模块1：项目骨架与基础配置 — 文档

## 1. 模块概述

本模块完成了 Rin Blog 项目的骨架搭建，包括：

- 完整目录结构
- 项目基础配置文件（package.json、astro.config.mjs、tsconfig.json）
- Cloudflare Wrangler 配置（wrangler.toml）
- D1 数据库建表 SQL
- 基础配置模板（站点配置、KV 默认值）
- Pages Functions 只读 API 骨架（5 个 GET 接口）
- 构建前自检脚本
- KV 初始化脚本

## 2. 目录结构说明

```
rin-blog/
├── astro.config.mjs          # Astro 配置：hybrid 模式 + Cloudflare 适配器
├── package.json              # 依赖管理：astro, pagefind, sharp, blessed, jimp 等
├── tsconfig.json             # TypeScript 配置，含路径别名
├── wrangler.toml             # Wrangler 配置：D1 + KV 绑定 + 环境变量
├── .gitignore                # 忽略 node_modules、dist、.wrangler 等
│
├── sql/
│   └── schema.sql            # D1 建表：posts 文章元数据表 + tags 标签表
│
├── scripts/
│   ├── build-check.js        # 构建前自检：目录、Pagefind、wrangler、图片大小/数量
│   └── kv-seed.js            # KV 初始化脚本：将 kv-defaults.json 转为 bulk put 格式
│
├── functions/api/            # Pages Functions（仅 GET 只读接口）
│   ├── posts.ts              # GET /api/posts      文章列表（分页 + 标签筛选）
│   ├── posts/[slug].ts       # GET /api/posts/:slug 单篇文章详情
│   ├── tags.ts               # GET /api/tags       标签列表
│   ├── config.ts             # GET /api/config     站点全局配置
│   └── friends.ts            # GET /api/friends    友链列表
│
├── src/
│   ├── config/
│   │   ├── site.config.ts    # 站点默认配置（TypeScript 常量）
│   │   └── kv-defaults.json  # KV 云端默认值（JSON 格式）
│   ├── content/posts/        # Markdown 文章存放目录
│   ├── env.d.ts              # Cloudflare 环境类型声明
│   ├── pages/                # Astro 页面（模块2实现）
│   ├── layouts/              # 布局组件（模块2实现）
│   ├── components/           # UI 组件（模块2实现）
│   ├── styles/               # 全局样式（模块2实现）
│   └── lib/                  # 工具函数（模块2实现）
│
├── public/assets/images/     # 图片资源（跟随 Git 提交）
├── tui/                      # TUI 终端工具（模块3实现）
└── docs/                     # 文档（模块4实现）
```

## 3. 关键配置说明

### 3.1 wrangler.toml

- **D1 绑定**：`BLOG_DB` → `rin-blog-db`，用于存储文章元数据
- **KV 绑定**：`BLOG_KV` → 用于存储站点配置 + 友链
- 当前使用占位符 `YOUR_D1_DATABASE_ID` / `YOUR_KV_NAMESPACE_ID`，部署前需替换

### 3.2 D1 数据库表结构

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `posts` | 文章元数据 | slug, title, summary, tags(JSON), published, created_at |
| `tags` | 标签统计 | name, count |

**重要规则**：
- 文章正文存 Markdown 文件，编译为静态 HTML，**不入 D1**
- D1 仅存储元数据用于排序、标签筛选
- `tags` 字段为 JSON 数组格式（如 `["Astro","Cloudflare"]`）

### 3.3 Pages Functions 接口

| 接口 | 方法 | 用途 |
|------|------|------|
| `/api/posts` | GET | 文章列表（分页 + 标签筛选），Cache 60s |
| `/api/posts/:slug` | GET | 单篇文章元数据，Cache 300s |
| `/api/tags` | GET | 标签列表，Cache 300s |
| `/api/config` | GET | 站点配置，Cache 3600s |
| `/api/friends` | GET | 友链列表，Cache 3600s |

**全部仅为 GET 接口，无 POST/PUT/DELETE。**

### 3.4 构建自检脚本

`scripts/build-check.js` 在 `npm run build` 时自动执行，检查：
1. 目录完整性
2. Pagefind 可用性
3. wrangler.toml 配置完整性
4. 图片文件大小（不超过 25MB）
5. 图片数量（不接近 20000 上限）

任何检查不通过 → 终止构建。

## 4. 对接模块2的准备

模块1 已为模块2 准备了以下接口：

- 前端页面将调用的 5 个 GET API 骨架
- 站点配置 TypeScript 常量和 KV 默认值
- 环境类型声明（D1、KV 接口类型）
- 示例 Markdown 文章（hello-world.md）

## 5. 下一步

模块2 将实现：
- Astro 页面（首页、文章列表、详情、标签分类）
- Rin 风格 UI 组件（文章卡片、侧边设置面板、健康检测）
- Pagefind 搜索集成
- ASCII 字符画渲染组件
- 原生 CSS 样式