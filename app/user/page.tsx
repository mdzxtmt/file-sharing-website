'use client'

import { useState, useEffect } from 'react'
import {
  UserCircleIcon,
  DocumentIcon,
  CloudArrowUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, Button, Loading } from '@/components/ui'
import { FileList, UploadManager } from '@/components/file'
import { FileService, StatsService } from '@/lib/database'
import { formatFileSize, formatDate } from '@/utils'
import type { FileItem } from '@/types'

export default function UserPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'upload' | 'settings'>('overview')
  const [userFiles, setUserFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    totalViews: 0,
    joinDate: new Date().toISOString()
  })

  // 模拟用户信息
  const userInfo = {
    name: '匿名用户',
    email: 'anonymous@example.com',
    avatar: null,
    joinDate: '2024-01-01'
  }

  // 加载用户数据
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        
        // 由于是匿名系统，这里模拟用户数据
        // 在实际应用中，可以根据用户ID获取数据
        const files = await FileService.getFiles({ limit: 10 })
        setUserFiles(files)

        // 计算用户统计
        const totalSize = files.reduce((sum, file) => sum + file.size, 0)
        const totalDownloads = files.reduce((sum, file) => sum + file.download_count, 0)
        const totalViews = files.reduce((sum, file) => sum + file.view_count, 0)

        setUserStats({
          totalFiles: files.length,
          totalSize,
          totalDownloads,
          totalViews,
          joinDate: userInfo.joinDate
        })
      } catch (error) {
        console.error('加载用户数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  // 标签页配置
  const tabs = [
    {
      key: 'overview' as const,
      label: '概览',
      icon: ChartBarIcon
    },
    {
      key: 'files' as const,
      label: '我的文件',
      icon: DocumentIcon
    },
    {
      key: 'upload' as const,
      label: '上传文件',
      icon: CloudArrowUpIcon
    },
    {
      key: 'settings' as const,
      label: '设置',
      icon: Cog6ToothIcon
    }
  ]

  // 渲染概览页面
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {userInfo.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {userInfo.email}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                <CalendarIcon className="w-4 h-4" />
                加入时间: {formatDate(userStats.joinDate)}
              </p>
            </div>
            <Button variant="outline">
              编辑资料
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">我的文件</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {userStats.totalFiles}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <DocumentIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">存储使用</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatFileSize(userStats.totalSize)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <CloudArrowUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总下载量</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {userStats.totalDownloads}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <ArrowDownTrayIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总浏览量</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {userStats.totalViews}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <EyeIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近文件 */}
      <Card>
        <CardHeader>
          <CardTitle>最近上传的文件</CardTitle>
        </CardHeader>
        <CardContent>
          {userFiles.length > 0 ? (
            <div className="space-y-3">
              {userFiles.slice(0, 5).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)} • {formatDate(file.upload_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      {file.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      {file.download_count}
                    </span>
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('files')}
                >
                  查看所有文件
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">还没有上传任何文件</p>
              <Button
                variant="primary"
                onClick={() => setActiveTab('upload')}
              >
                开始上传
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // 渲染设置页面
  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>账户设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              显示名称
            </label>
            <input
              type="text"
              value={userInfo.name}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              value={userInfo.email}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              readOnly
            />
          </div>
          <div className="pt-4">
            <Button variant="primary" disabled>
              保存设置
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>隐私设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">公开个人资料</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">允许其他用户查看您的个人资料</p>
            </div>
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              defaultChecked
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">显示上传统计</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">在个人资料中显示文件上传统计</p>
            </div>
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              defaultChecked
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
          <UserCircleIcon className="w-8 h-8 text-primary-500" />
          用户中心
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          管理您的个人文件和设置
        </p>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 标签页内容 */}
      <div className="py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" text="加载用户数据中..." />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'files' && (
              <FileList />
            )}
            {activeTab === 'upload' && (
              <UploadManager />
            )}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </div>
    </div>
  )
}
