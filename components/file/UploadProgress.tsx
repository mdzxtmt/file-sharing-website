'use client'

import React from 'react'
import { clsx } from 'clsx'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import { formatFileSize, getFileTypeIcon } from '@/utils'
import type { UploadProgress as UploadProgressType } from '@/types'

interface UploadProgressProps {
  upload: UploadProgressType
  onRetry?: (fileId: string) => void
  onCancel?: (fileId: string) => void
  className?: string
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  upload,
  onRetry,
  onCancel,
  className
}) => {
  const { fileName, progress, status, error } = upload

  // 获取文件信息
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || ''
  const fileIcon = getFileTypeIcon(fileName)

  // 状态图标
  const StatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      case 'uploading':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-400" />
    }
  }

  // 状态颜色
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'uploading':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  // 进度条颜色
  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'uploading':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={clsx(
      'flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
      'transition-all duration-200',
      className
    )}>
      {/* 文件图标 */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <span className="text-lg">{fileIcon}</span>
        </div>
      </div>

      {/* 文件信息和进度 */}
      <div className="flex-1 min-w-0">
        {/* 文件名 */}
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {fileName}
          </p>
          <StatusIcon />
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
          <div
            className={clsx(
              'h-2 rounded-full transition-all duration-300',
              getProgressColor()
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 状态信息 */}
        <div className="flex items-center justify-between">
          <span className={clsx('text-xs', getStatusColor())}>
            {status === 'uploading' && `上传中... ${progress}%`}
            {status === 'success' && '上传成功'}
            {status === 'error' && (error || '上传失败')}
            {status === 'pending' && '等待上传'}
          </span>
          
          {fileExtension && (
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              {fileExtension}
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {status === 'error' && onRetry && (
          <button
            onClick={() => onRetry(upload.fileId)}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="重试"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        )}
        
        {(status === 'pending' || status === 'error') && onCancel && (
          <button
            onClick={() => onCancel(upload.fileId)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="取消"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 上传队列组件
interface UploadQueueProps {
  uploads: UploadProgressType[]
  onRetry?: (fileId: string) => void
  onCancel?: (fileId: string) => void
  onClearCompleted?: () => void
  className?: string
}

export const UploadQueue: React.FC<UploadQueueProps> = ({
  uploads,
  onRetry,
  onCancel,
  onClearCompleted,
  className
}) => {
  if (uploads.length === 0) {
    return null
  }

  const completedUploads = uploads.filter(u => u.status === 'success' || u.status === 'error')
  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'pending')

  return (
    <div className={clsx('space-y-3', className)}>
      {/* 队列头部 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          上传队列 ({uploads.length})
        </h3>
        
        {completedUploads.length > 0 && onClearCompleted && (
          <button
            onClick={onClearCompleted}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            清除已完成
          </button>
        )}
      </div>

      {/* 上传项目列表 */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {uploads.map((upload) => (
          <UploadProgress
            key={upload.fileId}
            upload={upload}
            onRetry={onRetry}
            onCancel={onCancel}
          />
        ))}
      </div>

      {/* 队列统计 */}
      {uploads.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          活跃: {activeUploads.length} | 已完成: {completedUploads.length}
        </div>
      )}
    </div>
  )
}

export default UploadProgress
