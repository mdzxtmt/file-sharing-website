import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（确保只有 Vercel Cron 可以调用）
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      deletedFiles: 0,
      deletedOrphanedRecords: 0,
      cleanedStorage: 0,
      errors: [] as string[]
    }

    // 1. 清理过期的临时文件（如果有的话）
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: expiredFiles, error: queryError } = await supabase
        .from('files')
        .select('id, storage_path')
        .eq('is_public', false)
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (queryError) {
        results.errors.push(`Query expired files error: ${queryError.message}`)
      } else if (expiredFiles && expiredFiles.length > 0) {
        // 删除存储中的文件
        const filePaths = expiredFiles.map(file => file.storage_path)
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove(filePaths)

        if (storageError) {
          results.errors.push(`Storage cleanup error: ${storageError.message}`)
        }

        // 删除数据库记录
        const { error: deleteError } = await supabase
          .from('files')
          .delete()
          .in('id', expiredFiles.map(file => file.id))

        if (deleteError) {
          results.errors.push(`Database cleanup error: ${deleteError.message}`)
        } else {
          results.deletedFiles = expiredFiles.length
        }
      }
    } catch (error) {
      results.errors.push(`Cleanup expired files error: ${error}`)
    }

    // 2. 清理孤立的数据库记录（文件记录存在但存储中文件不存在）
    try {
      const { data: allFiles, error: allFilesError } = await supabase
        .from('files')
        .select('id, storage_path')

      if (allFilesError) {
        results.errors.push(`Query all files error: ${allFilesError.message}`)
      } else if (allFiles) {
        const orphanedFiles = []

        for (const file of allFiles) {
          try {
            const { error: checkError } = await supabase.storage
              .from('files')
              .download(file.storage_path)

            if (checkError) {
              orphanedFiles.push(file.id)
            }
          } catch (error) {
            orphanedFiles.push(file.id)
          }
        }

        if (orphanedFiles.length > 0) {
          const { error: deleteOrphanedError } = await supabase
            .from('files')
            .delete()
            .in('id', orphanedFiles)

          if (deleteOrphanedError) {
            results.errors.push(`Delete orphaned records error: ${deleteOrphanedError.message}`)
          } else {
            results.deletedOrphanedRecords = orphanedFiles.length
          }
        }
      }
    } catch (error) {
      results.errors.push(`Cleanup orphaned records error: ${error}`)
    }

    // 3. 清理用户行为记录（保留最近90天）
    try {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { error: cleanActionsError } = await supabase
        .from('user_actions')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString())

      if (cleanActionsError) {
        results.errors.push(`Clean user actions error: ${cleanActionsError.message}`)
      }
    } catch (error) {
      results.errors.push(`Cleanup user actions error: ${error}`)
    }

    // 4. 更新统计缓存
    try {
      // 重新计算分类文件数量
      const { data: categories } = await supabase
        .from('categories')
        .select('id')

      if (categories) {
        for (const category of categories) {
          const { count } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)

          await supabase
            .from('categories')
            .update({ file_count: count || 0 })
            .eq('id', category.id)
        }
      }

      // 重新计算标签使用次数
      const { data: tags } = await supabase
        .from('tags')
        .select('id, name')

      if (tags) {
        for (const tag of tags) {
          const { count } = await supabase
            .from('file_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id)

          await supabase
            .from('tags')
            .update({ usage_count: count || 0 })
            .eq('id', tag.id)
        }
      }
    } catch (error) {
      results.errors.push(`Update statistics error: ${error}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      results
    })

  } catch (error) {
    console.error('Cleanup task error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cleanup task failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cleanup endpoint is active',
    nextRun: 'Daily at 2:00 AM UTC'
  })
}
