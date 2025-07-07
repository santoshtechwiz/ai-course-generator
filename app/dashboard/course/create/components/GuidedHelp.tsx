"use client"

import React from 'react'

interface GuidedHelpProps {
  isOpen: boolean
  onClose: () => void
  title: string
  steps: {
    title: string
    content: string
  }[]
}

export function GuidedHelp({ isOpen, onClose, title, steps }: GuidedHelpProps) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="border-b pb-2 last:border-b-0">
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-muted-foreground">{step.content}</p>
            </div>
          ))}
        </div>
        <button 
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export function GuidedHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="text-sm text-primary hover:text-primary/80 flex items-center"
    >
      Help
    </button>
  )
}

export function useGuidedHelp() {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const open = React.useCallback(() => {
    setIsOpen(true)
  }, [])
  
  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])
  
  return {
    isOpen,
    open,
    close
  }
}
