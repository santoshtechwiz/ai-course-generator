"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, PlayCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface CarouselItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  quizType?: "mcq" | "openended" | "fill-blanks" | "code";
  type: "course" | "quiz";
}

const buildLinks = (items: CarouselItem[]) => {
  return items.map((item) => {
    if (item.type === "course") {
      return `/courses/dashboard/${item.slug}`;
    }
    if (item.quizType === "mcq") {
      return `/quiz/mcq/${item.slug}`;
    }
    if (item.quizType === "openended") {
      return `/quiz/openended/${item.slug}`;
    }
    if (item.quizType === "fill-blanks") {
      return `/quiz/blanks/${item.slug}`;
    }
    return `/quiz/${item.slug}`;
  });
};

const ShowCaseCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Precompute links using useMemo so it doesn't recalc on every render
  const links = useMemo(() => buildLinks(items), [items]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/carousel-items");
        if (!response.ok) throw new Error("Failed to fetch carousel items");
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Error fetching carousel items:", error);
      }
    };

    fetchItems();
  }, []);

  // Next slide function
  const nextSlide = useCallback(() => {
    if (items.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }
  }, [items]);

  // Previous slide function
  const prevSlide = useCallback(() => {
    if (items.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
    }
  }, [items]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        nextSlide();
      } else if (event.key === "ArrowLeft") {
        prevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Handle drag end for swipe gestures
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50; // Minimum distance in pixels to trigger the slide change
    if (info.offset.x < -threshold) {
      nextSlide();
    } else if (info.offset.x > threshold) {
      prevSlide();
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <section className="py-4 md:py-12 lg:py-20" aria-label="Showcase Carousel">
      <div className="container px-4 md:px-6">
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous Slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/70 hover:bg-white transition md:left-[-2rem]"
            onClick={prevSlide}
            disabled={items.length === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next Slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/70 hover:bg-white transition md:right-[-2rem]"
            onClick={nextSlide}
            disabled={items.length === 0}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Carousel Slide */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                drag="x"
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="w-full overflow-hidden bg-card shadow-lg">
                  <div className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-r from-primary to-primary-foreground">
                    {items[currentIndex].type === "course" ? (
                      <PlayCircle
                        className="absolute inset-0 m-auto h-24 md:h-32 lg:h-40 w-24 md:w-32 lg:w-40 text-card opacity-50"
                        aria-hidden="true"
                      />
                    ) : (
                      <HelpCircle
                        className="absolute inset-0 m-auto h-24 md:h-32 lg:h-40 w-24 md:w-32 lg:w-40 text-card opacity-50"
                        aria-hidden="true"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-2xl md:text-4xl font-bold text-card">
                        {items[currentIndex].type === "course" ? "Interactive Course" : "Engaging Quiz"}
                      </h3>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <CardTitle className="text-xl md:text-2xl text-primary">
                        {items[currentIndex].name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={items[currentIndex].type === "course" ? "default" : "secondary"}>
                          {items[currentIndex].type === "course" ? "Course" : "Quiz"}
                        </Badge>
                        {items[currentIndex].type !== "course" && (
                          <Badge variant="outline">
                            {items[currentIndex].quizType === "mcq"
                              ? "Multiple Choice"
                              : items[currentIndex].quizType === "openended"
                              ? "Open Ended"
                              : items[currentIndex].quizType === "fill-blanks"
                              ? "Fill in the Blank"
                              : "Code"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {items[currentIndex].description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Link href={links[currentIndex]}>
                      <Button variant="default" size="lg" className="w-full">
                        {items[currentIndex].type === "course" ? "Start Course" : "Take Quiz"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot Navigation */}
          <div className="flex justify-center mt-4 space-x-2">
            {items.map((_, index) => (
              <Link
                key={index}
                href={links[index]}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowCaseCarousel;
