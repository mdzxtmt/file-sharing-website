'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { 
  HomeIcon,
  FolderIcon,
  ChartBarIcon,
  UserIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { useUIStore } from '@/stores/useUIStore'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navigation: NavigationItem[] = [
  { name: '首页', href: '/', icon: HomeIcon },
  { name: '文件库', href: '/files', icon: FolderIcon },
  { name: '排行榜', href: '/ranking', icon: ChartBarIcon },
  { name: '用户中心', href: '/user', icon: UserIcon },
  { name: '设置', href: '/settings', icon: Cog6ToothIcon },
]

const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const { sidebarOpen, sidebarCollapsed, isMobile, toggleSidebarCollapsed, setSidebarOpen } = useUIStore()

  // 移动端点击遮罩关闭侧边栏
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {/* 移动端遮罩 */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
          'shadow-sidebar',
          {
            // 桌面端
            'lg:translate-x-0': true,
            'lg:w-64': !sidebarCollapsed,
            'lg:w-16': sidebarCollapsed,
            // 移动端
            'w-64': isMobile,
            'translate-x-0': isMobile && sidebarOpen,
            '-translate-x-full': isMobile && !sidebarOpen,
          }
        )}
      >
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                文件分享
              </span>
            </div>
          )}
          
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-lg">F</span>
            </div>
          )}

          {/* 折叠按钮 - 仅桌面端显示 */}
          {!isMobile && (
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                  {
                    'bg-primary-50 text-primary-700 border-r-2 border-primary-500 dark:bg-primary-900/20 dark:text-primary-400': isActive,
                    'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100': !isActive,
                    'justify-center': sidebarCollapsed,
                  }
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon
                  className={clsx(
                    'flex-shrink-0 w-5 h-5 transition-colors',
                    {
                      'text-primary-500': isActive,
                      'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300': !isActive,
                      'mr-3': !sidebarCollapsed,
                    }
                  )}
                />
                {!sidebarCollapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className="ml-auto bg-primary-100 text-primary-600 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-primary-900/30 dark:text-primary-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 侧边栏底部 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>基于 micu.wiki 风格</p>
              <p className="mt-1">现代化文件分享平台</p>
            </div>
          ) : (
            <div className="w-2 h-2 bg-primary-500 rounded-full mx-auto"></div>
          )}
        </div>
      </div>
    </>
  )
}

export default Sidebar
