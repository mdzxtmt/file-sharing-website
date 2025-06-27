import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 测试数据库连接
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('count')
      .limit(1)

    if (categoriesError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: categoriesError.message
      }, { status: 500 })
    }

    // 测试存储桶
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()

    if (storageError) {
      return NextResponse.json({
        success: false,
        error: 'Storage connection failed',
        details: storageError.message
      }, { status: 500 })
    }

    const filesBucket = buckets?.find(bucket => bucket.name === 'files')

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: {
        database: 'Connected',
        storage: 'Connected',
        filesBucket: filesBucket ? 'Exists' : 'Not found',
        buckets: buckets?.map(b => b.name) || []
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
