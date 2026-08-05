# wrangler.toml 配置详细教程

## 目录

1. [配置文件说明](#1-配置文件说明)
2. [D1 数据库创建与绑定](#2-d1-数据库创建与绑定)
3. [KV 命名空间创建与绑定](#3-kv-命名空间创建与绑定)
4. [获取 Cloudflare API 凭证](#4-获取-cloudflare-api-凭证)
5. [本地 wrangler 测试方法](#5-本地-wrangler-测试方法)
6. [配置缺失时的自检提示](#6-配置缺失时的自检提示)

---

## 1. 配置文件说明

项目的 `wrangler.toml` 位于项目根目录，包含以下配置：

```toml
name = "rin-blog"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

# D1 数据库绑定
[[d1_databases]]
binding = "BLOG_DB"
database_name = "rin-blog-db"
database_id = "YOUR_D1_DATABASE_ID"

# KV 命名空间绑定
[[kv_namespaces]]
binding = "BLOG_KV"
id = "YOUR_KV_NAMESPACE_ID"

# 环境变量
[vars]
SITE_TITLE = "Rin Blog"
SITE_DESCRIPTION = "A personal blog powered by Astro & Cloudflare Pages"
```

### 配置项说明

| 配置项 | 说明 |
|--------|------|
| `name` | 项目名称 |
| `compatibility_date` | 兼容性日期 |
| `pages_build_output_dir` | Pages 构建输出目录 |
| `[[d1_databases]]` | D1 数据库绑定配置 |
| `[[kv_namespaces]]` | KV 命名空间绑定配置 |
| `[vars]` | 环境变量 |

---

## 2. D1 数据库创建与绑定

### 步骤一：创建 D1 数据库

```bash
# 创建 D1 数据库
npx wrangler d1 create rin-blog-db
```

输出示例：
```
✅ Successfully created DB 'rin-blog-db' in region APAC
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### 步骤二：记录 database_id

将输出的 `database_id` 复制下来，替换 `wrangler.toml` 中的 `YOUR_D1_DATABASE_ID`：

```toml
[[d1_databases]]
binding = "BLOG_DB"
database_name = "rin-blog-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # ← 替换这里
```

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

### 步骤一：创建 KV 命名空间

```bash
npx wrangler kv:namespace create "BLOG_KV"
```

输出示例：
```
✅ Successfully created namespace 'BLOG_KV'
id = "f1e2d3c4-b5a6-7890-fedc-ba9876543210"
```

### 步骤二：记录 namespace id

将输出的 `id` 替换 `wrangler.toml` 中的 `YOUR_KV_NAMESPACE_ID`：

```toml
[[kv_namespaces]]
binding = "BLOG_KV"
id = "f1e2d3c4-b5a6-7890-fedc-ba9876543210"  # ← 替换这里
```

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
# 读取配置
npx wrangler kv:key get --binding=BLOG_KV "site_config"
```

---

## 4. 获取 Cloudflare API 凭证

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

### 步骤三：获取 Account ID（可选）

```bash
npx wrangler whoami
```

---

## 5. 本地 wrangler 测试方法

### 测试 D1 数据库

```bash
# 创建本地 D1 数据库
npx wrangler d1 create rin-blog-db-dev

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

## 6. 配置缺失时的自检提示

TUI 工具的自检系统会自动检测配置状态：

### 占位符未替换

```
[⚠] wrangler.toml: 包含占位符
[→] 部署前请替换为实际的 D1/KV ID
```

### D1 数据库不存在

```
[✗] D1 数据库: 未找到
[→] 运行 npx wrangler d1 create rin-blog-db 创建数据库
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

---

## 附录：完整的配置流程

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建 D1 数据库
npx wrangler d1 create rin-blog-db
# 复制输出的 database_id → 填入 wrangler.toml

# 3. 创建 KV 命名空间
npx wrangler kv:namespace create "BLOG_KV"
# 复制输出的 id → 填入 wrangler.toml

# 4. 创建表结构
npx wrangler d1 execute BLOG_DB --remote --file=sql/schema.sql

# 5. 初始化 KV 数据
node scripts/kv-seed.js
npx wrangler kv:bulk put --binding=BLOG_KV --remote kv-seed.json

# 6. 验证配置
npx wrangler d1 execute BLOG_DB --command="SELECT * FROM posts"
npx wrangler kv:key get --binding=BLOG_KV "site_config"

# 7. 配置完成！现在可以推送代码到 GitHub 触发 Pages 部署
```