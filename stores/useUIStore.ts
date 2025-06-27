'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // 侧边栏状态
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // 主题状态
  theme: 'light' | 'dark' | 'system'
  
  // 搜索状态
  searchQuery: string
  searchFocused: boolean
  
  // 移动端状态
  isMobile: boolean
  
  // 加载状态
  loading: boolean
  
  // 操作方法
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  toggleSidebarCollapsed: () => void
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
  
  setSearchQuery: (query: string) => void
  setSearchFocused: (focused: boolean) => void
  
  setIsMobile: (isMobile: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // 初始状态
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'system',
      searchQuery: '',
      searchFocused: false,
      isMobile: false,
      loading: false,
      
      // 侧边栏操作
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // 主题操作
      setTheme: (theme) => {
        set({ theme })
        
        // 应用主题到DOM
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement
          
          if (theme === 'dark') {
            root.classList.add('dark')
          } else if (theme === 'light') {
            root.classList.remove('dark')
          } else {
            // system theme
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            if (systemTheme === 'dark') {
              root.classList.add('dark')
            } else {
              root.classList.remove('dark')
            }
          }
        }
      },
      
      toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
        get().setTheme(newTheme)
      },
      
      // 搜索操作
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchFocused: (focused) => set({ searchFocused: focused }),
      
      // 设备状态
      setIsMobile: (isMobile) => set({ isMobile }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// 主题初始化Hook
export const useThemeInit = () => {
  const { theme, setTheme } = useUIStore()
  
  React.useEffect(() => {
    // 初始化主题
    setTheme(theme)
    
    // 监听系统主题变化
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => setTheme('system')
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, setTheme])
}

// 响应式检测Hook
export const useResponsive = () => {
  const { setIsMobile } = useUIStore()
  
  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [setIsMobile])
}

import React from 'react'
