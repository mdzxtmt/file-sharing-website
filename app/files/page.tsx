'use client'

import { useState } from 'react'
import { FileList, FileSearch, FilePreview } from '@/components/file'
import { StatsService } from '@/lib/database'
import type { FileItem } from '@/types'

export default function FilesPage() {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  // 处理文件预览
  const handleFilePreview = async (file: FileItem) => {
    try {
      // 增加浏览计数
      await StatsService.recordUserAction(file.id, 'view')
      setPreviewFile(file)
    } catch (error) {
      console.error('记录浏览失败:', error)
      setPreviewFile(file)
    }
  }

  // 处理文件下载
  const handleFileDownload = async (file: FileItem) => {
    try {
      // 增加下载计数
      await StatsService.recordUserAction(file.id, 'download')
    } catch (error) {
      console.error('记录下载失败:', error)
    }
  }

  // 处理文件点赞
  const handleFileLike = async (file: FileItem) => {
    try {
      // 记录点赞行为
      await StatsService.recordUserAction(file.id, 'like')
    } catch (error) {
      console.error('记录点赞失败:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          文件库
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          浏览和管理所有上传的文件
        </p>
      </div>

      {/* 搜索和筛选 */}
      <FileSearch showFilters={true} />

      {/* 文件列表 */}
      <FileList
        onFilePreview={handleFilePreview}
        onFileDownload={handleFileDownload}
        onFileLike={handleFileLike}
      />

      {/* 文件预览模态框 */}
      <FilePreview
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleFileDownload}
      />
    </div>
  )
}
