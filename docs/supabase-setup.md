# Supabase 配置指南

本文档详细说明如何配置 Supabase 项目以支持文件分享网站的功能。

## 📋 配置清单

### 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `file-share-website`
   - **Database Password**: 生成强密码并保存
   - **Region**: `Southeast Asia (Singapore)` - 距离香港最近，优化亚太访问
4. 等待项目创建完成（约2-3分钟）

### 2. 获取 API 配置

1. 进入项目 Dashboard
2. 点击左侧 "Settings" > "API"
3. 复制以下信息到 `.env.local` 文件：
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

### 3. 执行数据库迁移

在 Supabase Dashboard 的 SQL Editor 中依次执行以下脚本：

#### 3.1 创建表结构
```sql
-- 复制 sql/schema.sql 的内容并执行
```

#### 3.2 配置 RLS 策略
```sql
-- 复制 sql/rls-policies.sql 的内容并执行
```

#### 3.3 插入初始数据
```sql
-- 复制 sql/seed-data.sql 的内容并执行
```

### 4. 配置 Storage 存储桶

#### 4.1 创建存储桶
1. 在 Dashboard 中点击 "Storage"
2. 点击 "Create a new bucket"
3. 填写信息：
   - **Name**: `files`
   - **Public bucket**: ✅ 勾选
   - **File size limit**: `50MB`
   - **Allowed MIME types**: 留空（允许所有类型）

#### 4.2 配置存储桶策略
在 Storage > Policies 中添加以下策略：

**策略1：允许所有人查看文件**
- **Policy name**: `Public file access`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **USING expression**: `true`

**策略2：允许任何人上传文件**
- **Policy name**: `Anyone can upload`
- **Allowed operation**: `INSERT`
- **Target roles**: `public`
- **WITH CHECK expression**: `true`

**策略3：允许用户删除自己的文件**
- **Policy name**: `Users can delete own files`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**: `auth.uid()::text = (storage.foldername(name))[1]`

### 5. 配置认证设置

1. 在 Dashboard 中点击 "Authentication" > "Settings"
2. 配置以下选项：
   - **Enable email confirmations**: ❌ 关闭（简化注册流程）
   - **Enable phone confirmations**: ❌ 关闭
   - **Enable custom SMTP**: ❌ 关闭（使用默认）

### 6. 配置 CORS 设置

在 "Settings" > "API" > "CORS" 中添加：
```
http://localhost:3000
https://your-domain.vercel.app
```

## 🔧 数据库结构说明

### 核心表结构

#### files 表（文件主表）
- 存储所有文件的元数据信息
- 支持分类、标签、统计等功能
- 包含公开/私有、推荐等状态字段

#### categories 表（分类表）
- 文件分类管理
- 支持图标、颜色、排序等自定义
- 自动统计分类下的文件数量

#### tags 表（标签表）
- 文件标签系统
- 支持标签使用统计
- 通过 file_tags 表关联文件

#### user_actions 表（用户行为表）
- 记录用户行为（查看、下载、点赞、分享）
- 支持匿名用户行为记录
- 用于统计和分析

### 关键功能

#### 全文搜索
- 使用 PostgreSQL 的 gin 索引
- 支持文件名和描述的模糊搜索
- 优化中文搜索体验

#### 统计函数
- `increment_download_count()`: 增加下载计数
- `increment_view_count()`: 增加浏览计数
- `get_file_stats()`: 获取全站统计信息

#### 自动化触发器
- 自动更新 `updated_at` 字段
- 自动维护分类文件计数
- 确保数据一致性

## 🛡️ 安全策略

### Row Level Security (RLS)
- 所有表都启用了 RLS
- 公开文件对所有人可见
- 用户只能管理自己上传的文件
- 匿名用户可以上传和查看文件

### 存储安全
- 文件存储在公开存储桶中
- 支持匿名上传和访问
- 用户可以删除自己上传的文件

## 📊 性能优化

### 数据库索引
- 为常用查询字段创建索引
- 支持高效的分页和排序
- 优化全文搜索性能

### 缓存策略
- 分类文件计数缓存
- 热门文件视图
- 减少重复查询

## 🔍 验证配置

配置完成后，可以通过以下方式验证：

1. **数据库连接测试**
   ```bash
   npm run dev
   # 检查控制台是否有 Supabase 连接错误
   ```

2. **表结构验证**
   - 在 Supabase Dashboard 的 Table Editor 中查看所有表
   - 确认表结构和索引正确创建

3. **RLS 策略测试**
   - 尝试查询 files 表
   - 确认只能看到 is_public = true 的记录

4. **存储桶测试**
   - 尝试上传一个测试文件
   - 确认文件可以正常访问

## 🚨 常见问题

### 问题1：无法连接到 Supabase
- 检查环境变量是否正确配置
- 确认项目 URL 和 API Key 无误
- 检查网络连接

### 问题2：RLS 策略阻止访问
- 确认策略配置正确
- 检查用户认证状态
- 验证策略条件表达式

### 问题3：文件上传失败
- 检查存储桶策略
- 确认文件大小限制
- 验证 CORS 配置

### 问题4：搜索功能不工作
- 确认 pg_trgm 扩展已启用
- 检查全文搜索索引
- 验证搜索查询语法

## 📞 获取帮助

如果遇到配置问题：
1. 查看 Supabase 官方文档
2. 检查项目日志和错误信息
3. 参考本项目的示例代码
4. 在项目 Issues 中提问
