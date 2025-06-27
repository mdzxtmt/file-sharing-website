# 🚀 部署指南

## 📋 部署概览

本项目采用现代化的免费部署方案，支持手动部署和自动化CI/CD部署，确保全球访问性能和中国大陆访问优化：

- **前端部署**: Vercel (免费额度)
- **后端数据库**: Supabase (免费额度)
- **CDN加速**: Cloudflare (免费额度)
- **文件存储**: Supabase Storage (免费额度)
- **CI/CD**: GitHub Actions (免费额度)
- **监控**: 内置监控和通知系统

## 🎯 部署方式选择

### 手动部署 (适合快速体验)
- 适合个人项目或快速原型
- 需要手动执行每个步骤
- 部署时间：约30分钟

### 自动化部署 (推荐生产使用)
- 适合团队协作和生产环境
- 代码提交自动触发部署
- 包含质量检查、监控、回滚等功能
- 初始设置时间：约1小时，后续自动化

**💡 建议**: 如果是生产环境或团队项目，强烈推荐使用自动化部署方案。

## 🔧 部署前准备

### 1. 环境要求
- Node.js 18+ 
- Git
- Vercel CLI (可选)

### 2. 账户注册
- [Vercel](https://vercel.com) - 前端部署
- [Supabase](https://supabase.com) - 后端数据库
- [Cloudflare](https://cloudflare.com) - CDN加速

## 📦 Supabase 配置

### 1. 创建 Supabase 项目
1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 创建新项目，选择**新加坡区域**（亚洲用户访问最优）
3. 等待项目初始化完成

### 2. 配置数据库
在 SQL Editor 中依次执行以下脚本：

```bash
# 1. 创建表结构
sql/schema.sql

# 2. 配置安全策略
sql/rls-policies.sql

# 3. 插入初始数据
sql/seed-data.sql
```

### 3. 配置存储桶
1. 进入 Storage 页面
2. 创建名为 `files` 的公开存储桶
3. 配置存储桶策略（允许公开访问）

### 4. 获取配置信息
在 Settings > API 中获取：
- Project URL
- Anon Key
- Service Role Key

## 🌐 Vercel 部署

### 方法一：GitHub 自动部署（推荐）

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **连接 Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 导入 GitHub 仓库
   - 选择 Next.js 框架预设

3. **配置环境变量**
   在 Vercel 项目设置中添加：
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   CRON_SECRET=your_random_secret_for_cron_jobs
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   ```

4. **部署**
   - 点击 "Deploy" 开始部署
   - 等待构建完成

### 方法二：CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录并部署**
   ```bash
   vercel login
   vercel --prod
   ```

## ⚡ Cloudflare CDN 配置

### 1. 添加域名到 Cloudflare
1. 在 Cloudflare 添加您的域名
2. 更新 DNS 记录指向 Cloudflare

### 2. 配置 DNS 记录
```
Type: CNAME
Name: @
Content: your-project.vercel.app
Proxy: Enabled (橙色云朵)
```

### 3. 优化设置

**缓存规则**:
```
/_next/static/* - Cache Everything, Edge TTL: 1 year
/api/* - Bypass Cache
/images/* - Cache Everything, Edge TTL: 1 day
```

**页面规则**:
```
*.your-domain.com/_next/static/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year
```

**速度优化**:
- 启用 Auto Minify (HTML, CSS, JS)
- 启用 Brotli 压缩
- 启用 HTTP/2
- 启用 0-RTT Connection Resumption

## 🇨🇳 中国大陆访问优化

### 1. 域名选择
- 使用 `.com` 或 `.net` 域名
- 避免使用 `.io` 等可能被限制的域名

### 2. CDN 配置
- 启用 Cloudflare 的中国网络
- 配置智能路由
- 使用 CNAME 接入

### 3. 资源优化
- 图片使用 WebP 格式
- 启用 Gzip/Brotli 压缩
- 减少外部依赖

## 📊 性能监控

### 1. Vercel Analytics
在 Vercel 项目中启用 Analytics 功能

### 2. 自定义监控
项目已集成性能监控，包括：
- 页面加载时间
- 用户行为统计
- 错误监控
- 性能指标

### 3. 监控指标
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## 🔒 安全配置

### 1. 环境变量安全
- 敏感信息使用环境变量
- 不要在代码中硬编码密钥
- 定期轮换密钥

### 2. HTTPS 配置
- Vercel 自动提供 SSL 证书
- 强制 HTTPS 重定向
- 配置安全头部

### 3. 访问控制
- 配置 CORS 策略
- 实施 Rate Limiting
- 监控异常访问

## 🔄 自动化部署

### 1. GitHub Actions（可选）
创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 2. 定时任务
项目配置了每日清理任务：
- 清理过期文件
- 更新统计缓存
- 优化数据库性能

## 📈 扩展建议

### 免费额度限制
- **Vercel**: 100GB 带宽/月
- **Supabase**: 500MB 数据库 + 1GB 存储
- **Cloudflare**: 无限制（免费版）

### 升级路径
当超出免费额度时：
1. Vercel Pro: $20/月
2. Supabase Pro: $25/月
3. Cloudflare Pro: $20/月

## 🆘 故障排除

### 常见问题

1. **构建失败**
   - 检查环境变量配置
   - 确认依赖版本兼容性

2. **数据库连接失败**
   - 验证 Supabase URL 和密钥
   - 检查网络连接

3. **文件上传失败**
   - 确认存储桶配置
   - 检查文件大小限制

4. **CDN 缓存问题**
   - 清除 Cloudflare 缓存
   - 检查缓存规则配置

### 性能优化检查清单

- [ ] 图片格式优化 (WebP/AVIF)
- [ ] 代码分割和懒加载
- [ ] CDN 缓存配置
- [ ] 数据库查询优化
- [ ] 静态资源压缩
- [ ] 服务端渲染优化

---

# 🤖 自动化部署指南

## 📋 自动化部署概述

自动化部署系统基于GitHub Actions实现，提供完整的CI/CD流程：

- **持续集成**: 代码质量检查、类型验证、安全扫描
- **多环境部署**: Preview、Staging、Production环境
- **数据库迁移**: 自动化数据库版本管理
- **监控告警**: 部署状态监控和通知
- **自动回滚**: 故障检测和自动恢复

## 🚀 快速开始自动化部署

### 1. Fork项目并配置Secrets

1. **Fork项目到你的GitHub账户**
2. **配置GitHub Secrets** (Settings > Secrets and variables > Actions):

```bash
# Vercel配置
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Production环境
NEXT_PUBLIC_SUPABASE_URL=https://your-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key

# Staging环境
STAGING_SUPABASE_URL=https://your-staging.supabase.co
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key
STAGING_SUPABASE_SERVICE_KEY=your_staging_service_key

# 通知配置 (可选)
SLACK_WEBHOOK_URL=your_slack_webhook
DISCORD_WEBHOOK_URL=your_discord_webhook
```

### 2. 创建环境配置文件

```bash
# 复制环境配置模板
cp .env.staging.example .env.staging
cp .env.production.example .env.production

# 编辑配置文件，填入正确的值
```

### 3. 推送代码触发部署

```bash
# 推送到develop分支 -> 自动部署到Staging
git push origin develop

# 推送到main分支 -> 自动部署到Production
git push origin main

# 创建PR -> 自动创建Preview部署
```

## 🔄 CI/CD工作流详解

### 工作流文件结构

```
.github/workflows/
├── ci.yml              # 持续集成
├── deploy.yml          # 部署工作流
├── database.yml        # 数据库迁移
├── monitor.yml         # 部署监控
├── rollback.yml        # 自动回滚
└── env-security.yml    # 环境安全检查
```

### 部署流程图

```
代码提交 → CI检查 → 构建 → 部署 → 健康检查 → 监控 → (失败时)回滚
```

### 环境部署策略

| 分支 | 环境 | 触发条件 | 部署URL |
|------|------|----------|---------|
| feature/* | Preview | PR创建/更新 | https://preview-xxx.vercel.app |
| develop | Staging | 推送到develop | https://staging.your-domain.com |
| main | Production | 推送到main | https://your-domain.com |

## 📊 监控和通知

### 部署状态监控

- **实时监控**: 部署进度和状态追踪
- **健康检查**: 部署后自动验证系统健康
- **性能监控**: 响应时间和可用性监控
- **错误追踪**: 部署失败原因分析

### 通知渠道

- **Slack**: 部署状态和告警通知
- **Discord**: 团队协作通知
- **GitHub**: PR评论和状态检查
- **邮件**: 关键事件通知

## 🔧 自动化部署故障排除

### 常见CI/CD问题

1. **CI检查失败**
   ```bash
   # 本地运行CI检查
   npm run ci:check
   npm run lint
   npm run type-check
   ```

2. **环境变量配置错误**
   ```bash
   # 验证环境变量
   npm run env:validate
   npm run env:check
   ```

3. **数据库迁移失败**
   ```bash
   # 检查迁移状态
   npm run db:status
   npm run verify-supabase
   ```

4. **部署超时或失败**
   - 检查Vercel配额使用情况
   - 验证GitHub Secrets配置
   - 查看GitHub Actions日志

### 调试步骤

1. **查看工作流日志**
   - GitHub Actions页面查看详细日志
   - 检查每个步骤的输出和错误

2. **本地复现问题**
   ```bash
   # 本地运行相同的检查
   npm run ci:test
   npm run build
   ```

3. **验证配置**
   ```bash
   # 检查所有配置
   npm run check-services
   npm run env:validate
   ```

## 🔄 回滚操作

### 自动回滚

系统会在以下情况自动触发回滚：
- 部署后健康检查失败
- 连续3次部署失败
- 关键API端点不可访问

### 手动回滚

```bash
# 通过GitHub Actions手动回滚
# Actions > Automatic Rollback > Run workflow

# 或使用命令行
npm run rollback:deployment production
npm run rollback:database 003_seed_data
```

## 📚 相关文档

- [GitHub Actions配置指南](./github-actions-setup.md)
- [Vercel部署配置](./vercel-deployment.md)
- [数据库迁移指南](./database-migration.md)
- [环境变量安全管理](./github-secrets-setup.md)
- [回滚操作指南](./rollback-guide.md)

---

**🎉 部署完成！您的文件分享平台现在已经可以全球访问了！**

**🤖 自动化部署已配置完成！现在您可以享受完全自动化的CI/CD流程！**
