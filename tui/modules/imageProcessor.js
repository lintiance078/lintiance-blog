/**
 * ============================================================
 * 图片处理模块
 * - 本地有损压缩
 * - 单张图片手动转 ASCII
 * - 自动监测图片数量，阈值批量转换
 * - 转换前强制风险确认，确认后才删除原图
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { getConfig, getImagesDir, getProjectRoot } from '../utils/config.js';
import { imageToAscii, wrapAsciiForMarkdown } from '../utils/asciiArt.js';
import logger from '../utils/logger.js';

/**
 * 图片压缩（使用 Jimp 有损压缩）
 * @param {string} imagePath - 图片路径
 * @param {object} options - { quality: 0.8, maxWidth: 1920 }
 * @returns {Promise<object>} { originalSize, compressedSize, ratio }
 */
export async function compressImage(imagePath, options = {}) {
  const Jimp = (await import('jimp')).default;
  const quality = options.quality || 0.8;
  const maxWidth = options.maxWidth || 1920;

  const originalSize = fs.statSync(imagePath).size;
  const image = await Jimp.read(imagePath);

  // 缩放
  if (image.getWidth() > maxWidth) {
    image.resize(maxWidth, Jimp.AUTO);
  }

  // 压缩质量
  image.quality(Math.floor(quality * 100));

  // 覆盖原文件
  await image.writeAsync(imagePath);

  const compressedSize = fs.statSync(imagePath).size;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

  logger.success(`图片压缩完成: ${path.basename(imagePath)}`);
  logger.info(`${formatSize(originalSize)} → ${formatSize(compressedSize)} (节省 ${ratio}%)`);

  return { originalSize, compressedSize, ratio: parseFloat(ratio) };
}

/**
 * 单张图片手动转 ASCII
 * @param {string} imagePath - 图片路径
 * @param {boolean} deleteOriginal - 是否删除原图
 * @returns {Promise<string>} ASCII 文本
 */
export async function convertSingleToAscii(imagePath, deleteOriginal = false) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`图片不存在: ${imagePath}`);
  }

  logger.step('开始转换图片为 ASCII 字符画...');
  logger.info(`源文件: ${path.basename(imagePath)}`);

  const config = getConfig();
  const asciiDir = path.join(getImagesDir(), '..', 'ascii');
  if (!fs.existsSync(asciiDir)) {
    fs.mkdirSync(asciiDir, { recursive: true });
  }

  const baseName = path.basename(imagePath, path.extname(imagePath));
  const asciiPath = path.join(asciiDir, `${baseName}.txt`);

  const asciiText = await imageToAscii(imagePath, asciiPath, config.ascii);

  logger.success(`ASCII 字符画已生成: ${baseName}.txt`);
  logger.info(`字符数: ${asciiText.length.toLocaleString()}`);

  // 删除原图
  if (deleteOriginal) {
    fs.unlinkSync(imagePath);
    logger.success(`原图已删除: ${path.basename(imagePath)}`);
  }

  // 返回可嵌入 Markdown 的格式
  return wrapAsciiForMarkdown(asciiText, path.basename(imagePath));
}

/**
 * 自动批量转换旧图片为 ASCII
 * 条件：图片数量 >= 阈值 且 图片创建时间超过 oldImageDays
 * 转换前强制风险确认
 * @param {boolean} confirmed - 用户已确认风险
 * @returns {Promise<object>} { converted, failed, freedSpace }
 */
export async function batchConvertOldImages(confirmed = false) {
  const config = getConfig();
  const imagesDir = getImagesDir();

  if (!fs.existsSync(imagesDir)) {
    logger.info('图片目录不存在，无需转换');
    return { converted: 0, failed: 0, freedSpace: 0 };
  }

  // 收集所有图片
  const allImages = collectImages(imagesDir);
  const imageCount = allImages.length;

  logger.header('批量 ASCII 转换分析');
  logger.info(`当前图片总数: ${imageCount}`);
  logger.info(`配置阈值: ${config.imageThreshold}`);
  logger.info(`自动转换: ${config.autoConvertEnabled ? '已启用' : '已禁用'}`);
  logger.info(`旧图片阈值: ${config.oldImageDays} 天`);

  if (imageCount < config.imageThreshold) {
    logger.success(`图片数量未达到阈值，无需转换 (${imageCount}/${config.imageThreshold})`);
    return { converted: 0, failed: 0, freedSpace: 0 };
  }

  if (!config.autoConvertEnabled) {
    logger.warn('自动转换已禁用，跳过');
    return { converted: 0, failed: 0, freedSpace: 0 };
  }

  // 筛选旧图片
  const now = Date.now();
  const oldThreshold = config.oldImageDays * 24 * 60 * 60 * 1000;
  const oldImages = allImages.filter(img => (now - img.mtimeMs) > oldThreshold);
  const newImages = allImages.filter(img => (now - img.mtimeMs) <= oldThreshold);

  logger.info(`旧图片（>${config.oldImageDays}天）: ${oldImages.length} 张`);
  logger.info(`新图片（≤${config.oldImageDays}天）: ${newImages.length} 张（保留）`);

  if (oldImages.length === 0) {
    logger.success('没有符合条件的历史图片');
    return { converted: 0, failed: 0, freedSpace: 0 };
  }

  // 风险提示
  logger.warn('═══════════════════════════════════════');
  logger.warn('⚠️  风险提示：批量转换将删除原图片文件');
  logger.warn(`   将转换 ${oldImages.length} 张旧图片为 ASCII 字符画`);
  logger.warn('   ASCII 字符画为灰度字符，画质相比原图下降');
  logger.warn('   建议提前备份原图！');
  logger.warn('═══════════════════════════════════════');

  if (!confirmed) {
    logger.error('需要用户确认后才能执行', '请在 TUI 菜单中确认风险后重试');
    return { converted: 0, failed: 0, freedSpace: 0, needConfirm: true };
  }

  // 执行转换
  logger.step('开始批量转换...');
  const asciiDir = path.join(getImagesDir(), '..', 'ascii');
  if (!fs.existsSync(asciiDir)) {
    fs.mkdirSync(asciiDir, { recursive: true });
  }

  let converted = 0;
  let failed = 0;
  let freedSpace = 0;

  for (const img of oldImages) {
    try {
      const baseName = path.basename(img.path, path.extname(img.path));
      const asciiPath = path.join(asciiDir, `${baseName}.txt`);

      await imageToAscii(img.path, asciiPath, config.ascii);

      // 删除原图
      const originalSize = fs.statSync(img.path).size;
      fs.unlinkSync(img.path);
      freedSpace += originalSize;
      converted++;

      logger.success(`[${converted}/${oldImages.length}] ${baseName}`);
    } catch (e) {
      failed++;
      logger.error(`转换失败: ${path.basename(img.path)}`, e.message);
    }
  }

  logger.divider();
  logger.success(`批量转换完成: 成功 ${converted}, 失败 ${failed}`);
  logger.success(`释放空间: ${formatSize(freedSpace)}`);

  return { converted, failed, freedSpace };
}

/**
 * 获取图片统计信息
 */
export function getImageStats() {
  const imagesDir = getImagesDir();
  if (!fs.existsSync(imagesDir)) {
    return { total: 0, totalSize: 0, threshold: getConfig().imageThreshold };
  }

  const allImages = collectImages(imagesDir);
  const totalSize = allImages.reduce((sum, img) => sum + img.size, 0);

  return {
    total: allImages.length,
    totalSize,
    threshold: getConfig().imageThreshold,
    reachedThreshold: allImages.length >= getConfig().imageThreshold,
  };
}

/**
 * 递归收集图片文件
 */
function collectImages(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectImages(fullPath));
    } else if (/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(entry.name)) {
      const stat = fs.statSync(fullPath);
      results.push({
        path: fullPath,
        name: entry.name,
        size: stat.size,
        mtime: stat.mtime,
        mtimeMs: stat.mtimeMs,
      });
    }
  }
  return results;
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default { compressImage, convertSingleToAscii, batchConvertOldImages, getImageStats };