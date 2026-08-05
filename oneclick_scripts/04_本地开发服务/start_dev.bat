@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: Astro 本地开发服务启动脚本
:: 功能: 启动 Astro 开发服务器，用于本地开发和预览
:: 默认端口: 4321
:: ============================================================

echo ============================================================
echo    Astro 本地开发服务启动
echo ============================================================
echo.

:: ----------------------------------------------------------
:: 步骤 1: 读取项目路径
:: ----------------------------------------------------------
set "PROJECT_PATH_FILE=%~dp0..\..\project_local_path.txt"

if not exist "%PROJECT_PATH_FILE%" (
    echo [错误] 找不到项目路径文件: %PROJECT_PATH_FILE%
    echo 请确保 project_local_path.txt 文件存在且包含正确的项目路径。
    pause
    exit /b 1
)

:: 读取项目路径（去除首尾空格）
for /f "usebackq delims=" %%i in ("%PROJECT_PATH_FILE%") do (
    set "PROJECT_PATH=%%i"
)
echo [信息] 项目路径: %PROJECT_PATH%

:: ----------------------------------------------------------
:: 步骤 2: 切换到项目根目录
:: ----------------------------------------------------------
cd /d "%PROJECT_PATH%"

if %errorlevel% neq 0 (
    echo [错误] 无法切换到项目目录: %PROJECT_PATH%
    echo 请检查 project_local_path.txt 中的路径是否正确。
    pause
    exit /b 1
)

echo [信息] 当前目录: %CD%

:: ----------------------------------------------------------
:: 步骤 3: 检查 Node.js 环境
:: ----------------------------------------------------------
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境。
    echo 请先安装 Node.js（推荐版本: 18.x 或更高）:
    echo   https://nodejs.org/
    pause
    exit /b 1
)

:: 显示 Node.js 版本
for /f "tokens=*" %%i in ('node -v') do set "NODE_VERSION=%%i"
echo [信息] Node.js 版本: %NODE_VERSION%

:: 显示 npm 版本
for /f "tokens=*" %%i in ('npm -v') do set "NPM_VERSION=%%i"
echo [信息] npm 版本: %NPM_VERSION%

:: ----------------------------------------------------------
:: 步骤 4: 检查 node_modules 目录
:: ----------------------------------------------------------
if not exist "node_modules" (
    echo [警告] 未检测到 node_modules 目录，开始安装依赖...
    echo [信息] 正在执行: npm install
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [错误] npm install 执行失败，请检查以下可能原因:
        echo   1. 网络连接问题（可以尝试切换 npm 镜像源）
        echo   2. package.json 文件损坏或缺失
        echo   3. 磁盘空间不足
        echo 你可以手动运行 npm install 查看详细错误信息。
        pause
        exit /b 1
    )
    echo [信息] 依赖安装完成。
) else (
    echo [信息] node_modules 目录已存在，跳过依赖安装。
)

echo.

:: ----------------------------------------------------------
:: 步骤 5: 启动 Astro 开发服务器
:: ----------------------------------------------------------
echo ============================================================
echo    正在启动 Astro 开发服务器...
echo ============================================================
echo.
echo [信息] 执行命令: npx astro dev --host
echo [信息] Astro 开发服务器默认运行在端口 4321
echo.

:: 启动开发服务器
:: --host 参数使服务器监听所有网络接口，允许局域网访问
npx astro dev --host

:: 如果 astro dev 命令执行失败，显示错误信息
if %errorlevel% neq 0 (
    echo.
    echo [错误] Astro 开发服务器启动失败。
    echo 可能的原因:
    echo   1. 端口 4321 已被占用（请先运行 stop_dev.bat 停止已有服务）
    echo   2. astro 依赖未正确安装
    echo   3. astro.config.mjs 配置有误
    echo 请检查上述问题后重试。
    pause
    exit /b 1
)

:: 注意: npx astro dev 会持续运行，以下代码仅在服务器停止后执行
echo.
echo [信息] Astro 开发服务器已停止。
pause
endlocal