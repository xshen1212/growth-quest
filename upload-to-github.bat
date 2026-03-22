@echo off
chcp 65001
cls
echo ========================================
echo   成长冒险岛 - GitHub 上传脚本
echo ========================================
echo.

REM 检查是否已初始化 Git
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [1/5] 正在初始化 Git 仓库...
    git init
    if errorlevel 1 (
        echo 错误：Git 初始化失败！
        pause
        exit /b 1
    )
    echo 完成！
) else (
    echo [1/5] Git 仓库已存在，跳过初始化
)

echo.
echo [2/5] 正在添加文件到暂存区...
git add .
if errorlevel 1 (
    echo 错误：添加文件失败！
    pause
    exit /b 1
)
echo 完成！

echo.
echo [3/5] 正在提交更改...
git commit -m "Initial commit - 成长冒险岛上线！"
if errorlevel 1 (
    echo 提示：没有新的更改需要提交，继续...
)
echo 完成！

echo.
echo ========================================
echo 请先在 GitHub 创建仓库：
echo 1. 访问 https://github.com/new
echo 2. 仓库名填写：growth-quest
echo 3. 点击 Create repository
echo 4. 复制仓库地址（HTTPS）
echo ========================================
echo.
set /p repo_url="请输入 GitHub 仓库地址（例如：https://github.com/用户名/growth-quest.git）: "

echo.
echo [4/5] 正在添加远程仓库...
git remote remove origin 2>nul
git remote add origin %repo_url%
if errorlevel 1 (
    echo 错误：添加远程仓库失败！
    pause
    exit /b 1
)
echo 完成！

echo.
echo [5/5] 正在推送到 GitHub...
git branch -M main
git push -u origin main
if errorlevel 1 (
    echo.
    echo 错误：推送失败！可能的原因：
    echo 1. 网络连接问题
    echo 2. 仓库地址错误
    echo 3. 需要登录 GitHub（会弹出窗口）
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   🎉 上传成功！
echo ========================================
echo.
echo 您的代码已上传到 GitHub
echo 现在可以前往 Vercel 部署了！
echo.
pause
