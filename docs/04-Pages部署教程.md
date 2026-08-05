# Cloudflare Pages 部署完整分步教程

## 目录

1. [前置准备](#1-前置准备)
2. [GitHub 仓库创建与推送](#2-github-仓库创建与推送)
3. [Cloudflare Pages 项目创建](#3-cloudflare-pages-项目创建)
4. [D1 和 KV 绑定](#4-d1-和-kv-绑定)
5. [环境变量配置](#5-环境变量配置)
6. [GitHub Actions 自动部署](#6-github-actions-自动部署)
7. [自定义域名（可选）](#7-自定义域名可选)
8. [部署验证](#8-部署验证)
9. [后续更新流程](#9-后续更新流程)

---

## 1. 前置准备

在开始部署前，请确保已完成以下准备：

- [x] GitHub 账号
- [x] Cloudflare 账号
- [x] 项目代码已推送到 GitHub 仓库
- [x] D1 数据库已创建（参考 [wrangler 配置教程](./03-wrangler配置教程.md)）
- [x] KV 命名空间已创建
- [x] `wrangler.toml` 中的占位符已替换为实际 ID
- [x] 已配置 `HACKER_SECRET_KEY` 环境变量
- [x] 已安装 Node.js v18 或更高版本

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
3. 填写仓库名称（如 `lintiance-blog`）
4. 选择 Public 或 Private（推荐 Private）
5. **不要**勾选 "Initialize this repository with a README"
6. 点击 `Create repository`

### 步骤二：推送代码

```bash
# 在项目根目录执行

# 添加远程仓库
git remote add origin https://github.com/你的用户名/lintiance-blog.git

# 推送代码
git add -A
git commit -m "初始化 Rin Blog 项目"
git push -u origin main
```

> **安全提醒**：确保 `.env` 文件和 `oneclick_scripts/` 下的 `*_config.ini` 文件已在 `.gitignore` 中忽略，**不要将敏感信息提交到 Git 仓库**。

---

## 3. Cloudflare Pages 项目创建

### 步骤一：进入 Pages 控制台

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单选择 `Workers & Pages` → `Pages`
3. 点击 `连接到 Git`

### 步骤二：连接 GitHub

1. 选择 `GitHub` 作为 Git 提供商
2. 授权 Cloudflare 访问你的 GitHub 仓库（如果是首次使用）
3. 选择 `lintiance-blog` 仓库
4. 点击 `开始设置`

### 步骤三：构建设置

填写以下配置：

| 配置项 | 值 |
|--------|---|
| **项目名称** | `lintiance-blog` |
| **生产分支** | `main` |
| **框架预设** | `Astro` |
| **构建命令** | `npm run build` |
| **构建输出目录** | `dist` |

> **重要**：Cloudflare 会自动识别 Astro 框架并填入默认值，**请务必确认构建输出目录为 `dist`**（而不是默认的 `dist/client`）。

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

> **首次部署可能失败**：这是因为 D1 和 KV 绑定尚未配置。继续下一步配置绑定后重新部署即可。

---

## 4. D1 和 KV 绑定

部署成功后，需要在 Pages 项目中绑定 D1 和 KV。

### 绑定 D1 数据库

1. 进入 Pages 项目 → `设置` → `函数` → `D1 数据库绑定`
2. 点击 `添加绑定`
3. 填写：
   - **变量名称**：`BLOG_DB`（**必须与 `wrangler.toml` 中的 `binding` 名称一致**）
   - **D1 数据库**：选择 `lintiance-blog-db`
4. 点击 `保存`

### 绑定 KV 命名空间

1. 进入 Pages 项目 → `设置` → `函数` → `KV 命名空间绑定`
2. 点击 `添加绑定`
3. 填写：
   - **变量名称**：`BLOG_KV`（**必须与 `wrangler.toml` 中的 `binding` 名称一致**）
   - **KV 命名空间**：选择 `BLOG_KV`
4. 点击 `保存`

### 重新部署

绑定完成后，需要重新部署才能使绑定生效：

1. 进入 `部署` → `所有部署`
2. 点击最近的部署记录
3. 点击 `重试部署` 或推送新代码触发重新部署

> **注意**：如果不重新部署，Pages Functions 在运行时将无法访问 D1 和 KV，API 接口会返回 500 错误。

---

## 5. 环境变量配置

在 `设置` → `环境变量` 中可以配置以下变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SITE_TITLE` | 站点标题 | `林天策 Blog` |
| `SITE_DESCRIPTION` | 站点描述 | `个人技术博客` |
| `DEFAULT_THEME` | 默认主题 | `light` |
| `HACKER_SECRET_KEY` | 黑客模式访问密钥 | `你的密钥` |

这些变量已在 `wrangler.toml` 中定义，在 Cloudflare 后台设置会**覆盖** `wrangler.toml` 中的值。

> **推荐做法**：在 Cloudflare 后台设置环境变量，这样修改密钥不需要修改代码仓库。

### 添加环境变量的步骤

1. 进入 Pages 项目 → `设置` → `环境变量`
2. 点击 `添加变量`
3. 填写变量名和值
4. 选择适用的环境（生产 / 预览）
5. 点击 `保存`

---

## 6. GitHub Actions 自动部署

项目已内置 GitHub Actions 工作流文件 `.github/workflows/deploy.yml`，支持通过 API 手动触发部署。

### 使用一键脚本触发部署

1. 配置 `oneclick_scripts\03_一键GitHub部署CloudflarePages\cloudflare_config.ini`
2. 双击 `deploy_cloudflare.bat`
3. 脚本通过 GitHub API 触发 Actions 工作流
4. Actions 自动执行构建和部署

### 手动触发

也可以在 GitHub 仓库页面手动触发：
1. 打开 GitHub 仓库 → `Actions` 标签
2. 选择 `Deploy to Cloudflare Pages` 工作流
3. 点击 `Run workflow`

### 自动部署

每次推送代码到 `main` 分支时，Cloudflare Pages 会**自动**检测到变更并触发构建部署，无需手动操作。

---

## 7. 自定义域名（可选）

1. 进入 Pages 项目 → `自定义域`
2. 点击 `设置自定义域`
3. 输入你的域名（如 `blog.example.com`）
4. 按照提示添加 DNS 记录（CNAME 指向 `lintiance-blog.pages.dev`）
5. 等待 DNS 生效（通常 1-5 分钟）

Cloudflare 会自动为你的自定义域名配置 SSL 证书。

---

## 8. 部署验证

### 验证部署状态

1. 访问 `https://lintiance-blog.pages.dev`（或你的自定义域名）
2. 确认以下页面正常显示：
   - [x] 首页：文章列表、搜索按钮、设置按钮
   - [x] 文章列表页（`/articles`）：所有文章正常显示
   - [x] 文章详情：Markdown 渲染、标签、收藏按钮
   - [x] 标签分类（`/tags`）：标签云
   - [x] 搜索功能：按 `Ctrl+K` 打开搜索弹窗
   - [x] 设置面板：点击齿轮图标打开
   - [x] 404 页面：访问不存在的 URL 显示自定义错误页

### 验证 API 接口

```bash
# 测试文章列表接口
curl https://lintiance-blog.pages.dev/api/posts

# 测试站点配置接口
curl https://lintiance-blog.pages.dev/api/config

# 测试友链接口
curl https://lintiance-blog.pages.dev/api/friends
```

### 验证 D1 和 KV

```bash
# 验证 D1 数据
npx wrangler d1 execute BLOG_DB --remote --command="SELECT * FROM posts"

# 验证 KV 数据
npx wrangler kv:key get --binding=BLOG_KV --remote "site_config"
```

### 验证黑客模式

1. 打开设置面板（点击齿轮图标）
2. 在站点信息区域找到站点名称"林天策 Blog"
3. 连续快速点击站点名称 5 次（2 秒内）
4. 看到像素 loading 标识（`▮▯▮▯▮`）表示触发成功
5. 按 `Ctrl+K` 打开搜索框
6. 输入黑客密钥并按回车
7. 页面切换为黑客终端风格，显示黑客文章

> 详细操作请参考 [隐秘黑客模式使用教程](./06-隐秘黑客模式使用教程.md)

---

## 9. 后续更新流程

### 日常更新（使用 TUI 一键流水线，推荐）

```bash
# 1. 启动 TUI
npm run tui

# 2. 选择双入口模式
# 3. 选择 ③ 部署
# 4. 输入提交信息
# 5. 等待自动完成：自检 → 构建 → Git 推送
```

### 使用一键脚本

```bash
# 双击运行
oneclick_scripts\02_一键提交到GitHub\push_github.bat
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

### 无电脑时更新

在外出没有本机电脑的情况下，可以直接在 GitHub 网页上编辑 Markdown 文件：

1. 打开 GitHub 仓库 → `src/content/posts/`
2. 点击文件 → 编辑（铅笔图标）
3. 修改内容 → 提交
4. Cloudflare Pages 自动检测到变更并重新部署

---

## 常见问题

### Q: 部署后网站显示空白？
A: 检查构建日志，确认 `dist` 目录是否正确生成。常见原因：构建命令错误、依赖安装失败。

### Q: API 接口返回 500？
A: 检查 D1/KV 绑定是否正确，确认变量名称与 `wrangler.toml` 一致。绑定后需要重新部署。

### Q: 搜索功能不工作？
A: 确认 `pagefind` 在构建阶段成功生成索引，检查 `dist/pagefind/` 目录是否存在。开发模式下搜索功能不可用，需要先执行 `npm run build`。

### Q: 部署失败提示文件超限？
A: 检查是否有超过 25MB 的图片文件，压缩或转换图片。构建自检脚本会自动检查并报错。

### Q: 如何降级为纯静态模式？
A: 删除 `functions/` 文件夹，重新推送即可。网站将自动退化为纯静态博客，无需 D1/KV。

### Q: 黑客模式密钥在哪里设置？
A: 在 `wrangler.toml` 的 `[vars]` 部分设置 `HACKER_SECRET_KEY`，同时在 `.env` 文件中设置相同值。也可以在 Cloudflare 后台环境变量中设置。

### Q: 修改站点配置后多久生效？
A: 通过 TUI 修改 `wrangler.toml` 后，需要重新构建部署（推送代码）才能生效。通过 KV 写入的配置修改则立即生效。