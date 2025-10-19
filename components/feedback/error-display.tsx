'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { OwnlyError, ErrorSeverity, ErrorCategory } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface ErrorDisplayProps {
  error: OwnlyError
  onRetry?: () => void
  onDismiss?: () => void
  showDetails?: boolean
  compact?: boolean
  className?: string
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  showDetails = false,
  compact = false,
  className 
}: ErrorDisplayProps) {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  
  if (compact) {
    return (
      <CompactErrorDisplay 
        error={error} 
        onRetry={onRetry}
        className={className}
      />
    )
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            getSeverityStyles(error.severity).background
          )}>
            <AlertTriangle className={cn('h-5 w-5', getSeverityStyles(error.severity).icon)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">
                {getSeverityTitle(error.severity)}
              </CardTitle>
              <Badge variant={getSeverityBadgeVariant(error.severity)}>
                {error.category}
              </Badge>
            </div>
            <CardDescription className="text-sm">
              {error.userMessage}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {(error.suggestedActions?.length || showDetails) && (
        <CardContent className="space-y-4">
          {error.suggestedActions && error.suggestedActions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Suggested actions:</h4>
              <ul className="space-y-1">
                {error.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-xs mt-1 flex-shrink-0">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showDetails && (
            <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  Technical Details
                  {isDetailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <div className="rounded-md bg-muted p-3 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <span className="font-semibold">Code:</span> {error.code}
                    </div>
                    <div>
                      <span className="font-semibold">Severity:</span> {error.severity}
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Message:</span> {error.message}
                  </div>
                  {error.context && (
                    <div>
                      <span className="font-semibold">Context:</span>
                      <pre className="mt-1 text-xs overflow-auto">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      )}

      <CardFooter className="flex gap-2">
        {error.retryable && onRetry && (
          <Button onClick={onRetry} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
        
        {error.helpUrl && (
          <Button 
            onClick={() => window.open(error.helpUrl, '_blank')}
            variant="outline"
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Help
          </Button>
        )}
        
        {onDismiss && (
          <Button onClick={onDismiss} variant="ghost">
            Dismiss
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

interface CompactErrorDisplayProps {
  error: OwnlyError
  onRetry?: () => void
  className?: string
}

function CompactErrorDisplay({ error, onRetry, className }: CompactErrorDisplayProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-md border',
      getSeverityStyles(error.severity).border,
      className
    )}>
      <AlertTriangle className={cn('h-4 w-4 flex-shrink-0', getSeverityStyles(error.severity).icon)} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {error.userMessage}
        </p>
        {error.suggestedActions && error.suggestedActions.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {error.suggestedActions[0]}
          </p>
        )}
      </div>

      {error.retryable && onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

// Inline error display for forms and inputs
interface InlineErrorProps {
  error?: OwnlyError | string
  className?: string
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.userMessage
  
  return (
    <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      <span>{errorMessage}</span>
    </div>
  )
}

// Error list for displaying multiple errors
interface ErrorListProps {
  errors: OwnlyError[]
  onRetry?: (error: OwnlyError) => void
  onDismiss?: (error: OwnlyError) => void
  className?: string
}

export function ErrorList({ errors, onRetry, onDismiss, className }: ErrorListProps) {
  if (errors.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {errors.map((error, index) => (
        <CompactErrorDisplay
          key={`${error.code}-${index}`}
          error={error}
          onRetry={() => onRetry?.(error)}
        />
      ))}
    </div>
  )
}

// Helper functions
function getSeverityStyles(severity: ErrorSeverity) {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return {
        background: 'bg-red-100 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800'
      }
    case ErrorSeverity.HIGH:
      return {
        background: 'bg-red-50 dark:bg-red-900/10',
        icon: 'text-red-500 dark:text-red-400',
        border: 'border-red-100 dark:border-red-800'
      }
    case ErrorSeverity.MEDIUM:
      return {
        background: 'bg-yellow-50 dark:bg-yellow-900/10',
        icon: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-100 dark:border-yellow-800'
      }
    case ErrorSeverity.LOW:
      return {
        background: 'bg-blue-50 dark:bg-blue-900/10',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-100 dark:border-blue-800'
      }
    default:
      return {
        background: 'bg-gray-50 dark:bg-gray-900/10',
        icon: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-100 dark:border-gray-800'
      }
  }
}

function getSeverityTitle(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 'Critical Error'
    case ErrorSeverity.HIGH:
      return 'Error'
    case ErrorSeverity.MEDIUM:
      return 'Warning'
    case ErrorSeverity.LOW:
      return 'Notice'
    default:
      return 'Error'
  }
}

function getSeverityBadgeVariant(severity: ErrorSeverity): 'default' | 'destructive' | 'secondary' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'destructive'
    case ErrorSeverity.MEDIUM:
      return 'secondary'
    case ErrorSeverity.LOW:
      return 'default'
    default:
      return 'destructive'
  }
}