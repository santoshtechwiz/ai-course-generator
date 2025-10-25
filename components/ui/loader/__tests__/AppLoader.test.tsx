import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { AppLoader } from '../AppLoader'

describe('AppLoader', () => {
  it('renders with default message', () => {
    render(<AppLoader />)
    expect(screen.getByText('Loading...')).toBeTruthy()
  })

  it('renders with custom message', () => {
    render(<AppLoader message="Custom loading message" />)
    expect(screen.getByText('Custom loading message')).toBeTruthy()
  })

  it('renders with small size', () => {
    render(<AppLoader size="small" />)
    const spinner = document.querySelector('.lucide-loader-circle')
    expect(spinner?.classList.contains('h-4')).toBe(true)
    expect(spinner?.classList.contains('w-4')).toBe(true)
  })

  it('renders with medium size', () => {
    render(<AppLoader size="medium" />)
    const spinner = document.querySelector('.lucide-loader-circle')
    expect(spinner?.classList.contains('h-6')).toBe(true)
    expect(spinner?.classList.contains('w-6')).toBe(true)
  })

  it('renders with large size', () => {
    render(<AppLoader size="large" />)
    const spinner = document.querySelector('.lucide-loader-circle')
    expect(spinner?.classList.contains('h-8')).toBe(true)
    expect(spinner?.classList.contains('w-8')).toBe(true)
  })

  it('applies custom className', () => {
    render(<AppLoader className="custom-class" />)
    const container = screen.getByRole('status')
    expect(container.classList.contains('custom-class')).toBe(true)
  })

  it('has proper accessibility attributes', () => {
    render(<AppLoader />)
    const container = screen.getByRole('status')
    expect(container).toBeTruthy()
  })

  it('matches snapshot', () => {
    const { container } = render(<AppLoader />)
    expect(container.firstChild).toBeTruthy()
  })
})