'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EyeIcon,
  DocumentIcon,
  PlayIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline'
import { Modal, Button, Loading } from '@/components/ui'
import { formatFileSize, formatDate, copyToClipboard, downloadFile } from '@/utils'
import type { FileItem } from '@/types'
import toast from 'react-hot-toast'

interface FilePreviewProps {
  file: FileItem | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (file: FileItem) => void
}

const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  isOpen,
  onClose,
  onDownload
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (file && isOpen) {
      setLoading(false)
      setError(null)
    }
  }, [file, isOpen])

  if (!file) return null

  // 处理下载
  const handleDownload = async () => {
    try {
      downloadFile(file.public_url, file.original_name)
      onDownload?.(file)
      toast.success('开始下载文件')
    } catch (error) {
      toast.error('下载失败')
    }
  }

  // 处理分享
  const handleShare = async () => {
    try {
      await copyToClipboard(file.public_url)
      toast.success('文件链接已复制到剪贴板')
    } catch (error) {
      toast.error('复制链接失败')
    }
  }

  // 渲染预览内容
  const renderPreviewContent = () => {
    const mimeType = file.mime_type

    // 图片预览
    if (mimeType.startsWith('image/')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Image
            src={file.public_url}
            alt={file.name}
            fill
            className="object-contain"
            onError={() => setError('图片加载失败')}
          />
        </div>
      )
    }

    // PDF预览
    if (mimeType === 'application/pdf') {
      return (
        <div className="w-full h-full">
          <iframe
            src={`${file.public_url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={file.name}
            onError={() => setError('PDF加载失败')}
          />
        </div>
      )
    }

    // 视频预览
    if (mimeType.startsWith('video/')) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            src={file.public_url}
            controls
            className="max-w-full max-h-full"
            onError={() => setError('视频加载失败')}
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      )
    }

    // 音频预览
    if (mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
          <div className="mb-8">
            <SpeakerWaveIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
          </div>
          <audio
            src={file.public_url}
            controls
            className="w-full max-w-md"
            onError={() => setError('音频加载失败')}
          >
            您的浏览器不支持音频播放
          </audio>
        </div>
      )
    }

    // 文本文件预览
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      return (
        <div className="w-full h-full">
          <iframe
            src={file.public_url}
            className="w-full h-full border-0 bg-white dark:bg-gray-900"
            title={file.name}
            onError={() => setError('文本文件加载失败')}
          />
        </div>
      )
    }

    // 不支持预览的文件类型
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <DocumentIcon className="w-24 h-24 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          无法预览此文件
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          该文件类型不支持在线预览，请下载后查看
        </p>
        <Button onClick={handleDownload}>
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          下载文件
        </Button>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      closeOnOverlayClick={true}
    >
      <div className="flex flex-col h-full">
        {/* 头部工具栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-sm">
                  {file.mime_type.startsWith('image/') ? '🖼️' : 
                   file.mime_type.startsWith('video/') ? '🎥' :
                   file.mime_type.startsWith('audio/') ? '🎵' : '📄'}
                </span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {file.name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(file.size)}</span>
                <span>{formatDate(file.upload_time)}</span>
                <span className="flex items-center gap-1">
                  <EyeIcon className="w-4 h-4" />
                  {file.view_count}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <ShareIcon className="w-4 h-4 mr-2" />
              分享
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              下载
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 预览内容区域 */}
        <div className="flex-1 relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loading size="lg" text="加载中..." />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <DocumentIcon className="w-24 h-24 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                加载失败
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <Button onClick={handleDownload}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                下载文件
              </Button>
            </div>
          ) : (
            renderPreviewContent()
          )}
        </div>

        {/* 文件信息面板（可选） */}
        {file.description && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              文件描述
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {file.description}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default FilePreview
