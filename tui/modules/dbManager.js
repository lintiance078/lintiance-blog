/**
 * ============================================================
 * D1/KV 数据管理模块
 * 通过调用 wrangler 命令完成云端数据写入
 * 网页端没有写入能力，所有 D1/KV 写入必须在本地执行
 * ============================================================
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getProjectRoot } from '../utils/config.js';
import logger from '../utils/logger.js';

/**
 * 同步文章元数据到 D1
 * 从本地 Markdown frontmatter 读取，写入 D1 数据库
 * @param {Array} posts - 文章列表 [{ slug, title, summary, tags, cover_image, is_ascii, published, word_count }]
 */
export function syncPostsToD1(posts) {
  const root = getProjectRoot();

  logger.step('同步文章元数据到 D1...');

  // 构建 SQL 语句
  const statements = posts.map(post => {
    const tags = JSON.stringify(post.tags || []);
    return `
      INSERT OR REPLACE INTO posts (slug, title, summary, tags, cover_image, is_ascii, published, created_at, updated_at, word_count)
      VALUES (
        '${escapeSql(post.slug)}',
        '${escapeSql(post.title)}',
        '${escapeSql(post.summary || '')}',
        '${escapeSql(tags)}',
        '${escapeSql(post.cover_image || '')}',
        ${post.is_ascii ? 1 : 0},
        ${post.published ? 1 : 0},
        '${escapeSql(post.created_at || new Date().toISOString())}',
        datetime('now'),
        ${post.word_count || 0}
      );
    `;
  });

  // 写入临时 SQL 文件
  const sqlContent = statements.join('\n');
  const tempFile = path.join(root, '.temp_d1_sync.sql');
  fs.writeFileSync(tempFile, sqlContent, 'utf-8');

  try {
    logger.info('正在执行 D1 写入...');
    execSync(`npx wrangler d1 execute BLOG_DB --file="${tempFile}"`, {
      encoding: 'utf-8',
      cwd: root,
      stdio: 'inherit',
      timeout: 60000,
    });
    logger.success(`D1 同步成功: ${posts.length} 篇文章`);
  } catch (e) {
    logger.error('D1 写入失败', `请检查 wrangler 配置和网络连接\n${e.message}`);
  } finally {
    // 清理临时文件
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

/**
 * 同步标签到 D1
 * @param {Array} tags - [{ name, count }]
 */
export function syncTagsToD1(tags) {
  const root = getProjectRoot();

  logger.step('同步标签到 D1...');

  const statements = tags.map(tag => `
    INSERT OR REPLACE INTO tags (name, count) VALUES ('${escapeSql(tag.name)}', ${tag.count});
  `);

  const tempFile = path.join(root, '.temp_tags_sync.sql');
  fs.writeFileSync(tempFile, statements.join('\n'), 'utf-8');

  try {
    execSync(`npx wrangler d1 execute BLOG_DB --file="${tempFile}"`, {
      encoding: 'utf-8',
      cwd: root,
      stdio: 'inherit',
      timeout: 60000,
    });
    logger.success(`D1 标签同步成功: ${tags.length} 个标签`);
  } catch (e) {
    logger.error('D1 标签同步失败', e.message);
  } finally {
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

/**
 * 写入 KV 站点配置
 * @param {string} key - KV key (site_config, theme_config, layout_config, features_config, footer_config)
 * @param {object} value - 配置对象
 */
export function writeKVConfig(key, value) {
  const root = getProjectRoot();

  logger.step(`写入 KV 配置: ${key}`);

  const valueJson = JSON.stringify(value);
  const tempFile = path.join(root, '.temp_kv_value.json');
  fs.writeFileSync(tempFile, valueJson, 'utf-8');

  try {
    // 使用 wrangler kv:key put
    const escapedValue = valueJson.replace(/"/g, '\\"');
    execSync(`npx wrangler kv:key put --binding=BLOG_KV "${key}" "${escapedValue}"`, {
      encoding: 'utf-8',
      cwd: root,
      stdio: 'inherit',
      timeout: 30000,
    });
    logger.success(`KV 配置已更新: ${key}`);
  } catch (e) {
    // 尝试使用 bulk put 方式
    try {
      const bulkData = JSON.stringify([{ key, value: valueJson }]);
      fs.writeFileSync(tempFile, bulkData, 'utf-8');
      execSync(`npx wrangler kv:bulk put --binding=BLOG_KV "${tempFile}"`, {
        encoding: 'utf-8',
        cwd: root,
        stdio: 'inherit',
        timeout: 30000,
      });
      logger.success(`KV 配置已更新: ${key}`);
    } catch (e2) {
      logger.error('KV 写入失败', `请检查 wrangler 配置\n${e2.message}`);
    }
  } finally {
    try { fs.unlinkSync(tempFile); } catch {}
  }
}

/**
 * 写入友链列表到 KV
 * @param {Array} friends - [{ name, url, description, avatar }]
 */
export function writeFriendsList(friends) {
  writeKVConfig('friends_list', friends);
  logger.success(`友链列表已更新: ${friends.length} 个友链`);
}

/**
 * 添加单个友链
 * @param {object} friend - { name, url, description, avatar }
 */
export function addFriend(friend, existingFriends = []) {
  const friends = [...existingFriends, friend];
  writeFriendsList(friends);
  return friends;
}

/**
 * 删除友链
 * @param {string} name - 友链名称
 */
export function removeFriend(name, existingFriends = []) {
  const friends = existingFriends.filter(f => f.name !== name);
  writeFriendsList(friends);
  return friends;
}

/**
 * 从 D1 查询数据（只读）
 * @param {string} query - SQL 查询
 * @returns {Array} 查询结果
 */
export function queryD1(query) {
  const root = getProjectRoot();

  try {
    const output = execSync(
      `npx wrangler d1 execute BLOG_DB --command="${query.replace(/"/g, '\\"')}" --json`,
      { encoding: 'utf-8', cwd: root, stdio: 'pipe', timeout: 30000 }
    );
    const result = JSON.parse(output);
    return result[0]?.results || [];
  } catch (e) {
    logger.error('D1 查询失败', e.message);
    return [];
  }
}

/**
 * 从 KV 读取数据（只读）
 * @param {string} key - KV key
 * @returns {any} 值
 */
export function readKV(key) {
  const root = getProjectRoot();

  try {
    const output = execSync(
      `npx wrangler kv:key get --binding=BLOG_KV "${key}"`,
      { encoding: 'utf-8', cwd: root, stdio: 'pipe', timeout: 15000 }
    ).trim();

    try {
      return JSON.parse(output);
    } catch {
      return output;
    }
  } catch (e) {
    logger.error('KV 读取失败', e.message);
    return null;
  }
}

/**
 * SQL 字符串转义
 */
function escapeSql(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

export default {
  syncPostsToD1,
  syncTagsToD1,
  writeKVConfig,
  writeFriendsList,
  addFriend,
  removeFriend,
  queryD1,
  readKV,
};