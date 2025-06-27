'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'
import {
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  HeartIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Menu, Transition } from '@headlessui/react'
import { formatFileSize, formatDate, getFileTypeIcon, copyToClipboard, downloadFile } from '@/utils'
import type { FileItem } from '@/types'
import toast from 'react-hot-toast'

interface FileCardProps {
  file: FileItem
  onPreview?: (file: FileItem) => void
  onDownload?: (file: FileItem) => void
  onLike?: (file: FileItem) => void
  onDelete?: (file: FileItem) => void
  className?: string
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  onPreview,
  onDownload,
  onLike,
  onDelete,
  className
}) => {
  const [isLiked, setIsLiked] = useState(false)
  const [imageError, setImageError] = useState(false)

  // 处理预览
  const handlePreview = () => {
    onPreview?.(file)
  }

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

  // 处理点赞
  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike?.(file)
  }

  // 获取文件缩略图
  const getThumbnail = () => {
    if (file.thumbnail_url && !imageError) {
      return file.thumbnail_url
    }
    
    if (file.mime_type.startsWith('image/') && !imageError) {
      return file.public_url
    }
    
    return null
  }

  const thumbnail = getThumbnail()

  return (
    <div className={clsx(
      'group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
      'hover:shadow-card-hover hover:border-gray-300 dark:hover:border-gray-600',
      'transition-all duration-200 overflow-hidden',
      className
    )}>
      {/* 文件预览区域 */}
      <div 
        className="relative aspect-video bg-gray-100 dark:bg-gray-700 cursor-pointer"
        onClick={handlePreview}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={file.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-4xl">{getFileTypeIcon(file.mime_type)}</span>
          </div>
        )}
        
        {/* 悬停操作按钮 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePreview()
              }}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
              title="预览"
            >
              <EyeIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
              title="下载"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleShare()
              }}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
              title="分享"
            >
              <ShareIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* 文件类型标签 */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-md">
            {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>
        </div>

        {/* 文件大小 */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-md">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>

      {/* 文件信息 */}
      <div className="p-4">
        {/* 文件名 */}
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
          {file.name}
        </h3>

        {/* 文件描述 */}
        {file.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {file.description}
          </p>
        )}

        {/* 标签 */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {file.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs rounded-md"
              >
                <TagIcon className="w-3 h-3" />
                {typeof tag === 'string' ? tag : tag.name}
              </span>
            ))}
            {file.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{file.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 统计信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              {file.view_count}
            </span>
            <span className="flex items-center gap-1">
              <ArrowDownTrayIcon className="w-4 h-4" />
              {file.download_count}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            {formatDate(file.upload_time)}
          </div>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleLike}
            className={clsx(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors',
              isLiked
                ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            {isLiked ? (
              <HeartSolidIcon className="w-4 h-4" />
            ) : (
              <HeartIcon className="w-4 h-4" />
            )}
            <span className="text-sm">{file.like_count + (isLiked ? 1 : 0)}</span>
          </button>

          {/* 更多操作菜单 */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <EllipsisVerticalIcon className="w-4 h-4" />
            </Menu.Button>

            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 bottom-full mb-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-10">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handlePreview}
                        className={clsx(
                          'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors',
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        )}
                      >
                        <EyeIcon className="w-4 h-4" />
                        预览
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDownload}
                        className={clsx(
                          'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors',
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        )}
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        下载
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleShare}
                        className={clsx(
                          'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors',
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        )}
                      >
                        <ShareIcon className="w-4 h-4" />
                        分享
                      </button>
                    )}
                  </Menu.Item>
                  {onDelete && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onDelete(file)}
                          className={clsx(
                            'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors text-red-600 dark:text-red-400',
                            active ? 'bg-red-50 dark:bg-red-900/20' : ''
                          )}
                        >
                          删除
                        </button>
                      )}
                    </Menu.Item>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}

export default FileCard
