import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SafeNavigator } from '@/lib/hydration'

describe('SafeNavigator', () => {
  let originalWindow: any
  let originalNavigator: any

  beforeEach(() => {
    originalWindow = global.window
    originalNavigator = global.navigator
  })

  afterEach(() => {
    global.window = originalWindow
    global.navigator = originalNavigator
    vi.restoreAllMocks()
  })

  describe('copyToClipboard', () => {
    it('should return false when window is undefined (SSR)', async () => {
      // @ts-ignore
      delete global.window

      const result = await SafeNavigator.copyToClipboard('test')
      expect(result).toBe(false)
    })

    it('should use clipboard API when available', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      global.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      global.window = { isSecureContext: true } as any

      const result = await SafeNavigator.copyToClipboard('test text')
      
      expect(result).toBe(true)
      expect(mockWriteText).toHaveBeenCalledWith('test text')
    })

    it('should use fallback when clipboard API fails', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard failed'))
      const mockExecCommand = vi.fn().mockReturnValue(true)
      const mockCreateElement = vi.fn().mockReturnValue({
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn()
      })
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()

      global.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      global.window = { isSecureContext: true } as any
      global.document = {
        createElement: mockCreateElement,
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild
        },
        execCommand: mockExecCommand
      } as any

      const result = await SafeNavigator.copyToClipboard('test text')
      
      expect(result).toBe(true)
      expect(mockWriteText).toHaveBeenCalledWith('test text')
      expect(mockExecCommand).toHaveBeenCalledWith('copy')
    })

    it('should return false when both clipboard API and fallback fail', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard failed'))
      const mockExecCommand = vi.fn().mockReturnValue(false)
      const mockCreateElement = vi.fn().mockReturnValue({
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn()
      })

      global.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      global.window = { isSecureContext: true } as any
      global.document = {
        createElement: mockCreateElement,
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        },
        execCommand: mockExecCommand
      } as any

      const result = await SafeNavigator.copyToClipboard('test text')
      
      expect(result).toBe(false)
    })
  })

  describe('share', () => {
    it('should return false when window is undefined (SSR)', async () => {
      // @ts-ignore
      delete global.window

      const result = await SafeNavigator.share({ title: 'test' })
      expect(result).toBe(false)
    })

    it('should use Web Share API when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      const mockCanShare = vi.fn().mockReturnValue(true)
      
      global.navigator = {
        share: mockShare,
        canShare: mockCanShare
      }
      global.window = {} as any

      const shareData = { title: 'Test', text: 'Test description', url: '/test' }
      const result = await SafeNavigator.share(shareData)
      
      expect(result).toBe(true)
      expect(mockShare).toHaveBeenCalledWith(shareData)
    })

    it('should fallback to clipboard when Web Share API is not available', async () => {
      const mockCopyToClipboard = vi.spyOn(SafeNavigator, 'copyToClipboard').mockResolvedValue(true)
      
      global.navigator = {}
      global.window = { location: { href: 'http://localhost' } } as any

      const shareData = { title: 'Test', url: '/test' }
      const result = await SafeNavigator.share(shareData)
      
      expect(result).toBe(true)
      expect(mockCopyToClipboard).toHaveBeenCalledWith('/test')
    })

    it('should handle Web Share API user cancellation gracefully', async () => {
      const abortError = new Error('User cancelled')
      abortError.name = 'AbortError'
      const mockShare = vi.fn().mockRejectedValue(abortError)
      
      global.navigator = {
        share: mockShare
      }
      global.window = {} as any

      const result = await SafeNavigator.share({ title: 'test' })
      
      expect(result).toBe(false)
    })
  })

  describe('feature detection', () => {
    it('should detect clipboard support correctly', () => {
      global.navigator = {
        clipboard: { writeText: vi.fn() }
      }
      global.window = {} as any

      expect(SafeNavigator.isClipboardSupported).toBe(true)
    })

    it('should detect clipboard support with execCommand fallback', () => {
      global.navigator = {}
      global.window = {} as any
      global.document = {
        queryCommandSupported: vi.fn().mockReturnValue(true)
      } as any

      expect(SafeNavigator.isClipboardSupported).toBe(true)
    })

    it('should detect Web Share API support correctly', () => {
      global.navigator = {
        share: vi.fn()
      }
      global.window = {} as any

      expect(SafeNavigator.isShareSupported).toBe(true)
    })

    it('should return false for unsupported features in SSR', () => {
      // @ts-ignore
      delete global.window

      expect(SafeNavigator.isClipboardSupported).toBe(false)
      expect(SafeNavigator.isShareSupported).toBe(false)
    })
  })
})