---
slug: "web-performance-101"
title: "Web 性能优化实用手册：从 Lighthouse 70 到 95"
date: "2025-05-08"
tags: ["前端", "性能优化", "技术教程"]
summary: "记录对一个网站进行性能优化的完整过程，从分析诊断到具体实施，最终将 Lighthouse 评分从 70 提升到 95。"
cover: ""
word_count: 0
---

# Web 性能优化实用手册：从 Lighthouse 70 到 95

最近优化了一个网站的性能，Lighthouse 评分从 70 提升到了 95。这篇文章记录下整个优化过程和用到的方法。

## 第一步：诊断

先用 Lighthouse 跑一遍，看看问题出在哪里。常见的问题：

- **LCP 过大**（最大内容绘制）：通常是首屏大图或字体加载慢
- **CLS 过高**（布局偏移）：图片没有设置宽高，或者动态插入内容
- **TBT 过长**（总阻塞时间）：JavaScript 执行时间太长

## 第二步：图片优化

图片通常是页面体积最大的部分。

### 格式选择

- 照片用 **WebP**，压缩率高且质量损失小
- 图标用 **SVG**，体积小且可缩放
- 动图用 **视频** 代替 GIF（GIF 体积巨大）

### 图片加载策略

```html
<!-- 懒加载 -->
<img src="photo.webp" loading="lazy" decoding="async" />

<!-- 响应式图片 -->
<img
  src="photo-800.webp"
  srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1200.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  alt="描述"
/>
```

### 防止布局偏移

始终给图片设置宽高：

```css
img {
  width: 100%;
  height: auto;
  aspect-ratio: attr(width) / attr(height);
}
```

## 第三步：字体优化

自定义字体会阻塞渲染，导致文字不可见。

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap; /* 关键：先用系统字体，加载完再替换 */
}
```

使用 `font-display: swap` 确保文字在字体加载期间可见。

## 第四步：JavaScript 优化

- **代码分割**：按路由拆分 JS，不要一次性加载所有代码
- **延迟非关键 JS**：用 `defer` 或动态 `import()`
- **移除未使用的代码**：Tree Shaking
- **减少第三方脚本**：每个第三方脚本都是性能杀手

## 第五步：CSS 优化

- 移除未使用的 CSS（PurgeCSS）
- 内联关键 CSS（首屏样式直接写在 `<head>` 中）
- 避免在 `@keyframes` 中使用 `box-shadow`、`filter` 等昂贵属性

## 效果对比

优化后的 Lighthouse 报告：

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| Performance | 70 | 95 |
| FCP | 2.1s | 1.2s |
| LCP | 4.3s | 1.8s |
| CLS | 0.15 | 0.01 |

性能优化是一个持续的过程，不是一次性工作。每次发布新功能后，都应该跑一次 Lighthouse 检查。