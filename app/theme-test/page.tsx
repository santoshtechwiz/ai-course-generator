'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLoader } from "@/components/ui/loader";
import { useState } from "react";

export default function ThemeTestPage() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={`min-h-screen p-8 transition-colors ${isDark ? 'dark' : ''}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Theme Toggle */}
        <div className="flex justify-center">
          <Button
            onClick={() => setIsDark(!isDark)}
            className="bg-[var(--color-accent)] hover:bg-[var(--color-primary)] text-[var(--color-text)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] hover:shadow-[var(--shadow-neo-hover)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
          >
            Toggle {isDark ? 'Light' : 'Dark'} Mode
          </Button>
        </div>

        {/* Color Palette Test */}
        <Card className="border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] bg-[var(--color-card)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text)]">Color Palette Test</CardTitle>
            <CardDescription className="text-[var(--color-text)]/70">
              Testing all theme colors in both light and dark modes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-full h-16 bg-[var(--color-primary)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]"></div>
                <p className="text-sm font-medium text-[var(--color-text)]">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-[var(--color-secondary)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]"></div>
                <p className="text-sm font-medium text-[var(--color-text)]">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-[var(--color-accent)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]"></div>
                <p className="text-sm font-medium text-[var(--color-text)]">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="w-full h-16 bg-[var(--color-success)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]"></div>
                <p className="text-sm font-medium text-[var(--color-text)]">Success</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Variants Test */}
        <Card className="border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] bg-[var(--color-card)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text)]">Button Variants</CardTitle>
            <CardDescription className="text-[var(--color-text)]/70">
              Testing all button styles with hover and active states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-[var(--color-text)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] hover:shadow-[var(--shadow-neo-hover)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--shadow-neo-active)] transition-all font-bold">
                Primary Button
              </Button>
              <Button className="bg-[var(--color-secondary)] hover:bg-[var(--color-accent)] text-[var(--color-text)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] hover:shadow-[var(--shadow-neo-hover)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--shadow-neo-active)] transition-all font-bold">
                Secondary Button
              </Button>
              <Button className="bg-[var(--color-accent)] hover:bg-[var(--color-primary)] text-[var(--color-text)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] hover:shadow-[var(--shadow-neo-hover)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[var(--shadow-neo-active)] transition-all font-bold">
                Accent Button
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements Test */}
        <Card className="border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] bg-[var(--color-card)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text)]">Form Elements</CardTitle>
            <CardDescription className="text-[var(--color-text)]/70">
              Testing inputs, labels, and form styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-input" className="text-[var(--color-text)] font-bold">
                Test Input
              </Label>
              <Input
                id="test-input"
                placeholder="Enter some text..."
                className="bg-[var(--color-card)] border-6 border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent)]/20 text-[var(--color-text)] placeholder:text-[var(--color-text)]/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Badge Test */}
        <Card className="border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] bg-[var(--color-card)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text)]">Badges</CardTitle>
            <CardDescription className="text-[var(--color-text)]/70">
              Testing badge components with different colors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[var(--color-primary)] text-[var(--color-text)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
                Primary
              </Badge>
              <Badge className="bg-[var(--color-secondary)] text-[var(--color-text)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
                Secondary
              </Badge>
              <Badge className="bg-[var(--color-accent)] text-[var(--color-text)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
                Accent
              </Badge>
              <Badge className="bg-[var(--color-success)] text-[var(--color-text)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
                Success
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Loader Test */}
        <Card className="border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] bg-[var(--color-card)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text)]">Loader Component</CardTitle>
            <CardDescription className="text-[var(--color-text)]/70">
              Testing the unified loader with theme colors
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <AppLoader />
          </CardContent>
        </Card>

        {/* Shadow Test */}
        <Card className="border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)] bg-[var(--color-card)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-text)]">Shadow System</CardTitle>
            <CardDescription className="text-[var(--color-text)]/70">
              Testing different shadow variants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--color-card)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
                <p className="text-[var(--color-text)] font-bold">Default Shadow</p>
              </div>
              <div className="p-4 bg-[var(--color-card)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo-hover)]">
                <p className="text-[var(--color-text)] font-bold">Hover Shadow</p>
              </div>
              <div className="p-4 bg-[var(--color-card)] border-6 border-[var(--color-border)] shadow-[var(--shadow-neo-active)]">
                <p className="text-[var(--color-text)] font-bold">Active Shadow</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}