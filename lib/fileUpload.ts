import { supabase, STORAGE_BUCKET, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from './supabase'
import { FileService } from './database'
import { generateId, getFileCategory } from '@/utils'
import type { UploadProgress } from '@/types'

export interface FileUploadOptions {
  categoryId?: string
  description?: string
  tags?: string[]
  isPublic?: boolean
  onProgress?: (progress: number) => void
  onError?: (error: string) => void
  onSuccess?: (fileData: any) => void
}

export class FileUploadService {
  // 验证文件
  static validateFile(file: File): { valid: boolean; error?: string } {
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `文件大小超过限制 (${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`
      }
    }

    // 检查文件类型
    if (ALLOWED_FILE_TYPES.length > 0 && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.type}`
      }
    }

    return { valid: true }
  }

  // 生成文件路径
  static generateFilePath(file: File, userId?: string): string {
    const timestamp = Date.now()
    const randomId = generateId()
    const extension = file.name.split('.').pop()
    const category = getFileCategory(file.type)
    
    // 路径格式: public/category/year/month/randomId_timestamp.extension
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    
    return `public/${category}/${year}/${month}/${randomId}_${timestamp}.${extension}`
  }

  // 上传单个文件
  static async uploadFile(
    file: File, 
    options: FileUploadOptions = {}
  ): Promise<any> {
    // 验证文件
    const validation = this.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    try {
      // 生成文件路径
      const filePath = this.generateFilePath(file)
      
      // 上传到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`上传失败: ${uploadError.message}`)
      }

      // 获取公开URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath)

      // 创建文件记录
      const fileData = await FileService.createFile({
        name: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
        original_name: file.name,
        size: file.size,
        mime_type: file.type,
        storage_path: filePath,
        public_url: urlData.publicUrl,
        category_id: options.categoryId,
        description: options.description,
        tags: options.tags,
      })

      options.onSuccess?.(fileData)
      return fileData

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      options.onError?.(errorMessage)
      throw error
    }
  }

  // 批量上传文件
  static async uploadFiles(
    files: File[],
    options: FileUploadOptions & {
      onFileProgress?: (fileId: string, progress: UploadProgress) => void
      onAllComplete?: (results: any[]) => void
    } = {}
  ): Promise<any[]> {
    const results: any[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileId = generateId()

      try {
        // 通知开始上传
        options.onFileProgress?.(fileId, {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'uploading'
        })

        const result = await this.uploadFile(file, {
          ...options,
          onProgress: (progress) => {
            options.onFileProgress?.(fileId, {
              fileId,
              fileName: file.name,
              progress,
              status: 'uploading'
            })
          },
          onSuccess: (fileData) => {
            options.onFileProgress?.(fileId, {
              fileId,
              fileName: file.name,
              progress: 100,
              status: 'success'
            })
          },
          onError: (error) => {
            options.onFileProgress?.(fileId, {
              fileId,
              fileName: file.name,
              progress: 0,
              status: 'error',
              error
            })
          }
        })

        results.push(result)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败'
        errors.push(`${file.name}: ${errorMessage}`)
        
        options.onFileProgress?.(fileId, {
          fileId,
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage
        })
      }
    }

    options.onAllComplete?.(results)

    if (errors.length > 0) {
      console.warn('部分文件上传失败:', errors)
    }

    return results
  }

  // 删除文件
  static async deleteFile(fileId: string, storagePath: string): Promise<void> {
    try {
      // 从存储中删除文件
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])

      if (storageError) {
        console.warn('删除存储文件失败:', storageError.message)
      }

      // 从数据库中删除记录
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (dbError) {
        throw new Error(`删除文件记录失败: ${dbError.message}`)
      }

    } catch (error) {
      throw error
    }
  }

  // 生成缩略图（对于图片文件）
  static async generateThumbnail(file: File): Promise<string | null> {
    if (!file.type.startsWith('image/')) {
      return null
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 设置缩略图尺寸
        const maxSize = 200
        let { width, height } = img

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // 绘制缩略图
        ctx?.drawImage(img, 0, 0, width, height)
        
        // 转换为base64
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
      }

      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
  }
}
