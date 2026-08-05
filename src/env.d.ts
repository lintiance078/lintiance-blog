/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Cloudflare Pages 环境类型
interface CloudflareEnv {
  BLOG_DB: D1Database;
  BLOG_KV: KVNamespace;
}

// 运行时环境
declare namespace App {
  interface Locals extends CloudflareEnv {}
}

// D1 数据库类型声明
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  dump(): Promise<ArrayBuffer>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: {
    duration?: number;
    last_row_id?: number;
    changes?: number;
  };
}

// KV 命名空间类型声明
interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
  getWithMetadata<T = unknown>(key: string, options?: { type?: 'text' | 'json' }): Promise<{ value: string | null; metadata: T | null }>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; metadata?: unknown }[]; list_complete: boolean; cursor?: string }>;
}