/**
 * ============================================================
 * TUI 配置管理模块
 * 管理 TUI 工具的本地配置：阈值、路径、编辑器偏好等
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '..', '.tui-config.json');

const DEFAULT_CONFIG = {
  // 图片阈值：当 public/assets/images 图片数 >= 此值时触发自动转换
  imageThreshold: 12000,

  // 自动转换开关
  autoConvertEnabled: true,

  // 仅转换创建时间超过此天数的"旧图片"
  oldImageDays: 30,

  // Publii 编辑器路径（自动检测，也可手动指定）
  publiiPath: '',

  // 默认文本编辑器（回退用）
  defaultEditor: 'notepad.exe',

  // Git 配置
  git: {
    remote: 'origin',
    branch: 'main',
    autoPush: true,
  },

  // 项目根目录
  projectRoot: path.resolve(__dirname, '..', '..'),

  // ASCII 转换参数
  ascii: {
    maxWidth: 120,      // 最大字符宽度
    charset: 'detailed', // 字符集：detailed | standard | simple
    contrast: 1.0,      // 对比度增强系数
    brightness: 1.0,    // 亮度系数
  },

  // 日志级别
  logLevel: 'info',     // debug | info | warn | error
};

// 字符集定义
export const ASCII_CHARSETS = {
  detailed: '@%#*+=-:. ',
  standard: '@#S%?*+;:, ',
  simple: '@%#*+=-. ',
  blocks: '█▓▒░ ',
};

let config = { ...DEFAULT_CONFIG };

/** 加载配置 */
export function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const saved = JSON.parse(raw);
      config = { ...DEFAULT_CONFIG, ...saved };
    }
  } catch (e) {
    // 配置损坏时使用默认值
    config = { ...DEFAULT_CONFIG };
  }
  return config;
}

/** 保存配置 */
export function saveConfig(newConfig) {
  config = { ...config, ...newConfig };
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

/** 获取当前配置 */
export function getConfig() {
  return config;
}

/** 获取单个配置项 */
export function get(key, defaultValue) {
  const keys = key.split('.');
  let value = config;
  for (const k of keys) {
    if (value === undefined || value === null) return defaultValue;
    value = value[k];
  }
  return value !== undefined ? value : defaultValue;
}

/** 设置单个配置项并保存 */
export function set(key, value) {
  const keys = key.split('.');
  let obj = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  return saveConfig(config);
}

/** 获取项目根目录 */
export function getProjectRoot() {
  return config.projectRoot;
}

/** 获取图片目录 */
export function getImagesDir() {
  return path.join(config.projectRoot, 'public', 'assets', 'images');
}

/** 获取文章目录 */
export function getPostsDir() {
  return path.join(config.projectRoot, 'src', 'content', 'posts');
}

export default { loadConfig, saveConfig, getConfig, get, set, getProjectRoot, getImagesDir, getPostsDir };