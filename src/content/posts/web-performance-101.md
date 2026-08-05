---
slug: "web-performance-101"
title: "Web 性能优化实战：从 Lighthouse 诊断到 Core Web Vitals 达标"
date: "2025-05-08"
tags: ["前端", "性能优化", "Core Web Vitals"]
summary: "记录将网站性能从 Lighthouse 70 提升到 95 的完整过程，包括 LCP、CLS、TBT 的诊断与优化、资源加载策略、以及性能监控的持续化方案。"
cover: ""
word_count: 0
---

# Web 性能优化实战：从 Lighthouse 诊断到 Core Web Vitals 达标

性能优化不只是"让页面加载更快"——它直接影响用户体验、SEO 排名和转化率。Google 的研究表明，页面加载时间每增加 1 秒，移动端转化率下降约 20%。这篇文章记录了将一个网站从 Lighthouse 70 分优化到 95 分的完整过程。

## 诊断阶段：理解指标而非追逐分数

Lighthouse 分数是诊断工具，不是优化目标。真正需要关注的是 Core Web Vitals 的三个核心指标：

- **LCP（Largest Contentful Paint）**：最大内容渲染时间，目标 < 2.5s。通常是首屏大图、Hero 区域的背景图、或大段文字块
- **CLS（Cumulative Layout Shift）**：累计布局偏移，目标 < 0.1。来源于无尺寸的图片、动态注入的广告/横幅、Web Font 切换
- **TBT（Total Blocking Time）**：总阻塞时间，目标 < 200ms。来源于长时间执行的 JS 任务阻塞主线程

Lighthouse 的诊断面板会告诉你具体哪个元素拖慢了哪个指标。不要盲目优化，先定位问题。

## LCP 优化：让首屏内容尽快渲染

LCP 的优化本质是缩短"从用户请求到最大内容渲染"的路径：

### 图片优化

```html
<!-- 响应式图片：根据视口加载不同尺寸 -->
<img
  src="hero-800.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1200.webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  alt="Hero image"
  width="1200"
  height="600"
  fetchpriority="high"
/>
```

`fetchpriority="high"` 告诉浏览器这个资源是 LCP 元素，优先加载。`width` 和 `height` 属性防止布局偏移，同时解决 CLS 问题。

### 字体加载策略

自定义 Web Font 会阻塞文本渲染，因为浏览器在字体加载完成前不会显示文本。解决方式：

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap;          /* 先用系统字体，加载完再替换 */
  font-weight: 400 700;
}

/* 为字体加载期间设置 fallback 字体，减少 CLS */
body {
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
```

`font-display: swap` 的权衡：用户会看到短暂的字体切换（FOUT），但文本立即可见，不会出现白屏。

## CLS 优化：消除意外的布局偏移

CLS 最常见的原因是图片和广告。解决方案：

```css
/* 为所有图片设置默认宽高比，防止加载时布局偏移 */
img, video, iframe {
  max-width: 100%;
  height: auto;
  aspect-ratio: attr(width) / attr(height);
}

/* 为动态内容预留空间 */
.ad-slot {
  min-height: 250px;  /* 即使广告未加载，也保留空间 */
}
```

## JavaScript 的加载策略

不是所有 JS 都需要立即加载和执行：

```html
<!-- 普通脚本：阻塞 HTML 解析 -->
<script src="app.js"></script>

<!-- defer：不阻塞解析，DOM 构建完成后按顺序执行 -->
<script src="analytics.js" defer></script>

<!-- async：不阻塞解析，下载完立即执行（适合独立脚本） -->
<script src="widget.js" async></script>

<!-- 动态导入：只在需要时加载 -->
<script type="module">
  const { heavyFunction } = await import('./heavy-module.js');
</script>
```

第三方脚本（Google Analytics、广告 SDK、客服聊天）是性能的隐形杀手。每个第三方脚本都增加 DNS 查询、TCP 连接和 JS 解析开销。定期审查：是否还在用？延迟加载是否可行？

## 性能监控的持续化

一次性优化不够，性能会随着新功能的添加而退化。在 CI/CD 中集成 Lighthouse CI：

```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse
  run: |
    npx lhci autorun --config=lighthouserc.js
```

设置性能预算（performance budget），当构建产物体积超过阈值时 CI 失败，阻止性能退化进入生产环境。

性能优化是持续的工程实践，不是一次性的冲刺。关键是建立"诊断 → 优化 → 监控 → 回溯"的闭环，让性能成为开发流程的一部分而非事后补救。