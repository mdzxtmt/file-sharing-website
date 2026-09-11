'use client'

import React, { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  TagIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import { Input, Button } from '@/components/ui'
import { useFileStore } from '@/stores/useFileStore'
import { CategoryService, TagService } from '@/lib/database'
import { debounce } from '@/utils'
import type { Category, Tag } from '@/types'

interface FileSearchProps {
  placeholder?: string
  showFilters?: boolean
  className?: string
}

const FileSearch: React.FC<FileSearchProps> = ({
  placeholder = '搜索文件、描述、标签...',
  showFilters = true,
  className
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [localQuery, setLocalQuery] = useState('')

  const {
    searchQuery,
    selectedCategory,
    selectedTags,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTags
  } = useFileStore()

  const searchInputRef = useRef<HTMLInputElement>(null)

  // 防抖搜索
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query)
  }, 300)

  // 加载分类和标签
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          CategoryService.getCategories(),
          TagService.getPopularTags(20)
        ])
        setCategories(categoriesData)
        setTags(tagsData)
      } catch (error) {
        console.error('加载筛选选项失败:', error)
      }
    }

    loadFilters()
  }, [])

  // 同步本地搜索状态
  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  // 处理搜索输入
  const handleSearchChange = (value: string) => {
    setLocalQuery(value)
    debouncedSearch(value)
  }

  // 清除搜索
  const clearSearch = () => {
    setLocalQuery('')
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  // 处理分类选择
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
  }

  // 处理标签选择
  const handleTagToggle = (tagName: string) => {
    const newTags = selectedTags.includes(tagName)
      ? selectedTags.filter(tag => tag !== tagName)
      : [...selectedTags, tagName]
    setSelectedTags(newTags)
  }

  // 清除所有筛选
  const clearAllFilters = () => {
    setLocalQuery('')
    setSearchQuery('')
    setSelectedCategory(null)
    setSelectedTags([])
  }

  // 获取活跃筛选数量
  const getActiveFiltersCount = () => {
    let count = 0
    if (searchQuery) count++
    if (selectedCategory) count++
    if (selectedTags.length > 0) count += selectedTags.length
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className={clsx('space-y-4', className)}>
      {/* 主搜索栏 */}
      <div className="relative">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
          rightIcon={
            localQuery ? (
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            ) : undefined
          }
          className="pr-12"
        />

        {/* 高级筛选按钮 */}
        {showFilters && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={clsx(
                'relative',
                showAdvanced && 'bg-primary-50 dark:bg-primary-900/20'
              )}
            >
              <FunnelIcon className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* 高级筛选面板 */}
      {showAdvanced && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          {/* 分类筛选 */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <FolderIcon className="w-4 h-4" />
              分类
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={clsx(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                    selectedCategory === category.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                >
                  {category.icon && <span>{category.icon}</span>}
                  {category.name}
                  <span className="text-xs opacity-75">({category.file_count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 标签筛选 */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              热门标签
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.name)}
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
                    selectedTags.includes(tag.name)
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                >
                  {tag.name}
                  <span className="opacity-75">({tag.usage_count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {activeFiltersCount > 0 && `已选择 ${activeFiltersCount} 个筛选条件`}
            </div>
            
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  清除筛选
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(false)}
              >
                收起
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 活跃筛选标签 */}
      {activeFiltersCount > 0 && !showAdvanced && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-md">
             搜索: &quot;{searchQuery}&quot;
              <button
                onClick={() => setSearchQuery('')}
                className="hover:text-primary-900 dark:hover:text-primary-100"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md">
              分类: {categories.find(c => c.id === selectedCategory)?.name}
              <button
                onClick={() => setSelectedCategory(null)}
                className="hover:text-blue-900 dark:hover:text-blue-100"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-md"
            >
              标签: {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="hover:text-green-900 dark:hover:text-green-100"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileSearch
