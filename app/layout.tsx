import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { AppLayout } from '@/components/layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '文件分享 - 现代化文件管理平台',
  description: '基于micu.wiki风格的现代化文件分享网站，支持各种格式文件上传、分类管理、搜索和分享',
  keywords: ['文件分享', '文件上传', '文档管理', '云存储'],
  authors: [{ name: 'File Share Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#409eff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}
