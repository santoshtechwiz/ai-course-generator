"use client"

import React, { useState } from "react"
import { GlobalLoader } from "./loader/global-loader"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { Label } from "./label"
import { Slider } from "./slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

/**
 * Example component demonstrating how to use the GlobalLoader with all its variants
 */
export function GlobalLoaderDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [fullScreen, setFullScreen] = useState(false)
  const [variant, setVariant] = useState<"spinner" | "dots" | "pulse" | "skeleton">("spinner")
  const [size, setSize] = useState<"xs" | "sm" | "md" | "lg" | "xl">("md")
  const [text, setText] = useState("Loading...")
  const [subText, setSubText] = useState("Please wait while we load your content")
  const [theme, setTheme] = useState<"primary" | "secondary" | "accent" | "neutral">("primary")
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const [showProgress, setShowProgress] = useState(false)

  const handleStartLoading = () => {
    setIsLoading(true)
    
    // For demo purposes, auto-hide after 3 seconds
    if (!fullScreen) {
      setTimeout(() => setIsLoading(false), 3000)
    }
  }

  const handleStopLoading = () => {
    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>GlobalLoader Component</CardTitle>
        <CardDescription>
          Customize and test the unified loader component
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="options" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="options" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="variant">Loader Variant</Label>
                  <RadioGroup 
                    value={variant} 
                    onValueChange={(val) => setVariant(val as any)} 
                    className="flex flex-wrap gap-4"
                  >
                    {(['spinner', 'dots', 'pulse', 'skeleton'] as const).map(v => (
                      <div key={v} className="flex items-center space-x-2">
                        <RadioGroupItem value={v} id={`variant-${v}`} />
                        <Label htmlFor={`variant-${v}`}>{v}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <RadioGroup 
                    value={size} 
                    onValueChange={(val) => setSize(val as any)}
                    className="flex flex-wrap gap-4"
                  >
                    {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(s => (
                      <div key={s} className="flex items-center space-x-2">
                        <RadioGroupItem value={s} id={`size-${s}`} />
                        <Label htmlFor={`size-${s}`}>{s}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <RadioGroup 
                    value={theme} 
                    onValueChange={(val) => setTheme(val as any)}
                    className="flex flex-wrap gap-4"
                  >
                    {(['primary', 'secondary', 'accent', 'neutral'] as const).map(t => (
                      <div key={t} className="flex items-center space-x-2">
                        <RadioGroupItem value={t} id={`theme-${t}`} />
                        <Label htmlFor={`theme-${t}`}>{t}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="fullscreen" 
                    checked={fullScreen} 
                    onChange={(e) => setFullScreen(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="fullscreen">Fullscreen Overlay</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Main Text</Label>
                  <input
                    type="text"
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full p-2 rounded-md border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtext">Subtext</Label>
                  <input
                    type="text"
                    id="subtext"
                    value={subText}
                    onChange={(e) => setSubText(e.target.value)}
                    className="w-full p-2 rounded-md border"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="show-progress" 
                      checked={showProgress} 
                      onChange={(e) => {
                        setShowProgress(e.target.checked)
                        if (e.target.checked && progress === undefined) {
                          setProgress(0)
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="show-progress">Show Progress Bar</Label>
                  </div>
                  
                  {showProgress && (
                    <div className="space-y-2 pt-2">
                      <Label>Progress: {progress}%</Label>
                      <Slider
                        value={[progress || 0]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => setProgress(value[0])}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-6 flex items-center justify-center" style={{ minHeight: '200px' }}>
              {!fullScreen && isLoading && (
                <GlobalLoader
                  variant={variant}
                  size={size}
                  text={text || undefined}
                  subText={subText || undefined}
                  theme={theme}
                  fullScreen={false}
                  progress={showProgress ? progress : undefined}
                  isLoading={true}
                />
              )}
              {!isLoading && (
                <div className="text-center text-muted-foreground">
                  Press "Start Loading" to preview
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleStopLoading} disabled={!isLoading}>
          Stop Loading
        </Button>
        <Button onClick={handleStartLoading} disabled={isLoading}>
          Start Loading
        </Button>
      </CardFooter>

      {/* Fullscreen loader (outside of the preview area) */}
      <GlobalLoader
        variant={variant}
        size={size}
        text={text || undefined}
        subText={subText || undefined}
        theme={theme}
        fullScreen={true}
        progress={showProgress ? progress : undefined}
        isLoading={fullScreen && isLoading}
      />
    </Card>
  )
}

export default GlobalLoaderDemo
