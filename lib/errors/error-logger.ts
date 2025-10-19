// Error Logging and Monitoring

import { OwnlyError, ErrorSeverity, ErrorContext } from './types'

export interface LogEntry {
  id: string
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  error?: OwnlyError
  context?: ErrorContext
  userAgent?: string
  url?: string
  userId?: string
  sessionId?: string
}

export class ErrorLogger {
  private static logs: LogEntry[] = []
  private static maxLogs = 1000
  private static sessionId = this.generateSessionId()

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static logError(error: OwnlyError, additionalContext?: ErrorContext): void {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: this.mapSeverityToLevel(error.severity),
      message: error.message,
      error,
      context: { ...error.context, ...additionalContext },
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.sessionId
    }

    this.addLog(logEntry)
    this.consoleLog(logEntry)
    
    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(logEntry)
    }
  }

  static logWarning(message: string, context?: ErrorContext): void {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.sessionId
    }

    this.addLog(logEntry)
    this.consoleLog(logEntry)
  }

  static logInfo(message: string, context?: ErrorContext): void {
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
      sessionId: this.sessionId
    }

    this.addLog(logEntry)
    
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(logEntry)
    }
  }

  private static mapSeverityToLevel(severity: ErrorSeverity): 'error' | 'warn' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.MEDIUM:
      case ErrorSeverity.LOW:
        return 'warn'
      default:
        return 'error'
    }
  }

  private static addLog(logEntry: LogEntry): void {
    this.logs.push(logEntry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  private static consoleLog(logEntry: LogEntry): void {
    const { level, message, error, context } = logEntry
    
    const logData = {
      timestamp: logEntry.timestamp,
      message,
      context,
      ...(error && { 
        errorCode: error.code,
        errorCategory: error.category,
        errorSeverity: error.severity,
        retryable: error.retryable,
        actionable: error.actionable
      })
    }

    switch (level) {
      case 'error':
        console.error(`[OWNLY ERROR] ${message}`, logData)
        if (error?.originalError) {
          console.error('Original error:', error.originalError)
        }
        break
      case 'warn':
        console.warn(`[OWNLY WARN] ${message}`, logData)
        break
      case 'info':
        console.info(`[OWNLY INFO] ${message}`, logData)
        break
      default:
        console.log(`[OWNLY] ${message}`, logData)
    }
  }

  private static async sendToMonitoring(logEntry: LogEntry): Promise<void> {
    try {
      // In a real implementation, you would send to services like:
      // - Sentry
      // - LogRocket
      // - DataDog
      // - Custom analytics endpoint
      
      // Example implementation:
      if (typeof window !== 'undefined' && window.fetch) {
        await fetch('/api/monitoring/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(logEntry)
        }).catch(() => {
          // Silently fail monitoring to not affect user experience
        })
      }
    } catch {
      // Silently fail monitoring
    }
  }

  // Get recent logs for debugging
  static getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  // Get logs by severity
  static getLogsBySeverity(severity: ErrorSeverity): LogEntry[] {
    return this.logs.filter(log => 
      log.error?.severity === severity
    )
  }

  // Get logs by category
  static getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => 
      log.error?.category === category
    )
  }

  // Clear logs (useful for testing)
  static clearLogs(): void {
    this.logs = []
  }

  // Export logs for debugging
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Get error statistics
  static getErrorStats(): {
    total: number
    bySeverity: Record<ErrorSeverity, number>
    byCategory: Record<string, number>
    recent: number // errors in last hour
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const stats = {
      total: this.logs.length,
      bySeverity: {
        [ErrorSeverity.CRITICAL]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.LOW]: 0
      },
      byCategory: {} as Record<string, number>,
      recent: 0
    }

    this.logs.forEach(log => {
      if (log.error) {
        stats.bySeverity[log.error.severity]++
        
        const category = log.error.category
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
      }

      if (new Date(log.timestamp) > oneHourAgo) {
        stats.recent++
      }
    })

    return stats
  }
}