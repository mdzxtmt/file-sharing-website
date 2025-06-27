-- Migration: Add file metadata fields
-- Version: 004_add_file_metadata
-- Description: 添加文件元数据字段，包括EXIF信息、文件哈希等

-- 添加文件元数据字段
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exif_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS thumbnail_generated BOOLEAN DEFAULT false;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_files_file_hash ON files(file_hash);
CREATE INDEX IF NOT EXISTS idx_files_processing_status ON files(processing_status);
CREATE INDEX IF NOT EXISTS idx_files_thumbnail_generated ON files(thumbnail_generated);

-- 添加文件哈希唯一约束（防止重复上传）
ALTER TABLE files 
ADD CONSTRAINT unique_file_hash UNIQUE (file_hash);

-- 更新现有记录的处理状态
UPDATE files 
SET processing_status = 'completed' 
WHERE processing_status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';

-- 添加注释
COMMENT ON COLUMN files.file_hash IS '文件SHA-256哈希值，用于去重';
COMMENT ON COLUMN files.metadata IS '文件元数据信息（JSON格式）';
COMMENT ON COLUMN files.exif_data IS '图片EXIF信息（JSON格式）';
COMMENT ON COLUMN files.processing_status IS '文件处理状态：pending, processing, completed, failed';
COMMENT ON COLUMN files.thumbnail_generated IS '是否已生成缩略图';
