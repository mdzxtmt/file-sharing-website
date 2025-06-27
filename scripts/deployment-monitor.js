#!/usr/bin/env node

/**
 * 部署状态监控和通知脚本
 * 实时监控部署进度、状态报告、失败通知、性能监控
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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

// 部署状态枚举
const DEPLOYMENT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// 部署监控类
class DeploymentMonitor {
  constructor() {
    this.deployments = new Map();
    this.webhooks = this.loadWebhookConfig();
  }

  // 加载Webhook配置
  loadWebhookConfig() {
    const webhooks = {};
    
    // Slack Webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      webhooks.slack = process.env.SLACK_WEBHOOK_URL;
    }
    
    // Discord Webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      webhooks.discord = process.env.DISCORD_WEBHOOK_URL;
    }
    
    // 自定义Webhook
    if (process.env.CUSTOM_WEBHOOK_URL) {
      webhooks.custom = process.env.CUSTOM_WEBHOOK_URL;
    }
    
    return webhooks;
  }

  // 开始监控部署
  startDeployment(deploymentId, config) {
    const deployment = {
      id: deploymentId,
      environment: config.environment,
      version: config.version,
      branch: config.branch,
      startTime: Date.now(),
      status: DEPLOYMENT_STATUS.PENDING,
      stages: [],
      logs: [],
      metrics: {}
    };
    
    this.deployments.set(deploymentId, deployment);
    
    log(`🚀 开始监控部署: ${deploymentId}`, 'blue');
    log(`   环境: ${config.environment}`, 'blue');
    log(`   版本: ${config.version}`, 'blue');
    log(`   分支: ${config.branch}`, 'blue');
    
    // 发送开始通知
    this.sendNotification('deployment_started', deployment);
    
    return deployment;
  }

  // 更新部署状态
  updateDeploymentStatus(deploymentId, status, message) {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      log(`❌ 部署不存在: ${deploymentId}`, 'red');
      return false;
    }

    deployment.status = status;
    deployment.lastUpdate = Date.now();

    if (message) {
      deployment.logs.push({
        timestamp: Date.now(),
        message,
        level: status === DEPLOYMENT_STATUS.FAILED ? 'error' : 'info'
      });
    }

    log(`📊 部署状态更新: ${deploymentId} -> ${status}`, 'blue');
    if (message) {
      log(`   消息: ${message}`, 'blue');
    }

    // 检查是否需要触发自动回滚
    if (status === DEPLOYMENT_STATUS.FAILED) {
      this.checkAutoRollbackTrigger(deployment);
    }

    // 发送状态更新通知
    if (status === DEPLOYMENT_STATUS.SUCCESS || status === DEPLOYMENT_STATUS.FAILED) {
      this.sendNotification('deployment_completed', deployment);
    }

    return true;
  }

  // 检查自动回滚触发条件
  async checkAutoRollbackTrigger(deployment) {
    log(`🔍 检查自动回滚触发条件: ${deployment.id}`, 'blue');

    // 自动回滚配置
    const autoRollbackConfig = {
      enabled: process.env.AUTO_ROLLBACK_ENABLED === 'true',
      criticalEnvironments: ['production'],
      maxFailureCount: 3,
      healthCheckTimeout: 300000 // 5分钟
    };

    // 检查是否启用自动回滚
    if (!autoRollbackConfig.enabled) {
      log('⏭️ 自动回滚未启用', 'yellow');
      return false;
    }

    // 检查是否为关键环境
    if (!autoRollbackConfig.criticalEnvironments.includes(deployment.environment)) {
      log(`⏭️ 非关键环境，跳过自动回滚: ${deployment.environment}`, 'yellow');
      return false;
    }

    // 检查失败次数
    const recentFailures = this.getRecentFailures(deployment.environment);
    if (recentFailures.length >= autoRollbackConfig.maxFailureCount) {
      log(`🚨 连续失败次数达到阈值 (${recentFailures.length}/${autoRollbackConfig.maxFailureCount})`, 'red');
      await this.triggerAutoRollback(deployment, 'consecutive_failures');
      return true;
    }

    // 检查健康状态
    if (deployment.deploymentUrl) {
      try {
        const { RollbackManager } = require('./rollback-manager');
        const rollbackManager = new RollbackManager();

        const failureResult = await rollbackManager.detectDeploymentFailure(
          deployment.deploymentUrl,
          autoRollbackConfig.healthCheckTimeout
        );

        if (failureResult.failed && failureResult.reason === 'critical_health_check_failure') {
          log(`🚨 关键健康检查失败，触发自动回滚`, 'red');
          await this.triggerAutoRollback(deployment, 'critical_health_failure');
          return true;
        }
      } catch (error) {
        log(`⚠️ 健康检查错误: ${error.message}`, 'yellow');
      }
    }

    return false;
  }

  // 获取最近的失败部署
  getRecentFailures(environment, timeWindow = 3600000) { // 1小时内
    const cutoffTime = Date.now() - timeWindow;

    return Array.from(this.deployments.values())
      .filter(d =>
        d.environment === environment &&
        d.status === DEPLOYMENT_STATUS.FAILED &&
        d.startTime >= cutoffTime
      )
      .sort((a, b) => b.startTime - a.startTime);
  }

  // 触发自动回滚
  async triggerAutoRollback(deployment, reason) {
    log(`🔄 触发自动回滚: ${deployment.id}`, 'red');
    log(`   原因: ${reason}`, 'red');

    try {
      const { RollbackManager, ROLLBACK_TYPE } = require('./rollback-manager');
      const rollbackManager = new RollbackManager();

      // 执行自动回滚
      const rollbackResult = await rollbackManager.performRollback(ROLLBACK_TYPE.DEPLOYMENT, {
        environment: deployment.environment,
        reason: reason,
        triggeredBy: 'auto_rollback_system',
        originalDeployment: deployment.id
      });

      // 记录回滚事件
      deployment.logs.push({
        timestamp: Date.now(),
        message: `自动回滚已触发: ${rollbackResult.id}`,
        level: 'warning'
      });

      // 发送回滚通知
      await this.sendNotification('auto_rollback_triggered', {
        ...deployment,
        rollbackId: rollbackResult.id,
        rollbackReason: reason
      });

      log(`✅ 自动回滚已触发: ${rollbackResult.id}`, 'green');

    } catch (error) {
      log(`❌ 自动回滚失败: ${error.message}`, 'red');

      // 发送回滚失败通知
      await this.sendNotification('auto_rollback_failed', {
        ...deployment,
        rollbackError: error.message,
        rollbackReason: reason
      });
    }
  }

  // 添加部署阶段
  addDeploymentStage(deploymentId, stageName, status, duration) {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;
    
    const stage = {
      name: stageName,
      status,
      duration,
      timestamp: Date.now()
    };
    
    deployment.stages.push(stage);
    
    log(`📋 部署阶段: ${stageName} - ${status}`, status === 'success' ? 'green' : 'yellow');
    if (duration) {
      log(`   耗时: ${duration}ms`, 'blue');
    }
    
    return true;
  }

  // 记录性能指标
  recordMetric(deploymentId, metricName, value, unit = 'ms') {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return false;
    
    deployment.metrics[metricName] = {
      value,
      unit,
      timestamp: Date.now()
    };
    
    log(`📈 性能指标: ${metricName} = ${value}${unit}`, 'blue');
    return true;
  }

  // 发送通知
  async sendNotification(eventType, deployment) {
    const message = this.formatNotificationMessage(eventType, deployment);
    
    // 发送到所有配置的Webhook
    const promises = Object.entries(this.webhooks).map(([platform, url]) => {
      return this.sendWebhook(platform, url, message, deployment);
    });
    
    try {
      await Promise.allSettled(promises);
    } catch (error) {
      log(`⚠️ 发送通知失败: ${error.message}`, 'yellow');
    }
  }

  // 格式化通知消息
  formatNotificationMessage(eventType, deployment) {
    const duration = deployment.lastUpdate ?
      Math.round((deployment.lastUpdate - deployment.startTime) / 1000) : 0;

    switch (eventType) {
      case 'deployment_started':
        return {
          title: '🚀 部署开始',
          message: `环境: ${deployment.environment}\n版本: ${deployment.version}\n分支: ${deployment.branch}`,
          color: 'blue',
          fields: [
            { name: '部署ID', value: deployment.id, inline: true },
            { name: '环境', value: deployment.environment, inline: true },
            { name: '版本', value: deployment.version, inline: true }
          ]
        };

      case 'deployment_completed':
        const isSuccess = deployment.status === DEPLOYMENT_STATUS.SUCCESS;
        return {
          title: isSuccess ? '✅ 部署成功' : '❌ 部署失败',
          message: `环境: ${deployment.environment}\n版本: ${deployment.version}\n耗时: ${duration}秒`,
          color: isSuccess ? 'green' : 'red',
          fields: [
            { name: '部署ID', value: deployment.id, inline: true },
            { name: '状态', value: deployment.status, inline: true },
            { name: '耗时', value: `${duration}秒`, inline: true },
            { name: '阶段数', value: deployment.stages.length.toString(), inline: true }
          ]
        };

      case 'auto_rollback_triggered':
        return {
          title: '🔄 自动回滚已触发',
          message: `环境: ${deployment.environment}\n原因: ${deployment.rollbackReason}\n回滚ID: ${deployment.rollbackId}`,
          color: 'yellow',
          fields: [
            { name: '原部署ID', value: deployment.id, inline: true },
            { name: '回滚ID', value: deployment.rollbackId, inline: true },
            { name: '触发原因', value: deployment.rollbackReason, inline: true },
            { name: '环境', value: deployment.environment, inline: true }
          ]
        };

      case 'auto_rollback_failed':
        return {
          title: '❌ 自动回滚失败',
          message: `环境: ${deployment.environment}\n原因: ${deployment.rollbackReason}\n错误: ${deployment.rollbackError}`,
          color: 'red',
          fields: [
            { name: '部署ID', value: deployment.id, inline: true },
            { name: '环境', value: deployment.environment, inline: true },
            { name: '失败原因', value: deployment.rollbackError, inline: false }
          ]
        };

      default:
        return {
          title: '📊 部署更新',
          message: `部署 ${deployment.id} 状态更新`,
          color: 'blue'
        };
    }
  }

  // 发送Webhook通知
  async sendWebhook(platform, url, message, deployment) {
    let payload;
    
    switch (platform) {
      case 'slack':
        payload = this.formatSlackMessage(message, deployment);
        break;
      case 'discord':
        payload = this.formatDiscordMessage(message, deployment);
        break;
      default:
        payload = this.formatGenericMessage(message, deployment);
    }
    
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          log(`✅ ${platform} 通知发送成功`, 'green');
          resolve();
        } else {
          log(`❌ ${platform} 通知发送失败: ${res.statusCode}`, 'red');
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', (error) => {
        log(`❌ ${platform} 通知发送错误: ${error.message}`, 'red');
        reject(error);
      });
      
      req.write(data);
      req.end();
    });
  }

  // 格式化Slack消息
  formatSlackMessage(message, deployment) {
    const colorMap = {
      green: 'good',
      red: 'danger',
      yellow: 'warning',
      blue: '#36a64f'
    };
    
    return {
      text: message.title,
      attachments: [{
        color: colorMap[message.color] || message.color,
        fields: message.fields || [],
        text: message.message,
        footer: 'Deployment Monitor',
        ts: Math.floor(Date.now() / 1000)
      }]
    };
  }

  // 格式化Discord消息
  formatDiscordMessage(message, deployment) {
    const colorMap = {
      green: 0x00ff00,
      red: 0xff0000,
      yellow: 0xffff00,
      blue: 0x0099ff
    };
    
    return {
      embeds: [{
        title: message.title,
        description: message.message,
        color: colorMap[message.color] || 0x0099ff,
        fields: message.fields || [],
        footer: {
          text: 'Deployment Monitor'
        },
        timestamp: new Date().toISOString()
      }]
    };
  }

  // 格式化通用消息
  formatGenericMessage(message, deployment) {
    return {
      title: message.title,
      message: message.message,
      deployment: {
        id: deployment.id,
        environment: deployment.environment,
        status: deployment.status,
        startTime: deployment.startTime,
        stages: deployment.stages,
        metrics: deployment.metrics
      },
      timestamp: Date.now()
    };
  }

  // 获取部署状态
  getDeploymentStatus(deploymentId) {
    return this.deployments.get(deploymentId);
  }

  // 获取所有部署
  getAllDeployments() {
    return Array.from(this.deployments.values());
  }

  // 生成部署报告
  generateReport(deploymentId) {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) return null;
    
    const duration = deployment.lastUpdate ? 
      deployment.lastUpdate - deployment.startTime : 
      Date.now() - deployment.startTime;
    
    return {
      id: deployment.id,
      environment: deployment.environment,
      version: deployment.version,
      status: deployment.status,
      duration: Math.round(duration / 1000),
      stages: deployment.stages,
      metrics: deployment.metrics,
      logs: deployment.logs,
      summary: {
        totalStages: deployment.stages.length,
        successfulStages: deployment.stages.filter(s => s.status === 'success').length,
        averageStageTime: deployment.stages.length > 0 ? 
          deployment.stages.reduce((sum, s) => sum + (s.duration || 0), 0) / deployment.stages.length : 0
      }
    };
  }
}

// 创建全局监控实例
const deploymentMonitor = new DeploymentMonitor();

// 导出函数和类
module.exports = {
  DeploymentMonitor,
  deploymentMonitor,
  DEPLOYMENT_STATUS
};

// 如果直接运行此脚本
if (require.main === module) {
  // 示例用法
  const deploymentId = `deploy_${Date.now()}`;
  const config = {
    environment: process.argv[2] || 'staging',
    version: process.argv[3] || 'v1.0.0',
    branch: process.argv[4] || 'main'
  };
  
  deploymentMonitor.startDeployment(deploymentId, config);
  
  // 模拟部署过程
  setTimeout(() => {
    deploymentMonitor.addDeploymentStage(deploymentId, 'build', 'success', 30000);
    deploymentMonitor.recordMetric(deploymentId, 'build_time', 30000);
  }, 1000);
  
  setTimeout(() => {
    deploymentMonitor.addDeploymentStage(deploymentId, 'deploy', 'success', 15000);
    deploymentMonitor.updateDeploymentStatus(deploymentId, DEPLOYMENT_STATUS.SUCCESS, '部署完成');
  }, 2000);
}
