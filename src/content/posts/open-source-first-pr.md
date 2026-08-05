---
slug: "open-source-first-pr"
title: "我的第一个开源贡献：从提 Issue 到合并 PR 的完整记录"
date: "2025-04-10"
tags: ["开源", "GitHub", "编程"]
summary: "记录第一次给开源项目贡献代码的完整经历，包括如何找到适合的项目、沟通技巧、以及 PR 被合入的喜悦。"
cover: ""
word_count: 0
---

# 我的第一个开源贡献：从提 Issue 到合并 PR 的完整记录

上个月，我给一个开源项目提了人生中第一个被合并的 PR。虽然只是修复了一个文档中的小错误，但看到自己的名字出现在 Contributors 列表里时，还是很有成就感的。

## 如何找到适合的项目

对于第一次贡献，选对项目很重要。我的筛选标准是：

1. **标签 `good first issue`**：GitHub 上很多项目会打这个标签，专门给新人准备
2. **活跃的项目**：最近有提交，Issue 有人回复
3. **文档或测试**：修复文档错误、补充测试用例是很好的切入点
4. **熟悉的语言**：当然要选自己会用的技术栈

推荐用 GitHub 的搜索：`label:"good first issue" language:javascript`

## 贡献流程

### 第一步：Fork 和 Clone

```bash
# Fork 项目（在 GitHub 网页上操作）
# Clone 到本地
git clone https://github.com/你的用户名/项目名.git
cd 项目名
git remote add upstream https://github.com/原作者/项目名.git
```

### 第二步：创建分支

```bash
git checkout -b fix/typo-in-readme
```

### 第三步：修改和提交

```bash
# 修改文件
git add .
git commit -m "docs: fix typo in README installation section"
```

### 第四步：推送和提 PR

```bash
git push origin fix/typo-in-readme
```

然后在 GitHub 上点击 "Compare & pull request"。

## 写一个好的 PR 描述

参考模板：

```markdown
## 问题描述
修复了 README 安装步骤中的拼写错误

## 修改内容
- 将 `npm istall` 改为 `npm install`

## 测试
- [x] 文档修改，无需测试
```

## PR 被合并后

我的 PR 两天后被合并了。维护者还留了一句 "Thanks for the fix!"，虽然只是简单的一句话，但给了我很大的鼓励。

## 几点体会

1. **从小处着手**：不需要一上来就修复复杂 Bug，改个文档、加个测试都是很好的开始
2. **先读 CONTRIBUTING.md**：很多项目有贡献指南，一定要先读
3. **沟通很重要**：不确定的地方先在 Issue 里问，不要自己闷头改
4. **不要怕被拒绝**：PR 被要求修改是正常的，这是学习的过程

开源贡献没有门槛，从今天开始，找一个你常用的项目，看看有没有能帮上忙的地方吧。