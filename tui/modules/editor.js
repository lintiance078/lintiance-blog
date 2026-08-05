/**
 * ============================================================
 * 编辑器调用模块
 * 优先唤起 Publii，检测不到则回退系统默认编辑器
 * 禁止调用 Publii 自带站点导出功能
 * ============================================================
 */

import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../utils/config.js';
import logger from '../utils/logger.js';

/**
 * 打开编辑器编辑指定文件
 * @param {string} filePath - 要编辑的文件路径
 * @returns {Promise<string>} 使用的编辑器名称
 */
export function openEditor(filePath) {
  return new Promise((resolve, reject) => {
    const config = getConfig();
    const publiiPath = config.publiiPath || detectPublii();

    // 确保文件存在
    if (!fs.existsSync(filePath)) {
      reject(new Error(`文件不存在: ${filePath}`));
      return;
    }

    // 优先使用 Publii
    if (publiiPath && fs.existsSync(publiiPath)) {
      logger.info('正在启动 Publii 编辑器...');
      logger.warn('注意：仅使用 Publii 作为 Markdown 编辑器，禁止使用其站点导出功能');

      // Publii 可能不支持直接打开外部文件，尝试用命令行参数
      const proc = exec(`"${publiiPath}" "${filePath}"`, (err) => {
        if (err) {
          logger.warn('Publii 启动失败，回退到默认编辑器');
          fallbackEditor(filePath, resolve, reject);
        } else {
          logger.success('Publii 编辑器已启动');
          resolve('Publii');
        }
      });

      // 如果 Publii 进程快速退出（可能不支持 CLI 参数），回退
      setTimeout(() => {
        if (proc.exitCode !== null && proc.exitCode !== 0) {
          // Publii 可能已启动 GUI，不视为失败
        }
      }, 2000);

    } else {
      fallbackEditor(filePath, resolve, reject);
    }
  });
}

/**
 * 回退到系统默认编辑器
 */
function fallbackEditor(filePath, resolve, reject) {
  const config = getConfig();
  const defaultEditor = config.defaultEditor || 'notepad.exe';

  logger.info(`使用默认编辑器: ${defaultEditor}`);

  // Windows 下使用 start 命令打开文件（会自动关联默认程序）
  const cmd = process.platform === 'win32'
    ? `start "" "${filePath}"`
    : `"${defaultEditor}" "${filePath}"`;

  exec(cmd, (err) => {
    if (err) {
      // 尝试直接用 notepad
      exec(`notepad.exe "${filePath}"`, (err2) => {
        if (err2) {
          logger.error('无法打开编辑器', '请手动打开文件编辑，或修改 TUI 配置中的默认编辑器路径');
          reject(err2);
        } else {
          logger.success('记事本已启动');
          resolve('notepad.exe');
        }
      });
    } else {
      logger.success(`编辑器已启动`);
      resolve(defaultEditor);
    }
  });
}

/**
 * 检测 Publii 安装路径
 */
function detectPublii() {
  const possiblePaths = [
    'C:\\Program Files\\Publii\\Publii.exe',
    'C:\\Program Files (x86)\\Publii\\Publii.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Publii', 'Publii.exe'),
    path.join(process.env.APPDATA || '', 'Publii', 'Publii.exe'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export default { openEditor };