'use client'

import { create } from 'zustand'
import { FileItem, UploadProgress } from '@/types'

interface FileState {
  // 文件列表
  files: FileItem[]
  loading: boolean
  error: string | null
  
  // 上传状态
  uploadQueue: UploadProgress[]
  isUploading: boolean
  
  // 筛选和搜索
  searchQuery: string
  selectedCategory: string | null
  selectedTags: string[]
  sortBy: 'name' | 'size' | 'upload_time' | 'download_count' | 'view_count'
  sortOrder: 'asc' | 'desc'
  
  // 分页
  currentPage: number
  pageSize: number
  totalFiles: number
  hasMore: boolean
  
  // 操作方法
  setFiles: (files: FileItem[]) => void
  addFiles: (files: FileItem[]) => void
  updateFile: (id: string, updates: Partial<FileItem>) => void
  removeFile: (id: string) => void
  
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 上传队列管理
  addToUploadQueue: (upload: UploadProgress) => void
  updateUploadProgress: (fileId: string, progress: Partial<UploadProgress>) => void
  removeFromUploadQueue: (fileId: string) => void
  clearUploadQueue: () => void
  setIsUploading: (uploading: boolean) => void
  
  // 搜索和筛选
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedTags: (tags: string[]) => void
  setSortBy: (sortBy: 'name' | 'size' | 'upload_time' | 'download_count' | 'view_count') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  
  // 分页
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  setTotalFiles: (total: number) => void
  setHasMore: (hasMore: boolean) => void
  
  // 重置状态
  reset: () => void
}

export const useFileStore = create<FileState>((set, get) => ({
  // 初始状态
  files: [],
  loading: false,
  error: null,
  
  uploadQueue: [],
  isUploading: false,
  
  searchQuery: '',
  selectedCategory: null,
  selectedTags: [],
  sortBy: 'upload_time',
  sortOrder: 'desc',
  
  currentPage: 1,
  pageSize: 20,
  totalFiles: 0,
  hasMore: true,
  
  // 文件操作
  setFiles: (files) => set({ files }),
  addFiles: (newFiles) => set((state) => ({ 
    files: [...state.files, ...newFiles] 
  })),
  updateFile: (id, updates) => set((state) => ({
    files: state.files.map(file => 
      file.id === id ? { ...file, ...updates } : file
    )
  })),
  removeFile: (id) => set((state) => ({
    files: state.files.filter(file => file.id !== id)
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // 上传队列管理
  addToUploadQueue: (upload) => set((state) => ({
    uploadQueue: [...state.uploadQueue, upload]
  })),
  updateUploadProgress: (fileId, progress) => set((state) => ({
    uploadQueue: state.uploadQueue.map(upload =>
      upload.fileId === fileId ? { ...upload, ...progress } : upload
    )
  })),
  removeFromUploadQueue: (fileId) => set((state) => ({
    uploadQueue: state.uploadQueue.filter(upload => upload.fileId !== fileId)
  })),
  clearUploadQueue: () => set({ uploadQueue: [] }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  
  // 搜索和筛选
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setSelectedCategory: (category) => set({ selectedCategory: category, currentPage: 1 }),
  setSelectedTags: (tags) => set({ selectedTags: tags, currentPage: 1 }),
  setSortBy: (sortBy) => set({ sortBy, currentPage: 1 }),
  setSortOrder: (order) => set({ sortOrder: order, currentPage: 1 }),
  
  // 分页
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
  setTotalFiles: (total) => set({ totalFiles: total }),
  setHasMore: (hasMore) => set({ hasMore }),
  
  // 重置状态
  reset: () => set({
    files: [],
    loading: false,
    error: null,
    uploadQueue: [],
    isUploading: false,
    searchQuery: '',
    selectedCategory: null,
    selectedTags: [],
    currentPage: 1,
    totalFiles: 0,
    hasMore: true,
  }),
}))

// 选择器函数
export const useFileFilters = () => {
  const store = useFileStore()
  return {
    searchQuery: store.searchQuery,
    selectedCategory: store.selectedCategory,
    selectedTags: store.selectedTags,
    sortBy: store.sortBy,
    sortOrder: store.sortOrder,
    setSearchQuery: store.setSearchQuery,
    setSelectedCategory: store.setSelectedCategory,
    setSelectedTags: store.setSelectedTags,
    setSortBy: store.setSortBy,
    setSortOrder: store.setSortOrder,
  }
}

export const useUploadQueue = () => {
  const store = useFileStore()
  return {
    uploadQueue: store.uploadQueue,
    isUploading: store.isUploading,
    addToUploadQueue: store.addToUploadQueue,
    updateUploadProgress: store.updateUploadProgress,
    removeFromUploadQueue: store.removeFromUploadQueue,
    clearUploadQueue: store.clearUploadQueue,
    setIsUploading: store.setIsUploading,
  }
}
