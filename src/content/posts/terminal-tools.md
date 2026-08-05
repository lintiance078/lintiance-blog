---
slug: "terminal-tools"
title: "我的终端工具清单：提升命令行效率的利器"
date: "2025-05-20"
tags: ["开发工具", "效率", "技术笔记"]
summary: "分享日常使用的终端工具和配置，包括 shell 美化、模糊搜索、文件管理等方面的实践经验。"
cover: ""
word_count: 0
---

# 我的终端工具清单：提升命令行效率的利器

终端是开发者的主战场。一个配置得当的终端环境，能让工作效率提升不止一个档次。这篇文章记录了我日常使用的终端工具和配置。

## 终端模拟器

我目前使用 **Windows Terminal**，理由很简单：
- 支持多标签页和分屏
- GPU 加速渲染，字体渲染效果好
- 支持 PowerShell、WSL、Git Bash 等多种 shell
- 开源且持续更新

## Shell 配置

### PowerShell 美化

安装 Oh My Posh 来美化提示符：

```powershell
winget install JanDeDobbeleer.OhMyPosh
```

配合 Nerd Font 字体（推荐 JetBrainsMono Nerd Font），让终端图标正常显示。

### 实用的别名

```powershell
# 常用 Git 别名
function gs { git status }
function ga { git add . }
function gc { param($m) git commit -m "$m" }
function gp { git push }

# 快速导航
function src { cd ~/source }
function proj { cd ~/projects }
```

## 必装工具

### fd - 超快的文件查找

比 `find` 快得多，语法更友好：

```bash
fd "config" --type f
```

### ripgrep (rg) - 代码搜索神器

在大型项目中搜索代码的速度令人惊叹：

```bash
rg "function" --type ts
```

### fzf - 模糊搜索一切

`Ctrl+T` 搜索文件，`Ctrl+R` 搜索历史命令，`**` 触发补全：

```bash
# 用 fzf 选择文件并用 vim 打开
vim $(fzf)
```

### bat - 带语法高亮的 cat

```bash
bat README.md
```

### zoxide - 智能目录跳转

记住你常去的目录，自动跳转：

```bash
z project  # 跳转到包含 "project" 的目录
```

## 一点建议

不要一次性安装所有工具，先从一个开始，用熟了再加下一个。工具是用来提高效率的，不是用来折腾的。