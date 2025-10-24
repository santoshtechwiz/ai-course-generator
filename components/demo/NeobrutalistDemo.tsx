"use client"

import React, { useState } from "react"
import { SimpleLoader, ComponentLoader } from "@/components/loaders/SimpleLoader"
import { Heart, Star, Zap, Sparkles, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"

export function NeobrutalistDemo() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [progress, setProgress] = useState(65)
  const [showLoader, setShowLoader] = useState(false)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-shadow-neo-lg">🎨 Neobrutalism Theme Demo</h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Bold, playful, and geometric design system with high contrast and sharp edges.
        </p>
      </div>

      {/* Color Palette */}
      <div className="neo-card-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Color Palette</h2>
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-bold">Primary Colors</h4>
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-[var(--neo-primary)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
              <div className="w-16 h-16 bg-[var(--neo-secondary)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
              <div className="w-16 h-16 bg-[var(--neo-accent)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold">Status Colors</h4>
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-[var(--neo-success)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
              <div className="w-16 h-16 bg-[var(--neo-warning)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
              <div className="w-16 h-16 bg-[var(--neo-error)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
              <div className="w-16 h-16 bg-[var(--neo-info)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold">Extended Palette</h4>
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-[var(--neo-yellow)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
              <div className="w-16 h-16 bg-[var(--neo-orange)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
              <div className="w-16 h-16 bg-[var(--neo-lime)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
              <div className="w-16 h-16 bg-[var(--neo-pink)] rounded-neo-md border-neo-lg border-[var(--neo-border)] shadow-neo-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="neo-card-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Button Variations</h2>
          <Zap className="h-6 w-6" />
        </div>
        
        <div className="space-y-6">
          {/* Primary Buttons */}
          <div className="space-y-4">
            <h4 className="font-bold">Primary Buttons</h4>
            <div className="flex flex-wrap gap-4">
              <button className="neo-btn-primary neo-btn-sm">
                <Heart className="h-4 w-4" />
                Small
              </button>
              <button className="neo-btn-primary">
                <Star className="h-5 w-5" />
                Default
              </button>
              <button className="neo-btn-primary neo-btn-lg">
                <Zap className="h-6 w-6" />
                Large
              </button>
            </div>
          </div>

          {/* Button States */}
          <div className="space-y-4">
            <h4 className="font-bold">Button States</h4>
            <div className="flex flex-wrap gap-4">
              <button className="neo-btn-secondary">Secondary</button>
              <button className="neo-btn-accent">Accent</button>
              <button className="neo-btn-outline">Outline</button>
              <button className="neo-btn-success">Success</button>
              <button className="neo-btn-warning">Warning</button>
              <button className="neo-btn-error">Error</button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="neo-card-lg">
        <h2 className="text-2xl font-bold mb-6">Card Variations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="neo-card-sm">
            <h4 className="font-bold mb-2">Small Card</h4>
            <p className="text-sm text-[var(--neo-muted-dark)]">
              Perfect for compact information display.
            </p>
          </div>
          <div className="neo-card">
            <h4 className="font-bold mb-2">Default Card</h4>
            <p className="text-sm text-[var(--neo-muted-dark)]">
              Standard card with balanced padding and shadows.
            </p>
          </div>
          <div className="neo-card">
            <h4 className="font-bold mb-2">Interactive Card</h4>
            <p className="text-sm text-[var(--neo-muted-dark)]">
              Hover me for shadow animations!
            </p>
          </div>
        </div>
      </div>

      {/* Form Elements */}
      <div className="neo-card-lg">
        <h2 className="text-2xl font-bold mb-6">Form Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block font-bold">Input Field</label>
            <input 
              className="neo-input w-full" 
              placeholder="Enter your text here..."
            />
          </div>
          <div className="space-y-4">
            <label className="block font-bold">Select</label>
            <select className="neo-input w-full">
              <option>Choose an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <label className="block font-bold mb-4">Textarea</label>
          <textarea 
            className="neo-input w-full min-h-[100px] resize-y" 
            placeholder="Enter your message..."
          />
        </div>
      </div>

      {/* Badges & Status */}
      <div className="neo-card-lg">
        <h2 className="text-2xl font-bold mb-6">Badges & Status</h2>
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-bold">Badge Variations</h4>
            <div className="flex flex-wrap gap-3">
              <span className="neo-badge-primary">Primary</span>
              <span className="neo-badge-secondary">Secondary</span>
              <span className="neo-badge-success">Success</span>
              <span className="neo-badge-warning">Warning</span>
              <span className="neo-badge-error">Error</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold">Status Indicators</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[var(--neo-success)]" />
                <span>Success message with icon</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-[var(--neo-warning)]" />
                <span>Warning message with icon</span>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-[var(--neo-error)]" />
                <span>Error message with icon</span>
              </div>
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-[var(--neo-info)]" />
                <span>Info message with icon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Components */}
      <div className="neo-card-lg">
        <h2 className="text-2xl font-bold mb-6">Quiz Components</h2>
        
        <div className="space-y-6">
          {/* Quiz Options */}
          <div className="space-y-4">
            <h4 className="font-bold">Quiz Options</h4>
            <div className="space-y-3">
              {['Option A: React is a library', 'Option B: React is a framework', 'Option C: React is a language'].map((option, index) => (
                <div
                  key={index}
                  className={`neo-quiz-option cursor-pointer ${
                    selectedOption === option ? 'neo-quiz-option-selected' : ''
                  }`}
                  onClick={() => setSelectedOption(option)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-neo-md border-[var(--neo-border)] flex items-center justify-center ${
                      selectedOption === option ? 'bg-white' : 'bg-transparent'
                    }`}>
                      {selectedOption === option && <div className="w-3 h-3 rounded-full bg-[var(--neo-primary)]"></div>}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-4">
            <h4 className="font-bold">Progress Indicator</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Quiz Progress</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="neo-progress-bar">
                <div 
                  className="neo-progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="neo-btn-outline neo-btn-sm"
                  onClick={() => setProgress(Math.max(0, progress - 10))}
                >
                  -10%
                </button>
                <button 
                  className="neo-btn-primary neo-btn-sm"
                  onClick={() => setProgress(Math.min(100, progress + 10))}
                >
                  +10%
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loaders */}
      <div className="neo-card-lg">
        <h2 className="text-2xl font-bold mb-6">Loading States</h2>
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-bold">Loader Variants</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <ComponentLoader variant="spinner" message="Spinner" size="md" />
              </div>
              <div className="text-center">
                <ComponentLoader variant="dots" message="Dots" size="md" />
              </div>
              <div className="text-center">
                <ComponentLoader variant="skeleton" message="Skeleton" size="md" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold">Full Screen Loader</h4>
            <button 
              className="neo-btn-accent"
              onClick={() => {
                setShowLoader(true)
                setTimeout(() => setShowLoader(false), 3000)
              }}
            >
              Show Full Screen Loader (3s)
            </button>
            {showLoader && <SimpleLoader context="quiz" variant="spinner" size="lg" message="Loading quiz..." fullScreen />}
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="neo-card-lg">
        <h2 className="text-2xl font-bold mb-6">Theme Support</h2>
        <div className="space-y-4">
          <p className="text-[var(--neo-muted-dark)]">
            This design system automatically adapts to light and dark themes with proper contrast ratios.
          </p>
          <button 
            className="neo-btn-accent"
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            Toggle Dark Mode
          </button>
        </div>
      </div>

    </div>
  )
}