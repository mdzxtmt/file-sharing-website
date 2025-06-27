'use client'

import React from 'react'
import { clsx } from 'clsx'
import { useUIStore } from '@/stores/useUIStore'

interface MainContentProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const MainContent: React.FC<MainContentProps> = ({
  children,
  className,
  padding = 'lg',
  maxWidth = 'full',
}) => {
  const { sidebarOpen, sidebarCollapsed, isMobile } = useUIStore()

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-6 lg:p-8',
  }

  const maxWidthClasses = {
    none: '',
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-lg mx-auto',
    xl: 'max-w-xl mx-auto',
    '2xl': 'max-w-2xl mx-auto',
    full: 'w-full',
  }

  return (
    <main
      className={clsx(
        'min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out',
        {
          // 桌面端边距
          'lg:ml-64': !isMobile && sidebarOpen && !sidebarCollapsed,
          'lg:ml-16': !isMobile && sidebarOpen && sidebarCollapsed,
          'lg:ml-0': !sidebarOpen || isMobile,
        }
      )}
    >
      {/* 内容容器 */}
      <div
        className={clsx(
          'pt-16', // 为固定头部留出空间
          paddingClasses[padding],
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {children}
      </div>
    </main>
  )
}

export default MainContent
