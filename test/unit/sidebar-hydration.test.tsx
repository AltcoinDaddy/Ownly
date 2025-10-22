import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SidebarMenuSkeleton } from '@/components/ui/sidebar'

vi.mock('@/lib/hydration', () => ({
  useHydrated: vi.fn(() => ({ isHydrated: false })),
  SafeCookies: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  useIsomorphicLayoutEffect: vi.fn((effect, deps) => {
    React.useEffect(effect, deps)
  }),
  safeRandomWidth: vi.fn((min, max) => `${min + 5}%`),
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

describe('Sidebar Hydration', () => {
  it('should render skeleton elements correctly with icon', () => {
    render(<SidebarMenuSkeleton showIcon={true} data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    
    // Should have icon skeleton when showIcon is true
    const iconSkeleton = skeleton.querySelector('[data-sidebar="menu-skeleton-icon"]')
    expect(iconSkeleton).toBeInTheDocument()
    
    // Should have text skeleton
    const textSkeleton = skeleton.querySelector('[data-sidebar="menu-skeleton-text"]')
    expect(textSkeleton).toBeInTheDocument()
  })

  it('should not render icon skeleton when showIcon is false', () => {
    render(<SidebarMenuSkeleton showIcon={false} data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    const iconSkeleton = skeleton.querySelector('[data-sidebar="menu-skeleton-icon"]')
    expect(iconSkeleton).not.toBeInTheDocument()
    
    // Should still have text skeleton
    const textSkeleton = skeleton.querySelector('[data-sidebar="menu-skeleton-text"]')
    expect(textSkeleton).toBeInTheDocument()
  })

  it('should apply consistent styling classes', () => {
    render(<SidebarMenuSkeleton data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('flex', 'h-8', 'items-center', 'gap-2', 'rounded-md', 'px-2')
  })
})