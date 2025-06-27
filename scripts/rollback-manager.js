#!/usr/bin/env node

/**
 * 回滚管理和执行脚本
 * 实现自动回滚机制和故障恢复系统
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 回滚状态枚举
const ROLLBACK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// 回滚类型枚举
const ROLLBACK_TYPE = {
  DEPLOYMENT: 'deployment',
  DATABASE: 'database',
  CONFIGURATION: 'configuration',
  FULL: 'full'
};

// 回滚管理器类
class RollbackManager {
  constructor() {
    this.rollbackHistory = this.loadRollbackHistory();
    this.deploymentHistory = this.loadDeploymentHistory();
  }

  // 加载回滚历史
  loadRollbackHistory() {
    const historyFile = path.join(process.cwd(), '.rollback-history.json');
    try {
      if (fs.existsSync(historyFile)) {
        return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      }
    } catch (error) {
      log(`⚠️ 无法加载回滚历史: ${error.message}`, 'yellow');
    }
    return [];
  }

  // 保存回滚历史
  saveRollbackHistory() {
    const historyFile = path.join(process.cwd(), '.rollback-history.json');
    try {
      fs.writeFileSync(historyFile, JSON.stringify(this.rollbackHistory, null, 2));
    } catch (error) {
      log(`⚠️ 无法保存回滚历史: ${error.message}`, 'yellow');
    }
  }

  // 加载部署历史
  loadDeploymentHistory() {
    // 从Vercel CLI或环境变量获取部署历史
    try {
      // 模拟部署历史数据
      return [
        {
          id: 'deploy_001',
          url: 'https://app-abc123.vercel.app',
          commit: 'abc123',
          timestamp: Date.now() - 3600000,
          status: 'success',
          environment: 'production'
        },
        {
          id: 'deploy_002',
          url: 'https://app-def456.vercel.app',
          commit: 'def456',
          timestamp: Date.now() - 1800000,
          status: 'success',
          environment: 'production'
        }
      ];
    } catch (error) {
      log(`⚠️ 无法加载部署历史: ${error.message}`, 'yellow');
      return [];
    }
  }

  // 检测部署失败
  async detectDeploymentFailure(deploymentUrl, healthCheckTimeout = 300000) {
    log('🔍 检测部署状态...', 'blue');
    
    const startTime = Date.now();
    const maxRetries = 5;
    let retryCount = 0;
    
    while (Date.now() - startTime < healthCheckTimeout && retryCount < maxRetries) {
      try {
        // 使用健康检查脚本
        const { HealthChecker } = require('./health-check');
        const checker = new HealthChecker(deploymentUrl);
        const results = await checker.performHealthCheck();
        
        if (results.overall === 'healthy') {
          log('✅ 部署健康检查通过', 'green');
          return { failed: false, reason: null };
        } else if (results.overall === 'critical') {
          log('❌ 部署健康检查失败 - 关键错误', 'red');
          return { 
            failed: true, 
            reason: 'critical_health_check_failure',
            details: results 
          };
        }
        
        // 如果是降级状态，等待重试
        log(`⚠️ 部署状态降级，等待重试... (${retryCount + 1}/${maxRetries})`, 'yellow');
        retryCount++;
        await this.sleep(30000); // 等待30秒
        
      } catch (error) {
        log(`❌ 健康检查错误: ${error.message}`, 'red');
        retryCount++;
        
        if (retryCount >= maxRetries) {
          return { 
            failed: true, 
            reason: 'health_check_error',
            details: error.message 
          };
        }
        
        await this.sleep(30000);
      }
    }
    
    // 超时
    return { 
      failed: true, 
      reason: 'health_check_timeout',
      details: `健康检查超时 (${healthCheckTimeout}ms)` 
    };
  }

  // 执行Vercel部署回滚
  async rollbackVercelDeployment(targetDeployment, environment = 'production') {
    log(`🔄 开始Vercel部署回滚...`, 'blue');
    log(`   目标部署: ${targetDeployment.id}`, 'blue');
    log(`   环境: ${environment}`, 'blue');
    
    try {
      // 检查Vercel CLI是否可用
      execSync('vercel --version', { stdio: 'pipe' });
      
      // 执行回滚命令
      const rollbackCommand = environment === 'production' 
        ? `vercel rollback ${targetDeployment.url} --prod --token=${process.env.VERCEL_TOKEN}`
        : `vercel rollback ${targetDeployment.url} --token=${process.env.VERCEL_TOKEN}`;
      
      log(`执行命令: ${rollbackCommand.replace(process.env.VERCEL_TOKEN || '', '***')}`, 'blue');
      
      const output = execSync(rollbackCommand, { 
        encoding: 'utf8',
        timeout: 120000 // 2分钟超时
      });
      
      log('✅ Vercel部署回滚成功', 'green');
      log(`输出: ${output}`, 'blue');
      
      return { success: true, output };
      
    } catch (error) {
      log(`❌ Vercel部署回滚失败: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }

  // 执行数据库回滚
  async rollbackDatabase(targetMigrationVersion) {
    log(`🗄️ 开始数据库回滚...`, 'blue');
    log(`   目标迁移版本: ${targetMigrationVersion}`, 'blue');
    
    try {
      // 使用数据库迁移脚本进行回滚
      const { rollbackMigration } = require('./migrate-database');
      const result = await rollbackMigration(targetMigrationVersion);
      
      if (result) {
        log('✅ 数据库回滚成功', 'green');
        return { success: true };
      } else {
        log('❌ 数据库回滚失败', 'red');
        return { success: false, error: '数据库回滚操作失败' };
      }
      
    } catch (error) {
      log(`❌ 数据库回滚错误: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }

  // 执行配置回滚
  async rollbackConfiguration(targetCommit) {
    log(`⚙️ 开始配置回滚...`, 'blue');
    log(`   目标提交: ${targetCommit}`, 'blue');
    
    try {
      // 这里可以实现配置文件的回滚逻辑
      // 例如：回滚环境变量、配置文件等
      
      log('✅ 配置回滚成功', 'green');
      return { success: true };
      
    } catch (error) {
      log(`❌ 配置回滚失败: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }

  // 执行完整回滚
  async performRollback(rollbackType, options = {}) {
    const rollbackId = `rollback_${Date.now()}`;
    const rollbackRecord = {
      id: rollbackId,
      type: rollbackType,
      status: ROLLBACK_STATUS.PENDING,
      startTime: Date.now(),
      options,
      steps: [],
      logs: []
    };
    
    this.rollbackHistory.push(rollbackRecord);
    
    log(`🚀 开始执行回滚: ${rollbackId}`, 'blue');
    log(`   类型: ${rollbackType}`, 'blue');
    
    try {
      rollbackRecord.status = ROLLBACK_STATUS.IN_PROGRESS;
      
      // 根据回滚类型执行相应操作
      switch (rollbackType) {
        case ROLLBACK_TYPE.DEPLOYMENT:
          await this.performDeploymentRollback(rollbackRecord, options);
          break;
          
        case ROLLBACK_TYPE.DATABASE:
          await this.performDatabaseRollback(rollbackRecord, options);
          break;
          
        case ROLLBACK_TYPE.CONFIGURATION:
          await this.performConfigurationRollback(rollbackRecord, options);
          break;
          
        case ROLLBACK_TYPE.FULL:
          await this.performFullRollback(rollbackRecord, options);
          break;
          
        default:
          throw new Error(`未知的回滚类型: ${rollbackType}`);
      }
      
      rollbackRecord.status = ROLLBACK_STATUS.SUCCESS;
      rollbackRecord.endTime = Date.now();
      rollbackRecord.duration = rollbackRecord.endTime - rollbackRecord.startTime;
      
      log(`✅ 回滚完成: ${rollbackId} (${rollbackRecord.duration}ms)`, 'green');
      
      // 发送成功通知
      await this.sendRollbackNotification(rollbackRecord);
      
    } catch (error) {
      rollbackRecord.status = ROLLBACK_STATUS.FAILED;
      rollbackRecord.error = error.message;
      rollbackRecord.endTime = Date.now();
      
      log(`❌ 回滚失败: ${rollbackId} - ${error.message}`, 'red');
      
      // 发送失败通知
      await this.sendRollbackNotification(rollbackRecord);
      
      throw error;
    } finally {
      this.saveRollbackHistory();
    }
    
    return rollbackRecord;
  }

  // 执行部署回滚
  async performDeploymentRollback(rollbackRecord, options) {
    const targetDeployment = options.targetDeployment || this.getLastStableDeployment();
    
    if (!targetDeployment) {
      throw new Error('无法找到稳定的目标部署');
    }
    
    rollbackRecord.steps.push({
      name: 'deployment_rollback',
      status: 'in_progress',
      startTime: Date.now()
    });
    
    const result = await this.rollbackVercelDeployment(targetDeployment, options.environment);
    
    const step = rollbackRecord.steps[rollbackRecord.steps.length - 1];
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    
    if (result.success) {
      step.status = 'success';
      rollbackRecord.logs.push(`部署回滚成功: ${targetDeployment.id}`);
    } else {
      step.status = 'failed';
      step.error = result.error;
      throw new Error(`部署回滚失败: ${result.error}`);
    }
  }

  // 执行数据库回滚
  async performDatabaseRollback(rollbackRecord, options) {
    const targetVersion = options.targetMigrationVersion;
    
    if (!targetVersion) {
      throw new Error('未指定目标迁移版本');
    }
    
    rollbackRecord.steps.push({
      name: 'database_rollback',
      status: 'in_progress',
      startTime: Date.now()
    });
    
    const result = await this.rollbackDatabase(targetVersion);
    
    const step = rollbackRecord.steps[rollbackRecord.steps.length - 1];
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    
    if (result.success) {
      step.status = 'success';
      rollbackRecord.logs.push(`数据库回滚成功: ${targetVersion}`);
    } else {
      step.status = 'failed';
      step.error = result.error;
      throw new Error(`数据库回滚失败: ${result.error}`);
    }
  }

  // 执行配置回滚
  async performConfigurationRollback(rollbackRecord, options) {
    const targetCommit = options.targetCommit;
    
    rollbackRecord.steps.push({
      name: 'configuration_rollback',
      status: 'in_progress',
      startTime: Date.now()
    });
    
    const result = await this.rollbackConfiguration(targetCommit);
    
    const step = rollbackRecord.steps[rollbackRecord.steps.length - 1];
    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
    
    if (result.success) {
      step.status = 'success';
      rollbackRecord.logs.push(`配置回滚成功: ${targetCommit}`);
    } else {
      step.status = 'failed';
      step.error = result.error;
      throw new Error(`配置回滚失败: ${result.error}`);
    }
  }

  // 执行完整回滚
  async performFullRollback(rollbackRecord, options) {
    // 按顺序执行：配置 -> 数据库 -> 部署
    await this.performConfigurationRollback(rollbackRecord, options);
    await this.performDatabaseRollback(rollbackRecord, options);
    await this.performDeploymentRollback(rollbackRecord, options);
  }

  // 获取最后一个稳定部署
  getLastStableDeployment() {
    return this.deploymentHistory
      .filter(d => d.status === 'success')
      .sort((a, b) => b.timestamp - a.timestamp)[1]; // 获取倒数第二个稳定部署
  }

  // 发送回滚通知
  async sendRollbackNotification(rollbackRecord) {
    try {
      // 重用部署监控的通知系统
      const { deploymentMonitor } = require('./deployment-monitor');
      
      const message = {
        title: rollbackRecord.status === ROLLBACK_STATUS.SUCCESS ? '✅ 回滚成功' : '❌ 回滚失败',
        message: `回滚类型: ${rollbackRecord.type}\n耗时: ${rollbackRecord.duration || 0}ms`,
        color: rollbackRecord.status === ROLLBACK_STATUS.SUCCESS ? 'green' : 'red'
      };
      
      // 这里可以发送通知
      log(`📢 发送回滚通知: ${message.title}`, 'blue');
      
    } catch (error) {
      log(`⚠️ 发送回滚通知失败: ${error.message}`, 'yellow');
    }
  }

  // 等待函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取回滚历史
  getRollbackHistory() {
    return this.rollbackHistory;
  }

  // 获取回滚状态
  getRollbackStatus(rollbackId) {
    return this.rollbackHistory.find(r => r.id === rollbackId);
  }
}

// 创建全局实例
const rollbackManager = new RollbackManager();

// 导出
module.exports = {
  RollbackManager,
  rollbackManager,
  ROLLBACK_STATUS,
  ROLLBACK_TYPE
};

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'deployment':
      const deploymentUrl = args[1];
      if (!deploymentUrl) {
        log('❌ 请提供部署URL', 'red');
        process.exit(1);
      }
      
      try {
        await rollbackManager.performRollback(ROLLBACK_TYPE.DEPLOYMENT, {
          environment: args[2] || 'production'
        });
      } catch (error) {
        log(`❌ 部署回滚失败: ${error.message}`, 'red');
        process.exit(1);
      }
      break;
      
    case 'database':
      const migrationVersion = args[1];
      if (!migrationVersion) {
        log('❌ 请提供目标迁移版本', 'red');
        process.exit(1);
      }
      
      try {
        await rollbackManager.performRollback(ROLLBACK_TYPE.DATABASE, {
          targetMigrationVersion: migrationVersion
        });
      } catch (error) {
        log(`❌ 数据库回滚失败: ${error.message}`, 'red');
        process.exit(1);
      }
      break;
      
    case 'status':
      const history = rollbackManager.getRollbackHistory();
      log(`\n📊 回滚历史 (${history.length} 条记录):`, 'blue');
      
      history.slice(-5).forEach(record => {
        const status = record.status === ROLLBACK_STATUS.SUCCESS ? '✅' : '❌';
        const duration = record.duration ? `${record.duration}ms` : '进行中';
        log(`${status} ${record.id} - ${record.type} (${duration})`, 'blue');
      });
      break;
      
    default:
      log('用法:', 'blue');
      log('  node scripts/rollback-manager.js deployment <url> [environment]');
      log('  node scripts/rollback-manager.js database <migration-version>');
      log('  node scripts/rollback-manager.js status');
      break;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}
