"use client"

import { Skeleton } from "@/components/ui/skeleton"

// Hero Section Skeleton
export function HeroSkeleton() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-16 bg-main text-main-foreground">
  <div className="max-w-6xl mx-auto z-10 text-center w-full">
        {/* Badge */}
        <div className="mb-6">
          <Skeleton className="h-12 w-64 mx-auto bg-background/20" />
        </div>

        {/* Main heading */}
        <div className="mb-4 sm:mb-6 max-w-4xl mx-auto space-y-2">
          <Skeleton className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 w-full bg-background/20" />
          <Skeleton className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 w-5/6 mx-auto bg-background/20" />
        </div>

        {/* Description */}
        <div className="mb-8 sm:mb-12 max-w-3xl mx-auto space-y-2">
          <Skeleton className="h-6 w-full bg-background/20" />
          <Skeleton className="h-6 w-4/5 mx-auto bg-background/20" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-6 mb-16">
          <Skeleton className="h-12 w-32 bg-background/20" />
          <Skeleton className="h-12 w-40 bg-background/20" />
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-sm bg-background/20" />
              <Skeleton className="h-4 w-24 bg-background/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Features Section Skeleton
export function FeaturesSkeleton() {
  return (
    <div className="py-12 md:py-16 bg-background">
  <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center space-y-4">
              <Skeleton className="h-12 w-12 mx-auto rounded-lg" />
              <Skeleton className="h-6 w-32 mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mx-auto" />
                <Skeleton className="h-4 w-4/6 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Testimonials Section Skeleton
export function TestimonialsSkeleton() {
  return (
    <div className="py-12 md:py-16 bg-gray-50 dark:bg-gray-800/50">
  <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-12 w-80 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-border/10 shadow-lg text-center">
            {/* Quote */}
            <div className="space-y-3 mb-8">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6 mx-auto" />
              <Skeleton className="h-6 w-4/6 mx-auto" />
            </div>

            {/* Author */}
            <div className="flex items-center justify-center">
              <Skeleton className="h-16 w-16 mr-4 rounded-full" />
              <div className="text-left space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-2 w-2 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// FAQ Section Skeleton
export function FAQSkeleton() {
  return (
    <div className="py-12 md:py-16 bg-background">
  <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
        </div>

        {/* Search */}
        <div className="mb-8">
          <Skeleton className="h-12 w-full max-w-md mx-auto" />
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 flex-1 mr-4" />
                <Skeleton className="h-5 w-5 rounded-sm" />
              </div>
              {i === 1 && (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// How It Works Section Skeleton
function HowItWorksSkeleton() {
  return (
    <div className="py-12 md:py-16">
  <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <Skeleton className="h-12 w-80 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-6">
              <Skeleton className="h-16 w-16 mx-auto rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-32 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mx-auto" />
                <Skeleton className="h-4 w-4/6 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}