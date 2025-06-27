'use client'

import React, { useState } from 'react'
import { clsx } from 'clsx'
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { useUIStore } from '@/stores/useUIStore'
import { Button, Input } from '@/components/ui'

const Header: React.FC = () => {
  const {
    sidebarOpen,
    sidebarCollapsed,
    isMobile,
    theme,
    searchQuery,
    searchFocused,
    setSidebarOpen,
    setTheme,
    setSearchQuery,
    setSearchFocused,
  } = useUIStore()

  const [notifications] = useState(3) // 模拟通知数量

  // 主题图标
  const ThemeIcon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : ComputerDesktopIcon

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // TODO: 实现搜索逻辑
      console.log('搜索:', searchQuery)
    }
  }

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 z-30 h-16 bg-white dark:bg-gray-800',
        'border-b border-gray-200 dark:border-gray-700',
        'transition-all duration-300 ease-in-out',
        {
          'left-64': !isMobile && sidebarOpen && !sidebarCollapsed,
          'left-16': !isMobile && sidebarOpen && sidebarCollapsed,
          'left-0': !sidebarOpen || isMobile,
        }
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* 左侧：移动端菜单按钮 + 搜索 */}
        <div className="flex items-center gap-4 flex-1">
          {/* 移动端菜单按钮 */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Bars3Icon className="w-5 h-5" />
            </Button>
          )}

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <Input
                type="text"
                placeholder="搜索文件、分类、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
                className={clsx(
                  'transition-all duration-200',
                  searchFocused && 'ring-2 ring-primary-500/20'
                )}
              />
              
              {/* 搜索快捷键提示 */}
              {!searchFocused && !searchQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                    ⌘K
                  </kbd>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* 右侧：主题切换 + 通知 + 用户菜单 */}
        <div className="flex items-center gap-2">
          {/* 主题切换 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
              const currentIndex = themes.indexOf(theme)
              const nextTheme = themes[(currentIndex + 1) % themes.length]
              setTheme(nextTheme)
            }}
            title={`当前主题: ${theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}`}
          >
            <ThemeIcon className="w-5 h-5" />
          </Button>

          {/* 通知 */}
          <Button variant="ghost" size="sm" className="relative">
            <BellIcon className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </Button>

          {/* 用户菜单 */}
          <Menu as="div" className="relative">
            <Menu.Button as={Button} variant="ghost" size="sm">
              <UserCircleIcon className="w-5 h-5" />
            </Menu.Button>

            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none">
                <div className="p-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          'flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors',
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        )}
                      >
                        <UserCircleIcon className="w-4 h-4" />
                        个人资料
                      </button>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          'flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors',
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        )}
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        设置
                      </button>
                    )}
                  </Menu.Item>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          'flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors text-error-600 dark:text-error-400',
                          active ? 'bg-error-50 dark:bg-error-900/20' : ''
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        退出登录
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}

export default Header
