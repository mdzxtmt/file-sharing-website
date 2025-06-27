// 基础类型定义

export interface User {
  id: string
  email?: string
  name?: string
  avatar?: string
  created_at: string
  updated_at: string
}

export interface FileItem {
  id: string
  name: string
  original_name: string
  slug?: string
  size: number
  mime_type: string
  category_id?: string
  description?: string
  storage_path: string
  public_url: string
  thumbnail_url?: string
  preview_url?: string
  download_count: number
  view_count: number
  like_count: number
  is_public: boolean
  is_featured: boolean
  upload_time: string
  user_id?: string
  created_at: string
  updated_at: string
  category?: Category
  tags?: Tag[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  sort_order: number
  file_count: number
  is_active: boolean
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  usage_count: number
  created_at: string
}

export interface UserAction {
  id: string
  user_id?: string
  file_id: string
  action_type: 'view' | 'download' | 'like' | 'share'
  ip_address?: string
  user_agent?: string
  created_at: string
}

// UI相关类型
export interface Theme {
  mode: 'light' | 'dark'
  primaryColor: string
}

export interface UIState {
  sidebarOpen: boolean
  theme: Theme
  loading: boolean
}

// API响应类型
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// 文件上传相关类型
export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export interface FileUploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  category?: string
  tags?: string[]
  description?: string
  isPublic?: boolean
}

// 搜索和筛选类型
export interface SearchFilters {
  query?: string
  category?: string
  tags?: string[]
  fileType?: string
  dateRange?: {
    start: string
    end: string
  }
  sortBy?: 'name' | 'size' | 'upload_time' | 'download_count' | 'view_count'
  sortOrder?: 'asc' | 'desc'
}

// 统计数据类型
export interface Statistics {
  totalFiles: number
  totalSize: number
  totalDownloads: number
  totalViews: number
  categoriesCount: number
  tagsCount: number
  usersCount: number
}

// 排行榜类型
export interface RankingItem {
  file: FileItem
  rank: number
  score: number
  change?: number // 排名变化
}

export interface Rankings {
  mostDownloaded: RankingItem[]
  mostViewed: RankingItem[]
  mostLiked: RankingItem[]
  newest: RankingItem[]
  trending: RankingItem[]
}
