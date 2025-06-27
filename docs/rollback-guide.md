# 🔄 自动回滚和故障恢复指南

## 📋 概述

本指南详细说明了项目的自动回滚机制和故障恢复系统，包括部署失败检测、自动回滚触发、数据库回滚、服务恢复等功能。

## 🏗️ 回滚系统架构

### 回滚类型
- **部署回滚 (Deployment)**: 回滚到上一个稳定的Vercel部署
- **数据库回滚 (Database)**: 回滚数据库迁移到指定版本
- **配置回滚 (Configuration)**: 回滚环境变量和配置文件
- **完整回滚 (Full)**: 包含上述所有类型的完整回滚

### 触发机制
- **自动触发**: 基于健康检查失败、连续部署失败等条件
- **手动触发**: 通过GitHub Actions或命令行工具
- **紧急触发**: 生产环境关键故障时的快速回滚

## 🚀 使用方法

### 自动回滚配置

自动回滚通过环境变量控制：

```bash
# 启用自动回滚
AUTO_ROLLBACK_ENABLED=true

# 配置触发条件
AUTO_ROLLBACK_MAX_FAILURES=3        # 最大连续失败次数
AUTO_ROLLBACK_HEALTH_TIMEOUT=300000 # 健康检查超时时间(ms)
```

### 手动回滚操作

#### 1. 通过GitHub Actions

访问 `Actions > Automatic Rollback` 并配置：

- **回滚类型**: deployment/database/configuration/full
- **目标环境**: production/staging
- **目标部署**: 部署URL或留空使用最后稳定版本
- **目标迁移**: 数据库迁移版本号
- **回滚原因**: 详细说明回滚原因

#### 2. 通过命令行工具

```bash
# 部署回滚
npm run rollback:deployment <environment>

# 数据库回滚
npm run rollback:database <migration-version>

# 查看回滚状态
npm run rollback:status
```

#### 3. 直接使用脚本

```bash
# 部署回滚到指定URL
node scripts/rollback-manager.js deployment https://app-abc123.vercel.app production

# 数据库回滚到指定版本
node scripts/rollback-manager.js database 003_seed_data

# 查看回滚历史
node scripts/rollback-manager.js status
```

## 🔍 故障检测机制

### 部署失败检测

1. **健康检查失败**
   - 主页面无法访问 (HTTP 200)
   - API端点响应异常
   - 关键功能页面加载失败

2. **性能指标异常**
   - 响应时间超过阈值 (>5秒)
   - 错误率过高 (>5%)
   - 可用性低于阈值 (<95%)

3. **连续失败检测**
   - 1小时内连续3次部署失败
   - 关键环境(production)部署失败
   - 数据库连接异常

### 自动触发条件

```javascript
// 自动回滚触发条件
const autoRollbackConfig = {
  enabled: true,
  criticalEnvironments: ['production'],
  maxFailureCount: 3,
  healthCheckTimeout: 300000,
  
  triggers: {
    consecutive_failures: true,    // 连续失败
    critical_health_failure: true, // 关键健康检查失败
    performance_degradation: true, // 性能降级
    database_connection_error: true // 数据库连接错误
  }
};
```

## 🛠️ 回滚流程详解

### 部署回滚流程

1. **检测失败**
   ```
   部署失败 → 健康检查 → 触发条件评估 → 自动回滚决策
   ```

2. **执行回滚**
   ```
   获取稳定部署 → Vercel回滚命令 → 验证回滚结果 → 通知发送
   ```

3. **验证恢复**
   ```
   健康检查 → 性能监控 → 功能验证 → 状态报告
   ```

### 数据库回滚流程

1. **迁移状态检查**
   ```sql
   SELECT * FROM schema_migrations 
   ORDER BY executed_at DESC;
   ```

2. **回滚执行**
   ```bash
   # 回滚到指定版本
   node scripts/migrate-database.js rollback 003_seed_data
   ```

3. **数据完整性验证**
   ```bash
   # 验证数据库状态
   npm run verify-supabase
   ```

## 🔐 安全和最佳实践

### 回滚安全原则

1. **最小影响原则**
   - 只回滚必要的组件
   - 保护用户数据完整性
   - 最小化服务中断时间

2. **验证优先原则**
   - 回滚前验证目标状态
   - 回滚后验证系统健康
   - 记录完整的回滚日志

3. **通知透明原则**
   - 及时通知相关人员
   - 详细记录回滚原因
   - 提供恢复时间估计

### 预防性措施

1. **部署前检查**
   ```bash
   # 运行完整的预部署检查
   npm run ci:check
   npm run verify-supabase
   npm run env:validate
   ```

2. **渐进式部署**
   - 先部署到staging环境
   - 通过健康检查后部署到production
   - 使用蓝绿部署策略

3. **监控和告警**
   - 实时监控关键指标
   - 设置性能阈值告警
   - 配置多渠道通知

## 🚨 紧急回滚程序

### 生产环境紧急情况

1. **立即评估**
   - 确认故障影响范围
   - 评估用户影响程度
   - 决定回滚策略

2. **快速回滚**
   ```bash
   # 紧急部署回滚
   node scripts/rollback-manager.js deployment auto production
   
   # 或通过GitHub Actions快速触发
   ```

3. **状态通信**
   - 通知技术团队
   - 更新状态页面
   - 准备用户通告

### 回滚失败处理

如果自动回滚失败：

1. **手动干预**
   ```bash
   # 直接使用Vercel CLI
   vercel rollback <deployment-url> --prod
   
   # 手动数据库回滚
   node scripts/migrate-database.js rollback <version>
   ```

2. **紧急联系**
   - 联系Vercel支持
   - 联系Supabase支持
   - 启动灾难恢复计划

## 📊 监控和报告

### 回滚指标监控

- **回滚频率**: 每月回滚次数统计
- **回滚成功率**: 自动回滚成功比例
- **恢复时间**: 从故障到恢复的平均时间
- **影响范围**: 每次回滚的用户影响评估

### 回滚报告

每次回滚后生成详细报告：

```markdown
## 回滚报告

**回滚ID**: rollback_1640995200000
**类型**: 部署回滚
**环境**: production
**触发原因**: 连续健康检查失败
**执行时间**: 2024-01-01 10:00:00 UTC
**恢复时间**: 5分钟
**影响用户**: 约1000名用户

### 时间线
- 10:00 - 检测到部署失败
- 10:01 - 触发自动回滚
- 10:03 - 回滚执行完成
- 10:05 - 健康检查通过

### 根本原因
数据库连接配置错误导致API响应失败

### 预防措施
1. 加强部署前数据库连接测试
2. 改进环境变量验证流程
3. 增加数据库连接监控告警
```

## 🔧 故障排除

### 常见问题

1. **回滚脚本执行失败**
   ```bash
   # 检查环境变量
   npm run env:check
   
   # 检查Vercel CLI配置
   vercel whoami
   
   # 检查权限
   vercel teams list
   ```

2. **数据库回滚失败**
   ```bash
   # 检查数据库连接
   npm run verify-supabase
   
   # 查看迁移状态
   npm run db:status
   
   # 手动回滚
   npm run db:rollback <version>
   ```

3. **健康检查误报**
   ```bash
   # 手动运行健康检查
   npm run monitor:health <url>
   
   # 检查网络连接
   curl -I <url>
   
   # 调整检查阈值
   ```

### 调试步骤

1. **查看回滚日志**
   ```bash
   # 查看回滚历史
   node scripts/rollback-manager.js status
   
   # 查看详细日志
   cat .rollback-history.json
   ```

2. **验证系统状态**
   ```bash
   # 全面健康检查
   npm run monitor:health
   
   # 数据库状态检查
   npm run verify-supabase
   
   # 环境配置检查
   npm run env:validate
   ```

3. **测试回滚功能**
   ```bash
   # 在staging环境测试
   node scripts/rollback-manager.js deployment auto staging
   
   # 验证回滚结果
   npm run monitor:health <staging-url>
   ```

---

**🔄 重要提醒**: 
- 回滚是最后的手段，优先考虑修复而非回滚
- 每次回滚后都要进行根本原因分析
- 定期测试回滚流程确保其可靠性
- 保持回滚文档和流程的及时更新
