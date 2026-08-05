---
slug: "git-workflow-practice"
title: "Git 工作流的实践与思考：从随意提交到可追溯的提交历史"
date: "2025-06-15"
tags: ["Git", "开发工具", "工程实践"]
summary: "从实际项目出发，探讨 Git 工作流的规范化过程，包括 commit message 规范、分支策略、rebase 操作以及常见事故的恢复方法。"
cover: ""
word_count: 0
---

# Git 工作流的实践与思考：从随意提交到可追溯的提交历史

整理过去几个项目的 Git 提交历史时，我发现早期的 commit message 堪称灾难——"fix"、"update"、"修改"占据了半壁江山。当需要回滚某个线上问题时，面对几十条无意义的提交信息，根本无从还原当时的改动意图。

## Commit Message 不只是注释

好的 commit message 是一种**时间维度上的文档**。六个月后，当你需要理解某段代码为什么存在时，`git blame` 会指向一条 commit。如果那条 commit 的信息是"fix"，你需要重新阅读整个 diff 才能理解上下文。如果它是"fix: 修复用户注销后 session 未清理导致 401 循环"，你一眼就知道问题所在。

我采用的规范是 Conventional Commits 的精简版：

```
<type>(<scope>): <简短描述>

<详细说明（可选）>
```

类型定义：
- `feat`：新功能（触发 minor 版本号变更）
- `fix`：Bug 修复（触发 patch 版本号变更）
- `refactor`：不改变外部行为的代码重构
- `perf`：性能优化
- `docs`：文档变更
- `chore`：构建过程或辅助工具的变动

一个实用的技巧：在 commit message 的 body 中写清楚"为什么这样改"，而不是"改了什么"。Diff 已经展示了"改了什么"，"为什么"才是 commit message 的独特价值。

## 分支策略：适合的才是对的

对于个人项目和小团队，Git Flow 太重了。我使用的是一个简化模型：

- `main`：生产环境代码，受保护分支
- `feature/<描述>`：功能分支，合并到 main 后立即删除
- `fix/<描述>`：Bug 修复分支

对于多人协作的项目，增加一个 `develop` 分支作为集成分支，所有功能分支先合并到 develop，通过 CI 后再合并到 main。

## 交互式 Rebase 的实际用法

`git rebase -i` 是整理提交历史最强大的工具，但很多人害怕使用。掌握几个核心操作就够了：

```bash
# 压缩最近 3 个提交为一个
git rebase -i HEAD~3

# 在编辑器中：
# pick abc1234 feat: add user login
# squash def5678 fix: typo  ← 会被合并到上一个提交
# squash ghi9012 fix: another typo  ← 同上
```

`reword` 用于修改 commit message，`fixup` 类似于 squash 但丢弃 commit message。注意：**只在尚未推送到共享分支的提交上使用 rebase**。一旦 push 过，rebase 会改写历史，给协作者带来麻烦。

## 常见事故恢复

几个救过我命（或者说救过我的代码）的操作：

```bash
# 误删了文件，恢复到上次提交的状态
git checkout -- path/to/file

# 回退最后一次提交，但保留修改内容
git reset --soft HEAD~1

# 查看某个文件在特定提交时的内容
git show abc1234:src/app.ts

# 二分查找引入 bug 的提交
git bisect start
git bisect bad HEAD
git bisect good v1.0.0  # 已知正常的版本
# Git 会自动 checkout 中间的提交，你测试后标记 good/bad
```

## 一个反直觉的实践

不要追求"完美的线性历史"。在多人协作项目中，merge commit 是有价值的——它记录了功能分支的完整上下文，包括分支的起点和终点。一个纯线性的历史（通过 rebase 强制实现）会丢失这些信息。我们的规则是：**个人分支内用 rebase 保持整洁，分支合并时用 merge 保留上下文**。

Git 工作流没有银弹，关键是团队对齐一套约定并坚持执行。一致性比完美更重要。