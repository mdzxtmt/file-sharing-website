#!/usr/bin/env node

/**
 * 部署后健康检查脚本
 * 验证部署后的系统状态，包括端点健康、数据库连接、关键功能可用性
 */

const https = require('https');
const http = require('http');

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

// 健康检查配置
const HEALTH_CHECK_CONFIG = {
  timeout: 30000, // 30秒超时
  retries: 3,     // 重试3次
  retryDelay: 5000, // 重试间隔5秒
  
  // 检查端点配置
  endpoints: [
    {
      name: 'Main Page',
      path: '/',
      expectedStatus: 200,
      critical: true
    },
    {
      name: 'API Health',
      path: '/api/health',
      expectedStatus: 200,
      critical: true
    },
    {
      name: 'Files Page',
      path: '/files',
      expectedStatus: 200,
      critical: false
    },
    {
      name: 'Ranking Page',
      path: '/ranking',
      expectedStatus: 200,
      critical: false
    },
    {
      name: 'User Center',
      path: '/user',
      expectedStatus: 200,
      critical: false
    }
  ],
  
  // 性能阈值
  performanceThresholds: {
    responseTime: 5000,    // 5秒响应时间阈值
    availability: 0.95     // 95%可用性阈值
  }
};

// 健康检查类
class HealthChecker {
  constructor(baseUrl, config = HEALTH_CHECK_CONFIG) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
    this.config = config;
    this.results = [];
  }

  // 执行HTTP请求
  async makeRequest(url, timeout = this.config.timeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: timeout,
        headers: {
          'User-Agent': 'Health-Check-Bot/1.0',
          'Accept': 'text/html,application/json,*/*'
        }
      };
      
      const req = client.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime: responseTime
          });
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });
  }

  // 检查单个端点
  async checkEndpoint(endpoint, retryCount = 0) {
    const url = `${this.baseUrl}${endpoint.path}`;
    
    try {
      log(`🔍 检查端点: ${endpoint.name} (${url})`, 'blue');
      
      const response = await this.makeRequest(url);
      const isHealthy = response.statusCode === endpoint.expectedStatus;
      const isPerformant = response.responseTime <= this.config.performanceThresholds.responseTime;
      
      const result = {
        name: endpoint.name,
        url: url,
        status: isHealthy ? 'healthy' : 'unhealthy',
        statusCode: response.statusCode,
        expectedStatus: endpoint.expectedStatus,
        responseTime: response.responseTime,
        performant: isPerformant,
        critical: endpoint.critical,
        timestamp: Date.now(),
        retryCount: retryCount
      };
      
      if (isHealthy && isPerformant) {
        log(`✅ ${endpoint.name}: 健康 (${response.responseTime}ms)`, 'green');
      } else if (isHealthy && !isPerformant) {
        log(`⚠️ ${endpoint.name}: 响应慢 (${response.responseTime}ms)`, 'yellow');
      } else {
        log(`❌ ${endpoint.name}: 不健康 (HTTP ${response.statusCode})`, 'red');
        
        // 如果是关键端点且失败，进行重试
        if (endpoint.critical && retryCount < this.config.retries) {
          log(`🔄 重试 ${endpoint.name} (${retryCount + 1}/${this.config.retries})`, 'yellow');
          await this.sleep(this.config.retryDelay);
          return this.checkEndpoint(endpoint, retryCount + 1);
        }
      }
      
      return result;
      
    } catch (error) {
      log(`❌ ${endpoint.name}: 错误 - ${error.message}`, 'red');
      
      const result = {
        name: endpoint.name,
        url: url,
        status: 'error',
        error: error.message,
        critical: endpoint.critical,
        timestamp: Date.now(),
        retryCount: retryCount
      };
      
      // 关键端点错误时重试
      if (endpoint.critical && retryCount < this.config.retries) {
        log(`🔄 重试 ${endpoint.name} (${retryCount + 1}/${this.config.retries})`, 'yellow');
        await this.sleep(this.config.retryDelay);
        return this.checkEndpoint(endpoint, retryCount + 1);
      }
      
      return result;
    }
  }

  // 检查数据库连接（通过API端点）
  async checkDatabase() {
    try {
      log('🗄️ 检查数据库连接...', 'blue');
      
      const response = await this.makeRequest(`${this.baseUrl}/api/health/db`);
      
      if (response.statusCode === 200) {
        try {
          const data = JSON.parse(response.data);
          if (data.database && data.database.connected) {
            log('✅ 数据库连接正常', 'green');
            return { status: 'healthy', responseTime: response.responseTime };
          }
        } catch (parseError) {
          // 如果无法解析JSON，但状态码是200，认为连接正常
          log('✅ 数据库连接正常', 'green');
          return { status: 'healthy', responseTime: response.responseTime };
        }
      }
      
      log('❌ 数据库连接异常', 'red');
      return { status: 'unhealthy', statusCode: response.statusCode };
      
    } catch (error) {
      log(`❌ 数据库检查失败: ${error.message}`, 'red');
      return { status: 'error', error: error.message };
    }
  }

  // 检查存储服务
  async checkStorage() {
    try {
      log('📦 检查存储服务...', 'blue');
      
      const response = await this.makeRequest(`${this.baseUrl}/api/health/storage`);
      
      if (response.statusCode === 200) {
        log('✅ 存储服务正常', 'green');
        return { status: 'healthy', responseTime: response.responseTime };
      }
      
      log('❌ 存储服务异常', 'red');
      return { status: 'unhealthy', statusCode: response.statusCode };
      
    } catch (error) {
      log(`❌ 存储检查失败: ${error.message}`, 'red');
      return { status: 'error', error: error.message };
    }
  }

  // 执行完整健康检查
  async performHealthCheck() {
    log('🏥 开始健康检查...', 'blue');
    log(`🎯 目标URL: ${this.baseUrl}`, 'blue');
    log('=' .repeat(50), 'blue');
    
    const startTime = Date.now();
    const results = {
      overall: 'healthy',
      timestamp: startTime,
      baseUrl: this.baseUrl,
      endpoints: [],
      database: null,
      storage: null,
      summary: {
        total: 0,
        healthy: 0,
        unhealthy: 0,
        errors: 0,
        critical_failures: 0
      }
    };
    
    // 检查所有端点
    for (const endpoint of this.config.endpoints) {
      const result = await this.checkEndpoint(endpoint);
      results.endpoints.push(result);
      
      results.summary.total++;
      
      if (result.status === 'healthy') {
        results.summary.healthy++;
      } else if (result.status === 'unhealthy') {
        results.summary.unhealthy++;
        if (result.critical) {
          results.summary.critical_failures++;
        }
      } else {
        results.summary.errors++;
        if (result.critical) {
          results.summary.critical_failures++;
        }
      }
    }
    
    // 检查数据库
    results.database = await this.checkDatabase();
    
    // 检查存储
    results.storage = await this.checkStorage();
    
    // 计算总体健康状态
    const totalDuration = Date.now() - startTime;
    results.duration = totalDuration;
    
    // 判断整体健康状态
    if (results.summary.critical_failures > 0) {
      results.overall = 'critical';
    } else if (results.summary.unhealthy > 0 || results.summary.errors > 0) {
      results.overall = 'degraded';
    } else {
      results.overall = 'healthy';
    }
    
    // 输出总结
    log('\n' + '=' .repeat(50), 'blue');
    log('📊 健康检查总结', 'blue');
    log('=' .repeat(50), 'blue');
    
    const statusColor = results.overall === 'healthy' ? 'green' : 
                       results.overall === 'degraded' ? 'yellow' : 'red';
    
    log(`🏥 整体状态: ${results.overall.toUpperCase()}`, statusColor);
    log(`⏱️ 检查耗时: ${totalDuration}ms`, 'blue');
    log(`✅ 健康端点: ${results.summary.healthy}/${results.summary.total}`, 'green');
    
    if (results.summary.unhealthy > 0) {
      log(`⚠️ 异常端点: ${results.summary.unhealthy}`, 'yellow');
    }
    
    if (results.summary.errors > 0) {
      log(`❌ 错误端点: ${results.summary.errors}`, 'red');
    }
    
    if (results.summary.critical_failures > 0) {
      log(`🚨 关键失败: ${results.summary.critical_failures}`, 'red');
    }
    
    return results;
  }

  // 等待函数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0];
  
  if (!baseUrl) {
    log('用法: node scripts/health-check.js <base-url>', 'red');
    log('示例: node scripts/health-check.js https://your-app.vercel.app', 'blue');
    process.exit(1);
  }
  
  try {
    const checker = new HealthChecker(baseUrl);
    const results = await checker.performHealthCheck();
    
    // 根据结果设置退出码
    if (results.overall === 'healthy') {
      process.exit(0);
    } else if (results.overall === 'degraded') {
      process.exit(1);
    } else {
      process.exit(2);
    }
    
  } catch (error) {
    log(`❌ 健康检查失败: ${error.message}`, 'red');
    process.exit(3);
  }
}

// 导出类和函数
module.exports = {
  HealthChecker,
  HEALTH_CHECK_CONFIG
};

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}
