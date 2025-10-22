"use client"

import { useState, useEffect } from "react"
import { Bell, X, CheckCircle, ArrowRightLeft, ShoppingCart, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotificationEvents, useNFTEvents, useMarketplaceEvents } from "@/lib/flow/event-context"
import { cn } from "@/lib/utils"

interface NotificationItemProps {
  notification: {
    id: string
    type: string
    message: string
    timestamp: Date
    read: boolean
  }
  onMarkAsRead: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-purple-500" />
      case 'listing':
        return <Tag className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'mint':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'transfer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'sale':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'listing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
        notification.read 
          ? "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800" 
          : "bg-white dark:bg-gray-950 border-blue-200 dark:border-blue-800 shadow-sm"
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex-shrink-0 mt-1">
        {getIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <Badge className={cn("text-xs", getBadgeColor(notification.type))}>
            {notification.type.toUpperCase()}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(notification.timestamp)}
          </span>
        </div>
        
        <p className={cn(
          "text-sm",
          notification.read 
            ? "text-gray-600 dark:text-gray-400" 
            : "text-gray-900 dark:text-gray-100 font-medium"
        )}>
          {notification.message}
        </p>
      </div>
      
      {!notification.read && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      )}
    </div>
  )
}

export function EventNotifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    hasUnread
  } = useNotificationEvents()

  const [isOpen, setIsOpen] = useState(false)

  // Auto-close popover when no unread notifications
  useEffect(() => {
    if (!hasUnread && isOpen) {
      const timer = setTimeout(() => setIsOpen(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [hasUnread, isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearNotifications}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No notifications yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  You'll see real-time updates here
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1 p-3">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

// Real-time event indicator component
export function RealTimeIndicator() {
  const { latestNFTEvent, isNFTEvent } = useNFTEvents()
  const { latestMarketplaceEvent, isMarketplaceEvent } = useMarketplaceEvents()
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    if (isNFTEvent || isMarketplaceEvent) {
      setShowIndicator(true)
      const timer = setTimeout(() => setShowIndicator(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [latestNFTEvent, latestMarketplaceEvent, isNFTEvent, isMarketplaceEvent])

  if (!showIndicator) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CardContent className="flex items-center space-x-2 p-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Live update received
          </span>
        </CardContent>
      </Card>
    </div>
  )
}