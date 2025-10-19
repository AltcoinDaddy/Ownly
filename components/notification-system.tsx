"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useWallet } from "@/lib/wallet-context"
import { useBlockchainEvents } from "@/lib/flow/hooks"
import { BlockchainEvent } from "@/lib/flow/events"
import { CheckCircle, ArrowRightLeft, ShoppingCart, Tag, Zap } from "lucide-react"

interface NotificationSystemProps {
  enableToasts?: boolean
  enableBrowserNotifications?: boolean
}

export function NotificationSystem({ 
  enableToasts = true, 
  enableBrowserNotifications = false 
}: NotificationSystemProps) {
  const { address } = useWallet()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  // Request browser notification permission
  useEffect(() => {
    if (enableBrowserNotifications && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission)
        })
      }
    }
  }, [enableBrowserNotifications])

  // Listen to blockchain events and show notifications
  useBlockchainEvents({
    onMint: (event: BlockchainEvent) => {
      const { nftId, recipient, creator } = event.data
      
      if (enableToasts) {
        if (address === recipient) {
          // User minted an NFT
          toast.success("NFT Minted Successfully!", {
            description: `Your NFT #${nftId} has been minted`,
            icon: <CheckCircle className="w-4 h-4" />,
            duration: 5000,
            action: {
              label: "View",
              onClick: () => window.location.href = `/nft/${nftId}`
            }
          })
        } else {
          // Someone else minted an NFT
          toast.info("New NFT Minted", {
            description: `NFT #${nftId} was minted by ${creator?.slice(0, 6)}...`,
            icon: <Zap className="w-4 h-4" />,
            duration: 3000
          })
        }
      }

      // Browser notification for user's own mints
      if (enableBrowserNotifications && notificationPermission === 'granted' && address === recipient) {
        new Notification("NFT Minted!", {
          body: `Your NFT #${nftId} has been successfully minted`,
          icon: "/placeholder-logo.png",
          tag: `mint-${nftId}`
        })
      }
    },

    onTransfer: (event: BlockchainEvent) => {
      const { nftId, from, to } = event.data
      
      if (enableToasts) {
        if (address === to) {
          // User received an NFT
          toast.success("NFT Received!", {
            description: `You received NFT #${nftId} from ${from.slice(0, 6)}...`,
            icon: <ArrowRightLeft className="w-4 h-4" />,
            duration: 5000,
            action: {
              label: "View",
              onClick: () => window.location.href = `/profile`
            }
          })
        } else if (address === from) {
          // User sent an NFT
          toast.info("NFT Transferred", {
            description: `NFT #${nftId} sent to ${to.slice(0, 6)}...`,
            icon: <ArrowRightLeft className="w-4 h-4" />,
            duration: 4000
          })
        } else {
          // Other transfer
          toast.info("NFT Transfer", {
            description: `NFT #${nftId} transferred`,
            icon: <ArrowRightLeft className="w-4 h-4" />,
            duration: 2000
          })
        }
      }

      // Browser notification for user's transfers
      if (enableBrowserNotifications && notificationPermission === 'granted') {
        if (address === to) {
          new Notification("NFT Received!", {
            body: `You received NFT #${nftId}`,
            icon: "/placeholder-logo.png",
            tag: `transfer-${nftId}`
          })
        } else if (address === from) {
          new Notification("NFT Sent", {
            body: `NFT #${nftId} has been transferred`,
            icon: "/placeholder-logo.png",
            tag: `transfer-${nftId}`
          })
        }
      }
    },

    onSale: (event: BlockchainEvent) => {
      const { nftId, seller, buyer, price, currency } = event.data
      
      if (enableToasts) {
        if (address === seller) {
          // User sold an NFT
          toast.success("NFT Sold!", {
            description: `Your NFT #${nftId} sold for ${price} ${currency}`,
            icon: <ShoppingCart className="w-4 h-4" />,
            duration: 6000,
            action: {
              label: "View Transaction",
              onClick: () => window.location.href = `/profile`
            }
          })
        } else if (address === buyer) {
          // User bought an NFT
          toast.success("NFT Purchased!", {
            description: `You bought NFT #${nftId} for ${price} ${currency}`,
            icon: <ShoppingCart className="w-4 h-4" />,
            duration: 6000,
            action: {
              label: "View NFT",
              onClick: () => window.location.href = `/nft/${nftId}`
            }
          })
        } else {
          // Other sale
          toast.info("NFT Sale", {
            description: `NFT #${nftId} sold for ${price} ${currency}`,
            icon: <ShoppingCart className="w-4 h-4" />,
            duration: 3000
          })
        }
      }

      // Browser notification for user's sales/purchases
      if (enableBrowserNotifications && notificationPermission === 'granted') {
        if (address === seller) {
          new Notification("NFT Sold!", {
            body: `Your NFT #${nftId} sold for ${price} ${currency}`,
            icon: "/placeholder-logo.png",
            tag: `sale-${nftId}`
          })
        } else if (address === buyer) {
          new Notification("NFT Purchased!", {
            body: `You bought NFT #${nftId} for ${price} ${currency}`,
            icon: "/placeholder-logo.png",
            tag: `purchase-${nftId}`
          })
        }
      }
    },

    onListing: (event: BlockchainEvent) => {
      const { nftId, seller, price, currency } = event.data
      
      if (enableToasts) {
        if (address === seller) {
          // User listed an NFT
          toast.success("NFT Listed for Sale!", {
            description: `Your NFT #${nftId} is now listed for ${price} ${currency}`,
            icon: <Tag className="w-4 h-4" />,
            duration: 5000,
            action: {
              label: "View Listing",
              onClick: () => window.location.href = `/marketplace`
            }
          })
        } else {
          // Someone else listed an NFT
          toast.info("New NFT Listed", {
            description: `NFT #${nftId} listed for ${price} ${currency}`,
            icon: <Tag className="w-4 h-4" />,
            duration: 3000,
            action: {
              label: "View Marketplace",
              onClick: () => window.location.href = `/marketplace`
            }
          })
        }
      }

      // Browser notification for user's listings
      if (enableBrowserNotifications && notificationPermission === 'granted' && address === seller) {
        new Notification("NFT Listed!", {
          body: `Your NFT #${nftId} is now listed for ${price} ${currency}`,
          icon: "/placeholder-logo.png",
          tag: `listing-${nftId}`
        })
      }
    }
  })

  // This component doesn't render anything visible
  return null
}

// Hook to control notification preferences
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState({
    enableToasts: true,
    enableBrowserNotifications: false,
    enableSounds: false
  })

  const updatePreferences = (newPreferences: Partial<typeof preferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }))
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ownly-notification-preferences', JSON.stringify({
        ...preferences,
        ...newPreferences
      }))
    }
  }

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ownly-notification-preferences')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPreferences(parsed)
        } catch (error) {
          console.error('Failed to parse notification preferences:', error)
        }
      }
    }
  }, [])

  return { preferences, updatePreferences }
}

// Component for notification settings
export function NotificationSettings() {
  const { preferences, updatePreferences } = useNotificationPreferences()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notification Settings</h3>
      
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.enableToasts}
            onChange={(e) => updatePreferences({ enableToasts: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm">Show toast notifications</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.enableBrowserNotifications}
            onChange={(e) => updatePreferences({ enableBrowserNotifications: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm">Enable browser notifications</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.enableSounds}
            onChange={(e) => updatePreferences({ enableSounds: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm">Play notification sounds</span>
        </label>
      </div>
    </div>
  )
}