@echo off
:: ============================================================
:: GitHub 一键提交推送脚本
:: 功能: 自动将所有更改提交并推送到 GitHub 远程仓库
:: 依赖: Git 命令行工具
:: ============================================================

:: 设置控制台编码为 UTF-8，确保中文正常显示
chcp 65001 >nul

:: ----------------------------------------------------------
:: 第一步: 读取项目路径
:: ----------------------------------------------------------
echo [信息] 正在读取项目路径...

:: 项目路径文件位于脚本的上两级目录
set "PROJECT_PATH_FILE=%~dp0..\..\project_local_path.txt"

:: 检查项目路径文件是否存在
if not exist "%PROJECT_PATH_FILE%" (
    echo [错误] 找不到项目路径文件: %PROJECT_PATH_FILE%
    echo [提示] 请先运行项目初始化脚本，或手动创建 project_local_path.txt 文件
    pause
    exit /b 1
)

:: 读取项目路径（读取文件第一行）
set "PROJECT_PATH="
for /f "usebackq delims=" %%i in ("%PROJECT_PATH_FILE%") do (
    set "PROJECT_PATH=%%i"
    goto :read_done
)
:read_done

:: 去除路径末尾可能存在的空格
for %%i in ("%PROJECT_PATH%") do set "PROJECT_PATH=%%~fi"

:: 检查项目路径是否为空
if "%PROJECT_PATH%"=="" (
    echo [错误] 项目路径为空，请检查 %PROJECT_PATH_FILE% 文件内容
    pause
    exit /b 1
)

:: 检查项目路径是否存在
if not exist "%PROJECT_PATH%" (
    echo [错误] 项目路径不存在: %PROJECT_PATH%
    echo [提示] 请检查 project_local_path.txt 中的路径是否正确
    pause
    exit /b 1
)

echo [信息] 项目路径: %PROJECT_PATH%

:: ----------------------------------------------------------
:: 第二步: 读取配置文件
:: ----------------------------------------------------------
echo [信息] 正在读取 GitHub 配置...

:: 配置文件与脚本在同一目录
set "CONFIG_FILE=%~dp0github_config.ini"

:: 检查配置文件是否存在
if not exist "%CONFIG_FILE%" (
    echo [错误] 找不到配置文件: %CONFIG_FILE%
    echo [提示] 请确保 github_config.ini 与脚本在同一目录下
    pause
    exit /b 1
)

:: 读取 GITHUB_REPO_URL（从配置文件中查找以 GITHUB_REPO_URL 开头的行，取 = 后面的值）
for /f "tokens=2 delims==" %%a in ('findstr /b /c:"GITHUB_REPO_URL" "%CONFIG_FILE%" 2^>nul') do set "GITHUB_REPO_URL=%%a"
:: 去除值首尾空格
for /f "tokens=*" %%a in ("%GITHUB_REPO_URL%") do set "GITHUB_REPO_URL=%%a"

:: 读取 GITHUB_TOKEN（从配置文件中查找以 GITHUB_TOKEN 开头的行，取 = 后面的值）
for /f "tokens=2 delims==" %%a in ('findstr /b /c:"GITHUB_TOKEN" "%CONFIG_FILE%" 2^>nul') do set "GITHUB_TOKEN=%%a"
:: 去除值首尾空格
for /f "tokens=*" %%a in ("%GITHUB_TOKEN%") do set "GITHUB_TOKEN=%%a"

:: 检查配置值是否已填写
set "CONFIG_ERROR=0"
if "%GITHUB_REPO_URL%"=="" set "CONFIG_ERROR=1"
if "%GITHUB_REPO_URL%"=="https://github.com/YOUR_USERNAME/YOUR_REPO" set "CONFIG_ERROR=1"
if "%GITHUB_TOKEN%"=="" set "CONFIG_ERROR=1"
if "%GITHUB_TOKEN%"=="YOUR_GITHUB_TOKEN_HERE" set "CONFIG_ERROR=1"

if "%CONFIG_ERROR%"=="1" (
    echo.
    echo ============================================================
    echo [错误] 配置文件未正确填写！
    echo ============================================================
    echo.
    echo   请编辑以下文件并填入正确的配置信息:
    echo     %CONFIG_FILE%
    echo.
    echo   需要填写的配置项:
    echo     1. GITHUB_REPO_URL  - GitHub 仓库地址
    echo     2. GITHUB_TOKEN     - GitHub Personal Access Token
    echo.
    echo   Token 获取方式: GitHub Settings ^> Developer settings
    echo                   ^> Personal access tokens ^> Tokens (classic)
    echo   所需权限: repo (完整仓库读写权限)
    echo ============================================================
    echo.
    pause
    exit /b 1
)

echo [信息] 仓库地址: %GITHUB_REPO_URL%
echo [信息] Token 已配置

:: ----------------------------------------------------------
:: 第三步: 检查 Git 是否安装
:: ----------------------------------------------------------
echo [信息] 正在检查 Git 环境...

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Git，请先安装 Git for Windows
    echo [提示] 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('git --version') do echo [信息] %%i

:: ----------------------------------------------------------
:: 第四步: 切换到项目目录并检查状态
:: ----------------------------------------------------------
echo [信息] 正在切换到项目目录...
cd /d "%PROJECT_PATH%"

:: 检查当前目录是否为 Git 仓库
git rev-parse --git-dir >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 当前目录不是 Git 仓库: %PROJECT_PATH%
    echo [提示] 请确保项目路径正确，并使用 git init 初始化仓库
    pause
    exit /b 1
)

:: 显示当前 Git 状态
echo.
echo ============================================================
echo   Git 仓库状态
echo ============================================================
git status
echo ============================================================
echo.

:: 检查是否有变更
git diff --quiet --exit-code && git diff --cached --quiet --exit-code
if %errorlevel% equ 0 (
    echo [信息] 没有检测到任何变更，无需提交
    echo [提示] 如果确认有变更，请检查 .gitignore 文件配置
    pause
    exit /b 0
)

:: ----------------------------------------------------------
:: 第五步: 获取提交信息
:: ----------------------------------------------------------
echo.
echo ============================================================
echo   请输入提交信息（Commit Message）
echo ============================================================

:: 生成默认提交信息（格式: Update: 2024-01-01 12:00:00）
set "DEFAULT_MSG=Update: %date% %time%"

echo   默认提交信息: %DEFAULT_MSG%
echo.
set /p "COMMIT_MSG=请输入提交信息（直接回车使用默认信息）: "

:: 如果用户没有输入，使用默认信息
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=%DEFAULT_MSG%"

echo.
echo [信息] 提交信息: %COMMIT_MSG%

:: ----------------------------------------------------------
:: 第六步: 添加所有更改
:: ----------------------------------------------------------
echo [信息] 正在添加所有更改到暂存区...
git add --all

if %errorlevel% neq 0 (
    echo [错误] git add 执行失败
    pause
    exit /b 1
)

echo [信息] 所有更改已添加到暂存区

:: ----------------------------------------------------------
:: 第七步: 提交更改
:: ----------------------------------------------------------
echo [信息] 正在提交更改...
git commit -m "%COMMIT_MSG%"

if %errorlevel% neq 0 (
    echo [错误] git commit 执行失败
    echo [提示] 可能是提交信息包含特殊字符，或存在冲突
    pause
    exit /b 1
)

echo [信息] 提交成功

:: ----------------------------------------------------------
:: 第八步: 推送到 GitHub
:: ----------------------------------------------------------
echo [信息] 正在推送到 GitHub...

:: 获取当前分支名
for /f "tokens=*" %%i in ('git branch --show-current') do set "CURRENT_BRANCH=%%i"
echo [信息] 当前分支: %CURRENT_BRANCH%

:: 从仓库 URL 中提取仓库地址部分（去掉 https:// 前缀）
:: 示例: https://github.com/user/repo → github.com/user/repo
set "REPO_BASE=%GITHUB_REPO_URL:https://=%"

:: 构造带 Token 的推送 URL
:: 格式: https://TOKEN@github.com/user/repo.git
set "PUSH_URL=https://%GITHUB_TOKEN%@%REPO_BASE%"

echo [信息] 正在推送到远程仓库...

:: 执行推送（使用带 Token 的 URL，隐藏实际 Token 输出）
git push "%PUSH_URL%" "%CURRENT_BRANCH%"

:: 检查推送结果
if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo   [成功] 代码已成功推送到 GitHub！
    echo ============================================================
    echo   仓库: %GITHUB_REPO_URL%
    echo   分支: %CURRENT_BRANCH%
    echo   提交: %COMMIT_MSG%
    echo ============================================================
    echo.
) else (
    echo.
    echo ============================================================
    echo   [失败] 推送到 GitHub 失败！
    echo ============================================================
    echo.
    echo   可能的原因:
    echo     1. Token 无效或已过期
    echo     2. Token 权限不足（需要 repo 权限）
    echo     3. 网络连接问题
    echo     4. 远程仓库不存在或无推送权限
    echo     5. 远程分支有新的提交，需要先拉取
    echo.
    echo   建议操作:
    echo     1. 检查 Token 是否正确: GitHub Settings ^> Developer
    echo        settings ^> Personal access tokens ^> Tokens
    echo     2. 确认 Token 具有 repo 权限
    echo     3. 尝试先执行 git pull 拉取最新代码
    echo ============================================================
    echo.
    pause
    exit /b 1
)

:: ----------------------------------------------------------
:: 完成
:: ----------------------------------------------------------
pause
exit /b 0