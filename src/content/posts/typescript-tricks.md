---
slug: "typescript-tricks"
title: "TypeScript 实用技巧：让类型系统为你工作"
date: "2025-05-02"
tags: ["TypeScript", "前端", "技术笔记"]
summary: "分享日常开发中常用的 TypeScript 技巧，包括类型推导、工具类型、泛型约束等实用知识。"
cover: ""
word_count: 0
---

# TypeScript 实用技巧：让类型系统为你工作

刚开始用 TypeScript 的时候，觉得它就是在 JavaScript 上加了一层"类型注释"，写起来还更慢了。但用了一段时间后，发现一个好的类型系统能帮你提前发现很多隐患。

## 善用类型推导

TypeScript 的类型推导很智能，不需要手动标注所有类型：

```typescript
// ❌ 过度标注
const name: string = "Alice";
const age: number = 28;
const items: string[] = ["a", "b"];

// ✅ 让 TypeScript 自己推导
const name = "Alice";
const age = 28;
const items = ["a", "b"];
```

## 工具类型

TypeScript 内置了很多工具类型，可以组合出强大的类型定义：

```typescript
// Partial：所有属性可选
type PartialUser = Partial<User>;

// Pick：选取部分属性
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>;

// Omit：排除部分属性
type UserWithoutPassword = Omit<User, 'password'>;

// Record：创建键值对类型
type PageRoutes = Record<string, () => void>;
```

## 有用的模式

### 使用 const 断言获得精确类型

```typescript
// 普通写法：类型是 string[]
const colors = ['red', 'green', 'blue'];

// const 断言：类型是 readonly ["red", "green", "blue"]
const colors = ['red', 'green', 'blue'] as const;
type Color = typeof colors[number]; // "red" | "green" | "blue"
```

### 使用 satisfies 验证类型

```typescript
// 既验证类型，又保留精确值
const config = {
  port: 3000,
  host: 'localhost',
} satisfies Record<string, string | number>;
```

### 使用 is 做类型收窄

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

## 不要做的事情

1. **不要滥用 `any`**：用了 `any` 就失去了 TypeScript 的意义
2. **不要过度设计类型**：简单的类型比复杂的泛型更好维护
3. **不要用 `as` 强制转换**：除非你确定自己比 TypeScript 更懂

TypeScript 是一个工具，目的是帮你写出更好的代码，不是让你炫技。保持简单，按需使用。