/**
 * ============================================================
 * API 工具函数 - 前端调用 Pages Functions 只读接口
 * ============================================================
 * 所有接口均为 GET 只读，通过 Functions 代理访问 D1/KV
 * 浏览器 JS 绝不直接访问 D1 或 KV
 */

export interface PostMeta {
  id: number;
  slug: string;
  title: string;
  summary: string;
  tags: string;
  cover_image: string;
  is_ascii: number;
  published: number;
  created_at: string;
  updated_at: string;
  word_count: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PostsResponse {
  success: boolean;
  data: PostMeta[];
  pagination: Pagination;
  error?: string;
}

export interface PostDetailResponse {
  success: boolean;
  data: PostMeta | null;
  error?: string;
}

export interface TagItem {
  id: number;
  name: string;
  count: number;
}

export interface TagsResponse {
  success: boolean;
  data: TagItem[];
  error?: string;
}

export interface SiteConfigResponse {
  success: boolean;
  data: {
    site: Record<string, unknown> | null;
    theme: Record<string, unknown> | null;
    layout: Record<string, unknown> | null;
    features: Record<string, unknown> | null;
    footer: Record<string, unknown> | null;
  };
  error?: string;
}

export interface FriendLink {
  name: string;
  url: string;
  description: string;
  avatar: string;
}

export interface FriendsResponse {
  success: boolean;
  data: FriendLink[];
  error?: string;
}

const API_BASE = '/api';

async function fetchAPI<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/** 获取文章列表（分页 + 标签筛选） */
export async function getPosts(page = 1, limit = 10, tag?: string): Promise<PostsResponse> {
  return fetchAPI<PostsResponse>('/posts', {
    page: String(page),
    limit: String(limit),
    ...(tag ? { tag } : {}),
  });
}

/** 获取单篇文章元数据 */
export async function getPostBySlug(slug: string): Promise<PostDetailResponse> {
  return fetchAPI<PostDetailResponse>(`/posts/${slug}`);
}

/** 获取标签列表 */
export async function getTags(): Promise<TagsResponse> {
  return fetchAPI<TagsResponse>('/tags');
}

/** 获取站点全局配置 */
export async function getSiteConfig(): Promise<SiteConfigResponse> {
  return fetchAPI<SiteConfigResponse>('/config');
}

/** 获取友链列表 */
export async function getFriends(): Promise<FriendsResponse> {
  return fetchAPI<FriendsResponse>('/friends');
}