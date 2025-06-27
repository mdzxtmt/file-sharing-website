import { NextRequest, NextResponse } from 'next/server'
import { FileUploadService } from '@/lib/fileUpload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 })
    }

    // 验证文件
    const validation = FileUploadService.validateFile(file)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 })
    }

    // 获取上传选项
    const categoryId = formData.get('categoryId') as string || undefined
    const description = formData.get('description') as string || undefined
    const tags = formData.get('tags') as string
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined

    // 上传文件
    const result = await FileUploadService.uploadFile(file, {
      categoryId,
      description,
      tags: tagsArray,
      isPublic: true
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 })
  }
}

// 获取上传状态
export async function GET() {
  try {
    // 这里可以返回上传相关的统计信息
    return NextResponse.json({
      success: true,
      data: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
          'image/*',
          'application/pdf',
          'text/*',
          'video/*',
          'audio/*'
        ],
        storageUsed: 0, // TODO: 实现存储使用量统计
        storageLimit: 1024 * 1024 * 1024 // 1GB
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get upload info'
    }, { status: 500 })
  }
}
