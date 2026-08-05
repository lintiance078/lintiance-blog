/**
 * ============================================================
 * Rin Blog - Windows TUI 终端工具 (主入口)
 * ============================================================
 * 基于 blessed + blessed-contrib 实现 ANSI 彩色终端界面
 * 功能：ASCII Banner、方向键菜单、输入框、进度条
 *
 * 使用方式：node tui/index.js  或  npm run tui
 * ============================================================
 */

import blessed from 'blessed';
import contrib from 'blessed-contrib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 工具模块
import { loadConfig, getConfig, set as setConfig, getImagesDir } from './utils/config.js';
import { generateBannerSync } from './utils/banner.js';
import logger from './utils/logger.js';

// 功能模块
import { basicCheck, fullCheck, pipelineCheck } from './modules/selfCheck.js';
import { createPost, listPosts, editPost } from './modules/postManager.js';
import { compressImage, convertSingleToAscii, batchConvertOldImages, getImageStats } from './modules/imageProcessor.js';
import { runPipeline } from './modules/pipeline.js';
import { syncPostsToD1, syncTagsToD1, writeKVConfig, writeFriendsList } from './modules/dbManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载配置
loadConfig();

// ============================================================
// 创建 Blessed 屏幕
// ============================================================
const screen = blessed.screen({
  smartCSR: true,
  title: 'Rin Blog TUI - 博客管理工具',
  fullUnicode: true,
  mouse: true,
});

// ============================================================
// 主布局
// ============================================================

// Banner 区域
const bannerBox = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 8,
  content: '',
  style: {
    fg: 'magenta',
    bold: true,
  },
  tags: true,
});

// 菜单区域
const menuList = blessed.list({
  top: 8,
  left: 0,
  width: '30%',
  height: '100%-11',
  label: ' 主菜单 ',
  keys: true,
  vi: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    border: { fg: 'cyan' },
    selected: { bg: 'magenta', fg: 'black', bold: true },
    item: { fg: 'white' },
    focus: { border: { fg: 'magenta' } },
  },
  items: [
    '📝 新建文章',
    '✏️ 编辑文章',
    '🖼️ 图片处理',
    '🚀 一键流水线',
    '🗄️ 数据管理 (D1/KV)',
    '🔍 系统自检',
    '⚙️ 设置',
    '❌ 退出',
  ],
});

// 内容/日志区域
const contentBox = blessed.log({
  top: 8,
  left: '30%+1',
  width: '70%-1',
  height: '70%-3',
  label: ' 操作日志 ',
  border: { type: 'line' },
  style: {
    border: { fg: 'cyan' },
    fg: 'white',
  },
  scrollable: true,
  alwaysScroll: true,
  mouse: true,
  scrollbar: {
    ch: ' ',
    track: { bg: 'cyan' },
    style: { inverse: true },
  },
});

// 状态栏
const statusBar = blessed.text({
  top: '70%+11',
  left: '30%+1',
  width: '70%-1',
  height: 3,
  label: ' 状态 ',
  border: { type: 'line' },
  style: {
    border: { fg: 'cyan' },
    fg: 'green',
  },
  content: ' 按 ↑↓ 选择菜单项，Enter 确认，Esc 返回',
});

// 底部信息栏
const bottomBar = blessed.text({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: ' Rin Blog TUI | v1.0 | Tab 切换焦点 | ↑↓ 导航 | Enter 确认 | Esc 返回 | Ctrl+C 退出',
  style: {
    fg: 'black',
    bg: 'cyan',
  },
});

// 输入框（按需显示）
let inputBox = null;
let inputCallback = null;

function showInput(prompt, callback) {
  hideInput();

  inputBox = blessed.textbox({
    top: '70%+2',
    left: 'center',
    width: '60%',
    height: 3,
    label: ` ${prompt} `,
    border: { type: 'line' },
    style: {
      border: { fg: 'magenta' },
      fg: 'white',
      focus: { border: { fg: 'magenta' } },
    },
    inputOnFocus: true,
    keys: true,
    vi: true,
    mouse: true,
  });

  inputCallback = callback;

  inputBox.on('submit', (value) => {
    const text = value.trim();
    hideInput();
    if (inputCallback) {
      inputCallback(text);
      inputCallback = null;
    }
  });

  inputBox.key(['escape'], () => {
    hideInput();
    if (inputCallback) {
      inputCallback(null);
      inputCallback = null;
    }
  });

  screen.append(inputBox);
  inputBox.focus();
  screen.render();
}

function hideInput() {
  if (inputBox) {
    screen.remove(inputBox);
    inputBox = null;
    screen.render();
  }
}

// 确认对话框
function showConfirm(message, callback) {
  const confirmBox = blessed.question({
    top: 'center',
    left: 'center',
    width: '50%',
    height: 7,
    label: ' 确认操作 ',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      fg: 'white',
    },
  });

  screen.append(confirmBox);
  confirmBox.ask(message, (err, value) => {
    screen.remove(confirmBox);
    screen.render();
    callback(value);
  });
  screen.render();
}

// 进度条
function showProgress(label, total) {
  const progress = blessed.progressbar({
    top: 'center',
    left: 'center',
    width: '50%',
    height: 3,
    label: ` ${label} `,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      bar: { bg: 'magenta' },
    },
    filled: 0,
  });

  screen.append(progress);
  screen.render();

  return {
    update: (current) => {
      progress.setProgress(Math.min(current / total, 1));
      screen.render();
    },
    done: () => {
      screen.remove(progress);
      screen.render();
    },
  };
}

// 添加到屏幕
screen.append(bannerBox);
screen.append(menuList);
screen.append(contentBox);
screen.append(statusBar);
screen.append(bottomBar);

// ============================================================
// 日志输出到内容框
// ============================================================
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  const msg = args.join(' ');
  contentBox.add(msg);
  screen.render();
  originalConsoleLog(...args);
};

console.error = (...args) => {
  const msg = args.join(' ');
  contentBox.add(`{red-fg}${msg}{/red-fg}`);
  screen.render();
  originalConsoleError(...args);
};

// 更新状态栏
function setStatus(text, color = 'green') {
  statusBar.setContent(`  ${text}`);
  statusBar.style.fg = color;
  screen.render();
}

// ============================================================
// Banner 渲染
// ============================================================
function renderBanner() {
  const banner = generateBannerSync('Rin  Blog');
  bannerBox.setContent(banner);
  screen.render();
}

// ============================================================
// 菜单处理
// ============================================================
let currentScreen = 'main';

menuList.on('select', async (item, index) => {
  const selected = item.getText().trim();

  switch (selected) {
    case '📝 新建文章':
      await handleNewPost();
      break;
    case '✏️ 编辑文章':
      await handleEditPost();
      break;
    case '🖼️ 图片处理':
      await handleImageMenu();
      break;
    case '🚀 一键流水线':
      await handlePipeline();
      break;
    case '🗄️ 数据管理 (D1/KV)':
      await handleDbMenu();
      break;
    case '🔍 系统自检':
      await handleSelfCheck();
      break;
    case '⚙️ 设置':
      await handleSettings();
      break;
    case '❌ 退出':
      screen.destroy();
      process.exit(0);
  }
});

// ============================================================
// 功能处理函数
// ============================================================

/** 新建文章 */
async function handleNewPost() {
  contentBox.setContent('');
  logger.header('新建文章');

  showInput('请输入文章标题', async (title) => {
    if (!title) {
      logger.warn('已取消');
      return;
    }

    showInput('请输入标签（逗号分隔，如: Astro,Cloudflare,教程）', async (tagsInput) => {
      const tags = tagsInput
        ? tagsInput.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      showInput('请输入文章摘要（可选，直接回车跳过）', async (summary) => {
        try {
          const result = await createPost({
            title,
            tags,
            summary: summary || '',
            date: new Date().toISOString().split('T')[0],
          }, true);

          if (result.existed) {
            logger.warn(`文章已存在，已打开编辑器`);
          }

          setStatus(`文章已创建: ${result.slug}`, 'green');
        } catch (e) {
          logger.error('创建文章失败', e.message);
          setStatus('操作失败', 'red');
        }
      });
    });
  });
}

/** 编辑文章 */
async function handleEditPost() {
  contentBox.setContent('');
  logger.header('编辑文章');

  const posts = listPosts();

  if (posts.length === 0) {
    logger.info('还没有文章，请先创建');
    return;
  }

  // 显示文章列表供选择
  const items = posts.map((p, i) => `${i + 1}. ${p.title} [${p.date?.split('T')[0] || 'N/A'}]`);

  const listBox = blessed.list({
    top: 'center',
    left: 'center',
    width: '60%',
    height: Math.min(items.length + 4, 20),
    label: ' 选择要编辑的文章 ',
    keys: true,
    vi: true,
    mouse: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      selected: { bg: 'magenta', fg: 'black' },
    },
    items,
  });

  screen.append(listBox);
  listBox.focus();
  screen.render();

  listBox.on('select', async (_, index) => {
    screen.remove(listBox);
    screen.render();

    const post = posts[index];
    try {
      await editPost(post.slug);
      setStatus(`正在编辑: ${post.title}`, 'green');
    } catch (e) {
      logger.error('编辑失败', e.message);
    }
  });

  listBox.key(['escape'], () => {
    screen.remove(listBox);
    menuList.focus();
    screen.render();
  });
}

/** 图片处理子菜单 */
async function handleImageMenu() {
  contentBox.setContent('');
  logger.header('图片处理');

  const stats = getImageStats();
  logger.info(`图片总数: ${stats.total} | 阈值: ${stats.threshold} | ${stats.reachedThreshold ? '⚠️ 已达阈值' : '✅ 未达阈值'}`);

  const items = [
    '🗜️  压缩图片',
    '🎨 单张图片转 ASCII',
    '📦 批量转换旧图片为 ASCII',
    '📊 查看图片统计',
    '↩️ 返回主菜单',
  ];

  const subMenu = blessed.list({
    top: 'center',
    left: 'center',
    width: 40,
    height: items.length + 4,
    label: ' 图片处理 ',
    keys: true,
    vi: true,
    mouse: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      selected: { bg: 'magenta', fg: 'black' },
    },
    items,
  });

  screen.append(subMenu);
  subMenu.focus();
  screen.render();

  subMenu.on('select', async (_, index) => {
    screen.remove(subMenu);
    screen.render();

    switch (index) {
      case 0: // 压缩图片
        showInput('请输入图片路径（相对于 public/assets/images/）', async (imgPath) => {
          if (!imgPath) return;
          const fullPath = path.join(getImagesDir(), imgPath);
          try {
            await compressImage(fullPath);
            setStatus('图片压缩完成', 'green');
          } catch (e) {
            logger.error('压缩失败', e.message);
          }
        });
        break;

      case 1: // 单张转 ASCII
        showInput('请输入图片路径（相对于 public/assets/images/）', async (imgPath) => {
          if (!imgPath) return;
          const fullPath = path.join(getImagesDir(), imgPath);
          showConfirm('转换后将删除原图片，是否继续？(y/n)', async (confirmed) => {
            if (!confirmed) {
              logger.info('已取消');
              return;
            }
            try {
              const asciiMd = await convertSingleToAscii(fullPath, true);
              logger.success('ASCII 转换完成！');
              logger.info('以下是可嵌入 Markdown 的格式（已复制到剪贴板路径）:');
              logger.info(asciiMd.substring(0, 200) + '...');
              setStatus('ASCII 转换完成', 'green');
            } catch (e) {
              logger.error('转换失败', e.message);
            }
          });
        });
        break;

      case 2: // 批量转换
        showConfirm(
          `⚠️ 批量转换将删除 ${stats.total} 张图片中的旧图片，\n转为 ASCII 字符画（灰度，画质下降）。\n建议提前备份！是否继续？(y/n)`,
          async (confirmed) => {
            if (!confirmed) {
              logger.info('已取消批量转换');
              return;
            }
            const result = await batchConvertOldImages(true);
            setStatus(`批量转换完成: ${result.converted} 张`, 'green');
          }
        );
        break;

      case 3: // 查看统计
        logger.info(`图片总数: ${stats.total}`);
        logger.info(`总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
        logger.info(`阈值: ${stats.threshold}`);
        logger.info(`状态: ${stats.reachedThreshold ? '已达到阈值，建议转换' : '正常'}`);
        setStatus(`图片统计已显示`, 'green');
        break;

      case 4: // 返回
        menuList.focus();
        break;
    }
  });

  subMenu.key(['escape'], () => {
    screen.remove(subMenu);
    menuList.focus();
    screen.render();
  });
}

/** 一键流水线 */
async function handlePipeline() {
  contentBox.setContent('');

  showInput('请输入提交信息（直接回车使用默认信息）', async (commitMsg) => {
    try {
      setStatus('流水线运行中...', 'yellow');
      const result = await runPipeline(commitMsg || '');
      if (result.selfCheck && result.build && result.gitPush) {
        setStatus('流水线完成 ✓', 'green');
      } else {
        setStatus('流水线未完成', 'red');
      }
    } catch (e) {
      logger.error('流水线执行异常', e.message);
      setStatus('流水线异常', 'red');
    }
  });
}

/** 数据管理子菜单 */
async function handleDbMenu() {
  contentBox.setContent('');
  logger.header('D1/KV 数据管理');
  logger.info('注意：网页端没有写入能力，所有写入操作在此完成');

  const items = [
    '📤 同步文章元数据到 D1',
    '🏷️  同步标签到 D1',
    '⚙️ 写入 KV 站点配置',
    '🔗 管理友链列表',
    '↩️ 返回主菜单',
  ];

  const subMenu = blessed.list({
    top: 'center',
    left: 'center',
    width: 40,
    height: items.length + 4,
    label: ' 数据管理 ',
    keys: true,
    vi: true,
    mouse: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      selected: { bg: 'magenta', fg: 'black' },
    },
    items,
  });

  screen.append(subMenu);
  subMenu.focus();
  screen.render();

  subMenu.on('select', async (_, index) => {
    screen.remove(subMenu);
    screen.render();

    switch (index) {
      case 0: // 同步文章到 D1
        logger.step('正在从本地 Markdown 收集文章元数据...');
        const posts = listPosts();
        const postMeta = posts.map(p => ({
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          tags: p.tags,
          cover_image: '',
          is_ascii: false,
          published: true,
          word_count: 0,
          created_at: p.date,
        }));
        syncPostsToD1(postMeta);
        setStatus(`D1 同步完成: ${posts.length} 篇`, 'green');
        break;

      case 1: // 同步标签
        const allPosts = listPosts();
        const tagMap = new Map();
        allPosts.forEach(p => {
          (p.tags || []).forEach(t => tagMap.set(t, (tagMap.get(t) || 0) + 1));
        });
        const tags = Array.from(tagMap.entries()).map(([name, count]) => ({ name, count }));
        syncTagsToD1(tags);
        setStatus(`标签同步完成: ${tags.length} 个`, 'green');
        break;

      case 2: // 写入 KV 配置
        showInput('请输入配置 Key (site_config/theme_config/layout_config/features_config/footer_config)', async (key) => {
          if (!key) return;
          showInput('请输入配置值 (JSON 格式)', async (value) => {
            if (!value) return;
            try {
              const obj = JSON.parse(value);
              writeKVConfig(key, obj);
              setStatus(`KV 配置已更新: ${key}`, 'green');
            } catch {
              logger.error('JSON 格式无效');
            }
          });
        });
        break;

      case 3: // 管理友链
        showInput('请输入友链名称', async (name) => {
          if (!name) return;
          showInput('请输入友链 URL', async (url) => {
            if (!url) return;
            showInput('请输入友链描述（可选）', async (desc) => {
              const friend = { name, url, description: desc || '', avatar: '' };
              writeFriendsList([friend]);
              logger.success(`友链已添加: ${name}`);
              setStatus('友链已更新', 'green');
            });
          });
        });
        break;

      case 4:
        menuList.focus();
        break;
    }
  });

  subMenu.key(['escape'], () => {
    screen.remove(subMenu);
    menuList.focus();
    screen.render();
  });
}

/** 系统自检 */
async function handleSelfCheck() {
  contentBox.setContent('');
  const result = fullCheck();
  result.print();
  setStatus(result.allPassed ? '自检通过 ✓' : '自检未通过', result.allPassed ? 'green' : 'red');
}

/** 设置 */
async function handleSettings() {
  contentBox.setContent('');
  logger.header('TUI 设置');

  const config = getConfig();
  const items = [
    `图片阈值: ${config.imageThreshold}`,
    `自动转换: ${config.autoConvertEnabled ? '✅ 启用' : '❌ 禁用'}`,
    `旧图片天数: ${config.oldImageDays} 天`,
    `ASCII 最大宽度: ${config.ascii.maxWidth}`,
    `ASCII 字符集: ${config.ascii.charset}`,
    `Git 分支: ${config.git.branch}`,
    '↩️ 返回主菜单',
  ];

  const setMenu = blessed.list({
    top: 'center',
    left: 'center',
    width: 50,
    height: items.length + 4,
    label: ' 设置 ',
    keys: true,
    vi: true,
    mouse: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      selected: { bg: 'magenta', fg: 'black' },
    },
    items,
  });

  screen.append(setMenu);
  setMenu.focus();
  screen.render();

  setMenu.on('select', async (_, index) => {
    screen.remove(setMenu);
    screen.render();

    switch (index) {
      case 0: // 图片阈值
        showInput('请输入新阈值（当前: ' + config.imageThreshold + '）', async (val) => {
          const num = parseInt(val);
          if (num > 0) {
            setConfig('imageThreshold', num);
            logger.success(`图片阈值已更新: ${num}`);
          }
        });
        break;
      case 1: // 自动转换
        setConfig('autoConvertEnabled', !config.autoConvertEnabled);
        logger.success(`自动转换已${config.autoConvertEnabled ? '禁用' : '启用'}`);
        break;
      case 2: // 旧图片天数
        showInput('请输入天数（当前: ' + config.oldImageDays + '）', async (val) => {
          const num = parseInt(val);
          if (num > 0) {
            setConfig('oldImageDays', num);
            logger.success(`旧图片天数已更新: ${num}`);
          }
        });
        break;
      case 3: // ASCII 宽度
        showInput('请输入最大宽度（当前: ' + config.ascii.maxWidth + '）', async (val) => {
          const num = parseInt(val);
          if (num > 0 && num <= 300) {
            setConfig('ascii.maxWidth', num);
            logger.success(`ASCII 宽度已更新: ${num}`);
          }
        });
        break;
      case 4: // 字符集
        showInput('请输入字符集 (detailed/standard/simple/blocks)', async (val) => {
          if (['detailed', 'standard', 'simple', 'blocks'].includes(val)) {
            setConfig('ascii.charset', val);
            logger.success(`字符集已更新: ${val}`);
          } else {
            logger.error('无效的字符集名称');
          }
        });
        break;
      case 5: // Git 分支
        showInput('请输入 Git 分支名（当前: ' + config.git.branch + '）', async (val) => {
          if (val) {
            setConfig('git.branch', val);
            logger.success(`Git 分支已更新: ${val}`);
          }
        });
        break;
      case 6:
        menuList.focus();
        break;
    }
  });

  setMenu.key(['escape'], () => {
    screen.remove(setMenu);
    menuList.focus();
    screen.render();
  });
}

// ============================================================
// 键盘事件
// ============================================================
screen.key(['C-c'], () => {
  screen.destroy();
  process.exit(0);
});

screen.key(['tab'], () => {
  if (screen.focused === menuList) {
    contentBox.focus();
  } else {
    menuList.focus();
  }
  screen.render();
});

// ============================================================
// 启动
// ============================================================
renderBanner();
contentBox.add('{green-fg}欢迎使用 Rin Blog TUI 终端管理工具{/green-fg}');
contentBox.add('使用 ↑↓ 方向键选择菜单，Enter 确认');
contentBox.add('');

// 启动时执行基础自检
const checkResult = basicCheck();
checkResult.print();

menuList.focus();
screen.render();