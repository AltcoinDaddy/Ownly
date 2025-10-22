"use client"

/**
 * Safe navigator API utilities for SSR-safe usage
 * Provides fallbacks and client-side checks for navigator APIs
 */
export class SafeNavigator {
  /**
   * Safely copy text to clipboard with fallback
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    if (typeof window === "undefined") {
      return false
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // Fallback for older browsers or non-secure contexts
        return this.fallbackCopyToClipboard(text)
      }
    } catch (error) {
      console.warn("Clipboard API failed, trying fallback:", error)
      return this.fallbackCopyToClipboard(text)
    }
  }

  /**
   * Fallback clipboard copy using document.execCommand
   */
  private static fallbackCopyToClipboard(text: string): boolean {
    try {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)
      return successful
    } catch (error) {
      console.error("Fallback clipboard copy failed:", error)
      return false
    }
  }

  /**
   * Safely share content using Web Share API with fallback
   */
  static async share(shareData: ShareData): Promise<boolean> {
    if (typeof window === "undefined") {
      return false
    }

    try {
      if (navigator.share && this.canShare(shareData)) {
        await navigator.share(shareData)
        return true
      } else {
        // Fallback: copy URL to clipboard
        const url = shareData.url || window.location.href
        return await this.copyToClipboard(url)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.warn("Web Share API failed, trying fallback:", error)
        const url = shareData.url || window.location.href
        return await this.copyToClipboard(url)
      }
      return false
    }
  }

  /**
   * Check if Web Share API is supported and can share the data
   */
  static canShare(shareData?: ShareData): boolean {
    if (typeof window === "undefined" || !navigator.share) {
      return false
    }

    if (!shareData) {
      return true
    }

    try {
      return navigator.canShare ? navigator.canShare(shareData) : true
    } catch {
      return true
    }
  }

  /**
   * Check if clipboard API is supported
   */
  static get isClipboardSupported(): boolean {
    return typeof window !== "undefined" && 
           (!!navigator.clipboard || document.queryCommandSupported?.("copy"))
  }

  /**
   * Check if Web Share API is supported
   */
  static get isShareSupported(): boolean {
    return typeof window !== "undefined" && !!navigator.share
  }
}