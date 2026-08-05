/**
 * ============================================================
 * 文章管理模块
 * 新建 Markdown 文章模板、列出文章、编辑文章
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { getPostsDir } from '../utils/config.js';
import { openEditor } from './editor.js';
import logger from '../utils/logger.js';

/**
 * 生成 Markdown 文章模板
 * @param {object} meta - 文章元数据
 * @returns {string} 完整的 Markdown 内容
 */
function generateTemplate(meta) {
  const now = meta.date || new Date().toISOString().split('T')[0];
  const tags = meta.tags || [];
  const tagsYaml = tags.length > 0
    ? `[${tags.map(t => `"${t}"`).join(', ')}]`
    : '[]';

  return `---
slug: "${meta.slug || ''}"
title: "${meta.title || '新文章标题'}"
date: "${now}"
tags: ${tagsYaml}
summary: "${meta.summary || ''}"
cover: ""
cover_ascii: ""
word_count: 0
---

# ${meta.title || '新文章标题'}

> 在这里撰写文章正文...

## 第一部分

正文内容从这里开始。

## 总结

文章总结。
`;
}

/**
 * 创建新文章
 * @param {object} meta - { title, slug, tags, summary, date }
 * @param {boolean} openAfterCreate - 创建后是否立即打开编辑
 * @returns {Promise<object>} { filePath, slug }
 */
export async function createPost(meta, openAfterCreate = true) {
  const postsDir = getPostsDir();

  // 确保目录存在
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
    logger.info(`创建文章目录: ${postsDir}`);
  }

  // 生成 slug
  const slug = meta.slug || generateSlug(meta.title || 'untitled');
  const fileName = `${slug}.md`;
  const filePath = path.join(postsDir, fileName);

  // 检查文件是否已存在
  if (fs.existsSync(filePath)) {
    logger.warn(`文章已存在: ${fileName}`);
    if (openAfterCreate) {
      await openEditor(filePath);
    }
    return { filePath, slug, existed: true };
  }

  // 生成并写入模板
  const content = generateTemplate({ ...meta, slug });
  fs.writeFileSync(filePath, content, 'utf-8');
  logger.success(`文章已创建: ${fileName}`);

  // 打开编辑器
  if (openAfterCreate) {
    try {
      logger.info('正在打开编辑器...');
      await openEditor(filePath);
    } catch (e) {
      logger.warn(`编辑器启动失败: ${e.message}`);
    }
  }

  return { filePath, slug, existed: false };
}

/**
 * 列出所有文章
 * @returns {Array<object>} 文章列表
 */
export function listPosts() {
  const postsDir = getPostsDir();

  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const files = fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const filePath = path.join(postsDir, f);
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');

      // 简单解析 frontmatter
      const meta = parseFrontmatter(content);

      return {
        fileName: f,
        filePath,
        slug: meta.slug || f.replace('.md', ''),
        title: meta.title || 'Untitled',
        date: meta.date || stat.mtime.toISOString(),
        tags: meta.tags || [],
        summary: meta.summary || '',
        size: stat.size,
        modified: stat.mtime,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return files;
}

/**
 * 编辑已有文章
 * @param {string} slugOrFile - slug 或文件名
 */
export async function editPost(slugOrFile) {
  const postsDir = getPostsDir();
  let filePath;

  // 尝试按 slug 查找
  const fileName = slugOrFile.endsWith('.md') ? slugOrFile : `${slugOrFile}.md`;
  filePath = path.join(postsDir, fileName);

  if (!fs.existsSync(filePath)) {
    // 尝试模糊匹配
    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
    const match = files.find(f => f.includes(slugOrFile));
    if (match) {
      filePath = path.join(postsDir, match);
    } else {
      throw new Error(`未找到文章: ${slugOrFile}`);
    }
  }

  logger.info(`正在编辑: ${path.basename(filePath)}`);
  await openEditor(filePath);
  return filePath;
}

/**
 * 删除文章
 * @param {string} slugOrFile
 * @param {boolean} confirm - 是否需要确认
 */
export function deletePost(slugOrFile, confirm = true) {
  const postsDir = getPostsDir();
  const fileName = slugOrFile.endsWith('.md') ? slugOrFile : `${slugOrFile}.md`;
  const filePath = path.join(postsDir, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`未找到文章: ${slugOrFile}`);
  }

  if (confirm) {
    logger.warn(`即将删除: ${fileName}`);
    logger.warn('此操作不可撤销！');
  }

  fs.unlinkSync(filePath);
  logger.success(`文章已删除: ${fileName}`);
  return filePath;
}

/**
 * 生成 URL 友好的 slug
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-|\-$/g, '')
    || 'untitled';
}

/**
 * 简单解析 YAML frontmatter
 */
function parseFrontmatter(content) {
  const meta = {};
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    const yaml = match[1];
    const lines = yaml.split('\n');
    for (const line of lines) {
      const kvMatch = line.match(/^(\w+):\s*(.+)$/);
      if (kvMatch) {
        let value = kvMatch[2].trim();
        // 去除引号
        value = value.replace(/^["']|["']$/g, '');
        // 尝试解析 JSON 数组
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch {}
        }
        meta[kvMatch[1]] = value;
      }
    }
  }
  return meta;
}

export default { createPost, listPosts, editPost, deletePost, generateTemplate };