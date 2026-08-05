# 林天策 Blog

个人博客系统，基于 **Astro** + **Cloudflare Pages** + **D1** + **KV** 构建。

风格克制朴素，注重性能和可访问性。

## 技术栈

- **框架**：Astro（静态站点生成 + Hybrid 模式）
- **部署**：Cloudflare Pages + Pages Functions（仅 GET 只读接口）
- **数据库**：Cloudflare D1（文章元数据）
- **存储**：Cloudflare KV（站点配置、友链）
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
- 🖼️ 图片压缩 + ASCII 字符画转换
- 🏷️ 标签分类与筛选
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

## 项目结构

```
rin-blog/
├── src/
│   ├── components/     # Astro 组件
│   ├── layouts/        # 布局组件
│   ├── pages/          # 路由页面
│   ├── content/posts/  # Markdown 文章
│   ├── styles/         # 全局样式
│   ├── lib/            # 工具函数
│   └── config/         # 站点配置
├── functions/api/      # Pages Functions（GET 只读）
├── tui/                # 本地 TUI 工具
├── scripts/            # 构建脚本
├── sql/                # D1 数据库 Schema
├── docs/               # 文档教程
└── public/             # 静态资源
```

## 部署

详细部署教程请参考 [docs/04-Pages部署教程.md](docs/04-Pages部署教程.md)

## License

MIT