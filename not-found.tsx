import { Suspense } from "react"
import Link from "next/link"
import { Metadata } from "next"
import { notFoundMetadata } from "@/app/metadata/not-found-metadata"
import { Compass, ArrowLeft, BookOpen, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRecommendedItems } from "@/app/utils/get-recommended-items"
import { RecommendedCard } from "@/components/shared/RecommendedCard"
import { motion } from "framer-motion"
import MainNavbar from "@/components/layout/navigation/MainNavbar"
import ClientOnly from "@/components/ClientOnly"
import { notFoundStructuredData, setNotFoundHeaders } from "@/app/utils/not-found-utils"
import AsyncNavLink from "@/components/loaders/AsyncNavLink"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"
import { JsonLD } from "@/lib/seo"
import RecommendedSection from "@/components/shared/RecommendedSection"

// Export metadata for SEO optimization
export const metadata: Metadata = notFoundMetadata

// Use dynamic rendering to ensure proper 404 handling
export const dynamic = "force-dynamic"

// Set appropriate headers
export async function generateMetadata() {
  // Next.js will use this to set appropriate headers including status code
  setNotFoundHeaders();
  return notFoundMetadata;
}

// Fallback component for recommendations when loading or error occurs
function RecommendationsFallback() {
  return (
    <div className="w-full py-12 text-center">
      <div className="flex justify-center">
        <SearchX className="h-16 w-16 text-muted-foreground animate-pulse" />
      </div>
      <p className="mt-4 text-muted-foreground">
        Loading recommendations...
      </p>
    </div>
  );
}

// Recommendations component with server-side data fetching
async function Recommendations() {
  const recommendedItems = await getRecommendedItems(3);
  
  if (recommendedItems.length === 0) {
    return (
      <div className="w-full py-12 text-center">
        <div className="flex justify-center">
          <BookOpen className="h-16 w-16 text-muted-foreground" />
        </div>
        <p className="mt-4 text-muted-foreground">
          We couldn't load recommendations right now. Try exploring our courses directly.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {recommendedItems.map((item, index) => (
        <RecommendedCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

// Container animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.7,
      when: "beforeChildren",
      staggerChildren: 0.2,
    },
  }
};

// Item animations
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    },
  }
};

export default function NotFound() {
  // Use the global notFoundStructuredData with additional site-specific properties
  const rootNotFoundStructuredData = {
    ...notFoundStructuredData,
    mainEntity: {
      ...notFoundStructuredData.mainEntity,
      additionalProperty: {
        "@type": "PropertyValue",
        "name": "pageType",
        "value": "404 Not Found - Root"
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Add structured data for SEO */}
      <JsonLD type="WebPage" data={rootNotFoundStructuredData} />
      
      {/* Add noindex meta tag explicitly */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      
      <MainNavbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12 md:py-16">
        <motion.div
          className="max-w-5xl w-full space-y-12 md:space-y-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 404 Header Section */}
          <div className="text-center">
            <motion.div 
              variants={itemVariants}
              className="relative inline-block"
            >
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl opacity-30" />
              <h1 className="text-7xl md:text-8xl font-bold text-primary relative z-10">404</h1>
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-foreground mt-4"
              variants={itemVariants}
            >
              Page Not Found
            </motion.h2>
            
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed"
              variants={itemVariants}
            >
              Looks like you've ventured into uncharted territory! Don't worry, 
              we've gathered some excellent learning opportunities below to get you back on track.
            </motion.p>
          </div>

          {/* Recommendations Section */}
          <motion.div 
            variants={itemVariants}
            className="w-full"
          >
            <h3 className="text-2xl font-semibold mb-6 text-center md:text-left bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Recommended for You
            </h3>
            
            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4 sm:p-5">
              <ClientOnly>
                <Suspense fallback={<SuspenseGlobalFallback />}>
                  <Recommendations />
                </Suspense>
              </ClientOnly>
            </div>
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
            variants={itemVariants}
          >
            <Button
              size="lg"
              variant="default"
              className="h-12 px-8 text-base font-medium w-full sm:w-auto"
              asChild
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-5 w-5" /> Go to Dashboard
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base font-medium w-full sm:w-auto"
              asChild
            >
              <Link href="/dashboard/explore">
                <Compass className="mr-2 h-5 w-5" /> Explore More
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
