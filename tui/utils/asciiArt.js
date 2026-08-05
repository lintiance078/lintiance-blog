/**
 * ============================================================
 * 高精度灰度 ASCII 字符画转换算法
 * 使用 Jimp 读取图像 → 多级灰度映射 → 字符画输出
 * ============================================================
 */

import Jimp from 'jimp';
import fs from 'node:fs';
import path from 'node:path';
import { ASCII_CHARSETS, getConfig } from './config.js';

/**
 * 将图片转换为高精度灰度 ASCII 字符画
 * @param {string} imagePath - 图片路径
 * @param {string} outputPath - 输出文本路径（可选，不传则返回字符串）
 * @param {object} options - 转换选项
 * @returns {Promise<string>} ASCII 字符画文本
 */
export async function imageToAscii(imagePath, outputPath, options = {}) {
  const config = getConfig();
  const maxWidth = options.maxWidth || config.ascii.maxWidth || 120;
  const charsetName = options.charset || config.ascii.charset || 'detailed';
  const charset = ASCII_CHARSETS[charsetName] || ASCII_CHARSETS.detailed;
  const contrast = options.contrast || config.ascii.contrast || 1.0;
  const brightness = options.brightness || config.ascii.brightness || 1.0;

  // 读取图像
  const image = await Jimp.read(imagePath);
  const origWidth = image.getWidth();
  const origHeight = image.getHeight();

  // 计算缩放比例（字符宽度:高度 ≈ 1:2，所以高度减半补偿）
  const scaleWidth = Math.min(maxWidth, origWidth);
  const charAspectRatio = 0.5; // 终端字符宽高比补偿
  const scaleHeight = Math.floor((origHeight / origWidth) * scaleWidth * charAspectRatio);

  // 缩放图像
  image.resize(scaleWidth, scaleHeight);
  image.greyscale();

  // 增强对比度
  if (contrast !== 1.0) {
    image.contrast(contrast);
  }

  // 增强亮度
  if (brightness !== 1.0) {
    image.brightness(brightness);
  }

  // 逐像素映射为字符
  const charsetLen = charset.length;
  let ascii = '';

  for (let y = 0; y < scaleHeight; y++) {
    for (let x = 0; x < scaleWidth; x++) {
      const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
      // 计算灰度值（加权平均）
      const gray = 0.299 * pixel.r + 0.587 * pixel.g + 0.114 * pixel.b;
      // 映射到字符集索引
      const charIndex = Math.floor((gray / 255) * (charsetLen - 1));
      ascii += charset[charIndex];
    }
    ascii += '\n';
  }

  // 压缩：合并连续空行
  const compressed = ascii
    .split('\n')
    .reduce((acc, line, i, arr) => {
      if (i > 0 && line.trim() === '' && arr[i - 1].trim() === '') {
        return acc;
      }
      acc.push(line);
      return acc;
    }, [])
    .join('\n');

  // 保存到文件
  if (outputPath) {
    fs.writeFileSync(outputPath, compressed, 'utf-8');
  }

  return compressed;
}

/**
 * 将 ASCII 文本嵌入 Markdown 格式
 * @param {string} asciiText - ASCII 字符画文本
 * @param {string} caption - 图片说明
 * @returns {string} Markdown 格式文本
 */
export function wrapAsciiForMarkdown(asciiText, caption = '') {
  const captionLine = caption ? `\n*${caption}*\n` : '';
  return `\n<pre class="ascii-art">\n${asciiText}\n</pre>\n${captionLine}`;
}

/**
 * 获取图片文件的灰度直方图信息（用于调试）
 */
export async function getImageInfo(imagePath) {
  const image = await Jimp.read(imagePath);
  return {
    width: image.getWidth(),
    height: image.getHeight(),
    mime: image.getMIME(),
    size: fs.statSync(imagePath).size,
  };
}

export default { imageToAscii, wrapAsciiForMarkdown, getImageInfo };