#!/usr/bin/env node

/**
 * 环境变量管理和验证脚本
 * 支持多环境配置验证、安全检查和运行时注入
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// 环境变量配置定义
const ENV_CONFIG = {
  // 必需的环境变量
  required: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ],
  
  // 敏感的环境变量（不应出现在日志中）
  sensitive: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLOUDFLARE_API_TOKEN',
    'CRON_SECRET',
    'VERCEL_TOKEN'
  ],
  
  // 环境特定的变量
  environmentSpecific: {
    development: [
      'NEXT_PUBLIC_ENABLE_DEBUG'
    ],
    staging: [
      'STAGING_SUPABASE_URL',
      'STAGING_SUPABASE_ANON_KEY',
      'STAGING_SUPABASE_SERVICE_KEY'
    ],
    production: [
      'NEXT_PUBLIC_ENABLE_CSP',
      'NEXT_PUBLIC_ENABLE_SECURITY_HEADERS'
    ]
  },
  
  // 变量格式验证规则
  validation: {
    'NEXT_PUBLIC_SUPABASE_URL': /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': /^eyJ[A-Za-z0-9_-]+$/,
    'SUPABASE_SERVICE_ROLE_KEY': /^eyJ[A-Za-z0-9_-]+$/,
    'NEXT_PUBLIC_MAX_FILE_SIZE': /^\d+$/,
    'NEXT_PUBLIC_SITE_URL': /^https?:\/\/.+$/
  }
};

// 获取环境类型
function getEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const vercelEnv = process.env.VERCEL_ENV;
  const isCI = process.env.CI === 'true';
  
  if (vercelEnv) {
    return vercelEnv; // preview, development, production
  }
  
  if (isCI) {
    return process.env.GITHUB_REF === 'refs/heads/main' ? 'production' : 'staging';
  }
  
  return env;
}

// 读取环境变量文件
function readEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          vars[key] = valueParts.join('=');
        }
      }
    });
    
    return vars;
  } catch (error) {
    log(`❌ 读取环境文件失败: ${filePath}`, 'red');
    return null;
  }
}

// 验证环境变量格式
function validateEnvVar(key, value) {
  const rule = ENV_CONFIG.validation[key];
  if (!rule) {
    return true; // 没有验证规则的变量默认通过
  }
  
  return rule.test(value);
}

// 检查敏感信息泄露
function checkSensitiveLeaks(vars) {
  const leaks = [];
  
  ENV_CONFIG.sensitive.forEach(key => {
    if (vars[key] && vars[key] !== `your_${key.toLowerCase()}`) {
      // 检查是否是占位符
      if (vars[key].includes('your_') || vars[key].includes('example')) {
        return;
      }
      
      // 检查值的长度和格式，判断是否可能是真实密钥
      if (vars[key].length > 20) {
        leaks.push(key);
      }
    }
  });
  
  return leaks;
}

// 验证单个环境配置
function validateEnvironment(envName, envVars) {
  log(`\n🔍 验证 ${envName} 环境配置...`, 'blue');
  
  let isValid = true;
  const issues = [];
  
  // 检查必需变量
  ENV_CONFIG.required.forEach(key => {
    if (!envVars[key] || envVars[key].includes('your_')) {
      issues.push(`❌ ${key} 未配置或使用占位符`);
      isValid = false;
    } else if (!validateEnvVar(key, envVars[key])) {
      issues.push(`❌ ${key} 格式无效`);
      isValid = false;
    } else {
      log(`✅ ${key} 配置正确`, 'green');
    }
  });
  
  // 检查环境特定变量
  const envSpecific = ENV_CONFIG.environmentSpecific[envName] || [];
  envSpecific.forEach(key => {
    if (envVars[key]) {
      if (!validateEnvVar(key, envVars[key])) {
        issues.push(`❌ ${key} 格式无效`);
        isValid = false;
      } else {
        log(`✅ ${key} 配置正确`, 'green');
      }
    }
  });
  
  // 检查敏感信息
  const sensitiveLeaks = checkSensitiveLeaks(envVars);
  if (sensitiveLeaks.length > 0) {
    issues.push(`⚠️ 检测到敏感信息: ${sensitiveLeaks.join(', ')}`);
  }
  
  // 输出问题
  if (issues.length > 0) {
    log('\n问题列表:', 'yellow');
    issues.forEach(issue => log(`  ${issue}`, 'yellow'));
  }
  
  return { isValid, issues };
}

// 生成环境变量模板
function generateEnvTemplate(envName) {
  log(`\n📝 生成 ${envName} 环境变量模板...`, 'blue');
  
  const template = [];
  template.push(`# ${envName.toUpperCase()} Environment Configuration`);
  template.push(`# Generated at: ${new Date().toISOString()}`);
  template.push('');
  
  // 基础配置
  template.push('# Supabase Configuration');
  template.push(`NEXT_PUBLIC_SUPABASE_URL=https://your-${envName}-project.supabase.co`);
  template.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=your_${envName}_anon_key_here`);
  template.push(`SUPABASE_SERVICE_ROLE_KEY=your_${envName}_service_role_key_here`);
  template.push('');
  
  // 站点配置
  template.push('# Site Configuration');
  if (envName === 'production') {
    template.push('NEXT_PUBLIC_SITE_URL=https://your-domain.com');
  } else {
    template.push(`NEXT_PUBLIC_SITE_URL=https://your-${envName}-domain.vercel.app`);
  }
  template.push(`NEXT_PUBLIC_VERCEL_ENV=${envName}`);
  template.push('');
  
  // 功能开关
  template.push('# Feature Flags');
  template.push('NEXT_PUBLIC_ENABLE_ANALYTICS=true');
  template.push(`NEXT_PUBLIC_ENABLE_DEBUG=${envName !== 'production'}`);
  template.push('');
  
  // API配置
  template.push('# API Configuration');
  template.push(`CRON_SECRET=your_${envName}_cron_secret_here`);
  template.push('');
  
  // 环境标识
  template.push('# Environment Identifier');
  template.push('NODE_ENV=production');
  template.push(`VERCEL_ENV=${envName}`);
  
  // 环境特定配置
  const envSpecific = ENV_CONFIG.environmentSpecific[envName] || [];
  if (envSpecific.length > 0) {
    template.push('');
    template.push(`# ${envName.toUpperCase()} Specific Configuration`);
    envSpecific.forEach(key => {
      template.push(`${key}=your_${key.toLowerCase()}_here`);
    });
  }
  
  return template.join('\n');
}

// 安全检查
function performSecurityCheck(envVars) {
  log('\n🔒 执行安全检查...', 'blue');
  
  const securityIssues = [];
  
  // 检查默认密钥
  const defaultKeys = [
    'your_supabase_anon_key',
    'your_supabase_service_role_key',
    'example_key',
    'test_key'
  ];
  
  Object.entries(envVars).forEach(([key, value]) => {
    if (defaultKeys.some(defaultKey => value.includes(defaultKey))) {
      securityIssues.push(`❌ ${key} 使用默认值，存在安全风险`);
    }
    
    // 检查密钥强度
    if (ENV_CONFIG.sensitive.includes(key) && value.length < 20) {
      securityIssues.push(`⚠️ ${key} 密钥长度过短`);
    }
  });
  
  // 检查环境隔离
  const currentEnv = getEnvironment();
  if (currentEnv === 'production') {
    if (envVars.NEXT_PUBLIC_ENABLE_DEBUG === 'true') {
      securityIssues.push('⚠️ 生产环境启用了调试模式');
    }
  }
  
  if (securityIssues.length === 0) {
    log('✅ 安全检查通过', 'green');
  } else {
    log('⚠️ 发现安全问题:', 'yellow');
    securityIssues.forEach(issue => log(`  ${issue}`, 'yellow'));
  }
  
  return securityIssues;
}

// 主验证函数
function validateAllEnvironments() {
  log('🔧 环境变量安全管理系统', 'blue');
  log('=' .repeat(50), 'blue');
  
  const currentEnv = getEnvironment();
  log(`\n📍 当前环境: ${currentEnv}`, 'blue');
  
  const environments = ['development', 'staging', 'production'];
  const results = {};
  
  environments.forEach(env => {
    const envFile = env === 'development' ? '.env.local' : `.env.${env}`;
    const envVars = readEnvFile(envFile);
    
    if (!envVars) {
      log(`⚠️ ${env} 环境配置文件不存在: ${envFile}`, 'yellow');
      results[env] = { isValid: false, issues: ['配置文件不存在'] };
      return;
    }
    
    // 合并当前环境变量
    const mergedVars = { ...envVars, ...process.env };
    
    // 验证环境
    const validation = validateEnvironment(env, mergedVars);
    results[env] = validation;
    
    // 如果是当前环境，执行安全检查
    if (env === currentEnv) {
      const securityIssues = performSecurityCheck(mergedVars);
      results[env].securityIssues = securityIssues;
    }
  });
  
  // 生成报告
  log('\n📊 验证报告', 'blue');
  log('=' .repeat(50), 'blue');
  
  let allValid = true;
  Object.entries(results).forEach(([env, result]) => {
    const status = result.isValid ? '✅' : '❌';
    log(`${status} ${env}: ${result.isValid ? '通过' : '失败'}`, result.isValid ? 'green' : 'red');
    
    if (!result.isValid) {
      allValid = false;
    }
  });
  
  return { allValid, results };
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'validate':
      const { allValid } = validateAllEnvironments();
      process.exit(allValid ? 0 : 1);
      break;
      
    case 'generate':
      const envName = args[1] || 'development';
      const template = generateEnvTemplate(envName);
      const outputFile = envName === 'development' ? '.env.local' : `.env.${envName}`;
      
      if (fs.existsSync(outputFile)) {
        log(`⚠️ 文件已存在: ${outputFile}`, 'yellow');
        log('使用 --force 参数强制覆盖', 'yellow');
        if (!args.includes('--force')) {
          process.exit(1);
        }
      }
      
      fs.writeFileSync(outputFile, template);
      log(`✅ 已生成环境配置模板: ${outputFile}`, 'green');
      break;
      
    case 'check':
      const env = getEnvironment();
      log(`当前环境: ${env}`, 'blue');
      
      const envFile = env === 'development' ? '.env.local' : `.env.${env}`;
      const envVars = readEnvFile(envFile);
      
      if (!envVars) {
        log(`❌ 环境配置文件不存在: ${envFile}`, 'red');
        process.exit(1);
      }
      
      const mergedVars = { ...envVars, ...process.env };
      const validation = validateEnvironment(env, mergedVars);
      const securityIssues = performSecurityCheck(mergedVars);
      
      const success = validation.isValid && securityIssues.length === 0;
      process.exit(success ? 0 : 1);
      break;
      
    default:
      log('用法:', 'blue');
      log('  node scripts/env-manager.js validate    # 验证所有环境配置');
      log('  node scripts/env-manager.js generate <env> [--force]  # 生成环境配置模板');
      log('  node scripts/env-manager.js check       # 检查当前环境配置');
      break;
  }
}

// 导出函数供其他脚本使用
module.exports = {
  validateAllEnvironments,
  validateEnvironment,
  generateEnvTemplate,
  performSecurityCheck,
  getEnvironment
};

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}
