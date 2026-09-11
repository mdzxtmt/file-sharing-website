import { supabase } from './supabase'
import type { Database } from '@/types/database'

type FileRow = Database['public']['Tables']['files']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type TagRow = Database['public']['Tables']['tags']['Row']

// 文件相关操作
export class FileService {
  // 创建文件记录
  static async createFile(fileData: {
    name: string
    original_name: string
    size: number
    mime_type: string
    storage_path: string
    public_url: string
    category_id?: string
    description?: string
    user_id?: string
    tags?: string[]
  }) {
    const { tags, ...fileInfo } = fileData
    
    // 生成 slug
    const slug = this.generateSlug(fileData.name)
    
    const { data: file, error } = await supabase
      .from('files')
      .insert({
        ...fileInfo,
        slug,
      })
      .select()
      .single()

    if (error) throw error

    // 如果有标签，创建关联
    if (tags && tags.length > 0) {
      await this.addFileTags(file.id, tags)
    }

    return file
  }

  // 获取文件列表
  static async getFiles(options: {
    limit?: number
    offset?: number
    category?: string
    search?: string
    tags?: string[]
    sortBy?: 'name' | 'size' | 'upload_time' | 'download_count' | 'view_count'
    sortOrder?: 'asc' | 'desc'
    featured?: boolean
  } = {}) {
    let query = supabase
      .from('files')
      .select(`
        *,
        category:categories(id, name, slug, icon, color),
        file_tags(tag:tags(id, name, slug))
      `)
      .eq('is_public', true)

    // 搜索
    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
    }

    // 分类筛选
    if (options.category) {
      query = query.eq('category_id', options.category)
    }

    // 推荐筛选
    if (options.featured) {
      query = query.eq('is_featured', true)
    }

    // 标签筛选
    if (options.tags && options.tags.length > 0) {
      const tagIds = await this.getTagIdsByNames(options.tags)
      if (tagIds.length > 0) {
        query = query.in('id', 
          supabase
            .from('file_tags')
            .select('file_id')
            .in('tag_id', tagIds)
        )
      }
    }

    // 排序
    const sortBy = options.sortBy || 'upload_time'
    const sortOrder = options.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 分页
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  // 获取单个文件
  static async getFile(id: string) {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        category:categories(id, name, slug, icon, color),
        file_tags(tag:tags(id, name, slug))
      `)
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error) throw error
    return data
  }

  // 增加下载计数
  static async incrementDownloadCount(fileId: string) {
    const { error } = await supabase.rpc('increment_download_count', {
      file_id: fileId
    })
    if (error) throw error
  }

  // 增加浏览计数
  static async incrementViewCount(fileId: string) {
    const { error } = await supabase.rpc('increment_view_count', {
      file_id: fileId
    })
    if (error) throw error
  }

  // 为文件添加标签
  static async addFileTags(fileId: string, tagNames: string[]) {
    // 获取或创建标签
    const tagIds = await TagService.getOrCreateTags(tagNames)
    
    // 创建关联
    const fileTagsData = tagIds.map(tagId => ({
      file_id: fileId,
      tag_id: tagId
    }))

    const { error } = await supabase
      .from('file_tags')
      .insert(fileTagsData)

    if (error) throw error
  }

  // 生成文件 slug
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
  }

  // 根据标签名获取标签ID
  static async getTagIdsByNames(tagNames: string[]): Promise<string[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('id')
      .in('name', tagNames)

    if (error) throw error
    return data.map(tag => tag.id)
  }
}

// 分类相关操作
export class CategoryService {
  // 获取所有分类
  static async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return data
  }

  // 获取单个分类
  static async getCategory(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data
  }
}

// 标签相关操作
export class TagService {
  // 获取所有标签
  static async getTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('usage_count', { ascending: false })

    if (error) throw error
    return data
  }

  // 获取热门标签
  static async getPopularTags(limit = 20) {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  // 获取或创建标签
  static async getOrCreateTags(tagNames: string[]): Promise<string[]> {
    const tagIds: string[] = []

    for (const name of tagNames) {
      const slug = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      
      // 尝试获取现有标签
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', name)
        .single()

      if (existingTag) {
        tagIds.push(existingTag.id)
      } else {
        // 创建新标签
        const { data: newTag, error } = await supabase
          .from('tags')
          .insert({ name, slug })
          .select('id')
          .single()

        if (error) throw error
        tagIds.push(newTag.id)
      }
    }

    return tagIds
  }
}

// 统计相关操作
export class StatsService {
  // 获取全站统计
  static async getGlobalStats() {
    const { data, error } = await supabase.rpc('get_file_stats')
    if (error) throw error
    return data[0]
  }

  // 获取分类统计
  static async getCategoryStats() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, file_count')
      .eq('is_active', true)
      .order('file_count', { ascending: false })

    if (error) throw error
    return data
  }

  // 记录用户行为
  static async recordUserAction(
    fileId: string,
    actionType: 'view' | 'download' | 'like' | 'share',
    userId?: string
  ) {
    const { error } = await supabase
      .from('user_actions')
      .insert({
        file_id: fileId,
        action_type: actionType,
        user_id: userId,
        ip_address: null, // 在实际应用中可以获取真实IP
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      })

    if (error) throw error
  }
}
