# 模块3：Windows 本地 TUI 终端工具 — 文档

## 1. 模块概述

本模块完成了 Rin Blog 的 Windows 本地 TUI 终端管理工具，基于 Node.js + blessed + blessed-contrib 实现。

### 技术栈
- **UI 框架**：blessed + blessed-contrib（ANSI 彩色终端界面）
- **图像处理**：Jimp（图片读取、缩放、压缩、灰度转换）
- **Banner 生成**：figlet（ASCII 大标题艺术字）
- **终端颜色**：chalk（日志分级着色）

## 2. 文件清单

| 文件 | 说明 |
|------|------|
| `tui/index.js` | 主入口：blessed 界面、菜单系统、交互流程 |
| `tui/modules/selfCheck.js` | 自检系统：基础检查/完整检查/流水线检查 |
| `tui/modules/postManager.js` | 文章管理：新建/列出/编辑/删除 Markdown 文章 |
| `tui/modules/editor.js` | 编辑器调用：优先 Publii → 回退系统默认编辑器 |
| `tui/modules/imageProcessor.js` | 图片处理：压缩/单张转ASCII/批量转换/统计 |
| `tui/modules/pipeline.js` | 一键流水线：自检→构建→Git 推送 |
| `tui/modules/dbManager.js` | D1/KV 管理：同步文章/标签到 D1，写入 KV 配置/友链 |
| `tui/utils/config.js` | 配置管理：加载/保存/读取 TUI 配置 |
| `tui/utils/logger.js` | 日志系统：分级着色输出（成功/警告/错误/信息） |
| `tui/utils/banner.js` | Banner 生成：figlet ASCII 艺术字标题 |
| `tui/utils/asciiArt.js` | ASCII 转换：Jimp 高精度灰度字符画算法 |

## 3. 功能清单对照

### 主菜单
| 菜单项 | 功能 | 实现模块 |
|--------|------|----------|
| 📝 新建文章 | 输入标题/标签/摘要 → 生成 Markdown 模板 → 打开编辑器 | postManager.js + editor.js |
| ✏️ 编辑文章 | 列出所有文章 → 选择 → 打开编辑器 | postManager.js + editor.js |
| 🖼️ 图片处理 | 子菜单：压缩、单张转ASCII、批量转换、统计 | imageProcessor.js |
| 🚀 一键流水线 | 输入提交信息 → 自检→构建→Git推送 | pipeline.js |
| 🗄️ 数据管理 | 子菜单：同步D1、写入KV、管理友链 | dbManager.js |
| 🔍 系统自检 | 完整自检并输出结果 | selfCheck.js |
| ⚙️ 设置 | 调整阈值、自动转换开关、ASCII参数、Git分支 | config.js |

### 自检项
| 检查项 | 级别 | 说明 |
|--------|------|------|
| Node.js 版本 | 错误 | 需要 >= 18 |
| 项目目录结构 | 错误 | src/public/functions/sql 必须存在 |
| package.json | 错误 | 必须存在 |
| wrangler.toml | 警告 | 占位符提示 |
| node_modules | 错误 | 必须安装 |
| Git 环境 | 错误 | 必须安装 Git |
| Git 仓库/远程 | 错误 | 必须初始化并配置 origin |
| Wrangler 环境 | 警告 | 未登录时提示 |
| Publii 编辑器 | 警告 | 未找到时回退默认编辑器 |
| 图片目录/数量 | 警告 | 达到阈值时提示 |
| Astro 构建工具 | 错误 | 流水线检查时验证 |
| Pagefind | 警告 | 流水线检查时验证 |

### ASCII 转换参数
| 参数 | 默认值 | 说明 |
|------|--------|------|
| maxWidth | 120 | 最大字符宽度 |
| charset | detailed | 字符集：detailed(@%#*+=-:.)  |
| contrast | 1.0 | 对比度增强系数 |
| brightness | 1.0 | 亮度系数 |

## 4. 启动方式

```bash
# 方式1：npm 脚本
npm run tui

# 方式2：直接运行
node tui/index.js
```

## 5. 操作说明

- **↑↓**：导航菜单项
- **Enter**：确认选择
- **Esc**：返回上级菜单 / 取消输入
- **Tab**：切换焦点（菜单 ↔ 日志）
- **Ctrl+C**：退出程序

## 6. 关键约束遵守

- ✅ Windows ANSI 彩色终端程序（blessed）
- ✅ ASCII banner 艺术标题（figlet）
- ✅ 方向键菜单、输入框、进度条
- ✅ 非 GUI，非 bat 脚本
- ✅ 新建 Markdown 文章模板，填写标题/标签/时间
- ✅ 优先唤起 Publii 编辑器，找不到回退系统默认编辑器
- ✅ 禁止调用 Publii 导出站点（仅作为编辑器使用）
- ✅ 高危操作前置完整自检
- ✅ 自检失败直接终止，输出明确报错
- ✅ 日志区分成功/警告/错误
- ✅ 一键流水线：自检 → 构建 → Git 推送
- ✅ 不调用 Cloudflare 部署 API
- ✅ TUI 通过调用 wrangler 命令完成 D1/KV 写入
- ✅ 图片数量阈值配置
- ✅ 批量转换前强制风险确认
- ✅ 图片本地有损压缩
- ✅ 手动单张图片转 ASCII