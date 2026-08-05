---
slug: "blog-building-journey"
title: "从零搭建个人博客的技术选型与架构决策"
date: "2025-07-01"
tags: ["博客", "Astro", "Cloudflare", "前端工程"]
summary: "记录搭建这个博客的完整技术决策过程，包括 Astro vs Next.js 的深度对比、Cloudflare Pages 部署配置、以及静态博客的架构权衡。"
cover: ""
word_count: 0
---

# 从零搭建个人博客的技术选型与架构决策

搭建个人博客的技术选型，本质上是在"简单"和"灵活"之间做权衡。这篇文章记录了我从需求分析到最终部署的完整决策过程。

## 需求定义：明确"不需要什么"

在列出候选方案之前，我先明确了博客不需要什么，这比列出"需要什么"更能缩小范围：

- **不需要 SSR**：博客内容不依赖用户状态，静态生成完全够用
- **不需要数据库**：文章是 Markdown 文件，不需要持久化存储
- **不需要 CMS**：用编辑器写 Markdown 比用 Web 后台管理内容更高效
- **不需要复杂的交互**：不涉及实时数据、用户登录等

这些约束直接排除了 Next.js、WordPress、Ghost 等方案。

## 候选方案对比

| 方案 | 构建速度 | 自定义灵活性 | 学习曲线 | 部署复杂度 |
|------|----------|-------------|----------|-----------|
| Astro | 快（Vite 底层） | 高（组件模型） | 低 | 低（Cloudflare 适配器） |
| Hugo | 极快（Go 编译） | 中（Go 模板） | 中 | 低 |
| Hexo | 中 | 中（EJS 模板） | 低 | 低 |
| Next.js | 中 | 极高 | 高 | 中 |

Astro 的"默认零 JS"策略和 Island Architecture 恰好匹配博客的需求：大部分页面是纯静态内容，极少数需要交互的地方（如搜索、评论）可以按需加载 JS。

## 关键技术决策

### 图片处理策略

Astro 内置的 Image 组件在 Cloudflare Pages 上有兼容性问题——`sharp` 库在 Cloudflare 的构建环境中不可用。解决方案是使用 Cloudflare 的 Image Resizing 服务，或者退回到简单的 `<img>` 标签配合预生成的 WebP 格式。

我选择了后者：在构建阶段用脚本将图片转为 WebP 和多尺寸变体，避免运行时依赖。

### 搜索功能：Pagefind

纯静态博客的搜索不能依赖后端 API。Pagefind 是一个零配置的静态搜索库，它在构建后扫描生成的 HTML 文件建立索引，搜索时完全在浏览器端运行。关键配置：

```javascript
// astro.config.mjs 中的 Pagefind 集成
import pagefind from "astro-pagefind";

export default defineConfig({
  integrations: [pagefind()],
  build: {
    // 确保 Pagefind 在构建后运行
  }
});
```

### 暗色模式防闪烁

暗色模式的经典问题是：如果通过 JS 读取 `localStorage` 来切换主题，页面加载时会有短暂的"闪烁"（默认亮色主题渲染后才切换到暗色）。解决方案是在 `<head>` 中内联一个阻塞脚本，在页面渲染前读取主题偏好：

```html
<script is:inline>
  const theme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
</script>
```

`is:inline` 是 Astro 的指令，让这段脚本不经过打包直接输出。

## 部署配置

Cloudflare Pages 的部署通过 GitHub 集成自动触发。`wrangler.toml` 中无需额外配置，Pages 会自动识别 Astro 的构建输出目录。唯一需要注意的是环境变量：构建时需要的 API key 通过 Cloudflare Dashboard 设置，而不是 `.env` 文件。

```bash
# 构建命令
npm run build
# 输出目录
dist/
```

整个搭建过程给我最大的启发是：技术选型的核心不是"哪个技术最新最热"，而是"哪个技术解决的问题最匹配你不需要的功能"。少即是多。