/**
 * ============================================================
 * 日志系统 - 分级日志输出
 * 成功(绿) / 警告(黄) / 错误(红) / 信息(蓝) / 调试(灰)
 * ============================================================
 */

import chalk from 'chalk';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
let currentLevel = 'info';

export function setLogLevel(level) {
  if (LOG_LEVELS[level] !== undefined) {
    currentLevel = level;
  }
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export function debug(msg) {
  if (shouldLog('debug')) {
    console.log(chalk.gray(`  [DEBUG] ${msg}`));
  }
}

export function info(msg) {
  if (shouldLog('info')) {
    console.log(chalk.blue(`  [INFO] ${msg}`));
  }
}

export function success(msg) {
  console.log(chalk.green(`  [✓] ${msg}`));
}

export function warn(msg) {
  if (shouldLog('warn')) {
    console.log(chalk.yellow(`  [⚠] ${msg}`));
  }
}

export function error(msg, solution) {
  console.log(chalk.red(`  [✗] ${msg}`));
  if (solution) {
    console.log(chalk.yellow(`  [→] 解决方案: ${solution}`));
  }
}

export function step(msg) {
  console.log(chalk.cyan(`\n  ▶ ${msg}`));
}

export function divider() {
  console.log(chalk.gray('  ─'.repeat(40)));
}

export function header(title) {
  console.log(chalk.magenta.bold(`\n  ╔${'═'.repeat(48)}╗`));
  console.log(chalk.magenta.bold(`  ║  ${title.padEnd(44)}║`));
  console.log(chalk.magenta.bold(`  ╚${'═'.repeat(48)}╝`));
}

export default { setLogLevel, debug, info, success, warn, error, step, divider, header };