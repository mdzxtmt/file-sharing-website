#!/usr/bin/env node

/**
 * Supabase配置验证脚本
 * 验证Supabase连接、数据库表结构、RLS策略等
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function checkSupabaseConnection() {
  log('\n🔍 检查Supabase连接...', 'blue')
  
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local 文件不存在', 'red')
    return false
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  // 提取环境变量
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)
  
  if (!urlMatch || !keyMatch || urlMatch[1].includes('your_') || keyMatch[1].includes('your_')) {
    log('❌ Supabase环境变量未正确配置', 'red')
    log('请在.env.local中配置正确的SUPABASE_URL和SUPABASE_ANON_KEY', 'yellow')
    return false
  }
  
  const supabaseUrl = urlMatch[1].trim()
  const supabaseKey = keyMatch[1].trim()
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 测试连接
    const { data, error } = await supabase.from('categories').select('count').limit(1)
    
    if (error) {
      log(`❌ Supabase连接失败: ${error.message}`, 'red')
      return false
    }
    
    log('✅ Supabase连接成功', 'green')
    return { supabase, url: supabaseUrl }
    
  } catch (error) {
    log(`❌ Supabase连接错误: ${error.message}`, 'red')
    return false
  }
}

async function checkDatabaseTables(supabase) {
  log('\n📊 检查数据库表结构...', 'blue')
  
  const requiredTables = ['files', 'categories', 'tags', 'file_tags', 'user_actions']
  let allTablesExist = true
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      
      if (error) {
        log(`❌ 表 ${table} 不存在或无法访问: ${error.message}`, 'red')
        allTablesExist = false
      } else {
        log(`✅ 表 ${table} 存在`, 'green')
      }
    } catch (error) {
      log(`❌ 检查表 ${table} 时出错: ${error.message}`, 'red')
      allTablesExist = false
    }
  }
  
  return allTablesExist
}

async function checkStorageBucket(supabase) {
  log('\n📦 检查Storage存储桶...', 'blue')
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      log(`❌ 无法获取存储桶列表: ${error.message}`, 'red')
      return false
    }
    
    const filesBucket = buckets.find(bucket => bucket.name === 'files')
    
    if (!filesBucket) {
      log('❌ 存储桶 "files" 不存在', 'red')
      log('请在Supabase Dashboard中创建名为"files"的公开存储桶', 'yellow')
      return false
    }
    
    log('✅ 存储桶 "files" 存在', 'green')
    log(`   - 公开访问: ${filesBucket.public ? '是' : '否'}`, filesBucket.public ? 'green' : 'yellow')
    
    return true
    
  } catch (error) {
    log(`❌ 检查存储桶时出错: ${error.message}`, 'red')
    return false
  }
}

async function checkRLSPolicies(supabase) {
  log('\n🛡️ 检查RLS策略...', 'blue')
  
  try {
    // 测试files表的公开访问策略
    const { data: publicFiles, error: filesError } = await supabase
      .from('files')
      .select('id')
      .eq('is_public', true)
      .limit(1)
    
    if (filesError) {
      log(`❌ files表RLS策略可能有问题: ${filesError.message}`, 'red')
    } else {
      log('✅ files表RLS策略正常', 'green')
    }
    
    // 测试categories表的访问
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
    
    if (categoriesError) {
      log(`❌ categories表RLS策略可能有问题: ${categoriesError.message}`, 'red')
    } else {
      log('✅ categories表RLS策略正常', 'green')
    }
    
    return !filesError && !categoriesError
    
  } catch (error) {
    log(`❌ 检查RLS策略时出错: ${error.message}`, 'red')
    return false
  }
}

async function checkInitialData(supabase) {
  log('\n📝 检查初始数据...', 'blue')
  
  try {
    // 检查分类数据
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
    
    if (categoriesError) {
      log(`❌ 无法获取分类数据: ${categoriesError.message}`, 'red')
      return false
    }
    
    if (categories.length === 0) {
      log('⚠️ 没有找到分类数据', 'yellow')
      log('建议执行 sql/seed-data.sql 插入初始数据', 'yellow')
    } else {
      log(`✅ 找到 ${categories.length} 个分类`, 'green')
    }
    
    // 检查标签数据
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
    
    if (tagsError) {
      log(`❌ 无法获取标签数据: ${tagsError.message}`, 'red')
      return false
    }
    
    if (tags.length === 0) {
      log('⚠️ 没有找到标签数据', 'yellow')
    } else {
      log(`✅ 找到 ${tags.length} 个标签`, 'green')
    }
    
    return true
    
  } catch (error) {
    log(`❌ 检查初始数据时出错: ${error.message}`, 'red')
    return false
  }
}

function displaySetupInstructions() {
  log('\n📋 Supabase配置说明:', 'blue')
  log('')
  log('如果检查失败，请按照以下步骤配置Supabase：')
  log('')
  log('1. 创建Supabase项目')
  log('   - 访问 https://app.supabase.com')
  log('   - 创建新项目，选择新加坡区域')
  log('')
  log('2. 配置环境变量')
  log('   - 在 Settings > API 中获取URL和API Key')
  log('   - 更新 .env.local 文件')
  log('')
  log('3. 执行数据库迁移')
  log('   - 在SQL Editor中执行 sql/schema.sql')
  log('   - 执行 sql/rls-policies.sql')
  log('   - 执行 sql/seed-data.sql')
  log('')
  log('4. 配置Storage存储桶')
  log('   - 创建名为"files"的公开存储桶')
  log('   - 配置存储桶策略')
  log('')
  log('详细说明请查看: docs/supabase-setup.md')
}

async function main() {
  log('🔧 Supabase配置验证工具', 'blue')
  log('=' .repeat(50), 'blue')
  
  const connection = await checkSupabaseConnection()
  
  if (!connection) {
    displaySetupInstructions()
    process.exit(1)
  }
  
  const { supabase } = connection
  
  const checks = [
    await checkDatabaseTables(supabase),
    await checkStorageBucket(supabase),
    await checkRLSPolicies(supabase),
    await checkInitialData(supabase)
  ]
  
  const allPassed = checks.every(check => check)
  
  log('\n' + '=' .repeat(50), 'blue')
  
  if (allPassed) {
    log('🎉 所有检查通过！Supabase配置完成！', 'green')
    log('现在可以开始使用文件上传功能了', 'green')
  } else {
    log('⚠️ 部分检查失败，请查看上述错误信息', 'yellow')
    displaySetupInstructions()
  }
}

// 运行检查
main().catch(console.error)
