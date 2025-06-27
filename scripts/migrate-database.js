#!/usr/bin/env node

/**
 * 数据库迁移执行脚本
 * 自动执行数据库迁移并跟踪迁移状态
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

// 获取Supabase客户端
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase环境变量未配置')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// 创建迁移状态表
async function createMigrationTable(supabase) {
  log('\n📊 创建迁移状态表...', 'blue')
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      checksum VARCHAR(255),
      execution_time_ms INTEGER
    );
    
    -- 启用RLS
    ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
    
    -- 创建公开访问策略（用于迁移脚本）
    CREATE POLICY IF NOT EXISTS "Allow public read access to migrations" 
    ON schema_migrations FOR SELECT 
    USING (true);
  `
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      log(`❌ 创建迁移表失败: ${error.message}`, 'red')
      return false
    }
    
    log('✅ 迁移状态表已准备就绪', 'green')
    return true
  } catch (error) {
    log(`❌ 创建迁移表错误: ${error.message}`, 'red')
    return false
  }
}

// 获取已执行的迁移
async function getExecutedMigrations(supabase) {
  try {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('version')
    
    if (error) {
      log(`❌ 获取迁移历史失败: ${error.message}`, 'red')
      return []
    }
    
    return data.map(row => row.version)
  } catch (error) {
    log(`❌ 获取迁移历史错误: ${error.message}`, 'red')
    return []
  }
}

// 获取待执行的迁移文件
function getPendingMigrations(executedMigrations) {
  const migrationsDir = path.join(process.cwd(), 'migrations')
  const sqlDir = path.join(process.cwd(), 'sql')
  
  let migrationFiles = []
  
  // 检查migrations目录
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    migrationFiles = migrationFiles.concat(
      files.map(file => ({
        version: file.replace('.sql', ''),
        name: file,
        path: path.join(migrationsDir, file),
        type: 'migration'
      }))
    )
  }
  
  // 检查sql目录中的基础脚本
  if (fs.existsSync(sqlDir)) {
    const baseScripts = [
      { file: 'schema.sql', version: '001_initial_schema', name: 'Initial Schema' },
      { file: 'rls-policies.sql', version: '002_rls_policies', name: 'RLS Policies' },
      { file: 'seed-data.sql', version: '003_seed_data', name: 'Seed Data' }
    ]
    
    baseScripts.forEach(script => {
      const scriptPath = path.join(sqlDir, script.file)
      if (fs.existsSync(scriptPath)) {
        migrationFiles.push({
          version: script.version,
          name: script.name,
          path: scriptPath,
          type: 'base'
        })
      }
    })
  }
  
  // 过滤出未执行的迁移
  return migrationFiles
    .filter(migration => !executedMigrations.includes(migration.version))
    .sort((a, b) => a.version.localeCompare(b.version))
}

// 执行单个迁移
async function executeMigration(supabase, migration) {
  log(`\n🔄 执行迁移: ${migration.name} (${migration.version})`, 'blue')
  
  try {
    const startTime = Date.now()
    const sql = fs.readFileSync(migration.path, 'utf8')
    
    // 计算校验和
    const crypto = require('crypto')
    const checksum = crypto.createHash('md5').update(sql).digest('hex')
    
    // 执行SQL
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      log(`❌ 迁移执行失败: ${error.message}`, 'red')
      return false
    }
    
    const executionTime = Date.now() - startTime
    
    // 记录迁移状态
    const { error: recordError } = await supabase
      .from('schema_migrations')
      .insert({
        version: migration.version,
        name: migration.name,
        checksum,
        execution_time_ms: executionTime
      })
    
    if (recordError) {
      log(`⚠️ 记录迁移状态失败: ${recordError.message}`, 'yellow')
    }
    
    log(`✅ 迁移完成 (${executionTime}ms)`, 'green')
    return true
    
  } catch (error) {
    log(`❌ 迁移执行错误: ${error.message}`, 'red')
    return false
  }
}

// 主迁移函数
async function runMigrations(options = {}) {
  log('🚀 开始数据库迁移...', 'blue')
  log('=' .repeat(50), 'blue')
  
  try {
    const supabase = getSupabaseClient()
    
    // 创建迁移状态表
    const tableCreated = await createMigrationTable(supabase)
    if (!tableCreated && !options.force) {
      return false
    }
    
    // 获取已执行的迁移
    const executedMigrations = await getExecutedMigrations(supabase)
    log(`\n📋 已执行的迁移: ${executedMigrations.length} 个`, 'blue')
    
    // 获取待执行的迁移
    const pendingMigrations = getPendingMigrations(executedMigrations)
    
    if (pendingMigrations.length === 0) {
      log('\n✅ 没有待执行的迁移，数据库已是最新状态', 'green')
      return true
    }
    
    log(`\n📝 待执行的迁移: ${pendingMigrations.length} 个`, 'blue')
    pendingMigrations.forEach(migration => {
      log(`   - ${migration.version}: ${migration.name}`, 'blue')
    })
    
    // 执行迁移
    let successCount = 0
    for (const migration of pendingMigrations) {
      const success = await executeMigration(supabase, migration)
      if (success) {
        successCount++
      } else if (!options.continueOnError) {
        break
      }
    }
    
    // 总结
    log('\n' + '=' .repeat(50), 'blue')
    if (successCount === pendingMigrations.length) {
      log(`🎉 所有迁移执行成功！(${successCount}/${pendingMigrations.length})`, 'green')
      return true
    } else {
      log(`⚠️ 部分迁移执行失败 (${successCount}/${pendingMigrations.length})`, 'yellow')
      return false
    }
    
  } catch (error) {
    log(`❌ 迁移过程出错: ${error.message}`, 'red')
    return false
  }
}

// 回滚功能
async function rollbackMigration(version) {
  log(`🔄 回滚迁移: ${version}`, 'blue')
  
  try {
    const supabase = getSupabaseClient()
    
    // 删除迁移记录
    const { error } = await supabase
      .from('schema_migrations')
      .delete()
      .eq('version', version)
    
    if (error) {
      log(`❌ 回滚失败: ${error.message}`, 'red')
      return false
    }
    
    log(`✅ 迁移 ${version} 已回滚`, 'green')
    log('⚠️ 注意: 数据库结构更改需要手动处理', 'yellow')
    return true
    
  } catch (error) {
    log(`❌ 回滚错误: ${error.message}`, 'red')
    return false
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'migrate':
      const success = await runMigrations({
        force: args.includes('--force'),
        continueOnError: args.includes('--continue-on-error')
      })
      process.exit(success ? 0 : 1)
      break
      
    case 'rollback':
      const version = args[1]
      if (!version) {
        log('❌ 请指定要回滚的迁移版本', 'red')
        process.exit(1)
      }
      const rollbackSuccess = await rollbackMigration(version)
      process.exit(rollbackSuccess ? 0 : 1)
      break
      
    case 'status':
      const supabase = getSupabaseClient()
      const executed = await getExecutedMigrations(supabase)
      const pending = getPendingMigrations(executed)
      
      log('\n📊 迁移状态:', 'blue')
      log(`已执行: ${executed.length} 个`, 'green')
      log(`待执行: ${pending.length} 个`, pending.length > 0 ? 'yellow' : 'green')
      break
      
    default:
      log('用法:', 'blue')
      log('  node scripts/migrate-database.js migrate [--force] [--continue-on-error]')
      log('  node scripts/migrate-database.js rollback <version>')
      log('  node scripts/migrate-database.js status')
      break
  }
}

// 导出函数供其他脚本使用
module.exports = {
  runMigrations,
  rollbackMigration,
  getExecutedMigrations,
  getPendingMigrations
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error)
}
