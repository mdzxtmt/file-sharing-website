'use client'

import { useState } from 'react'
import {
  Cog6ToothIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { useUIStore } from '@/stores/useUIStore'

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore()
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true
  })

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showStats: true,
    allowIndexing: true
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
          <Cog6ToothIcon className="w-8 h-8 text-primary-500" />
          设置
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          管理您的偏好设置和隐私选项
        </p>
      </div>

      {/* 外观设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaintBrushIcon className="w-5 h-5 text-primary-500" />
            外观设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              主题模式
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'light', label: '浅色', desc: '始终使用浅色主题' },
                { key: 'dark', label: '深色', desc: '始终使用深色主题' },
                { key: 'system', label: '跟随系统', desc: '根据系统设置自动切换' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => setTheme(option.key as 'light' | 'dark' | 'system')}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    theme === option.key
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 通知设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-primary-500" />
            通知设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">邮件通知</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">接收重要更新和活动通知</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">推送通知</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">浏览器推送通知</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">产品更新</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">新功能和改进通知</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.updates}
                onChange={(e) => setNotifications(prev => ({ ...prev, updates: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 隐私设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-primary-500" />
            隐私设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">公开个人资料</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">允许其他用户查看您的个人资料</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.publicProfile}
                onChange={(e) => setPrivacy(prev => ({ ...prev, publicProfile: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">显示统计信息</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">在个人资料中显示上传和下载统计</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.showStats}
                onChange={(e) => setPrivacy(prev => ({ ...prev, showStats: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">搜索引擎索引</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">允许搜索引擎索引您的公开文件</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.allowIndexing}
                onChange={(e) => setPrivacy(prev => ({ ...prev, allowIndexing: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 语言和地区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeAltIcon className="w-5 h-5 text-primary-500" />
            语言和地区
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              界面语言
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              时区
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="Asia/Shanghai">北京时间 (UTC+8)</option>
              <option value="Asia/Tokyo">东京时间 (UTC+9)</option>
              <option value="America/New_York">纽约时间 (UTC-5)</option>
              <option value="Europe/London">伦敦时间 (UTC+0)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 关于 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-primary-500" />
            关于
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">版本信息</h4>
              <p className="text-gray-600 dark:text-gray-400">文件分享平台 v1.0.0</p>
              <p className="text-gray-600 dark:text-gray-400">构建时间: 2024-01-01</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">技术栈</h4>
              <p className="text-gray-600 dark:text-gray-400">Next.js 14 + TypeScript</p>
              <p className="text-gray-600 dark:text-gray-400">Supabase + Tailwind CSS</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" size="sm">
                使用条款
              </Button>
              <Button variant="outline" size="sm">
                隐私政策
              </Button>
              <Button variant="outline" size="sm">
                开源许可
              </Button>
              <Button variant="outline" size="sm">
                反馈建议
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button variant="primary">
          保存所有设置
        </Button>
      </div>
    </div>
  )
}
