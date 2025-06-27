'use client'

import React, { useState } from 'react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Card, CardContent, CardHeader, CardTitle, Modal } from '@/components/ui'
import FileUpload from './FileUpload'
import { UploadQueue } from './UploadProgress'
import { useUploadQueue } from '@/stores/useFileStore'

interface UploadManagerProps {
  className?: string
  onUploadComplete?: (files: any[]) => void
}

const UploadManager: React.FC<UploadManagerProps> = ({
  className,
  onUploadComplete
}) => {
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [settings, setSettings] = useState({
    maxFiles: 10,
    autoStart: false,
    showPreview: true,
    compressImages: true
  })

  const { uploadQueue, isUploading, clearUploadQueue } = useUploadQueue()

  // 处理上传完成
  const handleUploadComplete = (files: any[]) => {
    toast.success(`成功上传 ${files.length} 个文件`)
    onUploadComplete?.(files)
  }

  // 清除所有上传记录
  const handleClearAll = () => {
    clearUploadQueue()
    toast.info('已清除上传记录')
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* 上传管理器头部 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5 text-primary-500" />
              文件上传管理器
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* 信息按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfo(true)}
                title="上传说明"
              >
                <InformationCircleIcon className="w-4 h-4" />
              </Button>
              
              {/* 设置按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                title="上传设置"
              >
                <Cog6ToothIcon className="w-4 h-4" />
              </Button>
              
              {/* 清除按钮 */}
              {uploadQueue.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  title="清除记录"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 上传状态信息 */}
          {uploadQueue.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">
                  {isUploading ? '正在上传...' : '上传队列'}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {uploadQueue.filter(u => u.status === 'success').length} / {uploadQueue.length} 完成
                </span>
              </div>
              
              {isUploading && (
                <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(uploadQueue.filter(u => u.status === 'success').length / uploadQueue.length) * 100}%` 
                    }}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* 文件上传组件 */}
          <FileUpload
            onUploadComplete={handleUploadComplete}
            maxFiles={settings.maxFiles}
            disabled={isUploading}
          />
        </CardContent>
      </Card>

      {/* 上传设置模态框 */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="上传设置"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大文件数量
            </label>
            <select
              value={settings.maxFiles}
              onChange={(e) => setSettings(prev => ({ ...prev, maxFiles: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value={5}>5 个文件</option>
              <option value={10}>10 个文件</option>
              <option value={20}>20 个文件</option>
              <option value={50}>50 个文件</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoStart}
                onChange={(e) => setSettings(prev => ({ ...prev, autoStart: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                自动开始上传
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showPreview}
                onChange={(e) => setSettings(prev => ({ ...prev, showPreview: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                显示文件预览
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.compressImages}
                onChange={(e) => setSettings(prev => ({ ...prev, compressImages: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                自动压缩图片
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowSettings(false)
                toast.success('设置已保存')
              }}
            >
              保存设置
            </Button>
          </div>
        </div>
      </Modal>

      {/* 上传说明模态框 */}
      <Modal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="上传说明"
        size="md"
      >
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">支持的文件类型</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>图片：JPEG, PNG, GIF, WebP, SVG</li>
              <li>文档：PDF, Word, Excel, PowerPoint</li>
              <li>视频：MP4, AVI, MOV, WebM</li>
              <li>音频：MP3, WAV, OGG</li>
              <li>压缩包：ZIP, RAR, 7Z</li>
              <li>代码：TXT, HTML, CSS, JS, JSON</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">上传限制</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>单文件最大：50MB</li>
              <li>同时上传：最多 {settings.maxFiles} 个文件</li>
              <li>总存储空间：1GB（免费额度）</li>
              <li>月流量：5GB（免费额度）</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">使用说明</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>支持拖拽文件到上传区域</li>
              <li>可以批量选择多个文件</li>
              <li>上传前可以添加描述和标签</li>
              <li>所有文件默认公开可访问</li>
              <li>支持断点续传和重试</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              onClick={() => setShowInfo(false)}
              className="w-full"
            >
              我知道了
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UploadManager
