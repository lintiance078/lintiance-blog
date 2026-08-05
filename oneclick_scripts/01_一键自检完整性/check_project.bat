@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: 林天策 Blog - 项目完整性自检脚本
:: 用途：部署前全面检查项目结构与配置完整性
:: 用法：双击运行 check_project.bat
:: ============================================================

:: ---------- 初始化计数器 ----------
set PASS=0
set WARN=0
set ERR=0

:: ---------- 读取项目根路径 ----------
set "CONFIG_FILE=%~dp0..\..\project_local_path.txt"
set "REPORT_DIR=%~dp0"
set "REPORT_FILE=%REPORT_DIR%check_report_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt"
:: 去除文件名中的空格
set "REPORT_FILE=%REPORT_FILE: =0%"

:: 初始化报告文件
(
    echo ============================================================
    echo 林天策 Blog - 项目完整性自检报告
    echo 生成时间: %date% %time%
    echo ============================================================
    echo.
) > "%REPORT_FILE%"

:: 读取项目路径
if not exist "%CONFIG_FILE%" (
    call :log_error "配置文件不存在: %CONFIG_FILE%"
    goto :END
)

set "PROJECT_ROOT="
for /f "usebackq delims=" %%a in ("%CONFIG_FILE%") do (
    set "PROJECT_ROOT=%%a"
)

:: 去除尾部空格和回车
for /f "tokens=*" %%a in ("!PROJECT_ROOT!") do set "PROJECT_ROOT=%%a"

if "!PROJECT_ROOT!"=="" (
    call :log_error "project_local_path.txt 内容为空，请填写项目根路径"
    goto :END
)

if not exist "!PROJECT_ROOT!" (
    call :log_error "项目根路径不存在: !PROJECT_ROOT!"
    goto :END
)

echo [信息] 项目根路径: !PROJECT_ROOT!
echo [信息] 项目根路径: !PROJECT_ROOT! >> "%REPORT_FILE%"
echo. >> "%REPORT_FILE%"

:: ============================================================
:: 1. 检查目录结构
:: ============================================================
echo.
echo ========== 1. 目录结构检查 ==========
echo ========== 1. 目录结构检查 ========== >> "%REPORT_FILE%"

:: 定义需要检查的目录列表
set "DIRS=src/pages src/layouts src/components src/styles src/content/posts src/content/hacker-posts public/assets/images functions/api sql"

for %%d in (%DIRS%) do (
    if exist "!PROJECT_ROOT!\%%d" (
        call :log_pass "目录存在: %%d"
    ) else (
        call :log_error "目录缺失: %%d"
    )
)

:: ============================================================
:: 2. 检查文章数量
:: ============================================================
echo.
echo ========== 2. 文章数量检查 ==========
echo ========== 2. 文章数量检查 ========== >> "%REPORT_FILE%"

:: 检查普通博客文章
set "POST_DIR=!PROJECT_ROOT!\src\content\posts"
set COUNT=0
if exist "!POST_DIR!" (
    for %%f in ("!POST_DIR!\*.md") do set /a COUNT=!COUNT!+1
)
if !COUNT! GEQ 15 (
    call :log_pass "普通博客文章数量: !COUNT! 篇 (要求 >= 15)"
) else (
    call :log_warn "普通博客文章数量: !COUNT! 篇 (要求 >= 15，建议补充)"
)

:: 检查黑客博客文章
set "HACKER_DIR=!PROJECT_ROOT!\src\content\hacker-posts"
set COUNT=0
if exist "!HACKER_DIR!" (
    for %%f in ("!HACKER_DIR!\*.md") do set /a COUNT=!COUNT!+1
)
if !COUNT! GEQ 15 (
    call :log_pass "黑客博客文章数量: !COUNT! 篇 (要求 >= 15)"
) else (
    call :log_warn "黑客博客文章数量: !COUNT! 篇 (要求 >= 15，建议补充)"
)

:: ============================================================
:: 3. 检查关键文件
:: ============================================================
echo.
echo ========== 3. 关键文件检查 ==========
echo ========== 3. 关键文件检查 ========== >> "%REPORT_FILE%"

:: 检查 astro.config.mjs
if exist "!PROJECT_ROOT!\astro.config.mjs" (
    call :log_pass "astro.config.mjs 存在"
) else (
    call :log_error "astro.config.mjs 缺失"
)

:: 检查 package.json
if exist "!PROJECT_ROOT!\package.json" (
    call :log_pass "package.json 存在"
) else (
    call :log_error "package.json 缺失"
)

:: 检查 wrangler.toml
if exist "!PROJECT_ROOT!\wrangler.toml" (
    call :log_pass "wrangler.toml 存在"
) else (
    call :log_error "wrangler.toml 缺失"
)

:: 检查 .env 文件
if exist "!PROJECT_ROOT!\.env" (
    call :log_pass ".env 文件存在"
    :: 检查 .env 中是否设置了 HACKER_SECRET_KEY
    findstr /C:"HACKER_SECRET_KEY" "!PROJECT_ROOT!\.env" >nul 2>&1
    if !errorlevel! equ 0 (
        :: 检查值是否为空
        for /f "tokens=2 delims==" %%a in ('findstr /C:"HACKER_SECRET_KEY" "!PROJECT_ROOT!\.env"') do (
            set "SECRET_VAL=%%a"
        )
        if "!SECRET_VAL!"=="" (
            call :log_warn ".env 中 HACKER_SECRET_KEY 已声明但值为空"
        ) else (
            call :log_pass ".env 中 HACKER_SECRET_KEY 已设置"
        )
    ) else (
        call :log_error ".env 中缺少 HACKER_SECRET_KEY"
    )
) else (
    call :log_error ".env 文件缺失"
)

:: 检查 wrangler.toml 中 HACKER_SECRET_KEY
if exist "!PROJECT_ROOT!\wrangler.toml" (
    findstr /C:"HACKER_SECRET_KEY" "!PROJECT_ROOT!\wrangler.toml" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "wrangler.toml 中 HACKER_SECRET_KEY 已配置"
    ) else (
        call :log_warn "wrangler.toml 中缺少 HACKER_SECRET_KEY"
    )
)

:: ============================================================
:: 4. 检查 wrangler.toml 占位符
:: ============================================================
echo.
echo ========== 4. wrangler.toml 占位符检查 ==========
echo ========== 4. wrangler.toml 占位符检查 ========== >> "%REPORT_FILE%"

if exist "!PROJECT_ROOT!\wrangler.toml" (
    set "HAS_PLACEHOLDER=0"
    
    findstr /C:"YOUR_D1_DATABASE_ID" "!PROJECT_ROOT!\wrangler.toml" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_error "wrangler.toml 中存在未替换的占位符: YOUR_D1_DATABASE_ID"
        set "HAS_PLACEHOLDER=1"
    ) else (
        call :log_pass "wrangler.toml 中 YOUR_D1_DATABASE_ID 已替换"
    )
    
    findstr /C:"YOUR_KV_NAMESPACE_ID" "!PROJECT_ROOT!\wrangler.toml" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_error "wrangler.toml 中存在未替换的占位符: YOUR_KV_NAMESPACE_ID"
        set "HAS_PLACEHOLDER=1"
    ) else (
        call :log_pass "wrangler.toml 中 YOUR_KV_NAMESPACE_ID 已替换"
    )
    
    findstr /C:"YOUR_DEV_D1_ID" "!PROJECT_ROOT!\wrangler.toml" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_warn "wrangler.toml 中存在未替换的开发环境占位符: YOUR_DEV_D1_ID"
    ) else (
        call :log_pass "wrangler.toml 中 YOUR_DEV_D1_ID 已替换"
    )
    
    findstr /C:"YOUR_DEV_KV_ID" "!PROJECT_ROOT!\wrangler.toml" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_warn "wrangler.toml 中存在未替换的开发环境占位符: YOUR_DEV_KV_ID"
    ) else (
        call :log_pass "wrangler.toml 中 YOUR_DEV_KV_ID 已替换"
    )
)

:: ============================================================
:: 5. 检查 node_modules 和 npm 依赖
:: ============================================================
echo.
echo ========== 5. npm 依赖检查 ==========
echo ========== 5. npm 依赖检查 ========== >> "%REPORT_FILE%"

if exist "!PROJECT_ROOT!\node_modules" (
    call :log_pass "node_modules 目录存在"
) else (
    call :log_error "node_modules 目录缺失，请执行 npm install"
)

:: 检查 package.json 中的关键依赖是否已安装
if exist "!PROJECT_ROOT!\node_modules\astro" (
    call :log_pass "核心依赖 astro 已安装"
) else (
    call :log_error "核心依赖 astro 未安装"
)

if exist "!PROJECT_ROOT!\node_modules\@astrojs\cloudflare" (
    call :log_pass "核心依赖 @astrojs/cloudflare 已安装"
) else (
    call :log_error "核心依赖 @astrojs/cloudflare 未安装"
)

:: 检查 package-lock.json
if exist "!PROJECT_ROOT!\package-lock.json" (
    call :log_pass "package-lock.json 存在"
) else (
    call :log_warn "package-lock.json 缺失，依赖版本可能不一致"
)

:: ============================================================
:: 6. 检查 Git 仓库
:: ============================================================
echo.
echo ========== 6. Git 仓库检查 ==========
echo ========== 6. Git 仓库检查 ========== >> "%REPORT_FILE%"

if exist "!PROJECT_ROOT!\.git" (
    call :log_pass ".git 目录存在，项目已初始化 Git"
    REM Git Remote 检查在部署链路部分（第11节）
) else (
    call :log_error ".git 目录缺失，项目未初始化 Git 仓库"
)

:: ============================================================
:: 7. 检查 .gitignore
:: ============================================================
echo.
echo ========== 7. .gitignore 检查 ==========
echo ========== 7. .gitignore 检查 ========== >> "%REPORT_FILE%"

if exist "!PROJECT_ROOT!\.gitignore" (
    call :log_pass ".gitignore 文件存在"
    
    :: 检查关键忽略规则
    findstr /C:".env" "!PROJECT_ROOT!\.gitignore" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass ".gitignore 包含 .env 忽略规则"
    ) else (
        call :log_warn ".gitignore 缺少 .env 忽略规则，敏感信息可能泄露"
    )
    
    findstr /C:"node_modules" "!PROJECT_ROOT!\.gitignore" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass ".gitignore 包含 node_modules 忽略规则"
    ) else (
        call :log_warn ".gitignore 缺少 node_modules 忽略规则"
    )
    
    findstr /C:"oneclick_scripts" "!PROJECT_ROOT!\.gitignore" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass ".gitignore 包含 oneclick_scripts 忽略规则"
    ) else (
        call :log_warn ".gitignore 缺少 oneclick_scripts/*_config.ini 忽略规则，本地配置可能被提交"
    )
) else (
    call :log_error ".gitignore 文件缺失"
)

:: ============================================================
:: 8. 检查文章元数据完整性（frontmatter 字段）
:: ============================================================
echo.
echo ========== 8. 文章元数据完整性检查 ==========
echo ========== 8. 文章元数据完整性检查 ========== >> "%REPORT_FILE%"

:: 检查普通文章元数据
set "METADATA_OK=1"
for %%f in ("!PROJECT_ROOT!\src\content\posts\*.md") do (
    set "FILE_OK=1"
    :: 检查 title
    findstr /C:"title:" "%%f" >nul 2>&1
    if !errorlevel! neq 0 (
        call :log_warn "普通文章 %%~nxf 缺少 title 字段"
        set "FILE_OK=0"
    )
    :: 检查 date
    findstr /C:"date:" "%%f" >nul 2>&1
    if !errorlevel! neq 0 (
        call :log_warn "普通文章 %%~nxf 缺少 date 字段"
        set "FILE_OK=0"
    )
    :: 检查 slug
    findstr /C:"slug:" "%%f" >nul 2>&1
    if !errorlevel! neq 0 (
        call :log_warn "普通文章 %%~nxf 缺少 slug 字段"
        set "FILE_OK=0"
    )
    if "!FILE_OK!"=="1" (
        call :log_pass "普通文章 %%~nxf 元数据完整"
    )
)

:: 检查黑客文章元数据
for %%f in ("!PROJECT_ROOT!\src\content\hacker-posts\*.md") do (
    set "FILE_OK=1"
    findstr /C:"title:" "%%f" >nul 2>&1
    if !errorlevel! neq 0 (
        call :log_warn "黑客文章 %%~nxf 缺少 title 字段"
        set "FILE_OK=0"
    )
    findstr /C:"date:" "%%f" >nul 2>&1
    if !errorlevel! neq 0 (
        call :log_warn "黑客文章 %%~nxf 缺少 date 字段"
        set "FILE_OK=0"
    )
    findstr /C:"slug:" "%%f" >nul 2>&1
    if !errorlevel! neq 0 (
        call :log_warn "黑客文章 %%~nxf 缺少 slug 字段"
        set "FILE_OK=0"
    )
    if "!FILE_OK!"=="1" (
        call :log_pass "黑客文章 %%~nxf 元数据完整"
    )
)

:: ============================================================
:: 9. 检查前端关键组件文件
:: ============================================================
echo.
echo ========== 9. 前端关键组件检查 ==========
echo ========== 9. 前端关键组件检查 ========== >> "%REPORT_FILE%"

:: 黑客模式组件
if exist "!PROJECT_ROOT!\src\components\HackerMode.astro" (
    call :log_pass "HackerMode.astro 存在（隐秘黑客模式）"
) else (
    call :log_error "HackerMode.astro 缺失"
)

:: 设置面板
if exist "!PROJECT_ROOT!\src\components\SettingsPanel.astro" (
    call :log_pass "SettingsPanel.astro 存在（设置面板）"
) else (
    call :log_error "SettingsPanel.astro 缺失"
)

:: 搜索框
if exist "!PROJECT_ROOT!\src\components\SearchBox.astro" (
    call :log_pass "SearchBox.astro 存在（搜索功能）"
) else (
    call :log_error "SearchBox.astro 缺失"
)

:: 文章卡片
if exist "!PROJECT_ROOT!\src\components\PostCard.astro" (
    call :log_pass "PostCard.astro 存在（文章卡片）"
) else (
    call :log_error "PostCard.astro 缺失"
)

:: 基础布局
if exist "!PROJECT_ROOT!\src\layouts\BaseLayout.astro" (
    call :log_pass "BaseLayout.astro 存在（基础布局）"
) else (
    call :log_error "BaseLayout.astro 缺失"
)

:: 全局样式
if exist "!PROJECT_ROOT!\src\styles\global.css" (
    call :log_pass "global.css 存在（全局样式）"
) else (
    call :log_error "global.css 缺失"
)

:: 文章详情页
if exist "!PROJECT_ROOT!\src\pages\posts\[slug].astro" (
    call :log_pass "[slug].astro 存在（文章详情页）"
) else (
    call :log_error "[slug].astro 缺失"
)

:: 首页
if exist "!PROJECT_ROOT!\src\pages\index.astro" (
    call :log_pass "index.astro 存在（首页）"
) else (
    call :log_error "index.astro 缺失"
)

:: 标签页
if exist "!PROJECT_ROOT!\src\pages\tags\index.astro" (
    call :log_pass "tags/index.astro 存在（标签索引页）"
) else (
    call :log_warn "tags/index.astro 缺失"
)

if exist "!PROJECT_ROOT!\src\pages\tags\[tag].astro" (
    call :log_pass "tags/[tag].astro 存在（标签筛选页）"
) else (
    call :log_warn "tags/[tag].astro 缺失"
)

:: 工具函数
if exist "!PROJECT_ROOT!\src\lib\utils.ts" (
    call :log_pass "utils.ts 存在（工具函数）"
) else (
    call :log_warn "utils.ts 缺失"
)

:: ============================================================
:: 10. 检查 TUI 工具
:: ============================================================
echo.
echo ========== 10. TUI 工具检查 ==========
echo ========== 10. TUI 工具检查 ========== >> "%REPORT_FILE%"

if exist "!PROJECT_ROOT!\tui\index.js" (
    call :log_pass "tui/index.js 存在（TUI 主入口）"
) else (
    call :log_error "tui/index.js 缺失"
)

:: 检查 blessed 依赖
if exist "!PROJECT_ROOT!\node_modules\blessed" (
    call :log_pass "blessed 依赖已安装（TUI 界面库）"
) else (
    call :log_warn "blessed 依赖未安装，TUI 可能无法启动"
)

:: ============================================================
:: 11. 检查部署链路（GitHub Actions + Cloudflare）
:: ============================================================
echo.
echo ========== 11. 部署链路检查 ==========
echo ========== 11. 部署链路检查 ========== >> "%REPORT_FILE%"

:: 检查 GitHub Actions 工作流
if exist "!PROJECT_ROOT!\.github\workflows" (
    call :log_pass ".github/workflows 目录存在"
    for %%f in ("!PROJECT_ROOT!\.github\workflows\*.yml") do (
        call :log_pass "GitHub Actions 工作流: %%~nxf"
    )
) else (
    call :log_warn ".github/workflows 目录不存在，可能缺少 CI/CD 配置"
)

:: 检查 Cloudflare Pages 配置
if exist "!PROJECT_ROOT!\wrangler.toml" (
    findstr /C:"pages_build_output_dir" "!PROJECT_ROOT!\wrangler.toml" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "wrangler.toml 包含 pages 构建输出配置"
    ) else (
        call :log_warn "wrangler.toml 缺少 pages_build_output_dir 配置"
    )
)

:: 检查 Git Remote
pushd "!PROJECT_ROOT!" 2>nul
if exist ".git" (
    git remote get-url origin >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%r in ('git remote get-url origin 2^>nul') do (
            call :log_pass "Git Remote 已配置: %%r"
        )
    ) else (
        call :log_warn "Git Remote 未配置，请执行 git remote add origin 仓库地址"
    )
)
popd 2>nul

:: ============================================================
:: 12. 检查一键脚本完整性
:: ============================================================
echo.
echo ========== 12. 一键脚本完整性检查 ==========
echo ========== 12. 一键脚本完整性检查 ========== >> "%REPORT_FILE%"

set "SCRIPT_DIRS=01_一键自检完整性 02_一键提交到GitHub 03_一键GitHub部署CloudflarePages 04_本地开发服务 05_TUI工具"
for %%d in (%SCRIPT_DIRS%) do (
    if exist "!PROJECT_ROOT!\oneclick_scripts\%%d" (
        call :log_pass "脚本目录存在: oneclick_scripts/%%d"
    ) else (
        call :log_error "脚本目录缺失: oneclick_scripts/%%d"
    )
)

:: 检查关键脚本文件
set "BAT_FILES=01_一键自检完整性\check_project.bat 02_一键提交到GitHub\push_github.bat 03_一键GitHub部署CloudflarePages\deploy_cloudflare.bat 04_本地开发服务\start_dev.bat 04_本地开发服务\stop_dev.bat 05_TUI工具\start_tui.bat 05_TUI工具\stop_tui.bat"
for %%b in (%BAT_FILES%) do (
    if exist "!PROJECT_ROOT!\oneclick_scripts\%%b" (
        call :log_pass "脚本文件存在: %%b"
    ) else (
        call :log_error "脚本文件缺失: %%b"
    )
)

:: 检查 project_local_path.txt
if exist "!PROJECT_ROOT!\project_local_path.txt" (
    call :log_pass "project_local_path.txt 存在"
) else (
    call :log_error "project_local_path.txt 缺失，一键脚本将无法读取项目路径"
)

:: ============================================================
:: 13. 检查文档完整性
:: ============================================================
echo.
echo ========== 13. 文档完整性检查 ==========
echo ========== 13. 文档完整性检查 ========== >> "%REPORT_FILE%"

if exist "!PROJECT_ROOT!\docs" (
    call :log_pass "docs 目录存在"
    set "DOC_COUNT=0"
    for %%d in ("!PROJECT_ROOT!\docs\*.md") do set /a DOC_COUNT=!DOC_COUNT!+1
    call :log_pass "文档文件数量: !DOC_COUNT! 个"
) else (
    call :log_warn "docs 目录不存在"
)

:: 检查关键文档
set "DOCS=01-项目使用教程.md 02-TUI使用教程.md 06-隐秘黑客模式使用教程.md 07-Markdown写作指南.md 08-一键脚本使用文档.md 测试用例-黑客文章门禁验证.md"
for %%d in (%DOCS%) do (
    if exist "!PROJECT_ROOT!\docs\%%d" (
        call :log_pass "文档存在: %%d"
    ) else (
        call :log_warn "文档缺失: %%d"
    )
)

:: ============================================================
:: 14. 检查新增组件（侧边栏、健康检测、标签隔离）
:: ============================================================
echo.
echo ========== 14. 新增组件完整性检查 ==========
echo ========== 14. 新增组件完整性检查 ========== >> "%REPORT_FILE%"

:: 侧边栏组件
if exist "!PROJECT_ROOT!\src\components\Sidebar.astro" (
    call :log_pass "Sidebar.astro 存在（常驻左侧侧边栏）"
) else (
    call :log_error "Sidebar.astro 缺失"
)

:: 健康检测组件（嵌入设置面板）
if exist "!PROJECT_ROOT!\src\components\HealthCheck.astro" (
    call :log_pass "HealthCheck.astro 存在（站点健康检测）"
) else (
    call :log_error "HealthCheck.astro 缺失"
)

:: 检查 HealthCheck 是否包含导出日志功能
if exist "!PROJECT_ROOT!\src\components\HealthCheck.astro" (
    findstr /C:"exportHealthLog" "!PROJECT_ROOT!\src\components\HealthCheck.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "HealthCheck.astro 包含导出日志功能"
    ) else (
        call :log_warn "HealthCheck.astro 缺少导出日志功能"
    )
)

:: 检查悬浮球是否已移除（HealthCheck 不应再包含 floating button）
if exist "!PROJECT_ROOT!\src\components\HealthCheck.astro" (
    findstr /C:"health-check-panel" "!PROJECT_ROOT!\src\components\HealthCheck.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_warn "HealthCheck.astro 仍包含悬浮球相关代码，请确认已移除"
    ) else (
        call :log_pass "悬浮球代码已移除（HealthCheck 嵌入设置面板）"
    )
)

:: 检查 BaseLayout 是否移除了 HealthCheck 独立引用
if exist "!PROJECT_ROOT!\src\layouts\BaseLayout.astro" (
    findstr /C:"HealthCheck" "!PROJECT_ROOT!\src\layouts\BaseLayout.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_warn "BaseLayout.astro 仍包含 HealthCheck 引用，应为 SettingsPanel 内嵌"
    ) else (
        call :log_pass "BaseLayout.astro 已移除独立 HealthCheck 引用"
    )
)

:: 检查 SettingsPanel 是否包含健康检测
if exist "!PROJECT_ROOT!\src\components\SettingsPanel.astro" (
    findstr /C:"HealthCheck" "!PROJECT_ROOT!\src\components\SettingsPanel.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "SettingsPanel.astro 包含健康检测模块"
    ) else (
        call :log_warn "SettingsPanel.astro 缺少健康检测模块"
    )
)

:: 检查标签隔离：文章列表页是否包含 data-post-type
if exist "!PROJECT_ROOT!\src\pages\posts\index.astro" (
    findstr /C:"data-post-type" "!PROJECT_ROOT!\src\pages\posts\index.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "文章列表页包含 data-post-type 标签隔离"
    ) else (
        call :log_warn "文章列表页缺少 data-post-type 标签隔离"
    )
)

if exist "!PROJECT_ROOT!\src\pages\index.astro" (
    findstr /C:"data-post-type" "!PROJECT_ROOT!\src\pages\index.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "首页包含 data-post-type 标签隔离"
    ) else (
        call :log_warn "首页缺少 data-post-type 标签隔离"
    )
)

if exist "!PROJECT_ROOT!\src\pages\tags\index.astro" (
    findstr /C:"data-post-type" "!PROJECT_ROOT!\src\pages\tags\index.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "标签页包含 data-post-type 标签隔离"
    ) else (
        call :log_warn "标签页缺少 data-post-type 标签隔离"
    )
)

:: 检查毛玻璃 CSS 变量
if exist "!PROJECT_ROOT!\src\styles\global.css" (
    findstr /C:"--glass-blur" "!PROJECT_ROOT!\src\styles\global.css" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "global.css 包含 --glass-blur CSS 变量（毛玻璃强度）"
    ) else (
        call :log_warn "global.css 缺少 --glass-blur CSS 变量"
    )
)

:: 检查瀑布流 CSS 变量
if exist "!PROJECT_ROOT!\src\styles\global.css" (
    findstr /C:"--masonry-cols" "!PROJECT_ROOT!\src\styles\global.css" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "global.css 包含 --masonry-cols CSS 变量（瀑布流列数）"
    ) else (
        call :log_warn "global.css 缺少 --masonry-cols CSS 变量"
    )
)

:: 检查 SettingsPanel 的 applyToDOM 是否包含毛玻璃强度
if exist "!PROJECT_ROOT!\src\components\SettingsPanel.astro" (
    findstr /C:"--glass-blur" "!PROJECT_ROOT!\src\components\SettingsPanel.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "SettingsPanel 设置毛玻璃 CSS 变量 --glass-blur"
    ) else (
        call :log_warn "SettingsPanel 缺少毛玻璃 CSS 变量设置"
    )
)

:: 检查 SettingsPanel 的 applyToDOM 是否包含瀑布流列数
if exist "!PROJECT_ROOT!\src\components\SettingsPanel.astro" (
    findstr /C:"--masonry-cols" "!PROJECT_ROOT!\src\components\SettingsPanel.astro" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_pass "SettingsPanel 设置瀑布流 CSS 变量 --masonry-cols"
    ) else (
        call :log_warn "SettingsPanel 缺少瀑布流 CSS 变量设置"
    )
)

:: ============================================================
:: 输出汇总
:: ============================================================
:END
echo.
echo ============================================================
echo           自检汇总
echo ============================================================
echo   通过:  !PASS! 项
echo   警告:  !WARN! 项
echo   错误:  !ERR! 项
echo ============================================================

(
    echo.
    echo ============================================================
    echo           自检汇总
    echo ============================================================
    echo   通过:  !PASS! 项
    echo   警告:  !WARN! 项
    echo   错误:  !ERR! 项
    echo ============================================================
) >> "%REPORT_FILE%"

if !ERR! GTR 0 (
    echo.
    echo [ERROR] 存在 !ERR! 个阻塞性错误，强烈建议修复后再部署！
    echo [ERROR] 存在 !ERR! 个阻塞性错误，强烈建议修复后再部署！ >> "%REPORT_FILE%"
) else (
    echo.
    echo [OK] 所有阻塞性检查通过，可以部署！
    echo [OK] 所有阻塞性检查通过，可以部署！ >> "%REPORT_FILE%"
)

if !WARN! GTR 0 (
    echo [WARN] 存在 !WARN! 个警告项，建议在部署前检查。
    echo [WARN] 存在 !WARN! 个警告项，建议在部署前检查。 >> "%REPORT_FILE%"
)

:: 保存报告
echo.
echo [信息] 报告已保存至: %REPORT_FILE%
echo [信息] 报告已保存至: %REPORT_FILE% >> "%REPORT_FILE%"

:: 打开报告文件
start "" "%REPORT_FILE%"

:: 暂停以便查看
echo.
echo 按任意键关闭窗口...
pause >nul
exit /b 0

:: ============================================================
:: 辅助函数
:: ============================================================

:log_pass
set /a PASS+=1
echo [✓] %~1
echo [✓] %~1 >> "%REPORT_FILE%"
exit /b 0

:log_warn
set /a WARN+=1
echo [⚠] %~1
echo [⚠] %~1 >> "%REPORT_FILE%"
exit /b 0

:log_error
set /a ERR+=1
echo [✗] %~1
echo [✗] %~1 >> "%REPORT_FILE%"
exit /b 0