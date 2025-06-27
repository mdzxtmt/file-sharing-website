// 分析统计工具库

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
}

interface PageView {
  path: string
  title: string
  referrer: string
  timestamp: number
  sessionId: string
  userId?: string
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  sessionId: string
}

class Analytics {
  private sessionId: string
  private userId?: string
  private events: AnalyticsEvent[] = []
  private pageViews: PageView[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private isEnabled: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    
    if (typeof window !== 'undefined' && this.isEnabled) {
      this.initializeAnalytics()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeAnalytics() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush()
      }
    })

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.flush()
    })

    // 定期发送数据
    setInterval(() => {
      this.flush()
    }, 30000) // 每30秒发送一次

    // 监听性能指标
    this.observePerformance()
  }

  // 设置用户ID
  setUserId(userId: string) {
    this.userId = userId
  }

  // 跟踪事件
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    }

    this.events.push(event)

    // 如果是重要事件，立即发送
    if (this.isImportantEvent(eventName)) {
      this.flush()
    }
  }

  // 跟踪页面浏览
  page(path: string, title: string = document.title) {
    if (!this.isEnabled) return

    const pageView: PageView = {
      path,
      title,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    }

    this.pageViews.push(pageView)
  }

  // 跟踪性能指标
  trackPerformance(name: string, value: number) {
    if (!this.isEnabled) return

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId
    }

    this.performanceMetrics.push(metric)
  }

  // 判断是否为重要事件
  private isImportantEvent(eventName: string): boolean {
    const importantEvents = [
      'file_upload_complete',
      'file_download',
      'user_signup',
      'user_login',
      'error_occurred'
    ]
    return importantEvents.includes(eventName)
  }

  // 观察性能指标
  private observePerformance() {
    // 观察页面加载性能
    if ('PerformanceObserver' in window) {
      // 观察导航时间
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart)
            this.trackPerformance('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart)
            this.trackPerformance('first_byte', navEntry.responseStart - navEntry.fetchStart)
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })

      // 观察资源加载时间
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            this.trackPerformance(`resource_load_${resourceEntry.initiatorType}`, resourceEntry.duration)
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })

      // 观察最大内容绘制 (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance('largest_contentful_paint', entry.startTime)
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // 观察首次输入延迟 (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance('first_input_delay', entry.processingStart - entry.startTime)
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    }

    // 观察累积布局偏移 (CLS)
    if ('LayoutShiftAttribution' in window) {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        }
        this.trackPerformance('cumulative_layout_shift', clsValue)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  // 发送数据到服务器
  private async flush() {
    if (!this.isEnabled || (this.events.length === 0 && this.pageViews.length === 0 && this.performanceMetrics.length === 0)) {
      return
    }

    const data = {
      events: [...this.events],
      pageViews: [...this.pageViews],
      performanceMetrics: [...this.performanceMetrics],
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    try {
      // 使用 sendBeacon 或 fetch 发送数据
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', JSON.stringify(data))
      } else {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          keepalive: true
        })
      }

      // 清空已发送的数据
      this.events = []
      this.pageViews = []
      this.performanceMetrics = []
    } catch (error) {
      console.warn('Failed to send analytics data:', error)
    }
  }

  // 获取会话信息
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      eventsCount: this.events.length,
      pageViewsCount: this.pageViews.length,
      performanceMetricsCount: this.performanceMetrics.length
    }
  }
}

// 创建全局实例
export const analytics = new Analytics()

// 便捷方法
export const trackEvent = (name: string, properties?: Record<string, any>) => {
  analytics.track(name, properties)
}

export const trackPageView = (path: string, title?: string) => {
  analytics.page(path, title)
}

export const trackPerformance = (name: string, value: number) => {
  analytics.trackPerformance(name, value)
}

export const setUserId = (userId: string) => {
  analytics.setUserId(userId)
}

// 预定义的事件跟踪函数
export const trackFileUpload = (fileSize: number, fileType: string, uploadTime: number) => {
  trackEvent('file_upload_complete', {
    file_size: fileSize,
    file_type: fileType,
    upload_time: uploadTime
  })
}

export const trackFileDownload = (fileId: string, fileName: string, fileSize: number) => {
  trackEvent('file_download', {
    file_id: fileId,
    file_name: fileName,
    file_size: fileSize
  })
}

export const trackFileView = (fileId: string, fileName: string, viewDuration?: number) => {
  trackEvent('file_view', {
    file_id: fileId,
    file_name: fileName,
    view_duration: viewDuration
  })
}

export const trackSearch = (query: string, resultsCount: number, searchTime: number) => {
  trackEvent('search_performed', {
    query,
    results_count: resultsCount,
    search_time: searchTime
  })
}

export const trackError = (error: string, context?: string) => {
  trackEvent('error_occurred', {
    error_message: error,
    context
  })
}

// 部署相关事件跟踪函数
export const trackDeploymentStart = (environment: string, version: string, branch: string) => {
  trackEvent('deployment_started', {
    environment,
    version,
    branch,
    timestamp: Date.now()
  })
}

export const trackDeploymentSuccess = (environment: string, version: string, deploymentTime: number, deploymentUrl?: string) => {
  trackEvent('deployment_completed', {
    environment,
    version,
    deployment_time: deploymentTime,
    deployment_url: deploymentUrl,
    status: 'success'
  })
}

export const trackDeploymentFailure = (environment: string, version: string, error: string, stage?: string) => {
  trackEvent('deployment_failed', {
    environment,
    version,
    error_message: error,
    failed_stage: stage,
    status: 'failed'
  })
}

export const trackHealthCheck = (endpoint: string, responseTime: number, status: number, environment: string) => {
  trackEvent('health_check_performed', {
    endpoint,
    response_time: responseTime,
    http_status: status,
    environment,
    success: status >= 200 && status < 300
  })
}

export const trackRollback = (environment: string, fromVersion: string, toVersion: string, reason: string) => {
  trackEvent('rollback_executed', {
    environment,
    from_version: fromVersion,
    to_version: toVersion,
    reason
  })
}

// 在页面路由变化时自动跟踪
if (typeof window !== 'undefined') {
  // 跟踪初始页面加载
  trackPageView(window.location.pathname)

  // 监听 popstate 事件（浏览器前进后退）
  window.addEventListener('popstate', () => {
    trackPageView(window.location.pathname)
  })

  // 监听错误
  window.addEventListener('error', (event) => {
    trackError(event.error?.message || 'Unknown error', event.filename)
  })

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason?.message || 'Unhandled promise rejection')
  })
}
