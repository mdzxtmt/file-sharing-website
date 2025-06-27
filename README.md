# 文件分享平台

[![CI/CD Pipeline](https://github.com/your-username/your-repo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

基于micu.wiki风格的现代化文件分享网站，支持各种格式文件上传、分类管理、搜索和分享。

## 🎯 项目特点

- ✅ **现代化设计** - 参考micu.wiki的简洁UI风格，主色调#409eff
- ✅ **完全免费** - 使用Vercel、Supabase、Cloudflare免费计划
- ✅ **全球访问** - Cloudflare CDN优化，特别是中国大陆用户体验
- ✅ **功能完整** - 文件上传、分类管理、搜索、排行榜、用户中心
- ✅ **现代技术栈** - Next.js 14 + TypeScript + Tailwind CSS + Headless UI

## 🛠️ 技术架构

### 前端部署
- **Vercel免费计划**
  - 100GB带宽/月
  - 无限静态网站部署
  - 自动HTTPS和全球CDN
  - 支持自定义域名

### 后端服务
- **Supabase免费计划**
  - PostgreSQL数据库（500MB）
  - 文件存储（1GB）
  - 实时API和认证
  - 5GB带宽/月
  - 50,000月活用户

### CDN加速
- **Cloudflare免费计划**
  - 全球CDN网络（包括香港节点）
  - 无限带宽
  - DDoS防护
  - 免费SSL证书

## 📋 服务配置清单

### 1. Vercel配置
- [ ] 注册Vercel账号
- [ ] 连接GitHub仓库
- [ ] 配置自动部署
- [ ] 设置环境变量
- [ ] 验证免费额度

### 2. Supabase配置
- [ ] 创建Supabase项目
- [ ] 选择免费计划
- [ ] 配置数据库表结构
- [ ] 设置Storage存储桶
- [ ] 配置RLS策略
- [ ] 获取API密钥

### 3. Cloudflare配置
- [ ] 注册Cloudflare账号
- [ ] 添加域名
- [ ] 配置DNS解析
- [ ] 设置CDN缓存规则
- [ ] 启用安全功能

## 🔑 环境变量配置

需要在`.env.local`文件中配置以下环境变量：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare配置（可选）
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## 📊 免费额度监控

### Vercel限制
- 带宽：100GB/月
- 函数执行：100GB-小时/月
- 边缘函数：100,000次调用/月

### Supabase限制
- 数据库存储：500MB
- 文件存储：1GB
- 带宽：5GB/月
- 月活用户：50,000

### Cloudflare限制
- CDN带宽：无限制
- 页面规则：3个免费规则
- DNS查询：无限制

## 🚀 快速开始

### 方式一：手动部署 (适合快速体验)

1. 克隆项目
```bash
git clone <repository-url>
cd file-upload-website
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local 文件，填入相应的API密钥
```

4. 启动开发服务器
```bash
npm run dev
```

## 📝 部署说明

项目配置了自动部署，推送到main分支后会自动部署到Vercel。

## 🔧 维护指南

- 定期检查免费额度使用情况
- 监控文件存储空间（1GB限制）
- 优化图片压缩减少存储占用
- 配置自动清理策略

### 方式二：自动化部署 (推荐生产使用) 🤖

#### 1. Fork项目到你的GitHub账户

#### 2. 配置GitHub Secrets
在 `Settings > Secrets and variables > Actions` 中添加：
```bash
# Vercel配置
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Production环境
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Staging环境
STAGING_SUPABASE_URL=your_staging_url
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key
STAGING_SUPABASE_SERVICE_KEY=your_staging_service_key

# 通知配置 (可选)
SLACK_WEBHOOK_URL=your_slack_webhook
DISCORD_WEBHOOK_URL=your_discord_webhook
```

#### 3. 推送代码自动部署
```bash
# 推送到develop分支 -> 自动部署到Staging
git push origin develop

# 推送到main分支 -> 自动部署到Production
git push origin main

# 创建PR -> 自动创建Preview部署
```

🎉 **就这么简单！** 现在你拥有了完整的CI/CD自动化部署系统！

## 🤖 自动化部署特性

### ✨ 完整的CI/CD流程
- **持续集成**: 代码质量检查、类型验证、安全扫描
- **多环境部署**: Preview、Staging、Production环境
- **数据库迁移**: 自动化数据库版本管理
- **监控告警**: 部署状态监控和通知
- **自动回滚**: 故障检测和自动恢复

### 🔄 工作流程
```
代码提交 → CI检查 → 构建 → 部署 → 健康检查 → 监控 → (失败时)回滚
```

### 📊 环境策略
| 分支 | 环境 | 触发条件 | 部署URL |
|------|------|----------|---------|
| feature/* | Preview | PR创建/更新 | https://preview-xxx.vercel.app |
| develop | Staging | 推送到develop | https://staging.your-domain.com |
| main | Production | 推送到main | https://your-domain.com |

### 🛡️ 安全和监控
- **环境变量安全管理**: GitHub Secrets保护敏感信息
- **自动安全扫描**: 依赖漏洞检测和代码安全检查
- **实时监控**: 部署状态、健康检查、性能监控
- **智能回滚**: 自动检测故障并执行回滚

### 📚 详细文档
- [📖 部署指南](./docs/deployment-guide.md) - 完整的部署说明
- [🔄 CI/CD流程指南](./docs/ci-cd-guide.md) - 自动化流程详解
- [🔧 故障排除指南](./docs/troubleshooting.md) - 问题诊断和解决
- [🔄 回滚操作指南](./docs/rollback-guide.md) - 故障恢复机制
- [🔐 GitHub Secrets配置](./docs/github-secrets-setup.md) - 安全配置指南

## 📞 支持

如有问题，请查看项目文档或提交Issue。

### 快速命令参考
```bash
# 环境检查
npm run check-services      # 检查服务配置
npm run env:validate        # 验证环境变量
npm run verify-supabase     # 验证数据库连接

# CI/CD操作
npm run ci:check            # 运行CI检查
npm run monitor:health      # 健康检查
npm run rollback:deployment # 部署回滚

# 数据库操作
npm run db:migrate          # 执行数据库迁移
npm run db:status           # 查看迁移状态
npm run db:rollback         # 数据库回滚
```
