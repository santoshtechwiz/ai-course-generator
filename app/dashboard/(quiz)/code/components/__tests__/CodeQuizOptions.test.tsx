import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import CodeQuizOptions from '../CodeQuizOptions'

// Mock framer-motion to avoid animation-related issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock UI components
jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, onValueChange, value, disabled }: any) => (
    <div data-testid="radio-group" data-value={value} data-disabled={disabled} onChange={(e: any) => onValueChange?.(e.target.value)}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ children, value, ...props }: any) => (
    <div 
      role="radio" 
      aria-checked={value === props['data-value']} 
      data-value={value} 
      onClick={() => props.onClick?.(value)}
      {...props}
    >
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => <div className={className}>{children}</div>,
}))

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  CheckCircle2: () => <div data-testid="check-icon" />,
  Code: () => <div data-testid="code-icon" />,
}))

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}))

describe('CodeQuizOptions Component', () => {
  const mockOptions = ['Option A', 'Option B', 'Option C', 'Option D']
  const onSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders options correctly', () => {
    render(
      <CodeQuizOptions 
        options={mockOptions}
        selectedOption={null}
        onSelect={onSelect}
      />
    )

    // Check if all options are rendered
    mockOptions.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument()
    })
  })

  test('handles option selection correctly', () => {
    render(
      <CodeQuizOptions 
        options={mockOptions}
        selectedOption={null}
        onSelect={onSelect}
      />
    )

    // Find the first option and click it
    const optionElement = screen.getByText('Option A')
    fireEvent.click(optionElement)

    // Check if onSelect was called with the correct option
    expect(onSelect).toHaveBeenCalledWith('Option A')
  })
  test('shows selected option correctly', () => {
    render(
      <CodeQuizOptions 
        options={mockOptions}
        selectedOption="Option B"
        onSelect={onSelect}
      />
    )

    // Verify that the RadioGroup has the correct selected value
    const radioGroup = screen.getByTestId('radio-group')
    expect(radioGroup).toHaveAttribute('data-value', 'Option B')
    
    // Check that all options are present
    mockOptions.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument()
    })
  })

  test('renders fallback when no options are provided', () => {
    render(
      <CodeQuizOptions 
        options={[]}
        selectedOption={null}
        onSelect={onSelect}
      />
    )

    // Check if the fallback message is shown
    expect(screen.getByText('No options available')).toBeInTheDocument()
  })
  test('disables options when disabled prop is true', () => {
    render(
      <CodeQuizOptions 
        options={mockOptions}
        selectedOption={null}
        onSelect={onSelect}
        disabled={true}
      />
    )    // Check if RadioGroup has disabled attribute
    const radioGroup = screen.getByTestId('radio-group')
    expect(radioGroup).toHaveAttribute('data-disabled', 'true')
    
    // Click the first option
    const optionElement = screen.getByText('Option A')
    fireEvent.click(optionElement)

    // Check that onSelect was not called because options are disabled
    expect(onSelect).not.toHaveBeenCalled()
  })
})
