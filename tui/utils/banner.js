/**
 * ============================================================
 * ASCII Banner 生成器 - 使用 figlet 生成大标题
 * ============================================================
 */

import figlet from 'figlet';
import chalk from 'chalk';

/** 生成彩色 ASCII Banner */
export function generateBanner(text = '林天策 Blog') {
  return new Promise((resolve, reject) => {
    figlet.text(text, {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    }, (err, data) => {
      if (err) {
        // 回退：简单文本标题
        resolve(chalk.magenta.bold(`\n  ╔══════════════════════════════════╗\n  ║        ${text}        ║\n  ╚══════════════════════════════════╝\n`));
        return;
      }
      resolve(chalk.magenta.bold(data));
    });
  });
}

/** 生成小标题 */
export function generateSubtitle(text) {
  return new Promise((resolve) => {
    figlet.text(text, {
      font: 'Small',
      horizontalLayout: 'default',
    }, (err, data) => {
      if (err) {
        resolve(chalk.cyan.bold(`  ── ${text} ──`));
        return;
      }
      resolve(chalk.cyan(data));
    });
  });
}

/** 同步生成 banner（用于 blessed 渲染） */
export function generateBannerSync(text = '林天策 Blog') {
  try {
    return figlet.textSync(text, {
      font: 'Standard',
      horizontalLayout: 'default',
    });
  } catch {
    return `╔══════════════════════════════════╗\n║        ${text}        ║\n╚══════════════════════════════════╝`;
  }
}

export default { generateBanner, generateSubtitle, generateBannerSync };