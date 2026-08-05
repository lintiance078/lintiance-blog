@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: Astro 本地开发服务停止脚本
:: 功能: 停止运行在端口 4321 的 Astro 开发服务器
:: ============================================================

echo ============================================================
echo    Astro 本地开发服务停止
echo ============================================================
echo.

:: ----------------------------------------------------------
:: 步骤 1: 查找占用端口 4321 的进程
:: ----------------------------------------------------------
echo [信息] 正在查找占用端口 4321 的进程...

:: 使用 netstat 查找监听 4321 端口的进程
:: 输出格式: TCP    0.0.0.0:4321    0.0.0.0:0    LISTENING    12345
set "PID="

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":4321.*LISTENING"') do (
    set "PID=%%a"
    echo [信息] 找到进程 PID: !PID! 正在监听端口 4321
)

:: ----------------------------------------------------------
:: 步骤 2: 结束占用端口的进程
:: ----------------------------------------------------------
if not "%PID%"=="" (
    echo [信息] 正在终止进程 PID: %PID% ...
    taskkill /PID %PID% /F >nul 2>&1
    if %errorlevel% equ 0 (
        echo [成功] 已成功终止进程 PID: %PID% (端口 4321 已释放)
    ) else (
        echo [错误] 无法终止进程 PID: %PID% ，可能需要管理员权限。
        echo 请尝试以管理员身份运行此脚本。
    )
) else (
    echo [警告] 未找到监听端口 4321 的进程。
)

:: ----------------------------------------------------------
:: 步骤 3: 额外检查 node.exe 进程中是否有 astro 相关
:: ----------------------------------------------------------
echo.
echo [信息] 正在检查是否有残留的 Astro 相关 node 进程...

:: 使用 tasklist 查找所有 node.exe 进程
set "FOUND_ASTRO=0"

for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo csv /nh 2^>nul ^| findstr /r "[0-9]"') do (
    set "NODE_PID=%%a"
    :: 去掉引号
    set "NODE_PID=!NODE_PID:"=!"
    
    :: 使用 wmic 获取该进程的命令行参数
    for /f "usebackq tokens=*" %%c in (`wmic process where "processid=!NODE_PID!" get commandline /format:value 2^>nul ^| findstr /i "astro"`) do (
        set "CMD_LINE=%%c"
        if not "!CMD_LINE!"=="" (
            set "FOUND_ASTRO=1"
            echo [信息] 发现 Astro 相关进程 PID: !NODE_PID!
            echo        命令行: !CMD_LINE!
            taskkill /PID !NODE_PID! /F >nul 2>&1
            if !errorlevel! equ 0 (
                echo [成功] 已终止 Astro 相关进程 PID: !NODE_PID!
            )
        )
    )
)

if "%FOUND_ASTRO%"=="0" (
    echo [信息] 未发现其他 Astro 相关 node 进程。
)

echo.
echo ============================================================
echo    停止操作完成
echo ============================================================
echo.

pause
endlocal