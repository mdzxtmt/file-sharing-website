-- 启用行级安全策略 (RLS)

-- 文件表 RLS 策略
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 公开文件可以被所有人查看
CREATE POLICY "Public files are viewable by everyone" ON files
  FOR SELECT USING (is_public = true);

-- 任何人都可以插入文件（匿名上传）
CREATE POLICY "Anyone can insert files" ON files
  FOR INSERT WITH CHECK (true);

-- 用户可以更新自己上传的文件
CREATE POLICY "Users can update own files" ON files
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户可以删除自己上传的文件
CREATE POLICY "Users can delete own files" ON files
  FOR DELETE USING (auth.uid() = user_id);

-- 分类表 RLS 策略
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 活跃分类可以被所有人查看
CREATE POLICY "Active categories are viewable by everyone" ON categories
  FOR SELECT USING (is_active = true);

-- 只有认证用户可以创建分类
CREATE POLICY "Authenticated users can insert categories" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

-- 只有认证用户可以更新分类
CREATE POLICY "Authenticated users can update categories" ON categories
  FOR UPDATE TO authenticated USING (true);

-- 标签表 RLS 策略
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 所有标签可以被所有人查看
CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

-- 任何人都可以创建标签
CREATE POLICY "Anyone can insert tags" ON tags
  FOR INSERT WITH CHECK (true);

-- 认证用户可以更新标签
CREATE POLICY "Authenticated users can update tags" ON tags
  FOR UPDATE TO authenticated USING (true);

-- 文件标签关联表 RLS 策略
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;

-- 公开文件的标签关联可以被所有人查看
CREATE POLICY "File tags are viewable for public files" ON file_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM files 
      WHERE files.id = file_tags.file_id 
      AND files.is_public = true
    )
  );

-- 任何人都可以为文件添加标签
CREATE POLICY "Anyone can insert file tags" ON file_tags
  FOR INSERT WITH CHECK (true);

-- 用户可以删除自己文件的标签关联
CREATE POLICY "Users can delete own file tags" ON file_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM files 
      WHERE files.id = file_tags.file_id 
      AND files.user_id = auth.uid()
    )
  );

-- 用户行为表 RLS 策略
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- 用户行为记录可以被所有人查看（用于统计）
CREATE POLICY "User actions are viewable by everyone" ON user_actions
  FOR SELECT USING (true);

-- 任何人都可以记录用户行为
CREATE POLICY "Anyone can insert user actions" ON user_actions
  FOR INSERT WITH CHECK (true);

-- 用户可以查看自己的行为记录
CREATE POLICY "Users can view own actions" ON user_actions
  FOR SELECT USING (auth.uid() = user_id);

-- Storage 存储桶策略
-- 注意：这些策略需要在 Supabase Dashboard 中配置

-- 存储桶：files
-- 1. 允许所有人查看公开文件
-- 对象路径：public/*
-- 策略：SELECT
-- 条件：true

-- 2. 允许任何人上传文件
-- 对象路径：public/*
-- 策略：INSERT
-- 条件：true

-- 3. 允许用户删除自己上传的文件
-- 对象路径：public/*
-- 策略：DELETE
-- 条件：auth.uid()::text = (storage.foldername(name))[1]

-- 创建视图：热门文件
CREATE OR REPLACE VIEW popular_files AS
SELECT 
  f.*,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color
FROM files f
LEFT JOIN categories c ON f.category_id = c.id
WHERE f.is_public = true
ORDER BY f.download_count DESC, f.view_count DESC
LIMIT 100;

-- 创建视图：最新文件
CREATE OR REPLACE VIEW recent_files AS
SELECT 
  f.*,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color
FROM files f
LEFT JOIN categories c ON f.category_id = c.id
WHERE f.is_public = true
ORDER BY f.upload_time DESC
LIMIT 100;

-- 创建视图：推荐文件
CREATE OR REPLACE VIEW featured_files AS
SELECT 
  f.*,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color
FROM files f
LEFT JOIN categories c ON f.category_id = c.id
WHERE f.is_public = true AND f.is_featured = true
ORDER BY f.upload_time DESC;

-- 为视图启用 RLS
ALTER VIEW popular_files SET (security_invoker = true);
ALTER VIEW recent_files SET (security_invoker = true);
ALTER VIEW featured_files SET (security_invoker = true);
