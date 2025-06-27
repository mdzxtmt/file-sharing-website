// 性能优化工具库

// 图片压缩和优化
export class ImageOptimizer {
  // 压缩图片
  static async compressImage(file: File, quality = 0.8, maxWidth = 1920): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  // 生成WebP格式
  static async convertToWebP(file: File, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              })
              resolve(webpFile)
            } else {
              resolve(file)
            }
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }
}

// 虚拟滚动实现
export class VirtualScroller {
  private container: HTMLElement
  private itemHeight: number
  private visibleCount: number
  private totalCount: number
  private scrollTop = 0
  private startIndex = 0
  private endIndex = 0

  constructor(container: HTMLElement, itemHeight: number, visibleCount: number) {
    this.container = container
    this.itemHeight = itemHeight
    this.visibleCount = visibleCount
    this.totalCount = 0
  }

  setTotalCount(count: number) {
    this.totalCount = count
    this.updateScrollHeight()
  }

  private updateScrollHeight() {
    const totalHeight = this.totalCount * this.itemHeight
    this.container.style.height = `${totalHeight}px`
  }

  onScroll(scrollTop: number) {
    this.scrollTop = scrollTop
    this.startIndex = Math.floor(scrollTop / this.itemHeight)
    this.endIndex = Math.min(this.startIndex + this.visibleCount, this.totalCount)
  }

  getVisibleRange() {
    return {
      start: this.startIndex,
      end: this.endIndex,
      offsetY: this.startIndex * this.itemHeight
    }
  }
}

// 懒加载实现
export class LazyLoader {
  private observer: IntersectionObserver
  private callbacks = new Map<Element, () => void>()

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target)
          if (callback) {
            callback()
            this.unobserve(entry.target)
          }
        }
      })
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    })
  }

  observe(element: Element, callback: () => void) {
    this.callbacks.set(element, callback)
    this.observer.observe(element)
  }

  unobserve(element: Element) {
    this.callbacks.delete(element)
    this.observer.unobserve(element)
  }

  disconnect() {
    this.observer.disconnect()
    this.callbacks.clear()
  }
}

// 缓存管理
export class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl = 5 * 60 * 1000) { // 默认5分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // 清理过期缓存
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// 防抖和节流
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 性能监控
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>()

  // 记录性能指标
  mark(name: string) {
    performance.mark(name)
  }

  // 测量性能
  measure(name: string, startMark: string, endMark?: string) {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name, 'measure')[0]
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(measure.duration)
  }

  // 获取平均性能
  getAverage(name: string): number {
    const values = this.metrics.get(name) || []
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }

  // 获取所有指标
  getAllMetrics() {
    const result: Record<string, { average: number; count: number }> = {}
    
    for (const [name, values] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverage(name),
        count: values.length
      }
    }
    
    return result
  }

  // 清理指标
  clear() {
    this.metrics.clear()
    performance.clearMarks()
    performance.clearMeasures()
  }
}

// 部署性能监控类
export class DeploymentPerformanceMonitor {
  private deploymentMetrics = new Map<string, any>()

  // 记录部署开始时间
  startDeployment(deploymentId: string, environment: string) {
    this.deploymentMetrics.set(deploymentId, {
      environment,
      startTime: Date.now(),
      stages: new Map<string, { startTime: number; endTime?: number; duration?: number }>()
    })
    performanceMonitor.mark(`deployment_${deploymentId}_start`)
  }

  // 记录部署阶段
  markStage(deploymentId: string, stageName: string, action: 'start' | 'end') {
    const deployment = this.deploymentMetrics.get(deploymentId)
    if (!deployment) return

    const markName = `deployment_${deploymentId}_${stageName}_${action}`
    performanceMonitor.mark(markName)

    if (action === 'start') {
      deployment.stages.set(stageName, { startTime: Date.now() })
    } else if (action === 'end') {
      const stage = deployment.stages.get(stageName)
      if (stage) {
        stage.endTime = Date.now()
        stage.duration = stage.endTime - stage.startTime

        // 记录性能指标
        performanceMonitor.measure(
          `deployment_stage_${stageName}`,
          `deployment_${deploymentId}_${stageName}_start`,
          `deployment_${deploymentId}_${stageName}_end`
        )
      }
    }
  }

  // 完成部署记录
  completeDeployment(deploymentId: string, success: boolean) {
    const deployment = this.deploymentMetrics.get(deploymentId)
    if (!deployment) return

    const endTime = Date.now()
    const totalDuration = endTime - deployment.startTime

    performanceMonitor.mark(`deployment_${deploymentId}_end`)
    performanceMonitor.measure(
      `deployment_total_${deployment.environment}`,
      `deployment_${deploymentId}_start`,
      `deployment_${deploymentId}_end`
    )

    // 记录部署性能指标
    const metrics = {
      deploymentId,
      environment: deployment.environment,
      totalDuration,
      success,
      stages: Object.fromEntries(deployment.stages),
      completedAt: endTime
    }

    // 发送性能数据到分析系统
    if (typeof window !== 'undefined') {
      // 客户端环境
      import('./analytics').then(({ trackPerformance }) => {
        trackPerformance(`deployment_duration_${deployment.environment}`, totalDuration)
      })
    }

    return metrics
  }

  // 获取部署统计
  getDeploymentStats(environment?: string) {
    const stats = {
      totalDeployments: 0,
      successfulDeployments: 0,
      averageDuration: 0,
      environments: new Map<string, any>()
    }

    for (const [id, deployment] of this.deploymentMetrics.entries()) {
      if (environment && deployment.environment !== environment) continue

      stats.totalDeployments++
      if (deployment.success) stats.successfulDeployments++

      if (!stats.environments.has(deployment.environment)) {
        stats.environments.set(deployment.environment, {
          count: 0,
          totalDuration: 0,
          successCount: 0
        })
      }

      const envStats = stats.environments.get(deployment.environment)
      envStats.count++
      envStats.totalDuration += deployment.totalDuration || 0
      if (deployment.success) envStats.successCount++
    }

    return stats
  }
}

// 全局实例
export const cacheManager = new CacheManager()
export const performanceMonitor = new PerformanceMonitor()
export const deploymentPerformanceMonitor = new DeploymentPerformanceMonitor()

// 定期清理缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup()
  }, 5 * 60 * 1000) // 每5分钟清理一次
}
