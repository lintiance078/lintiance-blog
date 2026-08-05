---
slug: "javascript-array-methods"
title: "JavaScript 数组方法速查：从 map 到 reduce 的实战用法"
date: "2025-05-15"
tags: ["JavaScript", "前端", "技术教程"]
summary: "整理 JavaScript 数组常用方法的实际应用场景，通过代码示例展示 map、filter、reduce、flatMap 等方法的最佳实践。"
cover: ""
word_count: 0
---

# JavaScript 数组方法速查：从 map 到 reduce 的实战用法

数组操作是 JavaScript 日常开发中最频繁的场景之一。这篇文章整理了常用数组方法以及它们在实际项目中的典型用法。

## map：转换数据

当你需要把一种数据格式转换成另一种时。

```javascript
// 提取用户名称列表
const users = [
  { id: 1, name: 'Alice', age: 28 },
  { id: 2, name: 'Bob', age: 32 },
];
const names = users.map(u => u.name);
// ['Alice', 'Bob']
```

## filter：筛选数据

```javascript
// 过滤成年用户
const adults = users.filter(u => u.age >= 18);

// 过滤掉空值
const valid = items.filter(Boolean);
```

## reduce：聚合数据

Reduce 是最强大的数组方法，也是最容易被滥用的。

```javascript
// 按年龄分组
const grouped = users.reduce((acc, user) => {
  const decade = Math.floor(user.age / 10) * 10;
  (acc[decade] ||= []).push(user);
  return acc;
}, {});
// { '20': [...], '30': [...] }
```

**原则**：如果 `map` 或 `filter` 能解决问题，就不要用 `reduce`。代码可读性比"炫技"重要。

## find 和 findIndex

```javascript
// 查找第一个匹配项
const alice = users.find(u => u.name === 'Alice');

// 查找索引
const index = users.findIndex(u => u.id === 2);
```

## some 和 every

```javascript
// 是否有成年人
const hasAdult = users.some(u => u.age >= 18); // true

// 是否都是成年人
const allAdult = users.every(u => u.age >= 18); // false
```

## flatMap：先 map 再 flat

```javascript
// 提取所有标签并去重
const posts = [
  { title: 'Post 1', tags: ['js', 'web'] },
  { title: 'Post 2', tags: ['css', 'web'] },
];
const allTags = [...new Set(posts.flatMap(p => p.tags))];
// ['js', 'web', 'css']
```

## 链式调用

多个方法可以链式组合：

```javascript
const result = users
  .filter(u => u.age >= 18)
  .map(u => ({ name: u.name, isAdult: true }))
  .sort((a, b) => a.name.localeCompare(b.name));
```

## 性能提示

- 在处理大数组时，避免在 `map`/`filter` 中执行复杂计算
- 链式调用会遍历多次，如果性能敏感，考虑用 `reduce` 一次遍历完成
- 但大部分场景下，代码可读性比微小的性能优化更重要

掌握这些方法，你会发现原来需要 `for` 循环写一大段代码的逻辑，现在一行就能搞定。