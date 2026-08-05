@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================================
:: 博客 TUI 管理工具停止脚本
:: 功能: 停止正在运行的 TUI 管理工具进程
:: 说明: TUI 是基于 blessed 的终端 UI，通常以 node tui/index.js 运行
:: ============================================================

echo ============================================================
echo    博客 TUI 管理工具停止
echo ============================================================
echo.

set "FOUND_TUI=0"

:: ----------------------------------------------------------
:: 步骤 1: 通过窗口标题查找 TUI 进程
:: ----------------------------------------------------------
echo [信息] 正在通过窗口标题查找 TUI 进程...

:: 使用 taskkill 通过窗口标题筛选并终止进程
:: 注意: /FI 过滤器使用通配符 * 匹配包含 "TUI" 的窗口标题
taskkill /FI "WINDOWTITLE eq *TUI*" /F >nul 2>&1

if %errorlevel% equ 0 (
    set "FOUND_TUI=1"
    echo [成功] 已通过窗口标题找到并终止了 TUI 进程。
) else (
    echo [信息] 未通过窗口标题找到 TUI 进程。
)

:: ----------------------------------------------------------
:: 步骤 2: 通过命令行参数查找 TUI 进程（备用方案）
:: ----------------------------------------------------------
echo.
echo [信息] 正在通过命令行参数查找 TUI 进程（备用方案）...

:: 使用 wmic 查找命令行中包含 tui/index.js 的 node 进程
:: 注意: wmic 在较新版本的 Windows 中可能已被弃用，但通常仍可用
for /f "tokens=2 delims==" %%a in ('wmic process where "commandline like '%%tui/index.js%%' and name='node.exe'" get processid /value 2^>nul ^| findstr "ProcessId"') do (
    set "TUI_PID=%%a"
    if not "!TUI_PID!"=="" (
        set "FOUND_TUI=1"
        echo [信息] 找到 TUI 进程 PID: !TUI_PID!
        taskkill /PID !TUI_PID! /F >nul 2>&1
        if !errorlevel! equ 0 (
            echo [成功] 已终止 TUI 进程 PID: !TUI_PID!
        ) else (
            echo [错误] 无法终止进程 PID: !TUI_PID! ，可能需要管理员权限。
        )
    )
)

:: ----------------------------------------------------------
:: 步骤 3: 汇总结果
:: ----------------------------------------------------------
echo.

if "%FOUND_TUI%"=="0" (
    echo ============================================================
    echo    未找到正在运行的 TUI 进程
    echo ============================================================
    echo.
    echo [信息] 未检测到任何正在运行的 TUI 管理工具进程。
    echo 可能的原因:
    echo   1. TUI 工具当前未运行
    echo   2. TUI 工具已在其他终端窗口中关闭
    echo   3. TUI 进程已自动退出
    echo.
    echo 如果需要启动 TUI 工具，请运行 start_tui.bat 脚本。
) else (
    echo ============================================================
    echo    TUI 进程已全部停止
    echo ============================================================
    echo.
    echo [信息] 所有 TUI 相关进程已成功终止。
)

echo.
pause
endlocal