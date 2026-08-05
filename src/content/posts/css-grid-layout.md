---
slug: "css-grid-layout"
title: "CSS Grid 布局实用指南：从入门到放弃 Flexbox"
date: "2025-05-28"
tags: ["CSS", "前端", "技术教程"]
summary: "深入理解 CSS Grid 布局的核心概念，掌握常用布局模式，告别 Flexbox 的层层嵌套。"
cover: ""
word_count: 0
---

# CSS Grid 布局实用指南：从入门到放弃 Flexbox

用了很长时间的 Flexbox，总觉得自己布局能力还行，但每次遇到复杂的二维布局还是会头疼——各种嵌套、各种计算，代码又臭又长。直到我开始认真学 Grid。

## Grid 的核心思想

Grid 和 Flexbox 最大的区别是：Grid 是**二维**的，同时控制行和列；Flexbox 是**一维**的，只能沿一个方向排列。

一个简单的类比：
- Flexbox 像排列书架上的书，一本接一本
- Grid 像在 Excel 表格中放置内容，有行有列

## 基础用法

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto;
  gap: 16px;
}
```

`1fr` 是 Grid 中最实用的单位，表示"一份可用空间"。`repeat(3, 1fr)` 就是三等分。

## 几个实用的布局模式

### 圣杯布局

```css
body {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  grid-template-areas:
    "header header header"
    "sidebar-left main sidebar-right"
    "footer footer footer";
}
```

### 响应式卡片网格

不需要 `@media` 查询就能自动适配列数：

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
```

### 居中一个元素

Grid 的终极居中方案：

```css
.center {
  display: grid;
  place-items: center;
}
```

## Grid vs Flexbox 怎么选

- **一维布局**（导航栏、列表项）→ Flexbox
- **二维布局**（页面整体结构、卡片网格、仪表盘）→ Grid
- 不需要二选一，两者可以嵌套使用

## 总结

Grid 并不难学，关键是理解行和列的概念。一旦掌握，你会发现以前用 Flexbox 硬凑的布局，用 Grid 几行代码就能搞定。建议从 `grid-template-columns` 和 `gap` 开始，逐步深入。