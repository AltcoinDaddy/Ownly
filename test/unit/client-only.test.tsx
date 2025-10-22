import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClientOnly } from '@/lib/hydration/client-only'

// Mock useEffect to control when it runs
const mockUseEffect = vi.fn()
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useEffect: mockUseEffect,
  }
})

describe('ClientOnly Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset useEffect to its original implementation
    mockUseEffect.mockImplementation((callback: () => void) => {
      callback()
    })
  })

  it('renders fallback during SSR (before hydration)', () => {
    // Mock useEffect to not run (simulating SSR)
    mockUseEffect.mockImplementation(() => {})
    
    render(
      <ClientOnly fallback={<div>Loading...</div>}>
        <div>Client content</div>
      </ClientOnly>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Client content')).not.toBeInTheDocument()
  })

  it('renders children after hydration', async () => {
    render(
      <ClientOnly fallback={<div>Loading...</div>}>
        <div>Client content</div>
      </ClientOnly>
    )

    await waitFor(() => {
      expect(screen.getByText('Client content')).toBeInTheDocument()
    })
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('renders null fallback by default during SSR', () => {
    // Mock useEffect to not run (simulating SSR)
    mockUseEffect.mockImplementation(() => {})
    
    const { container } = render(
      <ClientOnly>
        <div>Client content</div>
      </ClientOnly>
    )

    expect(container.firstChild).toBeNull()
    expect(screen.queryByText('Client content')).not.toBeInTheDocument()
  })

  it('handles complex children after hydration', async () => {
    const ComplexChild = () => (
      <div>
        <h1>Title</h1>
        <p>Description</p>
        <button>Action</button>
      </div>
    )

    render(
      <ClientOnly fallback={<div>Loading complex content...</div>}>
        <ComplexChild />
      </ClientOnly>
    )

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
    })
  })

  it('prevents hydration mismatch with browser-dependent content', async () => {
    const BrowserDependentComponent = () => {
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'SSR'
      return <div>User Agent: {userAgent}</div>
    }

    render(
      <ClientOnly fallback={<div>Detecting browser...</div>}>
        <BrowserDependentComponent />
      </ClientOnly>
    )

    // During SSR, should show fallback
    if (mockUseEffect.mock.calls.length === 0) {
      expect(screen.getByText('Detecting browser...')).toBeInTheDocument()
    } else {
      // After hydration, should show browser-dependent content
      await waitFor(() => {
        expect(screen.getByText(/User Agent:/)).toBeInTheDocument()
      })
    }
  })

  it('works with nested ClientOnly components', async () => {
    render(
      <ClientOnly fallback={<div>Loading outer...</div>}>
        <div>
          <span>Outer content</span>
          <ClientOnly fallback={<div>Loading inner...</div>}>
            <span>Inner content</span>
          </ClientOnly>
        </div>
      </ClientOnly>
    )

    await waitFor(() => {
      expect(screen.getByText('Outer content')).toBeInTheDocument()
      expect(screen.getByText('Inner content')).toBeInTheDocument()
    })
  })
})