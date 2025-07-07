"use client"

import React from 'react'

interface ContextualHelpProps {
  children: React.ReactNode
  position?: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left-center' | 'right-center'
}

export function ContextualHelp({ children, position = 'bottom' }: ContextualHelpProps) {
  return (
    <div className="hidden">
      {children}
    </div>
  )
}
