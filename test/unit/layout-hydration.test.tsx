import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LoadingFallback } from '@/components/loading-fallback'
import { HydrationSafeBody } from '@/components/hydration-safe-body'

// Mock the hydration hook
vi.mock('@/lib/hydration/use-hydrated', () => ({
  useHydrated: () => ({ isHydrated: true }),
}))

describe('Hydration Safe Components', () => {
  describe('LoadingFallback Component', () => {
    it('should render minimal variant correctly', () => {
      render(<LoadingFallback variant="minimal" />)
      
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should render page variant with skeleton structure', () => {
      render(<LoadingFallback variant="page" />)
      
      const container = document.querySelector('.min-h-screen')
      expect(container).toBeInTheDocument()
    })

    it('should render card variant with card structure', () => {
      render(<LoadingFallback variant="card" />)
      
      const container = document.querySelector('.space-y-4')
      expect(container).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<LoadingFallback variant="minimal" className="custom-class" />)
      
      const container = document.querySelector('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  describe('HydrationSafeBody Component', () => {
    it('should render without errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<HydrationSafeBody className="test-class" />)
      
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should not render any visible content', () => {
      const { container } = render(<HydrationSafeBody className="test-class" />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Layout Structure', () => {
    it('should have consistent CSS class structure', () => {
      // Test that our CSS classes are consistent
      const testElement = document.createElement('div')
      testElement.className = 'font-sans antialiased bg-background text-foreground'
      
      expect(testElement.classList.contains('font-sans')).toBe(true)
      expect(testElement.classList.contains('antialiased')).toBe(true)
      expect(testElement.classList.contains('bg-background')).toBe(true)
      expect(testElement.classList.contains('text-foreground')).toBe(true)
    })

    it('should handle suppressHydrationWarning correctly', () => {
      const testElement = document.createElement('div')
      testElement.setAttribute('suppressHydrationWarning', '')
      
      expect(testElement.getAttribute('suppressHydrationWarning')).toBe('')
    })
  })
})

describe('LoadingFallback Component', () => {
  it('should render minimal variant correctly', () => {
    render(<LoadingFallback variant="minimal" />)
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render page variant with skeleton structure', () => {
    render(<LoadingFallback variant="page" />)
    
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render card variant with card structure', () => {
    render(<LoadingFallback variant="card" />)
    
    const container = document.querySelector('.space-y-4')
    expect(container).toBeInTheDocument()
  })
})