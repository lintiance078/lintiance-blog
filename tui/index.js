/**
 * ============================================================
 * 林天策 Blog - TUI 终端管理工具 v3.0
 * ============================================================
 * 数字键操作：1/2/3 选择 | 0 返回/退出 | 9 一键部署
 * 基于 blessed 实现 ANSI 彩色终端界面
 * ============================================================
 */

import blessed from 'blessed';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { loadConfig, getProjectRoot, getPostsDir, getEnvPath } from './utils/config.js';
import { generateBannerSync } from './utils/banner.js';
import logger from './utils/logger.js';
import { basicCheck } from './modules/selfCheck.js';
import { runPipeline } from './modules/pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadConfig();

// ============================================================
// 颜色常量
// ============================================================
const C = {
  primary:   '#a78bfa',   // 紫色主色
  accent:    '#818cf8',   // 靛蓝
  success:   '#34d399',   // 绿色
  warning:   '#fbbf24',   // 黄色
  danger:    '#f87171',   // 红色
  info:      '#67e8f9',   // 青色
  white:     '#f1f5f9',
  dim:       '#64748b',
  bg:        '#0f172a',
  panel:     '#1e293b',
  border:    '#334155',
};

// ============================================================
// 创建屏幕
// ============================================================
const screen = blessed.screen({
  smartCSR: true,
  title: '林天策 Blog · TUI',
  fullUnicode: true,
  dockBorders: false,
});

// ---- 顶部 Banner ----
const bannerBox = blessed.box({
  top: 0, left: 0, width: '100%', height: 9,
  content: '',
  tags: true,
});

// ---- 主菜单面板 ----
let menuBox = null;

// ---- 日志/内容面板 ----
const logBox = blessed.box({
  top: 11, left: '50%+1', width: '50%-1', height: '100%-14',
  label: ' 日志 ',
  border: { type: 'line' },
  style: { border: { fg: C.border }, fg: C.white },
  tags: true,
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  scrollbar: { ch: ' ', track: { bg: C.border } },
  padding: { left: 1, right: 1 },
});

// ---- 状态栏 ----
const statusBar = blessed.text({
  bottom: 2, left: 0, width: '100%', height: 1,
  content: ' 就绪',
  style: { fg: C.dim },
  tags: true,
});

// ---- 底部快捷键栏 ----
const keyBar = blessed.text({
  bottom: 0, left: 0, width: '100%', height: 1,
  content: ' {black-fg}{#a78bfa-bg} 1-9 选择 {/} {black-fg}{#818cf8-bg} 0 返回/退出 {/} {black-fg}{#34d399-bg} 9 部署 {/} {black-fg}{#64748b-bg} ↑↓ 导航 {/} {black-fg}{#64748b-bg} Enter 确认 {/} {black-fg}{#f87171-bg} Ctrl+C 退出 {/}',
  tags: true,
});

screen.append(bannerBox);
screen.append(logBox);
screen.append(statusBar);
screen.append(keyBar);

// ============================================================
// 日志输出重定向（自检等模块使用 console.log）
// ============================================================
const originalConsoleLog = console.log;
console.log = (...args) => {
  const msg = args.join(' ');
  logBox.insertBottom(msg);
  screen.render();
  originalConsoleLog(...args);
};

// ============================================================
// 辅助函数
// ============================================================

function log(msg, color = C.white) {
  logBox.insertBottom(`{${color}-fg}${msg}{/${color}-fg}`);
  screen.render();
}

function logSuccess(msg) { log(`  ✓ ${msg}`, C.success); }
function logWarn(msg)   { log(`  ⚠ ${msg}`, C.warning); }
function logError(msg)  { log(`  ✗ ${msg}`, C.danger); }
function logHeader(msg) {
  logBox.insertBottom('');
  logBox.insertBottom(`{${C.primary}-fg}{bold}▸ ${msg}{/bold}{/${C.primary}-fg}`);
  logBox.insertBottom(`{${C.border}-fg}${'─'.repeat(40)}{/${C.border}-fg}`);
  screen.render();
}
function setStatus(text, color = C.dim) {
  statusBar.setContent(`  {${color}-fg}${text}{/${color}-fg}`);
  screen.render();
}

function clearLog() {
  logBox.setContent('');
  screen.render();
}

// ============================================================
// 输入框
// ============================================================
let inputBox = null;
let inputCb = null;

function promptInput(label, cb, defVal = '') {
  if (inputBox) { screen.remove(inputBox); }
  inputBox = blessed.textbox({
    top: 'center', left: 'center', width: '50%', height: 3,
    label: ` ${label} `,
    border: { type: 'line' },
    style: {
      border: { fg: C.primary },
      fg: C.white,
      focus: { border: { fg: C.accent } },
    },
    inputOnFocus: true, keys: true, mouse: true,
    value: defVal,
  });
  inputCb = cb;
  inputBox.on('submit', (v) => {
    const text = v.trim();
    if (inputBox) { screen.remove(inputBox); inputBox = null; }
    screen.render();
    if (inputCb) { const cb2 = inputCb; inputCb = null; cb2(text); }
  });
  inputBox.key(['escape'], () => {
    if (inputBox) { screen.remove(inputBox); inputBox = null; }
    screen.render();
    if (inputCb) { const cb2 = inputCb; inputCb = null; cb2(null); }
  });
  screen.append(inputBox);
  inputBox.focus();
  screen.render();
}

function promptConfirm(msg, cb) {
  const box = blessed.question({
    top: 'center', left: 'center', width: '45%', height: 7,
    label: ' 确认 ',
    border: { type: 'line' },
    style: { border: { fg: C.warning }, fg: C.white },
  });
  screen.append(box);
  box.ask(msg, (err, v) => {
    screen.remove(box);
    screen.render();
    cb(v);
  });
  screen.render();
}

// ============================================================
// 菜单面板
// ============================================================
function createMenuPanel(title, items, onSelect, onBack) {
  if (menuBox) { screen.remove(menuBox); }

  const content = items.map((item, i) => {
    const num = i + 1;
    const icon = item.icon || '';
    const label = item.label || item;
    return `{${C.white}-fg}  {bold}{${C.accent}-fg}${num}{/${C.accent}-fg}{/bold}  ${icon} ${label}{/${C.white}-fg}`;
  }).join('\n');

  const fullContent = [
    `{${C.primary}-fg}{bold}  ${title}{/${C.primary}-fg}{/bold}`,
    `{${C.border}-fg}  ${'─'.repeat(30)}{/${C.border}-fg}`,
    content,
    '',
    `{${C.dim}-fg}  0  返回 / 退出{/${C.dim}-fg}`,
    `{${C.success}-fg}  9  一键部署{/${C.success}-fg}`,
  ].join('\n');

  menuBox = blessed.box({
    top: 11, left: 0, width: '50%', height: '100%-14',
    content: fullContent,
    border: { type: 'line' },
    style: { border: { fg: C.border }, fg: C.white },
    tags: true,
    padding: { top: 1, left: 2 },
  });

  // 数字键处理
  menuBox.key(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], (ch) => {
    const num = parseInt(ch);
    if (num === 0) {
      if (onBack) onBack();
    } else if (num === 9) {
      handleDeploy();
    } else if (num > 0 && num <= items.length) {
      if (onSelect) onSelect(num - 1);
    }
  });

  // 回车键等同于按1
  menuBox.key(['enter'], () => {
    if (items.length > 0 && onSelect) onSelect(0);
  });

  menuBox.key(['escape'], () => {
    if (onBack) onBack();
  });

  screen.append(menuBox);
  menuBox.focus();
  screen.render();
  return menuBox;
}

// ============================================================
// 文章解析辅助
// ============================================================
function parseFrontmatter(content) {
  const meta = {};
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    for (const line of match[1].split('\n')) {
      const m = line.match(/^(\w+):\s*(.+)$/);
      if (m) {
        let v = m[2].trim().replace(/^["']|["']$/g, '');
        if (v.startsWith('[') && v.endsWith(']')) {
          try { v = JSON.parse(v); } catch {}
        }
        meta[m[1]] = v;
      }
    }
  }
  return meta;
}

function generateSlug(title) {
  return title.toLowerCase().replace(/[\s]+/g, '-').replace(/[^\w\u4e00-\u9fff\-]/g, '').replace(/\-+/g, '-').replace(/^\-|\-$/g, '') || 'untitled';
}

function loadPosts(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const fp = path.join(dir, f);
      const c = fs.readFileSync(fp, 'utf-8');
      const meta = parseFrontmatter(c);
      return {
        fileName: f, filePath: fp,
        slug: meta.slug || f.replace('.md', ''),
        title: meta.title || 'Untitled',
        date: meta.date || '', tags: meta.tags || [],
        summary: meta.summary || '',
        hidden: c.includes('published: false') || c.includes('hidden: true'),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================
// Banner 渲染
// ============================================================
function renderBanner() {
  const art = generateBannerSync('LINTIANCE');
  const lines = art.split('\n');
  const colored = lines.map((l, i) => {
    const r = 140 + Math.floor(i * 8);
    const g = 100 + Math.floor(i * 6);
    const b = 255 - Math.floor(i * 4);
    return `{bold}{#${r.toString(16)}${g.toString(16)}${b.toString(16)}-fg}${l}{/}`;
  }).join('\n');
  bannerBox.setContent(colored);
  screen.render();
}

// ============================================================
// 主菜单
// ============================================================
function showMainMenu() {
  clearLog();
  setStatus('主菜单');
  createMenuPanel('主 菜 单', [
    { icon: '⚙️', label: '站点管理' },
    { icon: '📝', label: '文章管理' },
    { icon: '🚀', label: '一键部署' },
    { icon: '❌', label: '退出' },
  ], (idx) => {
    switch (idx) {
      case 0: showSiteMenu(); break;
      case 1: showArticleMenu(); break;
      case 2: handleDeploy(); break;
      case 3: screen.destroy(); process.exit(0);
    }
  }, () => {
    screen.destroy();
    process.exit(0);
  });
}

// ============================================================
// 站点管理
// ============================================================
function showSiteMenu() {
  clearLog();
  setStatus('站点管理');
  createMenuPanel('站 点 管 理', [
    { icon: '🏷️', label: '网站设置（名称/描述/标题）' },
    { icon: '🎨', label: '风格管理（颜色/圆角/字号）' },
  ], (idx) => {
    switch (idx) {
      case 0: handleSiteSettings(); break;
      case 1: handleStyleSettings(); break;
    }
  }, () => showMainMenu());
}

function handleSiteSettings() {
  logHeader('网站设置');
  const root = getProjectRoot();
  const wrPath = path.join(root, 'wrangler.toml');
  promptInput('站点名称', (name) => {
    if (!name) { setStatus('已取消', C.warning); showSiteMenu(); return; }
    promptInput('站点描述', (desc) => {
      if (desc === null) { setStatus('已取消', C.warning); showSiteMenu(); return; }
      promptInput('浏览器标题', (title) => {
        if (title === null) { setStatus('已取消', C.warning); showSiteMenu(); return; }
        try {
          let c = fs.readFileSync(wrPath, 'utf-8');
          if (name) c = c.replace(/SITE_TITLE\s*=\s*"[^"]*"/, `SITE_TITLE = "${name}"`);
          if (desc) c = c.replace(/SITE_DESCRIPTION\s*=\s*"[^"]*"/, `SITE_DESCRIPTION = "${desc}"`);
          fs.writeFileSync(wrPath, c, 'utf-8');
          logSuccess(`站点名称: ${name}`);
          logSuccess(`站点描述: ${desc || '(未修改)'}`);
          logSuccess(`浏览器标题: ${title || '(未修改)'}`);
          setStatus('站点设置已更新 ✓', C.success);
        } catch (e) {
          logError('写入失败: ' + e.message);
          setStatus('操作失败', C.danger);
        }
        showSiteMenu();
      });
    });
  });
}

function handleStyleSettings() {
  logHeader('风格管理');
  const root = getProjectRoot();
  const cssPath = path.join(root, 'src', 'styles', 'global.css');

  createMenuPanel('风 格 管 理', [
    { icon: '🎨', label: '主题色' },
    { icon: '📐', label: '卡片圆角' },
    { icon: '🔤', label: '正文字号' },
    { icon: '🌓', label: '暗色背景' },
    { icon: '📏', label: '内容最大宽度' },
  ], (idx) => {
    const settings = [
      { key: 'primary', label: '主题色', def: '#6366f1', pattern: /(--color-primary:\s*)#[0-9a-fA-F]+/ },
      { key: 'radius', label: '卡片圆角', def: '16px', pattern: /(--radius-lg:\s*)16px/ },
      { key: 'fontSize', label: '正文字号', def: '16px', pattern: /(html\s*\{\s*\n\s*font-size:\s*)16px/ },
      { key: 'darkBg', label: '暗色背景', def: '#0f172a', pattern: /(--bg-body:\s*)#[0-9a-fA-F]+/ },
      { key: 'maxWidth', label: '最大宽度', def: '1200px', pattern: /(--max-width:\s*)1200px/ },
    ][idx];

    promptInput(`新${settings.label}（当前: ${settings.def}）`, (val) => {
      if (!val) { setStatus('已取消', C.warning); handleStyleSettings(); return; }
      try {
        let css = fs.readFileSync(cssPath, 'utf-8');
        css = css.replace(settings.pattern, `$1${val}`);
        fs.writeFileSync(cssPath, css, 'utf-8');
        logSuccess(`${settings.label} → ${val}`);
        setStatus(`${settings.label}已更新 ✓`, C.success);
      } catch (e) {
        logError('更新失败: ' + e.message);
        setStatus('操作失败', C.danger);
      }
      handleStyleSettings();
    });
  }, () => showSiteMenu());
}

// ============================================================
// 文章管理
// ============================================================
function showArticleMenu() {
  clearLog();
  setStatus('文章管理');
  createMenuPanel('文 章 管 理', [
    { icon: '📋', label: '管理文章（列表/删除/隐藏）' },
    { icon: '✏️', label: '发布新文章' },
  ], (idx) => {
    switch (idx) {
      case 0: handleManageArticles(); break;
      case 1: handlePublishArticle(); break;
    }
  }, () => showMainMenu());
}

function handleManageArticles() {
  clearLog();
  logHeader('管理文章');
  const posts = loadPosts(getPostsDir());
  if (posts.length === 0) {
    log('  还没有文章，请先发布', C.dim);
    showArticleMenu();
    return;
  }

  const items = posts.map((p, i) => {
    const h = p.hidden ? ' [已隐藏]' : '';
    const d = p.date ? p.date.slice(0, 10) : '';
    return { icon: '', label: `${d}  ${p.title}${h}` };
  });

  createMenuPanel('文 章 列 表', items, (idx) => {
    const post = posts[idx];
    showArticleActions(post);
  }, () => showArticleMenu());
}

function showArticleActions(post) {
  clearLog();
  logHeader(`操作: ${post.title}`);
  log(`  ${post.date ? post.date.slice(0, 10) : ''}  ${post.hidden ? '[已隐藏]' : '[公开]'}`);

  createMenuPanel('操 作', [
    { icon: '🗑️', label: '删除文章' },
    { icon: '👁️', label: post.hidden ? '显示文章' : '隐藏文章' },
    { icon: '📝', label: '编辑文章' },
  ], (idx) => {
    switch (idx) {
      case 0:
        promptConfirm(`确定删除 "${post.title}" ? (y/n)`, (ok) => {
          if (ok) {
            try {
              fs.unlinkSync(post.filePath);
              logSuccess(`已删除: ${post.title}`);
              setStatus('文章已删除', C.success);
            } catch (e) {
              logError('删除失败: ' + e.message);
            }
          }
          handleManageArticles();
        });
        break;
      case 1:
        try {
          let c = fs.readFileSync(post.filePath, 'utf-8');
          if (post.hidden) {
            c = c.replace(/\n(published:\s*false|hidden:\s*true)/g, '');
            logSuccess(`已显示: ${post.title}`);
          } else {
            const end = c.indexOf('\n---', 4);
            if (end > 0) c = c.slice(0, end) + '\nhidden: true' + c.slice(end);
            logSuccess(`已隐藏: ${post.title}`);
          }
          fs.writeFileSync(post.filePath, c, 'utf-8');
          setStatus('操作完成', C.success);
        } catch (e) {
          logError('操作失败: ' + e.message);
        }
        handleManageArticles();
        break;
      case 2:
        try {
          const editor = process.env.EDITOR || 'notepad.exe';
          execSync(`start "" "${editor}" "${post.filePath}"`, { shell: true });
          log(`正在编辑: ${post.title}`, C.info);
          setStatus('编辑器已打开', C.success);
        } catch (e) {
          logError('打开编辑器失败: ' + e.message);
        }
        handleManageArticles();
        break;
    }
  }, () => handleManageArticles());
}

function handlePublishArticle() {
  clearLog();
  logHeader('发布新文章');
  const postsDir = getPostsDir();

  promptInput('文章标题', (title) => {
    if (!title) { setStatus('已取消', C.warning); showArticleMenu(); return; }
    promptInput('标签（#号分隔，如 #技术#教程）', (tagsInput) => {
      if (tagsInput === null) { setStatus('已取消', C.warning); showArticleMenu(); return; }
      const tags = tagsInput ? tagsInput.split('#').map(t => t.trim()).filter(Boolean) : [];

      promptInput('作者名字', (author) => {
        if (author === null) { setStatus('已取消', C.warning); showArticleMenu(); return; }
        promptInput('作者头像路径（直接回车跳过）', (avatar) => {
          if (avatar === null) { setStatus('已取消', C.warning); showArticleMenu(); return; }
          const today = new Date().toISOString().split('T')[0];
          promptInput(`发布时间（默认 ${today}）`, (dateInput) => {
            if (dateInput === null) { setStatus('已取消', C.warning); showArticleMenu(); return; }
            promptInput('文章摘要', (summary) => {
              if (summary === null) { setStatus('已取消', C.warning); showArticleMenu(); return; }
              promptInput('正文（输入 Markdown 或 .md 文件路径导入）', (body) => {
                if (body === null) { setStatus('已取消', C.warning); showArticleMenu(); return; }
                let bodyC = body;
                if (body.endsWith('.md') && fs.existsSync(body)) {
                  try { bodyC = fs.readFileSync(body, 'utf-8'); log(`已导入: ${body}`, C.info); }
                  catch (e) { logError('导入失败: ' + e.message); }
                }

                const slug = generateSlug(title);
                const date = dateInput || today;
                const tagsYaml = tags.length > 0 ? `[${tags.map(t => `"${t}"`).join(', ')}]` : '[]';

                const fm = `---
slug: "${slug}"
title: "${title}"
date: "${date}"
tags: ${tagsYaml}
summary: "${summary}"
cover: "${avatar || ''}"
cover_ascii: ""
word_count: ${bodyC.length}
---

# ${title}

${bodyC}
`;
                if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });
                const fp = path.join(postsDir, `${slug}.md`);

                if (fs.existsSync(fp)) {
                  promptConfirm(`文件 ${slug}.md 已存在，覆盖？(y/n)`, (ok) => {
                    if (ok) {
                      fs.writeFileSync(fp, fm, 'utf-8');
                      logSuccess(`已发布: ${slug}.md`);
                      log(`  标题: ${title}`, C.white);
                      log(`  标签: ${tags.join(', ') || '(无)'}`, C.dim);
                      log(`  日期: ${date}`, C.dim);
                      setStatus('文章已发布 ✓', C.success);
                    }
                    showArticleMenu();
                  });
                } else {
                  fs.writeFileSync(fp, fm, 'utf-8');
                  logSuccess(`已发布: ${slug}.md`);
                  log(`  标题: ${title}`, C.white);
                  log(`  标签: ${tags.join(', ') || '(无)'}`, C.dim);
                  log(`  日期: ${date}`, C.dim);
                  setStatus('文章已发布 ✓', C.success);
                  showArticleMenu();
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
// 一键部署
// ============================================================
async function handleDeploy() {
  clearLog();
  logHeader('一键部署');
  log('  流程: 自检 → 构建 → Git 推送', C.dim);

  promptInput('提交信息（直接回车使用默认）', async (msg) => {
    try {
      setStatus('部署中...', C.warning);
      const result = await runPipeline(msg || '');
      if (result.selfCheck && result.build && result.gitPush) {
        logSuccess('部署完成！');
        log('  GitHub Actions 将自动触发 Cloudflare Pages 部署', C.dim);
        setStatus('部署成功 ✓', C.success);
      } else {
        logError('部署未完成，请检查日志');
        setStatus('部署未完成', C.danger);
      }
    } catch (e) {
      logError('部署异常: ' + e.message);
      setStatus('部署异常', C.danger);
    }
    showMainMenu();
  });
}

// ============================================================
// 全局键盘
// ============================================================
screen.key(['C-c'], () => {
  screen.destroy();
  process.exit(0);
});

screen.key(['9'], () => {
  // 全局 9 = 一键部署
  if (inputBox) return; // 输入框内不拦截
  handleDeploy();
});

// ============================================================
// 启动
// ============================================================
renderBanner();
logBox.setContent('');
log('{bold}欢迎使用 林天策 Blog TUI v3.0{/bold}', C.primary);
log('  数字键选择 · 0 返回 · 9 部署', C.dim);
log('');

// 启动自检
const check = basicCheck();
check.print();
log('');

// 直接进入主菜单
showMainMenu();