# 🔐 GitHub Secrets 安全配置指南

## 📋 概述

本指南详细说明如何配置GitHub Secrets来安全管理项目的环境变量，确保敏感信息在CI/CD流程中的安全性。

## 🔑 必需的Secrets配置

### 基础Secrets

在GitHub仓库的 `Settings > Secrets and variables > Actions` 中添加以下Secrets：

#### Vercel部署相关
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here  
VERCEL_PROJECT_ID=your_vercel_project_id_here
```

#### Staging环境
```
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STAGING_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Production环境
```
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 可选Secrets
```
CRON_SECRET=your_random_cron_secret_here
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## 🔧 获取配置信息

### 1. Vercel配置

#### 获取Vercel Token
1. 访问 [Vercel Dashboard](https://vercel.com/account/tokens)
2. 点击 "Create Token"
3. 输入Token名称（如：`github-actions-deploy`）
4. 选择适当的权限范围
5. 复制生成的Token

#### 获取组织和项目ID
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 在项目目录中链接项目
vercel link

# 查看项目配置
cat .vercel/project.json
```

输出示例：
```json
{
  "orgId": "team_xxxxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxxxx"
}
```

### 2. Supabase配置

#### 创建Staging项目
1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 创建新项目，命名为 `your-project-staging`
3. 选择合适的区域（推荐：新加坡）
4. 等待项目初始化完成

#### 创建Production项目
1. 创建另一个项目，命名为 `your-project-production`
2. 使用相同的区域设置
3. 确保两个项目完全独立

#### 获取API密钥
在每个Supabase项目的 `Settings > API` 中获取：
- **Project URL**: `https://xxx.supabase.co`
- **Anon Key**: 公开的匿名访问密钥
- **Service Role Key**: 服务端密钥（具有完全权限）

## 🛡️ 安全最佳实践

### 1. 密钥管理原则

#### 权限最小化
- 只授予必要的最小权限
- 定期审查和轮换密钥
- 使用专用的服务账户

#### 环境隔离
- 不同环境使用完全独立的密钥
- 避免在多个环境间共享密钥
- 生产环境密钥严格控制访问

#### 密钥强度
- 使用强随机密钥
- 避免使用可预测的密钥
- 定期更新密钥

### 2. GitHub Secrets安全配置

#### 访问控制
```yaml
# 在workflow中限制secrets访问
environment:
  name: production
  # 需要管理员批准
```

#### 密钥验证
```bash
# 使用env-manager验证密钥格式
npm run env:validate
```

#### 日志安全
```yaml
# 避免在日志中暴露敏感信息
- name: Deploy
  run: |
    echo "Deploying to production..."
    # 不要直接echo secrets
  env:
    SECRET_KEY: ${{ secrets.SECRET_KEY }}
```

### 3. 本地开发安全

#### .env文件管理
```bash
# 确保.env文件不被提交
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

#### 模板文件
```bash
# 创建安全的模板文件
cp .env.local .env.example
# 手动替换所有敏感值为占位符
```

## 🔍 验证和测试

### 1. 本地验证

```bash
# 验证环境变量配置
npm run env:check

# 验证所有环境配置
npm run env:validate

# 生成环境配置模板
npm run env:generate staging
```

### 2. CI/CD验证

#### 测试Secrets配置
```yaml
# 在workflow中添加验证步骤
- name: Verify Secrets
  run: |
    if [ -z "${{ secrets.VERCEL_TOKEN }}" ]; then
      echo "❌ VERCEL_TOKEN not configured"
      exit 1
    fi
    echo "✅ Secrets verification passed"
```

#### 环境变量注入测试
```bash
# 检查CI环境中的变量注入
npm run ci:env-check
```

## 🚨 故障排除

### 常见问题

#### 1. Secrets未生效
**症状**: CI中提示环境变量未配置
**解决**:
```bash
# 检查Secret名称拼写
# 确认Secret在正确的仓库中配置
# 验证workflow中的引用语法
```

#### 2. 权限不足
**症状**: API调用返回401/403错误
**解决**:
```bash
# 检查密钥权限范围
# 确认使用正确的密钥类型
# 验证密钥是否过期
```

#### 3. 环境变量格式错误
**症状**: 应用启动失败或功能异常
**解决**:
```bash
# 使用env-manager验证格式
npm run env:validate

# 检查URL格式
# 验证密钥长度和格式
```

### 调试步骤

#### 1. 本地调试
```bash
# 设置调试环境变量
export DEBUG=true
export VERBOSE=true

# 运行验证脚本
npm run env:check
```

#### 2. CI调试
```yaml
# 在workflow中添加调试步骤
- name: Debug Environment
  run: |
    echo "Node version: $(node --version)"
    echo "Environment: ${{ github.ref }}"
    echo "Secrets available: ${{ toJson(secrets) }}"
```

#### 3. 密钥测试
```bash
# 测试Supabase连接
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$SUPABASE_URL/rest/v1/"

# 测试Vercel API
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v2/user"
```

## 📊 监控和审计

### 1. 访问监控
- 定期检查GitHub Secrets访问日志
- 监控API密钥使用情况
- 设置异常访问告警

### 2. 密钥轮换
```bash
# 定期轮换密钥（建议每3-6个月）
# 1. 生成新密钥
# 2. 更新GitHub Secrets
# 3. 验证新密钥工作正常
# 4. 撤销旧密钥
```

### 3. 安全审计
- 定期审查密钥权限
- 检查未使用的密钥
- 验证环境隔离效果

---

**🔒 安全提醒**: 
- 永远不要在代码、日志或文档中硬编码敏感信息
- 定期轮换所有密钥和令牌
- 使用最小权限原则配置访问权限
- 监控和审计所有密钥使用情况
