/**
 * ============================================================
 * 通用工具函数
 * ============================================================
 */

/** 格式化日期 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 格式化相对时间 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} 个月前`;
  return `${Math.floor(diffDays / 365)} 年前`;
}

/** 解析 JSON 标签数组 */
export function parseTags(tagsStr: string): string[] {
  try {
    return JSON.parse(tagsStr);
  } catch {
    return [];
  }
}

/** 估算阅读时间（分钟） */
export function estimateReadingTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 300));
  return `${minutes} 分钟`;
}

/** localStorage 封装 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(`rin_${key}`);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`rin_${key}`, JSON.stringify(value));
    } catch {
      // localStorage 不可用或已满，静默失败
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`rin_${key}`);
    } catch {
      // 静默失败
    }
  },
};

/** 主题管理 */
export type Theme = 'light' | 'dark' | 'auto';

export function getEffectiveTheme(): Theme {
  return storage.get<Theme>('theme', 'auto');
}

export function setTheme(theme: Theme): void {
  storage.set('theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

/** 本地收藏管理 */
export function getLocalLikes(): string[] {
  return storage.get<string[]>('likes', []);
}

export function toggleLocalLike(slug: string): boolean {
  const likes = getLocalLikes();
  const index = likes.indexOf(slug);
  if (index > -1) {
    likes.splice(index, 1);
    storage.set('likes', likes);
    return false;
  } else {
    likes.push(slug);
    storage.set('likes', likes);
    return true;
  }
}

export function isLocalLiked(slug: string): boolean {
  return getLocalLikes().includes(slug);
}

/** 侧边设置面板开关 */
export function toggleSettings(): void {
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  panel?.classList.toggle('active');
  overlay?.classList.toggle('active');
  document.body.style.overflow = panel?.classList.contains('active') ? 'hidden' : '';
}

export function closeSettings(): void {
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  panel?.classList.remove('active');
  overlay?.classList.remove('active');
  document.body.style.overflow = '';
}

/** 健康检测面板开关 */
export function toggleHealthCheck(): void {
  const popup = document.getElementById('health-check-popup');
  popup?.classList.toggle('active');
}

/** 点击外部关闭 */
export function initClickOutside(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    // 关闭设置面板
    const overlay = document.getElementById('settings-overlay');
    if (target === overlay) {
      closeSettings();
    }
    // 关闭健康检测
    const healthPopup = document.getElementById('health-check-popup');
    const healthToggle = document.getElementById('health-check-toggle');
    if (healthPopup?.classList.contains('active') &&
        !healthPopup.contains(target) &&
        target !== healthToggle &&
        !healthToggle?.contains(target)) {
      healthPopup.classList.remove('active');
    }
  });
}

/** 键盘快捷键 */
export function initKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    // Escape 关闭面板
    if (e.key === 'Escape') {
      closeSettings();
      const healthPopup = document.getElementById('health-check-popup');
      healthPopup?.classList.remove('active');
    }
    // Ctrl/Cmd + K 打开搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      searchInput?.focus();
    }
  });
}