"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "./button"
import { ClientOnly, SafeNavigator } from "@/lib/hydration"
import { useToast } from "@/hooks/use-toast"

interface ClipboardButtonProps {
  text: string
  label?: string
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  children?: React.ReactNode
  showIcon?: boolean
  successMessage?: string
}

export function ClipboardButton({
  text,
  label = "Copy",
  variant = "outline",
  size = "sm",
  className,
  children,
  showIcon = true,
  successMessage
}: ClipboardButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    const success = await SafeNavigator.copyToClipboard(text)
    
    if (success) {
      setCopied(true)
      if (successMessage) {
        toast({ description: successMessage })
      }
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard"
      })
    }
  }

  const ButtonContent = () => (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
      disabled={!SafeNavigator.isClipboardSupported}
    >
      {children || (
        <>
          {showIcon && (
            copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />
          )}
          {size !== "icon" && (
            <span className={showIcon ? "ml-2" : ""}>
              {copied ? "Copied!" : label}
            </span>
          )}
        </>
      )}
    </Button>
  )

  return (
    <ClientOnly fallback={
      <Button variant={variant} size={size} className={className} disabled>
        {showIcon && <Copy className="h-4 w-4" />}
        {size !== "icon" && (
          <span className={showIcon ? "ml-2" : ""}>{label}</span>
        )}
      </Button>
    }>
      <ButtonContent />
    </ClientOnly>
  )
}