# lintiance blog

基于免费域名部署于 Cloudflare 的静态网页。

## 作者自述

由于用不起 R2 数据库，我花费了半天时间，让豆包生成提示词，用 TRAE 给我生成网站源码和与之相对应的配套文件。可能会有很多 BUG。

这个文章发布时通过 Cloudflare 链接到 GitHub 仓库，再由 GitHub 仓库自动部署。

### 灵感来源

声明一下：这个灵感也不是无中生有的，是借鉴一个 GitHub 的仓库 **[openRin/Rin](https://github.com/openRin/Rin/)** 的。这个仓库的网页是动态的，我尝试过部署动态的，但我用不起 R2 桶，所以只能用其他的桶：FILEBASE。但是这个桶不是公开的桶，一些数据什么的无法缓存，所以差点给我气死了 👿

### 部署建议

如果大家需要部署的话，我建议大家直接链接到 Cloudflare 的应用程序自动部署。我就是拉源码到本地来，结果出了各种错误，差点没给我气死 👿

### 免费域名推荐

**[DNSHE 免费域名](https://my.dnshe.com/index.php?m=domain_hub&view=tools&invite_code=5SSQ7YPELYNF)** — 这个域名是一年到期，你可以把注册码分享出来，我们互相填，这样就可以升级成永久的了。

---

## 技术栈

- **框架**：Astro（静态站点生成）
- **部署**：Cloudflare Pages（自动从 GitHub 部署）
- **数据库**：Cloudflare D1（文章元数据）
- **存储**：Cloudflare KV（站点配置）
- **搜索**：Pagefind（构建时索引，浏览器端本地检索）
- **本地工具**：Windows TUI（Node.js + blessed）

## 功能特性

- 📝 Markdown 文章写作，本地 TUI 管理
- 🔍 模态搜索弹窗，Pagefind 全文检索
- 🎨 多主题切换（浅色/深色/自动）
- 📐 5 种文章布局（Grid、Masonry、List、Card-List、Timeline）
- 🧭 5 种导航交互（静态、Sticky、滚动显隐、透明渐变、收缩）
- 🃏 4 种卡片风格（圆角阴影、简约无边框、封面置顶、背景虚化）
- 🧩 简约模式（一键关闭所有装饰特效）
- 🕵️ 隐秘黑客模式（独立文章库，密钥门禁保护）
- 🏷️ 标签分类与筛选（普通/黑客模式标签隔离）
- 📱 响应式设计，移动端适配
- ♿ 性能优化：懒加载、防抖节流、降级兜底

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

详细部署教程请参考 [docs/04-Pages部署教程.md](docs/04-Pages部署教程.md)

## License

MIT