"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Heart, 
  Star, 
  Zap, 
  Sparkles, 
  Rocket, 
  Trophy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from "lucide-react"

export function NeobrutalistShowcase() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [progress, setProgress] = useState(65)

  return (
    <div className="neo-container py-neo-xl space-y-neo-xl">
      
      {/* Header */}
      <div className="text-center space-y-neo-md">
        <h1 className="text-shadow-neo-lg">🎨 Neobrutalism Showcase</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Bold, playful, and geometric design system with high contrast and sharp edges.
        </p>
      </div>

      {/* Color Palette */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle className="neo-flex-between">
            <span>Color Palette</span>
            <Sparkles className="h-6 w-6" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-neo-md">
          <div className="neo-grid">
            <div className="space-y-3">
              <h4 className="font-bold">Primary Colors</h4>
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-primary rounded-neo-md border-neo shadow-neo-md"></div>
                <div className="w-16 h-16 bg-secondary rounded-neo-md border-neo shadow-neo-md"></div>
                <div className="w-16 h-16 bg-accent rounded-neo-md border-neo shadow-neo-md"></div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold">Status Colors</h4>
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-success rounded-neo-md border-neo shadow-neo-md"></div>
                <div className="w-16 h-16 bg-warning rounded-neo-md border-neo shadow-neo-md"></div>
                <div className="w-16 h-16 bg-error rounded-neo-md border-neo shadow-neo-md"></div>
                <div className="w-16 h-16 bg-info rounded-neo-md border-neo shadow-neo-md"></div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold">Extended Palette</h4>
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-yellow rounded-neo-md border-neo shadow-neo-md"></div>
                <div className="w-16 h-16 bg-orange rounded-neo-md border-neo shadow-neo-md"></div>
                <div className="w-16 h-16 bg-lime rounded-neo-md border-neo shadow-neo-md"></div>
                <div className="w-16 h-16 bg-pink rounded-neo-md border-neo shadow-neo-md"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle className="neo-flex-between">
            <span>Button Variations</span>
            <Zap className="h-6 w-6" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-neo-md">
          
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
                <Rocket className="h-6 w-6" />
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

          {/* Disabled State */}
          <div className="space-y-4">
            <h4 className="font-bold">Disabled State</h4>
            <button className="neo-btn-primary" disabled>
              Disabled Button
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Cards & Layouts */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle className="neo-flex-between">
            <span>Card Variations</span>
            <Trophy className="h-6 w-6" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-neo-md">
          <div className="neo-grid">
            <div className="neo-card-sm">
              <h4 className="font-bold mb-2">Small Card</h4>
              <p className="text-sm text-muted-foreground">
                Perfect for compact information display.
              </p>
            </div>
            <div className="neo-card">
              <h4 className="font-bold mb-2">Default Card</h4>
              <p className="text-sm text-muted-foreground">
                Standard card with balanced padding and shadows.
              </p>
            </div>
            <div className="neo-card neo-tilt">
              <h4 className="font-bold mb-2">Tilt Effect</h4>
              <p className="text-sm text-muted-foreground">
                Hover me for a playful tilt animation!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-neo-md">
          <div className="neo-grid">
            <div className="space-y-4">
              <label className="block font-bold">Input Field</label>
              <input 
                className="neo-input w-full" 
                placeholder="Enter your text here..."
              />
            </div>
            <div className="space-y-4">
              <label className="block font-bold">Textarea</label>
              <textarea 
                className="neo-input w-full min-h-[100px] resize-y" 
                placeholder="Enter your message..."
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
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle>Badges & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-neo-md">
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
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Success message with icon</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span>Warning message with icon</span>
              </div>
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-error" />
                <span>Error message with icon</span>
              </div>
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-info" />
                <span>Info message with icon</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Components */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle>Quiz Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-neo-md">
          
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
                    <div className={`w-6 h-6 rounded-full border-neo-md border-neo-border flex items-center justify-center ${
                      selectedOption === option ? 'bg-white' : 'bg-transparent'
                    }`}>
                      {selectedOption === option && <div className="w-3 h-3 rounded-full bg-primary"></div>}
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
              <div className="neo-flex-between">
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
        </CardContent>
      </Card>

      {/* Animations */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle>Animations & Effects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-neo-md">
          <div className="neo-grid">
            <div className="neo-card-sm neo-bounce text-center">
              <div className="text-2xl mb-2">🎾</div>
              <p className="font-bold">Bounce</p>
            </div>
            <div className="neo-card-sm neo-pulse text-center">
              <div className="text-2xl mb-2">💫</div>
              <p className="font-bold">Pulse</p>
            </div>
            <div className="neo-card-sm neo-wiggle text-center">
              <div className="text-2xl mb-2">🎭</div>
              <p className="font-bold">Wiggle</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle>Typography Scale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-neo-md">
          <div className="space-y-4">
            <h1 className="text-shadow-neo">Heading 1 - Bold & Impactful</h1>
            <h2>Heading 2 - Strong Presence</h2>
            <h3>Heading 3 - Clear Hierarchy</h3>
            <h4>Heading 4 - Subtle Emphasis</h4>
            <h5>Heading 5 - Minor Headings</h5>
            <h6>Heading 6 - Small Headers</h6>
            <p className="text-lg">Large paragraph text for important content.</p>
            <p>Regular paragraph text for body content and descriptions.</p>
            <p className="text-sm text-muted-foreground">Small text for captions and secondary information.</p>
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode Toggle */}
      <Card className="neo-card-lg">
        <CardHeader>
          <CardTitle>Theme Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This design system automatically adapts to light and dark themes with proper contrast ratios.
            </p>
            <button 
              className="neo-btn-accent"
              onClick={() => document.documentElement.classList.toggle('dark')}
            >
              Toggle Dark Mode
            </button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}