import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 创建Supabase客户端
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 文件上传配置
export const STORAGE_BUCKET = 'files'
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ALLOWED_FILE_TYPES = [
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 文本
  'text/plain',
  'text/csv',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  // 压缩文件
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // 音频
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  // 视频
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo'
]

// 工具函数
export const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  return data
}

export const deleteFile = async (path: string) => {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])
  
  if (error) throw error
}

// 数据库查询辅助函数
export const getFiles = async (options?: {
  limit?: number
  offset?: number
  category?: string
  search?: string
  sortBy?: 'name' | 'size' | 'upload_time' | 'download_count'
  sortOrder?: 'asc' | 'desc'
}) => {
  let query = supabase
    .from('files')
    .select(`
      *,
      category:categories(id, name, icon, color),
      tags:file_tags(tag:tags(id, name))
    `)
    .eq('is_public', true)

  // 搜索
  if (options?.search) {
    query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
  }

  // 分类筛选
  if (options?.category) {
    query = query.eq('category_id', options.category)
  }

  // 排序
  const sortBy = options?.sortBy || 'upload_time'
  const sortOrder = options?.sortOrder || 'desc'
  query = query.order(sortBy, { ascending: sortOrder === 'asc' })

  // 分页
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data
}

export const getTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('usage_count', { ascending: false })

  if (error) throw error
  return data
}

export const incrementDownloadCount = async (fileId: string) => {
  const { error } = await supabase.rpc('increment_download_count', {
    file_id: fileId
  })
  
  if (error) throw error
}

export const incrementViewCount = async (fileId: string) => {
  const { error } = await supabase.rpc('increment_view_count', {
    file_id: fileId
  })
  
  if (error) throw error
}
