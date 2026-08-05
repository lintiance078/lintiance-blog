@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: 博客 TUI 管理工具启动脚本
:: 功能: 启动基于 blessed 的终端 UI 管理工具
:: 说明: TUI 在当前的终端窗口中运行，提供可视化的博客管理界面
:: ============================================================

echo ============================================================
echo    博客 TUI 管理工具启动
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

:: ----------------------------------------------------------
:: 步骤 5: 检查 TUI 入口文件是否存在
:: ----------------------------------------------------------
set "TUI_ENTRY=%PROJECT_PATH%\tui\index.js"

if not exist "%TUI_ENTRY%" (
    echo [错误] 找不到 TUI 入口文件: %TUI_ENTRY%
    echo 请确保项目根目录下存在 tui\index.js 文件。
    pause
    exit /b 1
)

echo [信息] TUI 入口文件: tui\index.js

echo.
echo ============================================================
echo    正在启动 TUI 管理工具...
echo ============================================================
echo.
echo [信息] TUI 是基于 blessed 库的终端 UI 工具，将在当前窗口中运行。
echo [信息] 使用方向键和回车键进行操作，按 Ctrl+C 或 q 键退出。
echo [信息] 如果界面显示异常，请确保终端窗口足够大（建议 80x24 以上）。
echo.

:: ----------------------------------------------------------
:: 步骤 6: 启动 TUI
:: ----------------------------------------------------------
node tui/index.js

:: 如果 TUI 异常退出，显示错误信息
if %errorlevel% neq 0 (
    echo.
    echo [错误] TUI 工具异常退出（退出码: %errorlevel%）。
    echo 可能的原因:
    echo   1. blessed 模块未正确安装（请检查 package.json 中是否有 blessed 依赖）
    echo   2. tui/index.js 文件存在语法错误
    echo   3. 终端窗口大小不满足要求
    echo 请检查上述问题后重试。
    pause
    exit /b 1
)

echo.
echo [信息] TUI 管理工具已正常退出。
pause
endlocal