/**
 * ============================================================
 * 林天策 Blog - Windows TUI 终端工具 (v2.0)
 * ============================================================
 * 基于 blessed 实现 ANSI 彩色终端界面
 * 功能：
 *   双入口选择（普通版/黑客版）
 *   站点管理（表单式网站设置 + 风格管理 + 密钥配置）
 *   文章管理（列表/删除/隐藏/迁移 + 完整表单发布）
 *   部署（Git 推送 + Cloudflare Pages 验证）
 *
 * 使用方式：node tui/index.js  或  npm run tui
 * ============================================================
 */

import blessed from 'blessed';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// 工具模块
import { loadConfig, getConfig, set as setConfig, getProjectRoot, getPostsDir, getHackerPostsDir, getEnvPath, setMode, getMode } from './utils/config.js';
import { generateBannerSync } from './utils/banner.js';
import logger from './utils/logger.js';

// 功能模块
import { basicCheck } from './modules/selfCheck.js';
import { createPost, listPosts, editPost, deletePost } from './modules/postManager.js';
import { runPipeline } from './modules/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载配置
loadConfig();

// ============================================================
// 辅助函数
// ============================================================

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
        value = value.replace(/^["']|["']$/g, '');
        if (value.startsWith('[') && value.endsWith(']')) {
          try { value = JSON.parse(value); } catch {}
        }
        meta[kvMatch[1]] = value;
      }
    }
  }
  return meta;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-|\-$/g, '')
    || 'untitled';
}

// ============================================================
// 创建 Blessed 屏幕
// ============================================================
const screen = blessed.screen({
  smartCSR: true,
  title: '林天策 Blog TUI - 博客管理工具',
  fullUnicode: true,
  mouse: true,
});

// Banner 区域
const bannerBox = blessed.box({
  top: 0, left: 0, width: '100%', height: 8,
  content: '',
  style: { fg: 'magenta', bold: true },
  tags: true,
});

// 内容/日志区域
const contentBox = blessed.log({
  top: 8, left: '30%+1', width: '70%-1', height: '100%-11',
  label: ' 操作日志 ',
  border: { type: 'line' },
  style: { border: { fg: 'cyan' }, fg: 'white' },
  scrollable: true, alwaysScroll: true, mouse: true,
  scrollbar: { ch: ' ', track: { bg: 'cyan' }, style: { inverse: true } },
});

// 状态栏
const statusBar = blessed.text({
  top: '100%-3', left: '30%+1', width: '70%-1', height: 3,
  label: ' 状态 ',
  border: { type: 'line' },
  style: { border: { fg: 'cyan' }, fg: 'green' },
  content: ' 按 ↑↓ 选择菜单项，Enter 确认，Esc 返回',
});

// 底部信息栏
const bottomBar = blessed.text({
  bottom: 0, left: 0, width: '100%', height: 1,
  content: ' 林天策 Blog TUI | v2.0 | ↑↓ 导航 | Enter 确认 | Esc 返回 | 数字键快捷选择 | Ctrl+C 退出',
  style: { fg: 'black', bg: 'cyan' },
});

// 侧边菜单
let menuList = null;

// 当前菜单引用栈
let menuStack = [];
let currentMode = 'normal';

screen.append(bannerBox);
screen.append(contentBox);
screen.append(statusBar);
screen.append(bottomBar);

// ============================================================
// 日志输出重定向
// ============================================================
const originalConsoleLog = console.log;
console.log = (...args) => {
  const msg = args.join(' ');
  contentBox.add(msg);
  screen.render();
  originalConsoleLog(...args);
};

function setStatus(text, color = 'green') {
  statusBar.setContent(`  ${text}`);
  statusBar.style.fg = color;
  screen.render();
}

function renderBanner() {
  const banner = generateBannerSync('林天策 Blog');
  bannerBox.setContent(banner);
  screen.render();
}

// ============================================================
// 输入框辅助
// ============================================================
let inputBox = null;
let inputCallback = null;

function showInput(prompt, callback, defaultValue = '') {
  hideInput();
  inputBox = blessed.textbox({
    top: 'center', left: 'center', width: '60%', height: 3,
    label: ` ${prompt} `,
    border: { type: 'line' },
    style: { border: { fg: 'magenta' }, fg: 'white', focus: { border: { fg: 'magenta' } } },
    inputOnFocus: true, keys: true, vi: true, mouse: true,
    value: defaultValue,
  });
  inputCallback = callback;
  inputBox.on('submit', (value) => {
    const text = value.trim();
    hideInput();
    if (inputCallback) { inputCallback(text); inputCallback = null; }
  });
  inputBox.key(['escape'], () => {
    hideInput();
    if (inputCallback) { inputCallback(null); inputCallback = null; }
  });
  screen.append(inputBox);
  inputBox.focus();
  screen.render();
}

function hideInput() {
  if (inputBox) { screen.remove(inputBox); inputBox = null; screen.render(); }
}

function showConfirm(message, callback) {
  const confirmBox = blessed.question({
    top: 'center', left: 'center', width: '50%', height: 7,
    label: ' 确认操作 ',
    border: { type: 'line' },
    style: { border: { fg: 'yellow' }, fg: 'white' },
  });
  screen.append(confirmBox);
  confirmBox.ask(message, (err, value) => {
    screen.remove(confirmBox);
    screen.render();
    callback(value);
  });
  screen.render();
}

// ============================================================
// 菜单辅助函数
// ============================================================
function createMenu(items, label, top, left, width, height, borderColor) {
  return blessed.list({
    top: top || 8, left: left || 0, width: width || '30%', height: height || '100%-11',
    label: label || ' 菜单 ',
    keys: true, vi: true, mouse: true,
    border: { type: 'line' },
    style: {
      border: { fg: borderColor || 'cyan' },
      selected: { bg: 'magenta', fg: 'black', bold: true },
      item: { fg: 'white' },
      focus: { border: { fg: 'magenta' } },
    },
    items,
  });
}

function setMenu(list) {
  if (menuList) { screen.remove(menuList); }
  menuList = list;
  screen.append(menuList);
  menuList.focus();
  screen.render();
}

function pushMenu(items, label, borderColor, onSelect, onEsc) {
  const list = createMenu(items, label, undefined, undefined, undefined, undefined, borderColor);
  list.on('select', (_, index) => {
    if (onSelect) onSelect(index, list);
  });
  list.key(['escape'], () => {
    screen.remove(list);
    if (onEsc) onEsc();
    else if (menuList) menuList.focus();
    screen.render();
  });
  // 数字键快捷选择
  list.key(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], (ch) => {
    const num = parseInt(ch);
    if (num === 0 && items.length >= 10) {
      list.select(9);
      list.emit('select', null, 9);
    } else if (num > 0 && num <= items.length) {
      list.select(num - 1);
      list.emit('select', null, num - 1);
    }
  });
  setMenu(list);
  return list;
}

// ============================================================
// 欢迎界面 - 双入口选择
// ============================================================
function showWelcomeScreen() {
  if (menuList) { screen.remove(menuList); }

  contentBox.setContent('');
  contentBox.add('{green-fg}欢迎使用 林天策 Blog TUI 终端管理工具 v2.0{/green-fg}');
  contentBox.add('请选择要管理的站点模式：');
  contentBox.add('');

  const items = [
    '{blue-fg}林天策 Blog【普通版】{/blue-fg}',
    '{#00ff41-fg}林天策 Blog【黑客版】{/#00ff41-fg}',
  ];

  const welcomeMenu = blessed.list({
    top: 'center', left: 'center', width: 40, height: 6,
    label: ' 选择站点模式 ',
    keys: true, vi: true, mouse: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'white' },
      selected: { bg: 'white', fg: 'black', bold: true },
      item: { fg: 'white' },
    },
    items,
  });

  welcomeMenu.on('select', (_, index) => {
    screen.remove(welcomeMenu);
    currentMode = index === 0 ? 'normal' : 'hacker';
    setMode(currentMode);
    const modeLabel = currentMode === 'normal' ? '普通版' : '黑客版';
    contentBox.setContent('');
    contentBox.add(`{green-fg}已选择: 林天策 Blog【${modeLabel}】{/green-fg}`);
    contentBox.add('');
    renderBanner();
    showRootMenu();
  });

  screen.append(welcomeMenu);
  welcomeMenu.focus();
  screen.render();
}

// ============================================================
// 根菜单
// ============================================================
function showRootMenu() {
  const modeLabel = currentMode === 'normal' ? '普通版' : '黑客版';
  const borderColor = currentMode === 'normal' ? 'cyan' : '#00ff41';

  pushMenu(
    [
      `① 站点管理 [${modeLabel}]`,
      '② 文章管理',
      '③ 部署（推送 GitHub → Cloudflare Pages）',
      '④ 退出',
    ],
    ` 主菜单 [${modeLabel}] `,
    borderColor,
    (index) => {
      switch (index) {
        case 0: showSiteManagement(); break;
        case 1: showArticleManagement(); break;
        case 2: handleDeploy(); break;
        case 3:
          screen.destroy();
          process.exit(0);
      }
    }
  );
}

// ============================================================
// 站点管理
// ============================================================
function showSiteManagement() {
  pushMenu(
    [
      '1) 网站设置（名称/描述/标题/favicon）',
      '2) 风格管理（外观样式参数）',
      ...(currentMode === 'hacker' ? ['3) 隐秘模式访问密钥设置'] : []),
      '↩️ 返回主菜单',
    ],
    ' 站点管理 ',
    currentMode === 'normal' ? 'cyan' : '#00ff41',
    (index) => {
      const items = currentMode === 'hacker' ? 4 : 3;
      if (index === 0) handleSiteSettings();
      else if (index === 1) handleStyleManagement();
      else if (currentMode === 'hacker' && index === 2) handleHackerKeySetting();
      else showRootMenu();
    },
    () => showRootMenu()
  );
}

/** 网站设置 */
function handleSiteSettings() {
  contentBox.setContent('');
  logger.header('网站设置');

  showInput('站点名称（当前: 林天策 Blog）', (name) => {
    if (!name) { setStatus('已取消', 'yellow'); showSiteManagement(); return; }
    showInput('站点描述', (desc) => {
      if (desc === null) { setStatus('已取消', 'yellow'); showSiteManagement(); return; }
      showInput('浏览器标题 (title)', (title) => {
        if (title === null) { setStatus('已取消', 'yellow'); showSiteManagement(); return; }
        showInput('favicon 路径（如 /favicon.svg）', (favicon) => {
          if (favicon === null) { setStatus('已取消', 'yellow'); showSiteManagement(); return; }

          // 更新 wrangler.toml
          const root = getProjectRoot();
          const wranglerPath = path.join(root, 'wrangler.toml');
          try {
            let content = fs.readFileSync(wranglerPath, 'utf-8');
            if (name) content = content.replace(/SITE_TITLE\s*=\s*"[^"]*"/, `SITE_TITLE = "${name}"`);
            if (desc) content = content.replace(/SITE_DESCRIPTION\s*=\s*"[^"]*"/, `SITE_DESCRIPTION = "${desc}"`);
            fs.writeFileSync(wranglerPath, content, 'utf-8');

            logger.success('站点设置已更新！');
            logger.info(`站点名称: ${name || '(未修改)'}`);
            logger.info(`站点描述: ${desc || '(未修改)'}`);
            logger.info(`浏览器标题: ${title || '(未修改)'}`);
            logger.info('修改将在下次构建部署后生效');
            setStatus('站点设置已更新 ✓', 'green');
          } catch (e) {
            logger.error('写入配置失败', e.message);
            setStatus('操作失败', 'red');
          }
          showSiteManagement();
        });
      });
    });
  });
}

/** 风格管理 */
async function handleStyleManagement() {
  contentBox.setContent('');
  logger.header('风格管理');
  logger.info('当前支持的可视化风格选项：');
  logger.info('');

  const root = getProjectRoot();
  const globalCssPath = path.join(root, 'src', 'styles', 'global.css');

  const items = [
    '🎨 主题色 (Primary Color)',
    '📐 卡片圆角 (Border Radius)',
    '🔤 正文字号 (Font Size)',
    '🌓 暗色模式背景色',
    '📏 内容最大宽度',
    '↩️ 返回站点管理',
  ];

  pushMenu(items, ' 风格管理 ', 'magenta', (index) => {
    if (index === 5) { showSiteManagement(); return; }

    const settings = [
      { key: 'primary', label: '主题色', current: '--color-primary: #6366f1', pattern: /(--color-primary:\s*)#[0-9a-fA-F]+/ },
      { key: 'radius', label: '卡片圆角', current: '--radius-lg: 16px', pattern: /(--radius-lg:\s*)16px/ },
      { key: 'fontSize', label: '正文字号', current: 'font-size: 16px', pattern: /(html\s*\{\s*\n\s*font-size:\s*)16px/ },
      { key: 'darkBg', label: '暗色背景', current: '--bg-body: #0f172a', pattern: /(--bg-body:\s*)#[0-9a-fA-F]+/ },
      { key: 'maxWidth', label: '最大宽度', current: '--max-width: 1200px', pattern: /(--max-width:\s*)1200px/ },
    ][index];

    showInput(`请输入新${settings.label}（当前: ${settings.current}）`, (val) => {
      if (!val) { setStatus('已取消', 'yellow'); handleStyleManagement(); return; }
      try {
        let css = fs.readFileSync(globalCssPath, 'utf-8');
        css = css.replace(settings.pattern, `$1${val}`);
        fs.writeFileSync(globalCssPath, css, 'utf-8');
        logger.success(`${settings.label}已更新为: ${val}`);
        logger.info('修改将在下次构建部署后生效');
        setStatus(`${settings.label}已更新 ✓`, 'green');
      } catch (e) {
        logger.error('更新失败', e.message);
        setStatus('操作失败', 'red');
      }
      handleStyleManagement();
    });
  }, () => showSiteManagement());
}

/** 黑客密钥设置 */
function handleHackerKeySetting() {
  contentBox.setContent('');
  logger.header('隐秘模式访问密钥设置');

  const envPath = getEnvPath();
  let currentKey = '';
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/HACKER_SECRET_KEY=(.+)/);
    if (match) currentKey = match[1];
  } catch {}

  logger.info(`当前密钥: ${currentKey ? '****' + currentKey.slice(-2) : '(未设置)'}`);
  logger.info('密钥存储在 .env 文件中，不会出现在浏览器源码中');
  logger.info('修改后需要重新构建部署才能生效');

  showInput('请输入新密钥（直接回车取消）', (newKey) => {
    if (!newKey) { setStatus('已取消', 'yellow'); showSiteManagement(); return; }

    showInput('请再次输入新密钥确认', (confirmKey) => {
      if (confirmKey !== newKey) {
        logger.error('两次输入的密钥不一致！');
        setStatus('密钥设置失败', 'red');
        showSiteManagement();
        return;
      }

      try {
        let envContent = fs.readFileSync(envPath, 'utf-8');
        if (envContent.includes('HACKER_SECRET_KEY=')) {
          envContent = envContent.replace(/HACKER_SECRET_KEY=.*/, `HACKER_SECRET_KEY=${newKey}`);
        } else {
          envContent += `\nHACKER_SECRET_KEY=${newKey}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf-8');

        // 同步更新 wrangler.toml
        const root = getProjectRoot();
        const wranglerPath = path.join(root, 'wrangler.toml');
        let wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
        wranglerContent = wranglerContent.replace(/HACKER_SECRET_KEY\s*=\s*"[^"]*"/, `HACKER_SECRET_KEY = "${newKey}"`);
        fs.writeFileSync(wranglerPath, wranglerContent, 'utf-8');

        logger.success('密钥已更新！');
        logger.info('请重新构建部署以使新密钥生效');
        setStatus('密钥已更新 ✓', 'green');
      } catch (e) {
        logger.error('写入密钥失败', e.message);
        setStatus('操作失败', 'red');
      }
      showSiteManagement();
    });
  });
}

// ============================================================
// 文章管理
// ============================================================
function showArticleManagement() {
  pushMenu(
    [
      '1) 管理文章（列表/删除/隐藏/迁移）',
      '2) 发布文章（完整表单编辑）',
      '↩️ 返回主菜单',
    ],
    ' 文章管理 ',
    currentMode === 'normal' ? 'cyan' : '#00ff41',
    (index) => {
      if (index === 0) handleManageArticles();
      else if (index === 1) handlePublishArticle();
      else showRootMenu();
    },
    () => showRootMenu()
  );
}

/** 管理文章：列表/删除/隐藏/迁移 */
function handleManageArticles() {
  contentBox.setContent('');
  logger.header('管理文章');

  // 加载两套文章
  const normalPosts = loadPostsFromDir(getPostsDir(), 'normal');
  const hackerPosts = loadPostsFromDir(getHackerPostsDir(), 'hacker');

  const allPosts = [...normalPosts, ...hackerPosts];

  if (allPosts.length === 0) {
    logger.info('还没有文章，请先发布文章');
    showArticleManagement();
    return;
  }

  // 显示文章列表
  const items = allPosts.map((p, i) => {
    const typeLabel = p.postType === 'hacker' ? '[黑客]' : '[普通]';
    const hidden = p.hidden ? ' [已隐藏]' : '';
    return `${i + 1}. ${typeLabel} ${p.title}${hidden}`;
  });
  items.push('↩️ 返回文章管理');

  const listBox = blessed.list({
    top: 8, left: 0, width: '30%', height: '100%-11',
    label: ' 文章列表 ',
    keys: true, vi: true, mouse: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      selected: { bg: 'magenta', fg: 'black', bold: true },
      item: { fg: 'white' },
    },
    items,
  });

  // 操作子菜单
  const actionItems = [
    '🗑️  删除文章',
    '👁️  隐藏/显示文章',
    '🔄 迁移文章（普通 ↔ 黑客）',
    '📝 编辑文章',
  ];

  const actionMenu = blessed.list({
    top: 8, left: '30%+1', width: '30%', height: '100%-11',
    label: ' 操作 ',
    keys: true, vi: true, mouse: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      selected: { bg: 'yellow', fg: 'black', bold: true },
      item: { fg: 'white' },
      focus: { border: { fg: 'yellow' } },
    },
    items: actionItems,
  });

  setMenu(listBox); // 先用 listBox 替换
  screen.append(actionMenu);

  let selectedPostIndex = 0;

  listBox.on('select', (_, index) => {
    if (index === allPosts.length) {
      screen.remove(listBox);
      screen.remove(actionMenu);
      showArticleManagement();
      return;
    }
    selectedPostIndex = index;
    actionMenu.focus();
    screen.render();
  });

  listBox.key(['escape'], () => {
    screen.remove(listBox);
    screen.remove(actionMenu);
    showArticleManagement();
  });

  actionMenu.key(['escape'], () => {
    listBox.focus();
    screen.render();
  });

  actionMenu.on('select', (_, actionIndex) => {
    const post = allPosts[selectedPostIndex];
    if (!post) return;

    switch (actionIndex) {
      case 0: // 删除
        showConfirm(`确定要删除文章 "${post.title}" 吗？(y/n)`, (confirmed) => {
          if (confirmed) {
            try {
              fs.unlinkSync(post.filePath);
              logger.success(`文章已删除: ${post.title}`);
              setStatus('文章已删除', 'green');
            } catch (e) {
              logger.error('删除失败', e.message);
            }
          }
          screen.remove(listBox);
          screen.remove(actionMenu);
          handleManageArticles();
        });
        break;

      case 1: // 隐藏/显示
        togglePostHidden(post);
        screen.remove(listBox);
        screen.remove(actionMenu);
        handleManageArticles();
        break;

      case 2: // 迁移
        migratePost(post);
        screen.remove(listBox);
        screen.remove(actionMenu);
        handleManageArticles();
        break;

      case 3: // 编辑
        try {
          const editor = process.env.EDITOR || 'notepad.exe';
          execSync(`start "" "${editor}" "${post.filePath}"`, { shell: true });
          logger.info(`正在编辑: ${post.title}`);
          setStatus(`正在编辑: ${post.title}`, 'green');
        } catch (e) {
          logger.error('打开编辑器失败', e.message);
        }
        screen.remove(listBox);
        screen.remove(actionMenu);
        handleManageArticles();
        break;
    }
  });

  screen.render();
}

/** 发布文章 */
function handlePublishArticle() {
  contentBox.setContent('');
  const modeLabel = currentMode === 'hacker' ? '🔒 隐秘黑客模式' : '📝 普通博客模式';
  logger.header(`发布文章 - ${modeLabel}`);
  logger.info(`标签将自动归属到【${currentMode === 'hacker' ? '黑客' : '普通'}】标签库`);
  logger.info(`标签隔离规则：${currentMode === 'hacker' ? '黑客模式只显示黑客标签' : '普通模式只显示普通标签'}`);

  const postsDir = currentMode === 'hacker' ? getHackerPostsDir() : getPostsDir();

  // 表单式输入
  showInput('文章标题', (title) => {
    if (!title) { setStatus('已取消', 'yellow'); showArticleManagement(); return; }

    showInput('标签（使用 # 号分隔，如 #技术#安全#教程，连续##视为两个独立标签）', (tagsInput) => {
      if (tagsInput === null) { setStatus('已取消', 'yellow'); showArticleManagement(); return; }

      // 解析标签：使用 # 分隔
      const tags = tagsInput
        ? tagsInput.split('#').map(t => t.trim()).filter(Boolean)
        : [];

      showInput('作者名字', (author) => {
        if (author === null) { setStatus('已取消', 'yellow'); showArticleManagement(); return; }

        showInput('作者头像路径（如 /assets/avatar.png，直接回车跳过）', (avatar) => {
          if (avatar === null) { setStatus('已取消', 'yellow'); showArticleManagement(); return; }

          const today = new Date().toISOString().split('T')[0];
          showInput(`发布时间（格式 YYYY-MM-DD，默认今天 ${today}）`, (dateInput) => {
            if (dateInput === null) { setStatus('已取消', 'yellow'); showArticleManagement(); return; }

            showInput('文章简介/摘要', (summary) => {
              if (summary === null) { setStatus('已取消', 'yellow'); showArticleManagement(); return; }

              showInput('正文 Markdown 内容（输入 markdown 内容，或输入文件路径导入 .md 文件）', (bodyInput) => {
                if (bodyInput === null) { setStatus('已取消', 'yellow'); showArticleManagement(); return; }

                let bodyContent = bodyInput;

                // 检查是否是文件路径导入
                if (bodyInput.endsWith('.md') && fs.existsSync(bodyInput)) {
                  try {
                    bodyContent = fs.readFileSync(bodyInput, 'utf-8');
                    logger.info(`已从文件导入: ${bodyInput}`);
                  } catch (e) {
                    logger.error('导入文件失败', e.message);
                  }
                }

                // 构建 frontmatter
                const slug = generateSlug(title);
                const date = dateInput || today;
                const tagsYaml = tags.length > 0
                  ? `[${tags.map(t => `"${t}"`).join(', ')}]`
                  : '[]';

                const frontmatter = `---
slug: "${slug}"
title: "${title}"
date: "${date}"
tags: ${tagsYaml}
summary: "${summary}"
cover: "${avatar || ''}"
cover_ascii: ""
word_count: ${bodyContent.length}
---

# ${title}

${bodyContent}
`;

                // 确保目录存在
                if (!fs.existsSync(postsDir)) {
                  fs.mkdirSync(postsDir, { recursive: true });
                }

                const filePath = path.join(postsDir, `${slug}.md`);

                if (fs.existsSync(filePath)) {
                  showConfirm(`文件已存在: ${slug}.md，是否覆盖？(y/n)`, (confirmed) => {
                    if (confirmed) {
                      fs.writeFileSync(filePath, frontmatter, 'utf-8');
                      logger.success(`文章已发布: ${slug}.md`);
                      setStatus(`文章已发布: ${title}`, 'green');
                    }
                    showArticleManagement();
                  });
                } else {
                  fs.writeFileSync(filePath, frontmatter, 'utf-8');
                  logger.success(`文章已发布: ${slug}.md`);
                  logger.info(`标题: ${title}`);
                  logger.info(`标签: ${tags.join(', ') || '(无)'}`);
                  logger.info(`发布时间: ${date}`);
                  setStatus(`文章已发布: ${title}`, 'green');
                  showArticleManagement();
                }
              });
            });
          });
        });
      });
    });
  });
}

// ============================================================
// 文章操作辅助函数
// ============================================================

function loadPostsFromDir(dir, postType) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const filePath = path.join(dir, f);
      const content = fs.readFileSync(filePath, 'utf-8');
      const meta = parseFrontmatter(content);
      const hidden = content.includes('published: false') || content.includes('hidden: true');
      return {
        fileName: f,
        filePath,
        slug: meta.slug || f.replace('.md', ''),
        title: meta.title || 'Untitled',
        date: meta.date || '',
        tags: meta.tags || [],
        summary: meta.summary || '',
        postType,
        hidden,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function togglePostHidden(post) {
  try {
    let content = fs.readFileSync(post.filePath, 'utf-8');
    if (post.hidden) {
      // 取消隐藏
      content = content.replace(/\n(published:\s*false|hidden:\s*true)/g, '');
      logger.success(`文章已显示: ${post.title}`);
    } else {
      // 隐藏
      const frontmatterEnd = content.indexOf('\n---', 4);
      if (frontmatterEnd > 0) {
        content = content.slice(0, frontmatterEnd) + '\nhidden: true' + content.slice(frontmatterEnd);
      }
      logger.success(`文章已隐藏: ${post.title}`);
    }
    fs.writeFileSync(post.filePath, content, 'utf-8');
  } catch (e) {
    logger.error('操作失败', e.message);
  }
}

function migratePost(post) {
  const targetDir = post.postType === 'normal' ? getHackerPostsDir() : getPostsDir();
  const targetType = post.postType === 'normal' ? 'hacker' : 'normal';

  showConfirm(`将文章 "${post.title}" 从 [${post.postType === 'normal' ? '普通' : '黑客'}] 迁移到 [${targetType === 'normal' ? '普通' : '黑客'}] 库？(y/n)`, (confirmed) => {
    if (!confirmed) {
      logger.info('已取消迁移');
      return;
    }

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, post.fileName);
      if (fs.existsSync(targetPath)) {
        logger.error(`目标文件已存在: ${post.fileName}`);
        return;
      }

      fs.renameSync(post.filePath, targetPath);
      logger.success(`文章已迁移: ${post.title} → [${targetType === 'normal' ? '普通' : '黑客'}]`);
      setStatus('文章迁移完成 ✓', 'green');
    } catch (e) {
      logger.error('迁移失败', e.message);
    }
  });
}

// ============================================================
// 部署功能
// ============================================================
async function handleDeploy() {
  contentBox.setContent('');
  logger.header('部署');

  showInput('请输入提交信息（直接回车使用默认信息）', async (commitMsg) => {
    try {
      setStatus('部署中...', 'yellow');

      const result = await runPipeline(commitMsg || '');

      if (result.selfCheck && result.build && result.gitPush) {
        logger.success('🎉 部署完成！');
        logger.info('GitHub Actions 将自动触发 Cloudflare Pages 构建部署');
        setStatus('部署成功 ✓', 'green');

        // 部署验证提示
        logger.info('');
        logger.info('部署验证建议：');
        logger.info('1. 等待 2-5 分钟后访问 Cloudflare Pages 控制台');
        logger.info('2. 检查构建状态是否为 "Success"');
        logger.info('3. 访问线上页面确认配置和文章元数据');
        logger.info('4. 对比本地内容与线上内容是否一致');
      } else {
        setStatus('部署未完成，请检查日志', 'red');
      }
    } catch (e) {
      logger.error('部署异常', e.message);
      setStatus('部署异常', 'red');
    }
    showRootMenu();
  });
}

// ============================================================
// 键盘事件
// ============================================================
screen.key(['C-c'], () => {
  screen.destroy();
  process.exit(0);
});

// ============================================================
// 启动
// ============================================================
renderBanner();
contentBox.add('{green-fg}欢迎使用 林天策 Blog TUI 终端管理工具 v2.0{/green-fg}');
contentBox.add('');

// 启动时执行基础自检
const checkResult = basicCheck();
checkResult.print();

// 显示欢迎界面
showWelcomeScreen();