/**
 * ============================================================
 * 一键流水线模块
 * 流程：自检 → 本地构建 dist → git add/commit/push
 * 自检不通过 → 直接终止，不构建、不推送
 * 构建失败 → 终止，不执行 git 推送
 * 不调用 Cloudflare 部署 API，依靠 GitHub 触发 Pages 部署
 * ============================================================
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { getConfig, getProjectRoot } from '../utils/config.js';
import { pipelineCheck } from './selfCheck.js';
import logger from '../utils/logger.js';

/**
 * 执行一键流水线
 * @param {string} commitMessage - Git 提交信息
 * @returns {Promise<object>} 流水线执行结果
 */
export async function runPipeline(commitMessage = '') {
  const root = getProjectRoot();
  const result = {
    selfCheck: false,
    build: false,
    gitPush: false,
    message: '',
  };

  logger.header('一键流水线');
  console.log('  流程: 自检 → 构建 → Git 推送');

  // ==========================================
  // 第一步：自检
  // ==========================================
  logger.step('第一步：系统自检');
  const checkResult = pipelineCheck();
  const checkPassed = checkResult.print();

  if (!checkPassed) {
    logger.error('自检未通过，流水线终止', '请根据上述错误提示修复问题后重试');
    result.message = '自检失败，流水线终止';
    return result;
  }
  result.selfCheck = true;
  logger.success('自检通过，开始构建...');

  // ==========================================
  // 第二步：本地构建
  // ==========================================
  logger.step('第二步：本地构建 (npm run build)');

  try {
    logger.info('正在执行构建...');
    execSync('npm run build', {
      encoding: 'utf-8',
      cwd: root,
      stdio: 'inherit',
      timeout: 300000, // 5 分钟超时
    });
    result.build = true;
    logger.success('构建成功！dist 目录已生成');
  } catch (e) {
    logger.error('构建失败', '请检查构建日志，修复错误后重试');
    logger.error(e.message);
    result.message = '构建失败，流水线终止';
    return result;
  }

  // ==========================================
  // 第三步：Git 提交推送
  // ==========================================
  logger.step('第三步：Git 提交与推送');

  try {
    // 检查是否有变更
    const status = execSync('git status --porcelain', {
      encoding: 'utf-8',
      cwd: root,
      stdio: 'pipe',
    }).trim();

    if (!status) {
      logger.info('没有文件变更，跳过 Git 提交');
      result.message = '构建成功，无文件变更';
      return result;
    }

    // 生成默认提交信息
    if (!commitMessage) {
      const now = new Date().toLocaleString('zh-CN');
      commitMessage = `[Rin Blog] 自动部署 - ${now}`;
    }

    // git add
    logger.info('git add -A');
    execSync('git add -A', { encoding: 'utf-8', cwd: root, stdio: 'inherit' });

    // git commit
    logger.info(`git commit -m "${commitMessage}"`);
    execSync(`git commit -m "${commitMessage}"`, {
      encoding: 'utf-8',
      cwd: root,
      stdio: 'inherit',
    });

    // git push
    const config = getConfig();
    const remote = config.git.remote || 'origin';
    const branch = config.git.branch || 'main';

    logger.info(`git push ${remote} ${branch}`);
    execSync(`git push ${remote} ${branch}`, {
      encoding: 'utf-8',
      cwd: root,
      stdio: 'inherit',
      timeout: 120000,
    });

    result.gitPush = true;
    logger.success('Git 推送成功！');
    logger.success('GitHub 将自动触发 Cloudflare Pages 部署');
    logger.info('请稍后访问 Cloudflare Pages 控制台查看部署状态');

    result.message = '流水线完成：自检 ✓ → 构建 ✓ → Git 推送 ✓';
  } catch (e) {
    logger.error('Git 操作失败', '请检查 Git 配置和网络连接');
    logger.error(e.message);
    result.message = 'Git 推送失败，请手动处理';
    return result;
  }

  logger.divider();
  logger.success('🎉 一键流水线执行完毕！');
  return result;
}

/**
 * 仅构建（不推送）
 */
export async function buildOnly() {
  const root = getProjectRoot();
  logger.step('本地构建 (npm run build)');

  try {
    execSync('npm run build', {
      encoding: 'utf-8',
      cwd: root,
      stdio: 'inherit',
      timeout: 300000,
    });
    logger.success('构建成功！');
    return true;
  } catch (e) {
    logger.error('构建失败', e.message);
    return false;
  }
}

/**
 * 仅 Git 推送（不构建）
 */
export async function gitPushOnly(commitMessage = '') {
  const root = getProjectRoot();

  try {
    const status = execSync('git status --porcelain', {
      encoding: 'utf-8', cwd: root, stdio: 'pipe',
    }).trim();

    if (!status) {
      logger.info('没有文件变更');
      return true;
    }

    if (!commitMessage) {
      commitMessage = `[Rin Blog] 更新 - ${new Date().toLocaleString('zh-CN')}`;
    }

    execSync('git add -A', { encoding: 'utf-8', cwd: root, stdio: 'inherit' });
    execSync(`git commit -m "${commitMessage}"`, { encoding: 'utf-8', cwd: root, stdio: 'inherit' });

    const config = getConfig();
    execSync(`git push ${config.git.remote} ${config.git.branch}`, {
      encoding: 'utf-8', cwd: root, stdio: 'inherit', timeout: 120000,
    });

    logger.success('Git 推送成功！');
    return true;
  } catch (e) {
    logger.error('Git 推送失败', e.message);
    return false;
  }
}

export default { runPipeline, buildOnly, gitPushOnly };