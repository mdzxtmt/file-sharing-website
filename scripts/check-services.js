#!/usr/bin/env node

/**
 * 免费服务配置检查脚本
 * 验证Vercel、Supabase、Cloudflare服务配置状态
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  log('\n🔍 检查环境变量配置...', 'blue');

  // 检测当前环境
  const currentEnv = process.env.NODE_ENV || 'development';
  const vercelEnv = process.env.VERCEL_ENV;
  const isCI = process.env.CI === 'true';

  let envFile = '.env.local';
  let environment = 'development';

  if (vercelEnv) {
    environment = vercelEnv;
    envFile = vercelEnv === 'development' ? '.env.local' : `.env.${vercelEnv}`;
  } else if (isCI) {
    environment = process.env.GITHUB_REF === 'refs/heads/main' ? 'production' : 'staging';
    envFile = `.env.${environment}`;
  }

  log(`📍 当前环境: ${environment}`, 'blue');
  log(`📄 配置文件: ${envFile}`, 'blue');

  const envPath = path.join(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    log(`❌ ${envFile} 文件不存在`, 'red');

    // 在CI环境中，检查环境变量是否通过其他方式注入
    if (isCI) {
      log('🔍 检查CI环境变量注入...', 'blue');
      return checkCIEnvironmentVariables();
    }

    log('请创建相应的环境配置文件', 'yellow');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  let allConfigured = true;

  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=your_`) || !envContent.includes(varName)) {
      log(`❌ ${varName} 未配置`, 'red');
      allConfigured = false;
    } else {
      log(`✅ ${varName} 已配置`, 'green');
    }
  });

  return allConfigured;
}

// 检查CI环境变量注入
function checkCIEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  let allConfigured = true;

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName} 已通过CI注入`, 'green');
    } else {
      log(`❌ ${varName} 未在CI中配置`, 'red');
      allConfigured = false;
    }
  });

  return allConfigured;
}

function checkSupabaseConfig() {
  log('\n🗄️ 检查Supabase配置...', 'blue');
  
  // 检查环境变量格式
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('❌ 无法检查Supabase配置，.env.local文件不存在', 'red');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // 检查URL格式
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  if (urlMatch && urlMatch[1] && urlMatch[1].includes('supabase.co')) {
    log('✅ Supabase URL 格式正确', 'green');
  } else {
    log('❌ Supabase URL 格式不正确', 'red');
    return false;
  }
  
  // 检查API Key格式
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  if (keyMatch && keyMatch[1] && keyMatch[1].startsWith('eyJ')) {
    log('✅ Supabase API Key 格式正确', 'green');
  } else {
    log('❌ Supabase API Key 格式不正确', 'red');
    return false;
  }
  
  return true;
}

function checkProjectStructure() {
  log('\n📁 检查项目结构...', 'blue');
  
  const requiredFiles = [
    'README.md',
    '.env.local',
    'docs/service-setup-guide.md'
  ];
  
  let allExists = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      log(`✅ ${file} 存在`, 'green');
    } else {
      log(`❌ ${file} 不存在`, 'red');
      allExists = false;
    }
  });
  
  return allExists;
}

function displayServiceInfo() {
  log('\n📊 免费服务额度信息:', 'blue');
  
  log('\n🚀 Vercel免费计划:', 'yellow');
  log('  • 带宽: 100GB/月');
  log('  • 部署: 无限次');
  log('  • 函数执行: 100GB-小时/月');
  log('  • 边缘函数: 100,000次调用/月');
  
  log('\n🗄️ Supabase免费计划:', 'yellow');
  log('  • 数据库存储: 500MB');
  log('  • 文件存储: 1GB');
  log('  • 带宽: 5GB/月');
  log('  • 月活用户: 50,000');
  
  log('\n🌐 Cloudflare免费计划:', 'yellow');
  log('  • CDN带宽: 无限制');
  log('  • DDoS防护: 基础级别');
  log('  • SSL证书: 免费');
  log('  • 页面规则: 3个');
}

function displayNextSteps() {
  log('\n🎯 下一步操作:', 'blue');
  
  log('\n如果所有检查都通过，您可以继续：');
  log('1. 创建Next.js项目');
  log('2. 配置Supabase数据库和存储');
  log('3. 开发文件上传功能');
  log('4. 配置Cloudflare CDN');
  
  log('\n如果有检查失败，请：');
  log('1. 查看 docs/service-setup-guide.md 详细指南');
  log('2. 确保所有服务账号创建成功');
  log('3. 正确配置 .env.local 文件');
  log('4. 重新运行此检查脚本');
}

function main() {
  log('🔧 免费文件上传网站 - 服务配置检查', 'blue');
  log('=' .repeat(50), 'blue');
  
  const checks = [
    checkProjectStructure(),
    checkEnvFile(),
    checkSupabaseConfig()
  ];
  
  const allPassed = checks.every(check => check);
  
  log('\n' + '=' .repeat(50), 'blue');
  
  if (allPassed) {
    log('🎉 所有检查通过！服务配置完成！', 'green');
  } else {
    log('⚠️ 部分检查失败，请查看上述错误信息', 'yellow');
  }
  
  displayServiceInfo();
  displayNextSteps();
}

// 运行检查
main();
