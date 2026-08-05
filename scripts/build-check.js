/**
 * ============================================================
 * 构建前自检脚本
 * ============================================================
 * 检查项：
 * 1. 目录结构完整性
 * 2. Pagefind 是否可用
 * 3. wrangler.toml 配置是否存在
 * 4. dist 文件数量预估（防止超过 20000 上限）
 * 5. 单文件大小检查（防止超过 25MB 上限）
 *
 * 任何检查不通过 → 终止构建，输出明确错误提示
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'assets', 'images');

// Cloudflare Pages 硬性限制
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_COUNT = 20000;

let errors = [];
let warnings = [];

function logSuccess(msg) {
  console.log(`\x1b[32m[✓]\x1b[0m ${msg}`);
}

function logWarning(msg) {
  console.log(`\x1b[33m[⚠]\x1b[0m ${msg}`);
  warnings.push(msg);
}

function logError(msg) {
  console.log(`\x1b[31m[✗]\x1b[0m ${msg}`);
  errors.push(msg);
}

// 1. 检查必要目录
function checkDirectories() {
  console.log('\n--- 目录结构检查 ---');
  const requiredDirs = [
    'src/pages',
    'src/layouts',
    'src/components',
    'src/styles',
    'src/content/posts',
    'public/assets/images',
    'functions/api',
    'sql',
  ];

  for (const dir of requiredDirs) {
    const fullPath = path.join(ROOT, dir);
    if (fs.existsSync(fullPath)) {
      logSuccess(`目录存在: ${dir}`);
    } else {
      logError(`目录缺失: ${dir}`);
    }
  }
}

// 2. 检查 Pagefind 是否可用
function checkPagefind() {
  console.log('\n--- Pagefind 环境检查 ---');
  try {
    execSync('npx pagefind --version', { cwd: ROOT, stdio: 'pipe' });
    logSuccess('Pagefind 可用');
  } catch {
    try {
      // 尝试本地安装的版本
      const localBin = path.join(ROOT, 'node_modules', '.bin', 'pagefind');
      execSync(`"${localBin}" --version`, { cwd: ROOT, stdio: 'pipe' });
      logSuccess('Pagefind (本地) 可用');
    } catch {
      logWarning('Pagefind 未安装，搜索功能将不可用。运行 npm install 安装依赖');
    }
  }
}

// 3. 检查 wrangler.toml
function checkWranglerConfig() {
  console.log('\n--- wrangler 配置检查 ---');
  const wranglerPath = path.join(ROOT, 'wrangler.toml');
  if (fs.existsSync(wranglerPath)) {
    const content = fs.readFileSync(wranglerPath, 'utf-8');
    if (content.includes('YOUR_D1_DATABASE_ID') || content.includes('YOUR_KV_NAMESPACE_ID')) {
      logWarning('wrangler.toml 中存在占位符，部署前请替换为实际的 D1/KV ID');
    } else {
      logSuccess('wrangler.toml 配置完整');
    }
  } else {
    logError('wrangler.toml 文件缺失');
  }
}

// 4. 检查图片数量与大小
function checkImageAssets() {
  console.log('\n--- 图片资源检查 ---');
  if (!fs.existsSync(IMAGES_DIR)) {
    logSuccess('图片目录不存在（无图片资源）');
    return;
  }

  let totalImages = 0;
  let largeFiles = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(entry.name)) {
        totalImages++;
        const stat = fs.statSync(fullPath);
        const sizeMB = stat.size / (1024 * 1024);
        if (sizeMB > MAX_FILE_SIZE_MB) {
          largeFiles.push({ name: entry.name, sizeMB: sizeMB.toFixed(2) });
        }
      }
    }
  }
  scanDir(IMAGES_DIR);

  logSuccess(`图片总数: ${totalImages}`);

  if (totalImages > 12000) {
    logWarning(`图片数量 (${totalImages}) 接近 dist 文件数上限 (${MAX_FILE_COUNT})，建议运行 TUI 批量转换旧图片为 ASCII`);
  }

  if (largeFiles.length > 0) {
    for (const f of largeFiles) {
      logError(`图片文件过大: ${f.name} (${f.sizeMB}MB)，超过 Cloudflare Pages 单文件 25MB 限制`);
    }
  }
}

// 5. 检查 dist 文件数预估
function checkDistFileCount() {
  console.log('\n--- dist 文件数量预估 ---');
  let srcFiles = 0;
  function countFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        countFiles(fullPath);
      } else {
        srcFiles++;
      }
    }
  }
  countFiles(ROOT);
  logSuccess(`项目源码文件数: ${srcFiles}`);

  if (srcFiles > MAX_FILE_COUNT * 0.7) {
    logWarning(`项目文件数较多，建议关注 dist 构建产物大小`);
  }
}

// 执行所有检查
console.log('\n========================================');
console.log('  林天策 Blog - 构建前自检');
console.log('========================================');

checkDirectories();
checkPagefind();
checkWranglerConfig();
checkImageAssets();
checkDistFileCount();

// 汇总结果
console.log('\n========================================');
console.log('  自检结果汇总');
console.log('========================================');
console.log(`错误: ${errors.length}  警告: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n\x1b[31m--- 以下错误必须修复后才能继续构建 ---\x1b[0m');
  for (const err of errors) {
    console.log(`  \x1b[31m•\x1b[0m ${err}`);
  }
  console.log('\n');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\n\x1b[33m--- 警告（不影响构建，但建议关注）---\x1b[0m');
  for (const warn of warnings) {
    console.log(`  \x1b[33m•\x1b[0m ${warn}`);
  }
}

console.log('\n\x1b[32m自检通过，开始构建...\x1b[0m\n');
process.exit(0);