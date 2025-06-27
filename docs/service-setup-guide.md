# 免费服务配置详细指南

本指南将帮助您逐步配置所有必需的免费服务。

## 🔧 1. Vercel账号创建和配置

### 步骤1：注册Vercel账号
1. 访问 [https://vercel.com](https://vercel.com)
2. 点击"Sign Up"
3. 选择"Continue with GitHub"（推荐）
4. 授权Vercel访问您的GitHub账号

### 步骤2：验证免费额度
- 登录后查看Dashboard
- 确认免费计划包含：
  - ✅ 100GB带宽/月
  - ✅ 无限静态网站部署
  - ✅ 自动HTTPS
  - ✅ 全球CDN

### 步骤3：准备项目部署
- 确保GitHub仓库已创建
- 项目推送到main分支后将自动部署

## 🗄️ 2. Supabase项目创建

### 步骤1：注册Supabase账号
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击"Start your project"
3. 使用GitHub账号登录（推荐）

### 步骤2：创建新项目
1. 点击"New Project"
2. 选择组织（个人账号）
3. 填写项目信息：
   - **Name**: file-upload-website
   - **Database Password**: 生成强密码并保存
   - **Region**: Southeast Asia (Singapore) - 距离香港最近
4. 点击"Create new project"

### 步骤3：获取API配置
1. 项目创建完成后，进入"Settings" > "API"
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 步骤4：验证免费额度
确认免费计划包含：
- ✅ 500MB PostgreSQL数据库
- ✅ 1GB文件存储
- ✅ 5GB带宽/月
- ✅ 50,000月活用户
- ✅ 实时API

## 🌐 3. Cloudflare账号配置

### 步骤1：注册Cloudflare账号
1. 访问 [https://cloudflare.com](https://cloudflare.com)
2. 点击"Sign Up"
3. 填写邮箱和密码注册

### 步骤2：添加域名（可选）
如果您有自己的域名：
1. 点击"Add a Site"
2. 输入您的域名
3. 选择"Free"计划
4. 按照指引更新域名服务器

### 步骤3：验证免费功能
确认免费计划包含：
- ✅ 全球CDN（无限带宽）
- ✅ DDoS防护
- ✅ 免费SSL证书
- ✅ 3个页面规则
- ✅ 香港节点支持

## 🔑 4. 环境变量配置

### 更新.env.local文件
将获取的API信息填入`.env.local`文件：

```bash
# 从Supabase项目设置中获取
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudflare配置（如果使用自定义域名）
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## ✅ 5. 配置验证清单

### Vercel验证
- [ ] 账号创建成功
- [ ] GitHub连接正常
- [ ] 免费额度确认
- [ ] 部署权限设置

### Supabase验证
- [ ] 项目创建成功
- [ ] API密钥获取
- [ ] 区域选择正确（新加坡）
- [ ] 免费额度确认

### Cloudflare验证
- [ ] 账号创建成功
- [ ] 域名添加（如适用）
- [ ] 免费计划确认
- [ ] CDN功能可用

## 🚨 重要注意事项

### 免费额度监控
- **Supabase存储**: 1GB限制，需要定期清理
- **Supabase带宽**: 5GB/月，需要优化CDN缓存
- **Vercel带宽**: 100GB/月，通常足够使用

### 安全建议
- 不要在代码中硬编码API密钥
- 使用环境变量管理敏感信息
- 定期检查API密钥使用情况

### 性能优化
- 启用Cloudflare CDN缓存
- 压缩图片减少存储占用
- 使用懒加载优化页面性能

## 📞 获取帮助

如果在配置过程中遇到问题：
1. 查看各服务的官方文档
2. 检查免费额度是否用完
3. 验证API密钥是否正确
4. 确认网络连接正常

配置完成后，您就可以开始下一步的项目开发了！
