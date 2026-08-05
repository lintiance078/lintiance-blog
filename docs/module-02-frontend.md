# 模块2：前端网页源码 — 文档

## 1. 模块概述

本模块完成了 Rin Blog 的全部前端页面源码，包括：

- **Rin 风格 UI 全局样式**：紫色系配色、暗色模式、响应式布局
- **8 个 Astro 组件**：Header、Footer、PostCard、SettingsPanel、HealthCheck、SearchBox、AsciiArt、TagList
- **1 个布局组件**：BaseLayout（HTML 骨架、全局样式、主题初始化）
- **6 个页面**：首页、文章列表、文章详情、标签分类、标签筛选、搜索页、404
- **2 个工具库**：API 调用封装、通用工具函数

## 2. 文件清单

### 样式
| 文件 | 说明 |
|------|------|
| `src/styles/global.css` | 全局样式：CSS 变量、浅色/暗色主题、文章卡片、ASCII 渲染、设置面板、健康检测、响应式 |

### 布局
| 文件 | 说明 |
|------|------|
| `src/layouts/BaseLayout.astro` | HTML 骨架、OG 标签、字体加载、主题防闪烁、全局交互脚本 |

### 组件
| 文件 | 说明 |
|------|------|
| `src/components/Header.astro` | 顶部导航栏：Logo、导航链接、搜索/设置按钮 |
| `src/components/Footer.astro` | 页脚：导航链接、版权信息、技术栈 |
| `src/components/PostCard.astro` | 文章卡片：封面图/ASCII 封面、标签、标题、摘要、日期、阅读时间 |
| `src/components/SettingsPanel.astro` | 侧边弹出设置面板：主题切换、站点信息展示、KV 配置异步加载 |
| `src/components/HealthCheck.astro` | 站点健康检测：页面加载时间、资源加载、API 接口、localStorage、Service Worker、网络类型 |
| `src/components/SearchBox.astro` | Pagefind 搜索：防抖输入、索引分片、URL 参数支持 |
| `src/components/AsciiArt.astro` | ASCII 字符画渲染：`<pre>` 标签、等宽字体、简单压缩 |
| `src/components/TagList.astro` | 标签云：标签统计、链接、active 状态 |

### 页面
| 文件 | 说明 |
|------|------|
| `src/pages/index.astro` | 首页：文章列表 + 搜索框 |
| `src/pages/posts/index.astro` | 文章列表页：全部文章 |
| `src/pages/posts/[slug].astro` | 文章详情：Markdown 渲染、封面图、ASCII 封面、本地收藏按钮 |
| `src/pages/tags/index.astro` | 标签分类页：标签云 |
| `src/pages/tags/[tag].astro` | 标签筛选页：按标签过滤文章 |
| `src/pages/search.astro` | 独立搜索页 |
| `src/pages/404.astro` | 404 页面：搜索建议 |

### 工具库
| 文件 | 说明 |
|------|------|
| `src/lib/api.ts` | API 调用封装：5 个 GET 接口的 TypeScript 类型定义和调用函数 |
| `src/lib/utils.ts` | 通用工具：日期格式化、标签解析、阅读时间、localStorage 封装、主题管理、键盘快捷键 |

## 3. Rin UI 风格复刻说明

### 配色
- 主色调：`#6366f1`（indigo-500）
- 悬停色：`#4f46e5`（indigo-600）
- 辅助色：`#818cf8`（indigo-400）
- 浅色背景：`#f8fafc`
- 暗色背景：`#0f172a`

### 页面布局
- 顶部固定导航栏（毛玻璃效果）
- 卡片式文章列表（hover 上浮 + 阴影）
- 侧边弹出设置面板（从右侧滑入）
- 右下角浮动健康检测按钮

### 设置面板
- 主题切换：浅色 / 深色 / 自动（跟随系统）
- 站点信息展示（异步加载 KV 配置）
- 说明：配置仅管理员通过 TUI 修改

### 健康检测
- 页面加载时间
- 资源加载状态
- API 接口可用性
- localStorage 可用性
- Service Worker 状态
- 网络类型

## 4. 技术约束遵守

- ✅ 原生 JavaScript，无 Vue/React 大框架
- ✅ 原生 CSS，无 Tailwind/Bootstrap
- ✅ 仅调用 GET 接口（`/api/posts`, `/api/tags`, `/api/config`, `/api/friends`）
- ✅ 浏览器 JS 不直接访问 D1/KV
- ✅ 网页端无任何写入云端能力
- ✅ 无登录系统、无在线编辑、无 R2 上传
- ✅ Pagefind 构建期索引，浏览器本地搜索
- ✅ 设置面板优先 localStorage，缺失时调用 KV
- ✅ 健康检测纯前端，结果仅存 localStorage
- ✅ 支持普通图片 + ASCII `<pre>` 字符画
- ✅ 仅 localStorage 本地点赞收藏
- ✅ 无 RSS 订阅
- ✅ 预渲染静态 HTML，CSS 压缩，图片懒加载
- ✅ ASCII 文本做简单压缩（连续空行合并）

## 5. 降级支持

删除 `functions/` 文件夹后，前端页面仍可正常工作：
- 文章列表从 `Astro.glob()` 读取本地 Markdown
- 标签统计从 frontmatter 解析
- 搜索使用 Pagefind 静态索引
- 设置面板使用 localStorage 默认值
- 健康检测仍可运行（API 检查项会显示错误）