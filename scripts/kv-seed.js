/**
 * ============================================================
 * KV 默认配置初始化脚本
 * ============================================================
 * 用途：将本地 kv-defaults.json 写入 Cloudflare KV 命名空间
 * 运行方式：npx wrangler kv:bulk put --binding=BLOG_KV --local kv-seed.json
 * 生产环境：npx wrangler kv:bulk put --binding=BLOG_KV kv-seed.json
 * ============================================================
 *
 * 注意：此脚本仅用于首次初始化 KV 配置
 * 后续修改配置请通过 TUI 工具调用 wrangler 命令
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kvDefaults = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'config', 'kv-defaults.json'), 'utf-8')
);

// 转换为 wrangler kv:bulk put 格式
const bulkData = [
  {
    key: 'site_config',
    value: JSON.stringify(kvDefaults.site),
    metadata: { type: 'config' },
  },
  {
    key: 'theme_config',
    value: JSON.stringify(kvDefaults.theme),
    metadata: { type: 'config' },
  },
  {
    key: 'layout_config',
    value: JSON.stringify(kvDefaults.layout),
    metadata: { type: 'config' },
  },
  {
    key: 'features_config',
    value: JSON.stringify(kvDefaults.features),
    metadata: { type: 'config' },
  },
  {
    key: 'footer_config',
    value: JSON.stringify(kvDefaults.footer),
    metadata: { type: 'config' },
  },
  {
    key: 'friends_list',
    value: JSON.stringify(kvDefaults.friends),
    metadata: { type: 'friends' },
  },
];

fs.writeFileSync(
  path.join(__dirname, '..', 'kv-seed.json'),
  JSON.stringify(bulkData, null, 2),
  'utf-8'
);

console.log('✅ kv-seed.json 已生成');
console.log('接下来运行以下命令写入 KV:');
console.log('  本地测试: npx wrangler kv:bulk put --binding=BLOG_KV --local kv-seed.json');
console.log('  生产环境: npx wrangler kv:bulk put --binding=BLOG_KV kv-seed.json');