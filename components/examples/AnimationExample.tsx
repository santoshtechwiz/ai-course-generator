"use client"

import { AnimatedWrapper, FadeIn, SlideUp, StaggeredList } from '@/components/animations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AnimationExample() {
  const items = [
    { id: 1, title: 'Learn React', description: 'Master modern React development' },
    { id: 2, title: 'Next.js Fundamentals', description: 'Build full-stack applications' },
    { id: 3, title: 'TypeScript Essentials', description: 'Type-safe JavaScript development' },
    { id: 4, title: 'Tailwind CSS', description: 'Utility-first CSS framework' },
  ]

  return (
    <div className="space-y-8 p-8">
      {/* Basic animations */}
      <FadeIn className="text-center">
        <h1 className="text-4xl font-bold mb-4">Animation System Demo</h1>
        <p className="text-lg text-muted-foreground">
          Showcase of our centralized animation utilities
        </p>
      </FadeIn>

      {/* Staggered list animation */}
      <SlideUp delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>Course List</CardTitle>
          </CardHeader>
          <CardContent>
            <StaggeredList className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              ))}
            </StaggeredList>
          </CardContent>
        </Card>
      </SlideUp>

      {/* Custom animation wrapper */}
      <AnimatedWrapper
        animation="scale"
        delay={0.5}
        duration={0.6}
        className="flex justify-center"
      >
        <Button size="lg" className="px-8">
          Get Started
        </Button>
      </AnimatedWrapper>
    </div>
  )
}
