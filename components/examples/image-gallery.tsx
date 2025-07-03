"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RevealImage } from '@/components/ui/animations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * ImageGallery - A component that demonstrates the improved RevealImage component
 * 
 * This shows a practical example of how animations can improve UX in a gallery view
 * by revealing images sequentially as the user scrolls or interacts with the gallery.
 */
export function ImageGallery() {
  const [activeCategory, setActiveCategory] = useState('all')
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'courses', label: 'Courses' },
    { id: 'tutorials', label: 'Tutorials' },
    { id: 'resources', label: 'Resources' },
  ]
  
  const images = [
    {
      id: 1,
      src: '/placeholder.svg',
      alt: 'Image 1',
      category: 'courses',
      title: 'Machine Learning Fundamentals'
    },
    {
      id: 2,
      src: '/placeholder.svg',
      alt: 'Image 2',
      category: 'tutorials',
      title: 'Python Tutorial'
    },
    {
      id: 3,
      src: '/placeholder.svg',
      alt: 'Image 3',
      category: 'resources',
      title: 'AI Learning Resources'
    },
    {
      id: 4,
      src: '/placeholder.svg',
      alt: 'Image 4',
      category: 'courses',
      title: 'Deep Learning Course'
    },
    {
      id: 5,
      src: '/placeholder.svg',
      alt: 'Image 5',
      category: 'tutorials',
      title: 'JavaScript for AI'
    },
    {
      id: 6,
      src: '/placeholder.svg',
      alt: 'Image 6',
      category: 'resources',
      title: 'Data Science Books'
    },
  ]
  
  const filteredImages = activeCategory === 'all' 
    ? images 
    : images.filter(img => img.category === activeCategory)
  
  return (
    <div className="container mx-auto py-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Learning Resources</h2>
      
      <div className="flex justify-center gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            onClick={() => setActiveCategory(category.id)}
            className="px-4 py-2"
          >
            {category.label}
          </Button>
        ))}
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        layout
      >
        {filteredImages.map((image, index) => (
          <motion.div
            key={image.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <RevealImage
                  src={image.src}
                  alt={image.alt}
                  height={200}
                  direction={index % 2 === 0 ? "left" : "right"}
                  delay={index * 0.1}
                  className="w-full h-[200px]"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{image.title}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{image.category}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
