# 🚀 成长冒险岛 - 部署指南

## 方案：Vercel + Supabase（免费方案）

## 📋 部署步骤

### 第一步：创建 Supabase 项目（5分钟）

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "New Project"
3. 填写项目名称：`growth-quest`
4. 选择地区：建议选择 `Singapore`（亚洲用户访问快）
5. 等待项目创建完成（约1-2分钟）

### 第二步：配置数据库（3分钟）

1. 在 Supabase 项目中，点击左侧菜单 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-setup.sql` 文件中的全部内容
4. 粘贴到 SQL Editor
5. 点击 "Run" 执行
6. 看到 "Success" 表示数据库配置完成

### 第三步：获取 API 密钥（2分钟）

1. 点击左侧菜单 "Project Settings" → "API"
2. 在页面顶部找到 **Project URL**（格式：`https://xxxx.supabase.co`）
3. 在 "Project API keys" 部分找到 **anon public**（以ey开头的一长串）
4. 复制这两个值，保存好（后面要用）

**注意**：anon public 就是我们要用的 anon key，不要搞错了！

### 第四步：上传代码到 GitHub（5分钟）

**如果您已经有 GitHub 仓库**：
- 直接跳到第五步

**如果代码在本地，需要先创建仓库**：

1. 访问 [https://github.com/new](https://github.com/new)
2. 创建新仓库，命名为 `growth-quest`
3. 选择 "Private"（私有）或 "Public"（公开）
4. 点击 "Create repository"
5. 在本地打开终端，执行以下命令：

```bash
# 进入项目目录
cd g:\growing up\growth-quest

# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库（替换 YOUR_USERNAME 为您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/growth-quest.git

# 推送到 GitHub
git push -u origin main
```

**如果遇到问题**：
- 确保已安装 Git：https://git-scm.com/download/win
- 确保已登录 GitHub：`git config --global user.name "您的名字"` 和 `git config --global user.email "您的邮箱"`

### 第五步：创建 Vercel 项目（3分钟）

1. 访问 [https://vercel.com](https://vercel.com)
2. 点击 "Sign Up" 或 "Login"，使用 GitHub 账号登录
3. 点击 "Add New" → "Project"
4. 在 "Import Git Repository" 中找到 `growth-quest` 仓库
5. 点击 "Import"

### 第六步：配置环境变量（3分钟）

在 Vercel 项目设置中：

1. 点击 "Settings" → "Environment Variables"
2. 添加以下变量：
   ```
   SUPABASE_URL=https://你的项目地址.supabase.co
   SUPABASE_ANON_KEY=你的anon密钥
   ```

### 第七步：部署（2分钟）

1. 点击 "Deploy"
2. 等待构建完成（约1-2分钟）
3. 获得网站地址：`https://你的项目名.vercel.app`

## ✅ 部署后验证

1. 访问部署的网站
2. 注册一个新账号
3. 完成几个任务
4. 刷新页面，检查数据是否保存
5. 在不同设备登录，检查数据同步

## 🔧 常见问题

### 1. 数据没有保存？
- 检查浏览器控制台是否有错误
- 确认 Supabase 的 API 密钥是否正确配置
- 检查数据库表是否正确创建

### 2. 访问速度慢？
- Supabase 选择 Singapore 地区
- Vercel 会自动选择最近的 CDN 节点

### 3. 免费额度用完？
- Supabase 免费版：500MB 数据库，2GB 传输/月
- Vercel 免费版：100GB 带宽/月
- 对于个人/家庭使用，免费额度充足

## 📦 项目文件说明

部署前确保项目包含以下文件：
```
growth-quest/
├── index.html          # 主页
├── game.html           # 游戏页
├── shop.html           # 商店页
├── admin/              # 管理后台
├── css/                # 样式文件
├── js/                 # JavaScript文件
│   ├── store.js        # 数据存储（已适配Supabase）
│   ├── common.js       # 公共函数
│   └── ...
├── supabase-setup.sql  # 数据库配置
└── vercel.json         # Vercel配置
```

## 🎉 完成！

部署完成后，您就拥有了一个：
- ✅ 全球访问的网站
- ✅ 云端数据存储
- ✅ 多设备同步
- ✅ 完全免费的方案

数据会自动备份，不用担心丢失！
