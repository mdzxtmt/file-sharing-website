'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  DocumentPlusIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Modal, Input } from '@/components/ui'
import { UploadQueue } from './UploadProgress'
import { FileUploadService } from '@/lib/fileUpload'
import { useFileStore, useUploadQueue } from '@/stores/useFileStore'
import { formatFileSize, generateId } from '@/utils'
import type { FileUploadOptions } from '@/lib/fileUpload'

interface FileUploadProps {
  onUploadComplete?: (files: any[]) => void
  className?: string
  maxFiles?: number
  disabled?: boolean
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  className,
  maxFiles = 10,
  disabled = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadOptions, setUploadOptions] = useState<FileUploadOptions>({
    categoryId: '',
    description: '',
    tags: [],
    isPublic: true
  })

  const { addFiles } = useFileStore()
  const {
    uploadQueue,
    isUploading,
    addToUploadQueue,
    updateUploadProgress,
    removeFromUploadQueue,
    clearUploadQueue,
    setIsUploading
  } = useUploadQueue()

  // 文件拖拽处理
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return

    // 验证文件数量
    if (acceptedFiles.length > maxFiles) {
      toast.error(`最多只能选择 ${maxFiles} 个文件`)
      return
    }

    // 验证每个文件
    const validFiles: File[] = []
    const errors: string[] = []

    acceptedFiles.forEach(file => {
      const validation = FileUploadService.validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      setIsModalOpen(true)
    }
  }, [disabled, maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
    maxFiles
  })

  // 开始上传
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setIsModalOpen(false)

    try {
      const uploadedFiles = await FileUploadService.uploadFiles(
        selectedFiles,
        {
          ...uploadOptions,
          onFileProgress: (fileId, progress) => {
            if (progress.status === 'uploading' && progress.progress === 0) {
              addToUploadQueue(progress)
            } else {
              updateUploadProgress(fileId, progress)
            }
          },
          onAllComplete: (results) => {
            setIsUploading(false)
            addFiles(results)
            onUploadComplete?.(results)
            toast.success(`成功上传 ${results.length} 个文件`)
            
            // 3秒后自动清除成功的上传记录
            setTimeout(() => {
              clearUploadQueue()
            }, 3000)
          }
        }
      )
    } catch (error) {
      setIsUploading(false)
      toast.error('上传失败，请重试')
    }

    setSelectedFiles([])
    setUploadOptions({
      categoryId: '',
      description: '',
      tags: [],
      isPublic: true
    })
  }

  // 移除选中的文件
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  // 重试上传
  const handleRetry = (fileId: string) => {
    // TODO: 实现重试逻辑
    toast.info('重试功能开发中...')
  }

  // 取消上传
  const handleCancel = (fileId: string) => {
    removeFromUploadQueue(fileId)
  }

  // 清除已完成的上传
  const handleClearCompleted = () => {
    clearUploadQueue()
  }

  // 获取文件类型图标
  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <PhotoIcon className="w-8 h-8" />
    if (file.type.startsWith('video/')) return <VideoCameraIcon className="w-8 h-8" />
    if (file.type.startsWith('audio/')) return <MusicalNoteIcon className="w-8 h-8" />
    if (file.type.includes('zip') || file.type.includes('rar')) return <ArchiveBoxIcon className="w-8 h-8" />
    return <DocumentPlusIcon className="w-8 h-8" />
  }

  return (
    <div className={className}>
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer',
          {
            'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20': isDragActive,
            'border-gray-300 hover:border-primary-400 dark:border-gray-600 dark:hover:border-primary-500': !isDragActive && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800': disabled,
          }
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={clsx(
            'w-16 h-16 rounded-full flex items-center justify-center',
            isDragActive ? 'bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
          )}>
            <CloudArrowUpIcon className="w-8 h-8" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {isDragActive ? '释放文件开始上传' : '拖拽文件到这里上传'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              或者 <span className="text-primary-600 dark:text-primary-400 font-medium">点击选择文件</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              支持图片、文档、视频、音频等格式，单文件最大50MB
            </p>
          </div>
        </div>
      </div>

      {/* 上传队列 */}
      {uploadQueue.length > 0 && (
        <div className="mt-6">
          <UploadQueue
            uploads={uploadQueue}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onClearCompleted={handleClearCompleted}
          />
        </div>
      )}

      {/* 上传配置模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="配置上传选项"
        size="lg"
      >
        <div className="space-y-6">
          {/* 选中的文件列表 */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              选中的文件 ({selectedFiles.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="text-gray-400 dark:text-gray-500">
                    {getFileTypeIcon(file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeSelectedFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 上传选项 */}
          <div className="space-y-4">
            <Input
              label="描述（可选）"
              placeholder="为这些文件添加描述..."
              value={uploadOptions.description || ''}
              onChange={(e) => setUploadOptions(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签（可选）
              </label>
              <Input
                placeholder="输入标签，用逗号分隔"
                value={uploadOptions.tags?.join(', ') || ''}
                onChange={(e) => setUploadOptions(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              loading={isUploading}
            >
              开始上传 ({selectedFiles.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default FileUpload
