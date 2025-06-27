# 🗄️ 数据库迁移自动化指南

## 📋 概述

本项目实现了完整的Supabase数据库迁移自动化系统，支持版本控制、自动执行、状态跟踪和回滚机制。

## 🏗️ 迁移系统架构

### 迁移文件组织
```
sql/                    # 基础数据库脚本
├── schema.sql         # 初始数据库结构
├── rls-policies.sql   # 行级安全策略
└── seed-data.sql      # 初始数据

migrations/            # 增量迁移文件
├── 004_add_file_metadata.sql
├── 005_add_user_preferences.sql
└── ...

scripts/
└── migrate-database.js  # 迁移执行脚本
```

### 迁移状态跟踪
系统自动创建 `schema_migrations` 表来跟踪迁移状态：
- `version`: 迁移版本号
- `name`: 迁移名称
- `executed_at`: 执行时间
- `checksum`: 文件校验和
- `execution_time_ms`: 执行耗时

## 🚀 使用方法

### 本地迁移操作

```bash
# 查看迁移状态
npm run db:status

# 执行待处理的迁移
npm run db:migrate

# 强制执行迁移（跳过检查）
npm run db:migrate:force

# 回滚指定迁移
npm run db:rollback 004_add_file_metadata
```

### 创建新迁移

1. **创建迁移文件**
   ```bash
   # 在migrations目录创建新文件
   # 命名格式: XXX_description.sql
   touch migrations/005_add_user_preferences.sql
   ```

2. **编写迁移SQL**
   ```sql
   -- Migration: Add user preferences
   -- Version: 005_add_user_preferences
   -- Description: 添加用户偏好设置表
   
   CREATE TABLE user_preferences (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     preferences JSONB DEFAULT '{}',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- 启用RLS
   ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
   
   -- 添加策略
   CREATE POLICY "Users can manage their own preferences" 
   ON user_preferences FOR ALL 
   USING (auth.uid() = user_id);
   ```

3. **测试迁移**
   ```bash
   # 在staging环境测试
   npm run db:migrate
   ```

## 🔄 自动化工作流

### 触发条件
- **文件变更**: `sql/` 或 `migrations/` 目录文件变更
- **分支推送**: `main` 或 `develop` 分支
- **手动触发**: GitHub Actions手动执行

### 执行流程

#### 1. 迁移验证 (`validate-migrations`)
- SQL语法检查
- 迁移脚本验证
- 模拟执行检查

#### 2. Staging迁移 (`migrate-staging`)
- develop分支自动触发
- 执行迁移脚本
- 验证迁移结果
- 检查迁移状态

#### 3. Production迁移 (`migrate-production`)
- main分支自动触发
- 需要GitHub Environment保护
- 预迁移备份检查
- 执行迁移脚本
- 全面验证
- 生成迁移报告

## 🔐 环境配置

### GitHub Secrets配置

**Staging环境**:
```
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_SERVICE_KEY=your_staging_service_role_key
STAGING_SUPABASE_ANON_KEY=your_staging_anon_key
```

**Production环境**:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### 环境隔离
- 不同环境使用独立的Supabase项目
- 迁移状态独立跟踪
- 环境特定的验证流程

## 🛡️ 安全和最佳实践

### 迁移安全
1. **备份策略**: 生产环境迁移前自动备份
2. **权限控制**: 使用Service Role Key执行迁移
3. **状态跟踪**: 完整的迁移历史记录
4. **校验和验证**: 防止迁移文件被篡改

### 编写规范
1. **幂等性**: 迁移应该可以重复执行
2. **向后兼容**: 避免破坏性变更
3. **事务性**: 使用事务确保原子性
4. **文档化**: 添加清晰的注释和说明

### 示例最佳实践
```sql
-- ✅ 好的迁移示例
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS new_field VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_files_new_field 
ON files(new_field);

-- ❌ 避免的做法
ALTER TABLE files 
ADD COLUMN new_field VARCHAR(255); -- 可能重复执行失败

DROP TABLE old_table; -- 破坏性操作
```

## 🔧 故障排除

### 常见问题

1. **迁移执行失败**
   ```bash
   # 检查迁移状态
   npm run db:status
   
   # 查看详细错误信息
   node scripts/migrate-database.js migrate --verbose
   ```

2. **权限问题**
   - 确认Service Role Key配置正确
   - 检查数据库权限设置
   - 验证RLS策略配置

3. **迁移冲突**
   ```bash
   # 回滚有问题的迁移
   npm run db:rollback 004_add_file_metadata
   
   # 修复后重新执行
   npm run db:migrate
   ```

4. **环境不一致**
   - 检查不同环境的迁移状态
   - 确保迁移文件同步
   - 验证环境变量配置

### 调试步骤

1. **本地测试**
   ```bash
   # 设置本地环境变量
   export NEXT_PUBLIC_SUPABASE_URL="your_url"
   export SUPABASE_SERVICE_ROLE_KEY="your_key"
   
   # 本地执行迁移
   npm run db:migrate
   ```

2. **查看迁移历史**
   ```sql
   SELECT * FROM schema_migrations 
   ORDER BY executed_at DESC;
   ```

3. **验证数据库状态**
   ```bash
   npm run verify-supabase
   ```

## 📊 监控和报告

### 迁移监控
- GitHub Actions执行日志
- 迁移状态实时跟踪
- 执行时间性能监控
- 错误和异常报告

### 报告功能
- 自动生成迁移摘要
- 详细的验证结果
- 环境状态对比
- 性能指标统计

## 🔄 回滚策略

### 自动回滚
- 迁移执行失败时自动回滚记录
- 保留数据库结构变更（需手动处理）
- 通知相关人员

### 手动回滚
```bash
# 回滚特定迁移
npm run db:rollback 004_add_file_metadata

# 查看回滚后状态
npm run db:status
```

---

**💡 提示**: 这个迁移系统重用了现有的verify-supabase.js验证脚本，确保了与现有架构的一致性。所有迁移操作都有完整的日志记录和状态跟踪。
