'use client'

import { useState, useEffect } from 'react'
import {
  TrophyIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  ClockIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, Button, Loading } from '@/components/ui'
import { FileCard } from '@/components/file'
import { FileService, StatsService } from '@/lib/database'
import { formatFileSize, formatDate } from '@/utils'
import type { FileItem } from '@/types'

interface RankingData {
  mostDownloaded: FileItem[]
  mostViewed: FileItem[]
  newest: FileItem[]
  trending: FileItem[]
}

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState<'downloads' | 'views' | 'newest' | 'trending'>('downloads')
  const [rankingData, setRankingData] = useState<RankingData>({
    mostDownloaded: [],
    mostViewed: [],
    newest: [],
    trending: []
  })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    totalViews: 0
  })

  // 加载排行榜数据
  useEffect(() => {
    const loadRankingData = async () => {
      try {
        setLoading(true)

        const [
          mostDownloaded,
          mostViewed,
          newest,
          globalStats
        ] = await Promise.all([
          FileService.getFiles({ sortBy: 'download_count', sortOrder: 'desc', limit: 20 }),
          FileService.getFiles({ sortBy: 'view_count', sortOrder: 'desc', limit: 20 }),
          FileService.getFiles({ sortBy: 'upload_time', sortOrder: 'desc', limit: 20 }),
          StatsService.getGlobalStats()
        ])

        // 计算趋势文件（综合下载量和浏览量）
        const trending = [...mostDownloaded]
          .sort((a, b) => {
            const scoreA = a.download_count * 2 + a.view_count
            const scoreB = b.download_count * 2 + b.view_count
            return scoreB - scoreA
          })
          .slice(0, 20)

        setRankingData({
          mostDownloaded,
          mostViewed,
          newest,
          trending
        })

        setStats(globalStats)
      } catch (error) {
        console.error('加载排行榜数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRankingData()
  }, [])

  // 获取当前标签页的数据
  const getCurrentData = () => {
    switch (activeTab) {
      case 'downloads':
        return rankingData.mostDownloaded
      case 'views':
        return rankingData.mostViewed
      case 'newest':
        return rankingData.newest
      case 'trending':
        return rankingData.trending
      default:
        return []
    }
  }

  // 标签页配置
  const tabs = [
    {
      key: 'downloads' as const,
      label: '下载排行',
      icon: ArrowDownTrayIcon,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      key: 'views' as const,
      label: '浏览排行',
      icon: EyeIcon,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      key: 'newest' as const,
      label: '最新上传',
      icon: ClockIcon,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      key: 'trending' as const,
      label: '热门趋势',
      icon: FireIcon,
      color: 'text-red-600 dark:text-red-400'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
          <TrophyIcon className="w-8 h-8 text-yellow-500" />
          排行榜
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          查看热门文件和下载统计
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总文件数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalFiles.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总存储量</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatFileSize(stats.totalSize)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
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
                  {stats.totalDownloads.toLocaleString()}
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
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <EyeIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 排行榜标签页 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>文件排行榜</CardTitle>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" text="加载排行榜中..." />
            </div>
          ) : (
            <div className="space-y-6">
              {/* 前三名特殊展示 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getCurrentData().slice(0, 3).map((file, index) => (
                  <div
                    key={file.id}
                    className={`relative p-4 rounded-lg border-2 ${
                      index === 0 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' :
                      index === 1 ? 'border-gray-300 bg-gray-50 dark:bg-gray-800/50' :
                      'border-orange-300 bg-orange-50 dark:bg-orange-900/10'
                    }`}
                  >
                    {/* 排名徽章 */}
                    <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-500' :
                      'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>

                    <div className="text-center">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                        {file.name}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          {file.download_count}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          {file.view_count}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 其余排名列表 */}
              {getCurrentData().length > 3 && (
                <div className="space-y-2">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    完整排行榜
                  </h4>
                  {getCurrentData().slice(3).map((file, index) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 4}
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
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          {file.download_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          {file.view_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {getCurrentData().length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">暂无数据</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
