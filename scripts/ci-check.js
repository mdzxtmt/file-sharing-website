#!/usr/bin/env node

/**
 * CI环境检查脚本
 * 验证CI环境中的配置和依赖
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

function checkCIEnvironment() {
  log('\n🔍 检查CI环境...', 'blue');
  
  const isCI = process.env.CI === 'true';
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  
  if (isCI) {
    log('✅ 运行在CI环境中', 'green');
  } else {
    log('ℹ️ 运行在本地环境中', 'yellow');
  }
  
  if (isGitHubActions) {
    log('✅ GitHub Actions环境检测成功', 'green');
    log(`   - Workflow: ${process.env.GITHUB_WORKFLOW || 'Unknown'}`, 'blue');
    log(`   - Event: ${process.env.GITHUB_EVENT_NAME || 'Unknown'}`, 'blue');
    log(`   - Ref: ${process.env.GITHUB_REF || 'Unknown'}`, 'blue');
  }
  
  return { isCI, isGitHubActions };
}

function checkNodeEnvironment() {
  log('\n🟢 检查Node.js环境...', 'blue');
  
  const nodeVersion = process.version;
  const npmVersion = process.env.npm_version || 'Unknown';
  
  log(`✅ Node.js版本: ${nodeVersion}`, 'green');
  log(`✅ npm版本: ${npmVersion}`, 'green');
  
  // 检查Node.js版本是否符合要求
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 18) {
    log('✅ Node.js版本符合要求 (>=18)', 'green');
    return true;
  } else {
    log('❌ Node.js版本过低，需要>=18', 'red');
    return false;
  }
}

function checkProjectFiles() {
  log('\n📁 检查项目文件...', 'blue');
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.ts',
    'tsconfig.json',
    '.github/workflows/ci.yml'
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

function checkDependencies() {
  log('\n📦 检查依赖...', 'blue');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDeps = [
      'next',
      'react',
      'typescript',
      '@types/node',
      'tailwindcss'
    ];
    
    let allPresent = true;
    
    requiredDeps.forEach(dep => {
      const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
      const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
      
      if (inDeps || inDevDeps) {
        const version = inDeps || inDevDeps;
        log(`✅ ${dep}: ${version}`, 'green');
      } else {
        log(`❌ ${dep} 未安装`, 'red');
        allPresent = false;
      }
    });
    
    return allPresent;
  } catch (error) {
    log('❌ 无法读取package.json', 'red');
    return false;
  }
}

function checkBuildRequirements() {
  log('\n🔨 检查构建要求...', 'blue');
  
  // 检查是否有node_modules
  if (fs.existsSync('node_modules')) {
    log('✅ node_modules 目录存在', 'green');
  } else {
    log('❌ node_modules 目录不存在，请运行 npm install', 'red');
    return false;
  }
  
  // 检查TypeScript配置
  if (fs.existsSync('tsconfig.json')) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      if (tsconfig.compilerOptions) {
        log('✅ TypeScript配置有效', 'green');
      } else {
        log('❌ TypeScript配置无效', 'red');
        return false;
      }
    } catch (error) {
      log('❌ TypeScript配置解析失败', 'red');
      return false;
    }
  }
  
  return true;
}

function generateReport(checks) {
  log('\n📊 CI检查报告', 'blue');
  log('=' .repeat(50), 'blue');
  
  const passed = checks.filter(check => check).length;
  const total = checks.length;
  
  log(`\n通过检查: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('🎉 所有CI检查通过！', 'green');
    log('✅ 项目已准备好进行CI/CD流程', 'green');
    return true;
  } else {
    log('⚠️ 部分CI检查失败', 'yellow');
    log('❌ 请修复上述问题后重新运行', 'red');
    return false;
  }
}

function main() {
  log('🔧 CI环境检查工具', 'blue');
  log('=' .repeat(50), 'blue');
  
  const envInfo = checkCIEnvironment();
  
  const checks = [
    checkNodeEnvironment(),
    checkProjectFiles(),
    checkDependencies(),
    checkBuildRequirements()
  ];
  
  const allPassed = generateReport(checks);
  
  // 在CI环境中，如果检查失败则退出
  if (envInfo.isCI && !allPassed) {
    process.exit(1);
  }
  
  return allPassed;
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = { main, checkCIEnvironment, checkNodeEnvironment };
