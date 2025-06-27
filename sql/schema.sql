-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- 图标名称
  color TEXT, -- 主题色
  sort_order INTEGER DEFAULT 0,
  file_count INTEGER DEFAULT 0, -- 文件数量缓存
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建文件主表
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  slug TEXT UNIQUE, -- URL友好的文件标识
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT, -- 缩略图URL
  preview_url TEXT, -- 预览图URL
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- 是否推荐
  upload_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建文件标签关联表
CREATE TABLE IF NOT EXISTS file_tags (
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (file_id, tag_id)
);

-- 创建用户行为表
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'download', 'like', 'share')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category_id);
CREATE INDEX IF NOT EXISTS idx_files_public ON files(is_public);
CREATE INDEX IF NOT EXISTS idx_files_featured ON files(is_featured);
CREATE INDEX IF NOT EXISTS idx_files_upload_time ON files(upload_time DESC);
CREATE INDEX IF NOT EXISTS idx_files_download_count ON files(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_files_view_count ON files(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);

CREATE INDEX IF NOT EXISTS idx_user_actions_file ON user_actions(file_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_time ON user_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_user ON user_actions(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_files_search ON files USING gin(
  (name || ' ' || COALESCE(description, '')) gin_trgm_ops
);

-- 创建触发器函数：更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 files 表创建触发器
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建函数：增加下载计数
CREATE OR REPLACE FUNCTION increment_download_count(file_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE files 
  SET download_count = download_count + 1,
      updated_at = NOW()
  WHERE id = file_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：增加浏览计数
CREATE OR REPLACE FUNCTION increment_view_count(file_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE files 
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = file_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：获取统计信息
CREATE OR REPLACE FUNCTION get_file_stats()
RETURNS TABLE(
  total_files BIGINT,
  total_size BIGINT,
  total_downloads BIGINT,
  total_views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_files,
    COALESCE(SUM(size), 0)::BIGINT as total_size,
    COALESCE(SUM(download_count), 0)::BIGINT as total_downloads,
    COALESCE(SUM(view_count), 0)::BIGINT as total_views
  FROM files 
  WHERE is_public = true;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：更新分类文件计数
CREATE OR REPLACE FUNCTION update_category_file_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果是插入或更新操作
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- 更新新分类的文件计数
    IF NEW.category_id IS NOT NULL THEN
      UPDATE categories 
      SET file_count = (
        SELECT COUNT(*) 
        FROM files 
        WHERE category_id = NEW.category_id AND is_public = true
      )
      WHERE id = NEW.category_id;
    END IF;
  END IF;

  -- 如果是删除或更新操作
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    -- 更新旧分类的文件计数
    IF OLD.category_id IS NOT NULL THEN
      UPDATE categories 
      SET file_count = (
        SELECT COUNT(*) 
        FROM files 
        WHERE category_id = OLD.category_id AND is_public = true
      )
      WHERE id = OLD.category_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 为 files 表创建分类计数触发器
DROP TRIGGER IF EXISTS update_category_count ON files;
CREATE TRIGGER update_category_count
  AFTER INSERT OR UPDATE OR DELETE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_category_file_count();
