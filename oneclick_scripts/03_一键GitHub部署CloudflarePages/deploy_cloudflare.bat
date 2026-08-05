@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: Cloudflare Pages 一键部署脚本
:: 功能: 通过 GitHub Actions 触发 Cloudflare Pages 部署
:: 依赖: github_config.ini (GitHub 仓库配置)
::       cloudflare_config.ini (Cloudflare 配置)
:: ============================================================

echo ============================================================
echo    Cloudflare Pages 一键部署脚本
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
:: 步骤 2: 读取 GitHub 配置文件
:: ----------------------------------------------------------
set "GITHUB_CONFIG_FILE=%~dp0..\02_一键提交到GitHub\github_config.ini"

if not exist "%GITHUB_CONFIG_FILE%" (
    echo [错误] 找不到 GitHub 配置文件: %GITHUB_CONFIG_FILE%
    echo 请确保已在 02_一键提交到GitHub 目录下配置好 github_config.ini。
    pause
    exit /b 1
)

:: 从 github_config.ini 中提取 GITHUB_REPO_URL
for /f "usebackq tokens=2 delims==" %%i in (`findstr /b "GITHUB_REPO_URL" "%GITHUB_CONFIG_FILE%"`) do (
    set "GITHUB_REPO_URL=%%i"
)
:: 去除首尾空格
set "GITHUB_REPO_URL=%GITHUB_REPO_URL: =%"

:: 从 github_config.ini 中提取 GITHUB_TOKEN
for /f "usebackq tokens=2 delims==" %%i in (`findstr /b "GITHUB_TOKEN" "%GITHUB_CONFIG_FILE%"`) do (
    set "GITHUB_TOKEN=%%i"
)
:: 去除首尾空格
set "GITHUB_TOKEN=%GITHUB_TOKEN: =%"

echo [信息] GitHub 仓库地址: %GITHUB_REPO_URL%

:: ----------------------------------------------------------
:: 步骤 3: 读取 Cloudflare 配置文件
:: ----------------------------------------------------------
set "CF_CONFIG_FILE=%~dp0cloudflare_config.ini"

if not exist "%CF_CONFIG_FILE%" (
    echo [错误] 找不到 Cloudflare 配置文件: %CF_CONFIG_FILE%
    echo 请确保 cloudflare_config.ini 文件存在且已正确配置。
    pause
    exit /b 1
)

:: 从 cloudflare_config.ini 中提取配置值
for /f "usebackq tokens=2 delims==" %%i in (`findstr /b "CLOUDFLARE_ACCOUNT_ID" "%CF_CONFIG_FILE%"`) do (
    set "CF_ACCOUNT_ID=%%i"
)
for /f "usebackq tokens=2 delims==" %%i in (`findstr /b "CLOUDFLARE_PROJECT_NAME" "%CF_CONFIG_FILE%"`) do (
    set "CF_PROJECT_NAME=%%i"
)
for /f "usebackq tokens=2 delims==" %%i in (`findstr /b "CLOUDFLARE_API_TOKEN" "%CF_CONFIG_FILE%"`) do (
    set "CF_API_TOKEN=%%i"
)

:: 去除首尾空格
set "CF_ACCOUNT_ID=%CF_ACCOUNT_ID: =%"
set "CF_PROJECT_NAME=%CF_PROJECT_NAME: =%"
set "CF_API_TOKEN=%CF_API_TOKEN: =%"

:: ----------------------------------------------------------
:: 步骤 4: 验证配置值是否已填写
:: ----------------------------------------------------------
:: 检查 GITHUB_REPO_URL
if "%GITHUB_REPO_URL%"=="" (
    echo [错误] github_config.ini 中的 GITHUB_REPO_URL 为空，请先填写。
    pause
    exit /b 1
)
:: 检查是否是占位符
echo %GITHUB_REPO_URL% | findstr /i "YOUR_USERNAME YOUR_REPO" >nul
if %errorlevel% equ 0 (
    echo [错误] github_config.ini 中的 GITHUB_REPO_URL 仍为占位符，请填写真实的仓库地址。
    echo 当前值: %GITHUB_REPO_URL%
    pause
    exit /b 1
)

:: 检查 GITHUB_TOKEN
if "%GITHUB_TOKEN%"=="" (
    echo [错误] github_config.ini 中的 GITHUB_TOKEN 为空，请先填写。
    pause
    exit /b 1
)
echo %GITHUB_TOKEN% | findstr /i "YOUR_GITHUB_TOKEN_HERE" >nul
if %errorlevel% equ 0 (
    echo [错误] github_config.ini 中的 GITHUB_TOKEN 仍为占位符，请填写真实的 Token。
    pause
    exit /b 1
)

:: 检查 CLOUDFLARE_ACCOUNT_ID
if "%CF_ACCOUNT_ID%"=="" (
    echo [错误] cloudflare_config.ini 中的 CLOUDFLARE_ACCOUNT_ID 为空，请先填写。
    pause
    exit /b 1
)
echo %CF_ACCOUNT_ID% | findstr /i "YOUR_CLOUDFLARE_ACCOUNT_ID" >nul
if %errorlevel% equ 0 (
    echo [错误] cloudflare_config.ini 中的 CLOUDFLARE_ACCOUNT_ID 仍为占位符，请填写真实的账户 ID。
    pause
    exit /b 1
)

:: 检查 CLOUDFLARE_PROJECT_NAME
if "%CF_PROJECT_NAME%"=="" (
    echo [错误] cloudflare_config.ini 中的 CLOUDFLARE_PROJECT_NAME 为空，请先填写。
    pause
    exit /b 1
)
echo %CF_PROJECT_NAME% | findstr /i "YOUR_PROJECT_NAME" >nul
if %errorlevel% equ 0 (
    echo [错误] cloudflare_config.ini 中的 CLOUDFLARE_PROJECT_NAME 仍为占位符，请填写真实项目名称。
    pause
    exit /b 1
)

:: 检查 CLOUDFLARE_API_TOKEN
if "%CF_API_TOKEN%"=="" (
    echo [错误] cloudflare_config.ini 中的 CLOUDFLARE_API_TOKEN 为空，请先填写。
    pause
    exit /b 1
)
echo %CF_API_TOKEN% | findstr /i "YOUR_CLOUDFLARE_API_TOKEN" >nul
if %errorlevel% equ 0 (
    echo [错误] cloudflare_config.ini 中的 CLOUDFLARE_API_TOKEN 仍为占位符，请填写真实的 API Token。
    pause
    exit /b 1
)

echo [信息] 所有配置验证通过。
echo [信息] Cloudflare 账户 ID: %CF_ACCOUNT_ID%
echo [信息] Cloudflare 项目名称: %CF_PROJECT_NAME%
echo.

:: ----------------------------------------------------------
:: 步骤 5: 从 GITHUB_REPO_URL 中提取 owner 和 repo
:: ----------------------------------------------------------
:: 格式: https://github.com/owner/repo
:: 先去掉协议前缀
for /f "tokens=1,2 delims=/" %%a in ("%GITHUB_REPO_URL%") do (
    set "OWNER=%%a"
    set "REPO=%%b"
)

:: 处理 URL 可能以 https://github.com/ 开头的情况
:: 将 URL 按 / 分割，取倒数第二个和倒数第一个
set "TEMP_URL=%GITHUB_REPO_URL%"
:: 去掉末尾的 .git（如果有的话）
set "TEMP_URL=%TEMP_URL:.git=%"
:: 去掉末尾的斜杠（如果有的话）
if "%TEMP_URL:~-1%"=="/" set "TEMP_URL=%TEMP_URL:~0,-1%"

:: 提取 owner 和 repo（取最后两段）
for %%a in ("%TEMP_URL%") do set "REPO_NAME=%%~nxa"
for %%a in ("%TEMP_URL:\= %") do (
    set "OWNER=!LAST_OWNER!"
    set "LAST_OWNER=%%a"
)
:: 如果上面解析失败，用另一种方式
if "%OWNER%"=="" (
    for /f "tokens=3,4 delims=/" %%a in ("%TEMP_URL%") do (
        set "OWNER=%%a"
        set "REPO=%%b"
    )
) else (
    set "REPO=%REPO_NAME%"
)

echo [信息] 解析结果 - Owner: %OWNER%, Repo: %REPO%

:: 验证 owner 和 repo 不为空
if "%OWNER%"=="" (
    echo [错误] 无法从仓库地址中提取 owner，请检查 GITHUB_REPO_URL 格式。
    echo 当前值: %GITHUB_REPO_URL%
    echo 正确格式: https://github.com/用户名/仓库名
    pause
    exit /b 1
)
if "%REPO%"=="" (
    echo [错误] 无法从仓库地址中提取 repo，请检查 GITHUB_REPO_URL 格式。
    echo 当前值: %GITHUB_REPO_URL%
    echo 正确格式: https://github.com/用户名/仓库名
    pause
    exit /b 1
)

:: ----------------------------------------------------------
:: 步骤 6: 检查 GitHub Actions 工作流文件是否存在
:: ----------------------------------------------------------
set "WORKFLOW_FILE=%PROJECT_PATH%\.github\workflows\deploy.yml"

if not exist "%WORKFLOW_FILE%" (
    echo [错误] 找不到 GitHub Actions 工作流文件: %WORKFLOW_FILE%
    echo 请确保项目根目录下存在 .github\workflows\deploy.yml 文件。
    pause
    exit /b 1
)

echo [信息] 工作流文件已找到: .github\workflows\deploy.yml
echo.

:: ----------------------------------------------------------
:: 步骤 7: 触发 GitHub Actions 工作流
:: ----------------------------------------------------------
:: 工作流文件名作为 workflow_id
set "WORKFLOW_ID=deploy.yml"

:: 构建 API URL
set "API_URL=https://api.github.com/repos/%OWNER%/%REPO%/actions/workflows/%WORKFLOW_ID%/dispatches"

echo [信息] 正在触发 GitHub Actions 工作流...
echo [信息] API URL: %API_URL%
echo [信息] 分支: main

:: 构建 JSON 请求体
:: ref 指定要触发工作流的分支
set "JSON_BODY={\"ref\":\"main\"}"

:: 使用 curl 调用 GitHub API
:: -s: 静默模式（不显示进度条）
:: -X POST: 指定请求方法为 POST
:: -H: 设置请求头
:: -d: 请求体
:: --connect-timeout: 连接超时时间
:: -w: 输出 HTTP 状态码
set "HTTP_CODE_FILE=%TEMP%\github_deploy_http_code.txt"

:: 使用 curl 调用 GitHub API 并捕获 HTTP 状态码
:: -w 输出的状态码写入 HTTP_CODE_FILE
:: -o 将响应体写入响应文件
curl -s -X POST "%API_URL%" ^
    -H "Authorization: Bearer %GITHUB_TOKEN%" ^
    -H "Accept: application/vnd.github+json" ^
    -H "X-GitHub-Api-Version: 2022-11-28" ^
    -H "Content-Type: application/json" ^
    -d "%JSON_BODY%" ^
    --connect-timeout 30 ^
    -w "%%{http_code}" ^
    -o "%TEMP%\github_deploy_response.txt" > "%HTTP_CODE_FILE%"

:: 读取 HTTP 状态码
if exist "%HTTP_CODE_FILE%" (
    set /p HTTP_CODE=<"%HTTP_CODE_FILE%"
) else (
    set "HTTP_CODE=000"
)

echo.

:: ----------------------------------------------------------
:: 步骤 8: 处理响应结果
:: ----------------------------------------------------------
if "%HTTP_CODE%"=="204" (
    echo ============================================================
    echo   部署触发成功！
    echo ============================================================
    echo.
    echo [成功] GitHub Actions 工作流已成功触发。
    echo.
    echo 工作流名称: deploy.yml
    echo 触发分支: main
    echo 仓库: %OWNER%/%REPO%
    echo.
    echo 你可以通过以下链接查看部署进度:
    echo https://github.com/%OWNER%/%REPO%/actions
    echo.
    echo 部署完成后，你的博客将可以在 Cloudflare Pages 上访问。
    echo Cloudflare Pages 仪表盘: https://dash.cloudflare.com/%CF_ACCOUNT_ID%/pages/view/%CF_PROJECT_NAME%
    echo.
) else if "%HTTP_CODE%"=="401" (
    echo [错误] 认证失败 (HTTP 401)。GitHub Token 无效或已过期。
    echo 请检查 github_config.ini 中的 GITHUB_TOKEN 是否正确。
    echo 如果 Token 已过期，请重新生成一个新的 Token。
) else if "%HTTP_CODE%"=="404" (
    echo [错误] 资源未找到 (HTTP 404)。
    echo 可能的原因:
    echo   1. 仓库 %OWNER%/%REPO% 不存在
    echo   2. 工作流文件 .github/workflows/deploy.yml 不存在
    echo   3. Token 没有访问该仓库的权限
    echo 请检查以上配置是否正确。
) else if "%HTTP_CODE%"=="422" (
    echo [错误] 请求无法处理 (HTTP 422)。
    echo 可能的原因:
    echo   1. 工作流文件存在语法错误
    echo   2. 工作流未配置 workflow_dispatch 事件
    echo 请检查 .github/workflows/deploy.yml 文件是否正确配置。
) else (
    echo [错误] 部署触发失败，HTTP 状态码: %HTTP_CODE%
    echo 服务器响应内容:
    if exist "%TEMP%\github_deploy_response.txt" (
        type "%TEMP%\github_deploy_response.txt"
    )
    echo.
    echo 请检查网络连接和配置是否正确。
)

:: 清理临时文件
if exist "%HTTP_CODE_FILE%" del "%HTTP_CODE_FILE%" >nul
if exist "%TEMP%\github_deploy_response.txt" del "%TEMP%\github_deploy_response.txt" >nul

echo.
pause
endlocal