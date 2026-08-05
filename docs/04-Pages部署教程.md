# Cloudflare Pages 部署完整分步教程

## 目录

1. [前置准备](#1-前置准备)
2. [GitHub 仓库创建与推送](#2-github-仓库创建与推送)
3. [Cloudflare Pages 项目创建](#3-cloudflare-pages-项目创建)
4. [D1 和 KV 绑定](#4-d1-和-kv-绑定)
5. [环境变量配置](#5-环境变量配置)
6. [自定义域名（可选）](#6-自定义域名可选)
7. [部署验证](#7-部署验证)
8. [后续更新流程](#8-后续更新流程)

---

## 1. 前置准备

在开始部署前，请确保已完成以下准备：

- [x] GitHub 账号
- [x] Cloudflare 账号
- [x] 项目代码已推送到 GitHub 仓库
- [x] D1 数据库已创建（参考 [wrangler 配置教程](./03-wrangler配置教程.md)）
- [x] KV 命名空间已创建
- [x] `wrangler.toml` 中的占位符已替换为实际 ID

### 构建配置预设

| 配置项 | 值 |
|--------|---|
| 框架预设 | Astro |
| 构建命令 | `npm run build` |
| 构建输出目录 | `dist` |
| Node.js 版本 | 18.x 或更高 |

---

## 2. GitHub 仓库创建与推送

### 步骤一：在 GitHub 创建仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角 `+` → `New repository`
3. 填写仓库名称（如 `rin-blog`）
4. 选择 Public 或 Private
5. **不要**勾选 "Initialize this repository with a README"
6. 点击 `Create repository`

### 步骤二：推送代码

```bash
# 在项目根目录执行

# 添加远程仓库
git remote add origin https://github.com/你的用户名/rin-blog.git

# 推送代码
git add -A
git commit -m "初始化 Rin Blog 项目"
git push -u origin main
```

---

## 3. Cloudflare Pages 项目创建

### 步骤一：进入 Pages 控制台

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单选择 `Workers & Pages` → `Pages`
3. 点击 `连接到 Git`

### 步骤二：连接 GitHub

1. 选择 `GitHub` 作为 Git 提供商
2. 授权 Cloudflare 访问你的 GitHub 仓库
3. 选择 `rin-blog` 仓库
4. 点击 `开始设置`

### 步骤三：构建设置

填写以下配置：

| 配置项 | 值 |
|--------|---|
| **项目名称** | `rin-blog` |
| **生产分支** | `main` |
| **框架预设** | `Astro` |
| **构建命令** | `npm run build` |
| **构建输出目录** | `dist` |

> ⚠️ **重要**：Cloudflare 会自动识别 Astro 框架并填入默认值，请确认构建输出目录为 `dist`。

### 步骤四：保存并部署

点击 `保存并部署`，Cloudflare Pages 将自动开始首次构建和部署。

构建日志中可以看到：
```
Installing dependencies...
Building project...
Running build command: npm run build
...
Pagefind index generated
Deploying to Cloudflare's global network...
✅ Deployment complete!
```

---

## 4. D1 和 KV 绑定

部署成功后，需要在 Pages 项目中绑定 D1 和 KV。

### 绑定 D1 数据库

1. 进入 Pages 项目 → `设置` → `函数` → `D1 数据库绑定`
2. 点击 `添加绑定`
3. 填写：
   - **变量名称**：`BLOG_DB`（必须与 wrangler.toml 中的 binding 名称一致）
   - **D1 数据库**：选择 `rin-blog-db`
4. 点击 `保存`

### 绑定 KV 命名空间

1. 进入 Pages 项目 → `设置` → `函数` → `KV 命名空间绑定`
2. 点击 `添加绑定`
3. 填写：
   - **变量名称**：`BLOG_KV`（必须与 wrangler.toml 中的 binding 名称一致）
   - **KV 命名空间**：选择 `BLOG_KV`
4. 点击 `保存`

### 重新部署

绑定完成后，需要重新部署才能使绑定生效：

1. 进入 `部署` → `所有部署`
2. 点击最近的部署记录
3. 点击 `重试部署` 或推送新代码触发重新部署

---

## 5. 环境变量配置

### 可选环境变量

在 `设置` → `环境变量` 中可以配置：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SITE_TITLE` | 站点标题 | `Rin Blog` |
| `SITE_DESCRIPTION` | 站点描述 | `个人技术博客` |

这些变量已在 `wrangler.toml` 中定义，也可在 Cloudflare 后台覆盖。

---

## 6. 自定义域名（可选）

1. 进入 Pages 项目 → `自定义域`
2. 点击 `设置自定义域`
3. 输入你的域名（如 `blog.example.com`）
4. 按照提示添加 DNS 记录（CNAME 指向 `rin-blog.pages.dev`）
5. 等待 DNS 生效（通常 1-5 分钟）

---

## 7. 部署验证

### 验证部署状态

1. 访问 `https://rin-blog.pages.dev`（或你的自定义域名）
2. 确认以下页面正常显示：
   - [x] 首页：文章列表、搜索框
   - [x] 文章详情：Markdown 渲染、标签、收藏按钮
   - [x] 标签分类：标签云
   - [x] 搜索页：搜索功能
   - [x] 404 页面：自定义错误页

### 验证 API 接口

```bash
# 测试文章列表接口
curl https://rin-blog.pages.dev/api/posts

# 测试站点配置接口
curl https://rin-blog.pages.dev/api/config

# 测试友链接口
curl https://rin-blog.pages.dev/api/friends
```

### 验证 D1 和 KV

```bash
# 验证 D1 数据
npx wrangler d1 execute BLOG_DB --remote --command="SELECT * FROM posts"

# 验证 KV 数据
npx wrangler kv:key get --binding=BLOG_KV --remote "site_config"
```

---

## 8. 后续更新流程

### 日常更新（使用 TUI 一键流水线）

```bash
# 1. 启动 TUI
npm run tui

# 2. 选择 🚀 一键流水线
# 3. 输入提交信息
# 4. 等待自动完成：自检 → 构建 → Git 推送
```

### 手动更新

```bash
# 1. 修改文章（编辑 src/content/posts/ 下的 .md 文件）
# 2. 构建
npm run build

# 3. 提交推送
git add -A
git commit -m "更新文章"
git push
```

### 修改站点配置

```bash
# 使用 TUI 的数据管理功能
npm run tui
# 选择 🗄️ 数据管理 → ⚙️ 写入 KV 站点配置
```

> 💡 **提示**：修改站点配置（标题、友链等）通过 TUI 写入 KV 后**立即生效**，无需重新部署。

### 无电脑时更新

在外出没有本机电脑的情况下，可以直接在 GitHub 网页上编辑 Markdown 文件：

1. 打开 GitHub 仓库 → `src/content/posts/`
2. 点击文件 → 编辑（铅笔图标）
3. 修改内容 → 提交
4. GitHub 自动触发 Cloudflare Pages 重新部署

---

## 常见问题

### Q: 部署后网站显示空白？
A: 检查构建日志，确认 `dist` 目录是否正确生成。常见原因：构建命令错误、依赖安装失败。

### Q: API 接口返回 500？
A: 检查 D1/KV 绑定是否正确，确认变量名称与 `wrangler.toml` 一致。

### Q: 搜索功能不工作？
A: 确认 `pagefind` 在构建阶段成功生成索引，检查 `dist/pagefind/` 目录是否存在。

### Q: 部署失败提示文件超限？
A: 检查是否有超过 25MB 的图片文件，使用 TUI 工具压缩或转换。

### Q: 如何降级为纯静态模式？
A: 删除 `functions/` 文件夹，重新推送即可。网站将自动退化为纯静态博客，无需 D1/KV。