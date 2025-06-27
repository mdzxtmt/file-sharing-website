'use client'

import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline'
import { Button, Loading } from '@/components/ui'
import FileCard from './FileCard'
import { useFileStore } from '@/stores/useFileStore'
import { FileService } from '@/lib/database'
import type { FileItem } from '@/types'

interface FileListProps {
  onFilePreview?: (file: FileItem) => void
  onFileDownload?: (file: FileItem) => void
  onFileLike?: (file: FileItem) => void
  onFileDelete?: (file: FileItem) => void
  className?: string
}

const FileList: React.FC<FileListProps> = ({
  onFilePreview,
  onFileDownload,
  onFileLike,
  onFileDelete,
  className
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const {
    files,
    loading,
    error,
    searchQuery,
    selectedCategory,
    selectedTags,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
    hasMore,
    setFiles,
    setLoading,
    setError,
    setSortBy,
    setSortOrder,
    setCurrentPage
  } = useFileStore()

  // 加载文件列表
  const loadFiles = async (page = 1, append = false) => {
    try {
      setLoading(true)
      setError(null)

      const offset = (page - 1) * pageSize
      const result = await FileService.getFiles({
        limit: pageSize,
        offset,
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy,
        sortOrder
      })

      if (append) {
        setFiles([...files, ...result])
      } else {
        setFiles(result)
      }

      setCurrentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文件失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadFiles(1, false)
  }, [searchQuery, selectedCategory, selectedTags, sortBy, sortOrder])

  // 加载更多
  const loadMore = () => {
    if (!loading && hasMore) {
      loadFiles(currentPage + 1, true)
    }
  }

  // 处理排序
  const handleSort = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  // 排序选项
  const sortOptions = [
    { key: 'upload_time', label: '上传时间' },
    { key: 'download_count', label: '下载量' },
    { key: 'view_count', label: '浏览量' },
    { key: 'name', label: '文件名' },
    { key: 'size', label: '文件大小' }
  ] as const

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={() => loadFiles(1, false)}>重试</Button>
      </div>
    )
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 视图切换 */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
              title="网格视图"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
              title="列表视图"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          {/* 筛选按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            筛选
          </Button>
        </div>

        {/* 排序 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">排序：</span>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value as typeof sortBy)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {sortOptions.map(option => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            title={sortOrder === 'asc' ? '升序' : '降序'}
          >
            <ArrowsUpDownIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            筛选功能开发中...
          </p>
        </div>
      )}

      {/* 文件列表 */}
      {loading && files.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" text="加载文件中..." />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">暂无文件</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {searchQuery ? '尝试调整搜索条件' : '开始上传您的第一个文件'}
          </p>
        </div>
      ) : (
        <>
          {/* 网格视图 */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onPreview={onFilePreview}
                  onDownload={onFileDownload}
                  onLike={onFileLike}
                  onDelete={onFileDelete}
                />
              ))}
            </div>
          )}

          {/* 列表视图 */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-card-hover transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-lg">{file.mime_type.startsWith('image/') ? '🖼️' : '📄'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {file.size} • {file.upload_time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onFilePreview?.(file)}>
                        预览
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => onFileDownload?.(file)}>
                        下载
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 加载更多 */}
          {hasMore && (
            <div className="text-center py-6">
              <Button
                onClick={loadMore}
                loading={loading}
                disabled={loading}
              >
                {loading ? '加载中...' : '加载更多'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FileList
