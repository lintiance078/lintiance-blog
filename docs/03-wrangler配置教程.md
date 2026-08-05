# wrangler.toml 配置详细教程

## 目录

1. [配置文件说明](#1-配置文件说明)
2. [D1 数据库创建与绑定](#2-d1-数据库创建与绑定)
3. [KV 命名空间创建与绑定](#3-kv-命名空间创建与绑定)
4. [环境变量配置](#4-环境变量配置)
5. [获取 Cloudflare API 凭证](#5-获取-cloudflare-api-凭证)
6. [本地 wrangler 测试方法](#6-本地-wrangler-测试方法)
7. [配置缺失时的自检提示](#7-配置缺失时的自检提示)
8. [附录：完整的配置流程](#8-附录完整的配置流程)

---

## 1. 配置文件说明

项目的 `wrangler.toml` 位于项目根目录，包含以下配置：

```toml
name = "lintiance-blog"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

# D1 数据库绑定
[[d1_databases]]
binding = "BLOG_DB"
database_name = "lintiance-blog-db"
database_id = "YOUR_D1_DATABASE_ID"

# KV 命名空间绑定
[[kv_namespaces]]
binding = "BLOG_KV"
id = "YOUR_KV_NAMESPACE_ID"

# 环境变量
[vars]
SITE_TITLE = "林天策 Blog"
SITE_DESCRIPTION = "A personal blog powered by Astro & Cloudflare Pages"
DEFAULT_THEME = "light"
HACKER_SECRET_KEY = "hunter2"

# 开发环境配置
[env.dev]
d1_databases = [
  { binding = "BLOG_DB", database_name = "lintiance-blog-db-dev", database_id = "YOUR_DEV_D1_ID" }
]

[[env.dev.kv_namespaces]]
binding = "BLOG_KV"
id = "YOUR_DEV_KV_ID"
```

### 配置项说明

| 配置项 | 说明 |
|--------|------|
| `name` | 项目名称，对应 Cloudflare Pages 项目名 |
| `compatibility_date` | 兼容性日期，用于运行时特性支持 |
| `pages_build_output_dir` | Pages 构建输出目录，固定为 `dist` |
| `[[d1_databases]]` | D1 数据库绑定配置（生产环境） |
| `[[kv_namespaces]]` | KV 命名空间绑定配置（生产环境） |
| `[vars]` | 环境变量，在构建时和运行时注入 |
| `[env.dev]` | 开发环境配置，用于本地测试 |

> **重要**：`wrangler.toml` 中标记为 `YOUR_*` 的占位符必须替换为实际值，否则部署会失败。

---

## 2. D1 数据库创建与绑定

D1 是 Cloudflare 的分布式关系型数据库，用于存储文章元数据（标题、标签、发布时间、摘要等）。

> **注意**：文章正文以 Markdown 编译为静态 HTML，不存入 D1 数据库。

### 步骤一：创建 D1 数据库

```bash
npx wrangler d1 create lintiance-blog-db
```

输出示例：
```
✅ Successfully created DB 'lintiance-blog-db' in region APAC
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### 步骤二：获取并填写 database_id

将输出的 `database_id` 复制下来，替换 `wrangler.toml` 中的 `YOUR_D1_DATABASE_ID`：

```toml
[[d1_databases]]
binding = "BLOG_DB"
database_name = "lintiance-blog-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # ← 替换这里
```

> **警告**：`database_id` 是 D1 数据库的唯一标识符。如果填错，Pages Functions 将无法连接数据库，API 接口返回 500 错误。

### 步骤三：创建表结构

```bash
# 本地测试环境
npx wrangler d1 execute BLOG_DB --local --file=sql/schema.sql

# 生产环境
npx wrangler d1 execute BLOG_DB --remote --file=sql/schema.sql
```

### 步骤四：验证

```bash
# 查看表结构
npx wrangler d1 execute BLOG_DB --command="SELECT name FROM sqlite_master WHERE type='table'"
```

预期输出：
```
posts
tags
```

---

## 3. KV 命名空间创建与绑定

KV 是 Cloudflare 的分布式键值存储，用于存放网站全局配置和友链列表。

> **注意**：KV 每日有 1,000 次写入限制。仅修改配置或友链时才触发写入，正常浏览不会消耗写入配额。

### 步骤一：创建 KV 命名空间

```bash
npx wrangler kv:namespace create "BLOG_KV"
```

输出示例：
```
✅ Successfully created namespace 'BLOG_KV'
id = "f1e2d3c4-b5a6-7890-fedc-ba9876543210"
```

### 步骤二：获取并填写 namespace id

将输出的 `id` 替换 `wrangler.toml` 中的 `YOUR_KV_NAMESPACE_ID`：

```toml
[[kv_namespaces]]
binding = "BLOG_KV"
id = "f1e2d3c4-b5a6-7890-fedc-ba9876543210"  # ← 替换这里
```

> **警告**：`id` 是 KV 命名空间的唯一标识符。如果填错，Pages Functions 将无法读取站点配置，网站可能显示默认值或报错。

### 步骤三：初始化 KV 数据

```bash
# 生成初始化数据文件
node scripts/kv-seed.js

# 写入本地测试 KV
npx wrangler kv:bulk put --binding=BLOG_KV --local kv-seed.json

# 写入生产 KV
npx wrangler kv:bulk put --binding=BLOG_KV --remote kv-seed.json
```

### 步骤四：验证

```bash
# 读取站点配置
npx wrangler kv:key get --binding=BLOG_KV "site_config"
```

---

## 4. 环境变量配置

`wrangler.toml` 的 `[vars]` 部分定义了以下环境变量：

| 变量名 | 说明 | 默认值 | 是否必填 |
|--------|------|--------|----------|
| `SITE_TITLE` | 站点标题 | `林天策 Blog` | 否 |
| `SITE_DESCRIPTION` | 站点描述 | `A personal blog powered by Astro & Cloudflare Pages` | 否 |
| `DEFAULT_THEME` | 默认主题 | `light` | 否 |
| `HACKER_SECRET_KEY` | 黑客模式访问密钥 | `hunter2` | **是（如需黑客模式）** |

### HACKER_SECRET_KEY 说明

- 用于隐秘黑客模式的访问验证
- 构建时使用 djb2 哈希算法对密钥进行哈希处理
- 前端仅存储哈希值，通过哈希比对验证用户输入
- **密钥原文不会出现在浏览器源码中**
- 密钥同时需要在 `.env` 文件中配置（本地开发用）
- 修改密钥后需要重新构建部署才能生效

> **安全建议**：使用至少 8 位、包含大小写字母和数字的强密钥。不要使用 `hunter2` 等常见密码。

---

## 5. 获取 Cloudflare API 凭证

### 步骤一：登录 Wrangler

```bash
npx wrangler login
```

浏览器会自动打开 Cloudflare 授权页面，点击"允许"完成授权。

### 步骤二：验证登录状态

```bash
npx wrangler whoami
```

输出示例：
```
You are logged in with an API Token.
┌───────────────────┬──────────────────────────────────────┐
│ Account Name      │ your-email@example.com                │
│ Account ID        │ abc123def456                          │
└───────────────────┴──────────────────────────────────────┘
```

### 步骤三：获取 Account ID

Account ID 显示在 `wrangler whoami` 的输出中，格式为 32 位十六进制字符串。Cloudflare Pages 部署脚本需要用到此 ID。

你也可以在 Cloudflare Dashboard 中获取：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单选择 `Workers & Pages`
3. 右侧面板中可以看到 `账户 ID`

---

## 6. 本地 wrangler 测试方法

### 测试 D1 数据库

```bash
# 创建本地 D1 数据库
npx wrangler d1 create lintiance-blog-db-dev

# 执行建表 SQL
npx wrangler d1 execute BLOG_DB --local --file=sql/schema.sql

# 插入测试数据
npx wrangler d1 execute BLOG_DB --local --command="INSERT INTO posts (slug, title, summary, tags, published) VALUES ('test', '测试文章', '摘要', '[\"测试\"]', 1)"

# 查询数据
npx wrangler d1 execute BLOG_DB --local --command="SELECT * FROM posts"
```

### 测试 KV 存储

```bash
# 写入测试数据
npx wrangler kv:key put --binding=BLOG_KV --local "test_key" "test_value"

# 读取数据
npx wrangler kv:key get --binding=BLOG_KV --local "test_key"

# 列出所有 key
npx wrangler kv:key list --binding=BLOG_KV --local
```

### 测试 Pages Functions

```bash
# 本地运行 Pages（包含 Functions）
npx wrangler pages dev dist --binding BLOG_DB=<database_id> --kv BLOG_KV
```

---

## 7. 配置缺失时的自检提示

TUI 工具的自检系统会自动检测配置状态，以下是常见提示及其含义：

### 占位符未替换

```
[⚠] wrangler.toml: 包含占位符
[→] 部署前请替换为实际的 D1/KV ID
```

**含义**：`wrangler.toml` 中仍有 `YOUR_D1_DATABASE_ID` 或 `YOUR_KV_NAMESPACE_ID` 占位符。**部署前必须替换。**

### D1 数据库不存在

```
[✗] D1 数据库: 未找到
[→] 运行 npx wrangler d1 create lintiance-blog-db 创建数据库
```

### KV 命名空间不存在

```
[✗] KV 命名空间: 未找到
[→] 运行 npx wrangler kv:namespace create "BLOG_KV" 创建命名空间
```

### Wrangler 未登录

```
[✗] Wrangler 登录: 未登录
[→] 运行 npx wrangler login 登录 Cloudflare 账号
```

### HACKER_SECRET_KEY 未配置

```
[✗] .env 中缺少 HACKER_SECRET_KEY
[→] 在 TUI 中选择黑客版 → 站点管理 → 设置密钥
```

---

## 8. 附录：完整的配置流程

以下是从零开始配置项目的完整步骤：

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建 D1 数据库
npx wrangler d1 create lintiance-blog-db
# 复制输出的 database_id → 填入 wrangler.toml 的 YOUR_D1_DATABASE_ID

# 3. 创建 KV 命名空间
npx wrangler kv:namespace create "BLOG_KV"
# 复制输出的 id → 填入 wrangler.toml 的 YOUR_KV_NAMESPACE_ID

# 4. 创建表结构
npx wrangler d1 execute BLOG_DB --remote --file=sql/schema.sql

# 5. 初始化 KV 数据
node scripts/kv-seed.js
npx wrangler kv:bulk put --binding=BLOG_KV --remote kv-seed.json

# 6. 配置环境变量
# 编辑 wrangler.toml，设置 HACKER_SECRET_KEY 等
# 编辑 .env 文件，设置 HACKER_SECRET_KEY

# 7. 验证配置
npx wrangler d1 execute BLOG_DB --command="SELECT * FROM posts"
npx wrangler kv:key get --binding=BLOG_KV "site_config"

# 8. 配置完成！现在可以推送代码到 GitHub 触发 Pages 部署
```

> **提示**：你也可以使用一键自检脚本 `oneclick_scripts\01_一键自检完整性\check_project.bat` 来检查配置是否完整。脚本会生成详细的检查报告文件。