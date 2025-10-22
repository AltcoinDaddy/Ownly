"use client"

import React from "react"
import { AlertTriangle, Bug, Clock, Monitor, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useHydrationWarnings } from "@/lib/hydration/hydration-monitor"
import { useHydrationErrors } from "./hydration-error-boundary"

/**
 * Development-time dashboard for monitoring hydration issues
 * Only renders in development mode
 */
export function HydrationDashboard() {
  const [isOpen, setIsOpen] = React.useState(false)
  const { warnings, clearWarnings, getWarningsByType } = useHydrationWarnings()
  const { errors, clearErrors } = useHydrationErrors()

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const totalIssues = warnings.length + errors.length

  if (!isOpen && totalIssues === 0) {
    return null
  }

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && totalIssues > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            variant="destructive"
            size="sm"
            className="rounded-full shadow-lg animate-pulse"
          >
            <Bug className="h-4 w-4 mr-2" />
            {totalIssues} Hydration Issue{totalIssues !== 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {/* Dashboard panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Hydration Monitor
                </CardTitle>
                <CardDescription>
                  Development-time hydration issue tracking
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="overflow-auto">
              <Tabs defaultValue="warnings" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="warnings" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Warnings ({warnings.length})
                  </TabsTrigger>
                  <TabsTrigger value="errors" className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Errors ({errors.length})
                  </TabsTrigger>
                  <TabsTrigger value="summary">
                    Summary
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="warnings" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Hydration Warnings</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearWarnings}
                      disabled={warnings.length === 0}
                    >
                      Clear All
                    </Button>
                  </div>

                  {warnings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hydration warnings detected
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {warnings.map((warning, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={
                                  warning.type === 'mismatch' ? 'destructive' :
                                  warning.type === 'browser-api' ? 'secondary' :
                                  warning.type === 'dynamic-content' ? 'outline' :
                                  'default'
                                }>
                                  {warning.type}
                                </Badge>
                                {warning.component && (
                                  <Badge variant="outline">
                                    {warning.component}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{warning.message}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(warning.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="errors" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Hydration Errors</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearErrors}
                      disabled={errors.length === 0}
                    >
                      Clear All
                    </Button>
                  </div>

                  {errors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hydration errors recorded
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {errors.map((error, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="destructive">Error</Badge>
                                {error.isHydrationError && (
                                  <Badge variant="outline">Hydration</Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium">{error.message}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(error.timestamp).toLocaleString()}
                                {error.retryCount > 0 && (
                                  <span>• Retries: {error.retryCount}</span>
                                )}
                              </div>
                              {error.stack && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs font-medium">
                                    Stack Trace
                                  </summary>
                                  <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                    {error.stack}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="summary" className="space-y-4">
                  <h3 className="text-lg font-semibold">Issue Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Warning Types</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Mismatches:</span>
                          <span>{getWarningsByType('mismatch').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Browser APIs:</span>
                          <span>{getWarningsByType('browser-api').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dynamic Content:</span>
                          <span>{getWarningsByType('dynamic-content').length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Event Listeners:</span>
                          <span>{getWarningsByType('event-listener').length}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Error Statistics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Errors:</span>
                          <span>{errors.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hydration Errors:</span>
                          <span>{errors.filter(e => e.isHydrationError).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Auto-Recovered:</span>
                          <span>{errors.filter(e => e.retryCount > 0).length}</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {totalIssues > 0 && (
                    <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20">
                      <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
                        Recommendations
                      </h4>
                      <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
                        <li>• Wrap browser API usage in ClientOnly components</li>
                        <li>• Use SafeLocalStorage for localStorage operations</li>
                        <li>• Replace Math.random() with consistent alternatives</li>
                        <li>• Add useEffect guards for event listeners</li>
                        <li>• Ensure consistent initial state between server and client</li>
                      </ul>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}