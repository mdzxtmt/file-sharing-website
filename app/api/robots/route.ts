import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.vercel.app'
  
  const robots = `User-agent: *
Allow: /
Allow: /files
Allow: /ranking
Disallow: /api/
Disallow: /user
Disallow: /settings
Disallow: /_next/
Disallow: /admin/

# 允许搜索引擎访问公开文件
Allow: /file/

# 网站地图
Sitemap: ${baseUrl}/sitemap.xml

# 爬取延迟（毫秒）
Crawl-delay: 1`

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}
