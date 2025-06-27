'use client'

import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Modal } from '@/components/ui'
import { UploadManager } from '@/components/file'

export default function HomePage() {
  const [showUpload, setShowUpload] = useState(false)

  const handleUploadComplete = (files: any[]) => {
    console.log('上传完成:', files)
    setShowUpload(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-8 mb-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">
            欢迎来到文件分享平台
          </h1>
          <p className="text-xl text-primary-100 mb-6">
            基于micu.wiki风格的现代化文件管理和分享平台，支持各种格式文件上传、分类管理、搜索和分享
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowUpload(true)}
            >
              开始上传文件
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
              浏览文件库
            </Button>
          </div>
        </div>
      </div>

      {/* 功能特性 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎨 <span>现代化设计</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              参考micu.wiki的设计风格，使用主色调#409eff，现代化圆角卡片设计，支持深浅主题切换
            </p>
            <Button variant="primary" size="sm">
              查看组件
            </Button>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📁 <span>智能文件管理</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              支持各种格式文件上传、分类管理、标签系统、智能搜索和文件预览功能
            </p>
            <Button variant="outline" size="sm">
              开始上传
            </Button>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌍 <span>全球CDN加速</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              使用Cloudflare CDN优化全球访问速度，特别针对中国大陆用户进行优化
            </p>
            <Button variant="secondary" size="sm">
              了解更多
            </Button>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 <span>数据统计</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              实时统计文件下载量、浏览量，提供热门文件排行榜和趋势分析
            </p>
            <Button variant="ghost" size="sm">
              查看排行榜
            </Button>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔒 <span>安全可靠</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              文件类型验证、病毒扫描、访问控制，确保平台安全稳定运行
            </p>
            <Button variant="ghost" size="sm">
              安全说明
            </Button>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 <span>完全免费</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              基于Vercel、Supabase、Cloudflare免费服务构建，零成本运行
            </p>
            <Button variant="ghost" size="sm">
              技术架构
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 开发进度 */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
            🚀 开发进度
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">已完成 ✅</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Next.js 14 项目创建</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>UI设计系统建立</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>核心布局组件开发</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Supabase数据库配置</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>文件上传功能开发</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">进行中 🔄</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">○</span>
                  <span>文件展示界面</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">○</span>
                  <span>页面功能模块</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">○</span>
                  <span>搜索和筛选</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">○</span>
                  <span>性能优化部署</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">○</span>
                  <span>CDN全球加速</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 inline-block">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                当前进度: <span className="font-semibold text-primary-600">4/7 阶段完成</span>
              </p>
              <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-primary-500 h-2 rounded-full w-[57%]"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文件上传模态框 */}
      <Modal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title="文件上传"
        size="xl"
      >
        <UploadManager onUploadComplete={handleUploadComplete} />
      </Modal>
    </div>
  )
}
