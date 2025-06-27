# 🚀 快速开始指南

欢迎使用免费文件上传网站！按照以下步骤快速配置所有免费服务。

## ⏱️ 预计时间：15-20分钟

## 📋 准备工作

确保您有以下账号：
- [ ] GitHub账号（必需）
- [ ] 有效的邮箱地址
- [ ] 稳定的网络连接

## 🔧 第一步：创建服务账号

### 1. Vercel账号 (2分钟)
```bash
1. 访问 https://vercel.com
2. 点击 "Sign Up"
3. 选择 "Continue with GitHub"
4. 授权Vercel访问您的GitHub
✅ 完成后您将看到Vercel仪表板
```

### 2. Supabase账号 (5分钟)
```bash
1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用GitHub账号登录
4. 点击 "New Project"
5. 填写项目信息：
   - Name: file-upload-website
   - Password: [生成强密码并保存]
   - Region: Southeast Asia (Singapore)
6. 点击 "Create new project"
✅ 等待项目创建完成（约2-3分钟）
```

### 3. Cloudflare账号 (3分钟) - 可选
```bash
1. 访问 https://cloudflare.com
2. 点击 "Sign Up"
3. 填写邮箱和密码
4. 验证邮箱
✅ 账号创建完成
```

## 🔑 第二步：获取API密钥

### Supabase API配置
```bash
1. 进入Supabase项目仪表板
2. 点击左侧 "Settings" > "API"
3. 复制以下信息：
   📋 Project URL: https://xxx.supabase.co
   📋 anon public key: eyJhbGciOiJIUzI1NiIs...
```

## ⚙️ 第三步：配置环境变量

编辑项目根目录的 `.env.local` 文件：

```bash
# 将复制的信息填入以下位置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 其他配置保持默认即可
```

## ✅ 第四步：验证配置

运行配置检查脚本：

```bash
# 检查所有服务配置状态
npm run check-services
```

如果看到 "🎉 所有检查通过！" 说明配置成功！

## 🎯 配置完成！

恭喜！您已经成功配置了所有免费服务：

### ✅ 已完成
- [x] Vercel账号创建
- [x] Supabase项目创建
- [x] API密钥配置
- [x] 环境变量设置
- [x] 项目基础结构

### 📊 免费额度总览
| 服务 | 存储 | 带宽 | 其他限制 |
|------|------|------|----------|
| Vercel | - | 100GB/月 | 无限部署 |
| Supabase | 1GB文件 + 500MB数据库 | 5GB/月 | 50K月活用户 |
| Cloudflare | - | 无限 | 3个页面规则 |

## 🚀 下一步

现在您可以开始开发了！下一个任务是：
1. 创建Next.js项目
2. 配置Supabase数据库表
3. 开发文件上传功能

## 🆘 遇到问题？

### 常见问题
1. **Supabase项目创建失败**
   - 检查网络连接
   - 尝试刷新页面重试
   - 确认邮箱已验证

2. **API密钥找不到**
   - 确保项目创建完成
   - 检查是否在正确的项目中
   - 刷新页面重新查看

3. **环境变量配置错误**
   - 检查文件名是否为 `.env.local`
   - 确认没有多余的空格
   - 重新复制API密钥

### 获取帮助
- 📖 查看详细指南：`docs/service-setup-guide.md`
- 🔍 运行检查脚本：`npm run check-services`
- 📊 查看配置状态：`config/services-status.json`

---

**🎉 配置完成后，您就拥有了一个完全免费但功能强大的文件上传网站基础架构！**
