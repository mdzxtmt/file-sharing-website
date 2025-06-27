# 🚀 Vercel自动部署配置指南

## 📋 概述

本项目配置了完整的Vercel自动部署流程，支持多环境部署策略：
- **Preview**: 每个PR自动创建预览部署
- **Staging**: develop分支自动部署到staging环境
- **Production**: main分支自动部署到生产环境

## 🔧 配置要求

### 1. GitHub Secrets配置

在GitHub仓库的Settings > Secrets and variables > Actions中添加以下secrets：

#### 必需的Secrets
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_project_id_here
```

#### 环境特定的Secrets

**Staging环境**:
```
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key
```

**Production环境**:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### 2. 获取Vercel配置信息

#### 获取Vercel Token
1. 访问 [Vercel Dashboard](https://vercel.com/account/tokens)
2. 创建新的Token，选择适当的权限
3. 复制Token值到GitHub Secrets

#### 获取组织和项目ID
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 在项目目录中运行
vercel link

# 查看项目信息
cat .vercel/project.json
```

## 🌊 部署流程

### Preview部署 (PR)
```
PR创建/更新 → 自动触发 → 构建 → 部署到Preview → PR评论通知
```

**特点**:
- 每个PR自动创建独立的预览环境
- 在PR中自动评论预览URL
- 使用preview环境配置

### Staging部署 (develop分支)
```
Push到develop → 预检查 → 构建 → 部署到Staging → 健康检查
```

**特点**:
- 自动部署到staging环境
- 包含预部署检查和后部署验证
- 使用staging环境配置

### Production部署 (main分支)
```
Push到main → 全面检查 → 构建 → 部署到Production → 完整验证 → 部署报告
```

**特点**:
- 需要通过GitHub Environment保护规则
- 包含全面的预检查和后验证
- 生成详细的部署报告

## 🔍 部署验证

### 预部署检查
- CI质量检查通过
- Supabase配置验证
- 安全审计检查

### 后部署验证
- 主页面可访问性检查
- API端点健康检查
- 关键功能页面验证

## 📊 环境配置

### 环境变量管理
- `.env.staging`: Staging环境配置模板
- `.env.production`: Production环境配置模板
- GitHub Secrets: 敏感信息安全存储

### 环境隔离
- 不同环境使用独立的Supabase项目
- 环境特定的域名和配置
- 独立的监控和日志

## 🔄 回滚策略

### 自动回滚触发条件
- 部署后健康检查失败
- 关键API端点不可访问
- 主要功能页面加载失败

### 手动回滚
```bash
# 使用Vercel CLI回滚
vercel rollback [deployment-url] --token=$VERCEL_TOKEN

# 或在Vercel Dashboard中操作
```

## 🚨 故障排除

### 常见部署问题

1. **构建失败**
   - 检查环境变量配置
   - 验证依赖版本兼容性
   - 查看构建日志详情

2. **部署超时**
   - 检查构建时间是否过长
   - 优化构建配置
   - 检查网络连接

3. **环境变量问题**
   - 确认GitHub Secrets配置正确
   - 检查环境变量名称拼写
   - 验证Supabase连接信息

4. **健康检查失败**
   - 检查API端点是否正常
   - 验证数据库连接
   - 查看应用日志

### 调试步骤

1. **查看GitHub Actions日志**
   - 检查每个步骤的输出
   - 查找错误信息和警告

2. **检查Vercel部署日志**
   - 在Vercel Dashboard查看构建日志
   - 检查运行时错误

3. **本地复现**
   - 使用相同的环境变量在本地测试
   - 运行相同的构建命令

## 📈 性能优化

### 构建优化
- 依赖缓存策略
- 并行构建步骤
- 增量构建支持

### 部署优化
- 多区域部署配置
- CDN缓存策略
- 静态资源优化

## 🔐 安全最佳实践

### 密钥管理
- 使用GitHub Secrets存储敏感信息
- 定期轮换API密钥
- 最小权限原则

### 环境隔离
- 生产和测试环境完全隔离
- 独立的数据库和存储
- 环境特定的访问控制

## 📋 部署检查清单

### 首次设置
- [ ] 配置GitHub Secrets
- [ ] 设置Vercel项目
- [ ] 配置环境变量
- [ ] 测试部署流程

### 每次部署前
- [ ] 代码通过CI检查
- [ ] 环境变量更新
- [ ] 数据库迁移准备
- [ ] 回滚计划确认

### 部署后验证
- [ ] 健康检查通过
- [ ] 关键功能测试
- [ ] 性能指标检查
- [ ] 错误监控确认

---

**💡 提示**: 这个部署系统基于现有的vercel.json配置进行扩展，保持了多区域部署等优化配置，同时添加了完整的自动化流程。
