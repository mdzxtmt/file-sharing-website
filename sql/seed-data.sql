-- 插入初始分类数据
INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES
('图片', 'images', '图片文件，包括照片、插图、图标等', '🖼️', '#10b981', 1),
('文档', 'documents', '文档文件，包括PDF、Word、Excel等', '📄', '#3b82f6', 2),
('视频', 'videos', '视频文件，包括电影、教程、演示等', '🎥', '#8b5cf6', 3),
('音频', 'audio', '音频文件，包括音乐、播客、录音等', '🎵', '#f59e0b', 4),
('压缩包', 'archives', '压缩文件，包括ZIP、RAR、7Z等', '📦', '#6b7280', 5),
('代码', 'code', '代码文件，包括源码、脚本、配置等', '💻', '#ef4444', 6),
('其他', 'others', '其他类型的文件', '📁', '#64748b', 7)
ON CONFLICT (slug) DO NOTHING;

-- 插入初始标签数据
INSERT INTO tags (name, slug) VALUES
('热门', 'popular'),
('推荐', 'featured'),
('新上传', 'new'),
('高质量', 'high-quality'),
('免费', 'free'),
('开源', 'open-source'),
('教程', 'tutorial'),
('模板', 'template'),
('工具', 'tool'),
('资源', 'resource'),
('设计', 'design'),
('开发', 'development'),
('办公', 'office'),
('学习', 'study'),
('娱乐', 'entertainment')
ON CONFLICT (slug) DO NOTHING;

-- 更新标签使用计数（示例）
UPDATE tags SET usage_count = 
  CASE slug
    WHEN 'popular' THEN 50
    WHEN 'featured' THEN 30
    WHEN 'new' THEN 100
    WHEN 'high-quality' THEN 25
    WHEN 'free' THEN 80
    WHEN 'open-source' THEN 40
    WHEN 'tutorial' THEN 60
    WHEN 'template' THEN 35
    WHEN 'tool' THEN 45
    WHEN 'resource' THEN 70
    WHEN 'design' THEN 55
    WHEN 'development' THEN 65
    WHEN 'office' THEN 30
    WHEN 'study' THEN 40
    WHEN 'entertainment' THEN 20
    ELSE usage_count
  END;
