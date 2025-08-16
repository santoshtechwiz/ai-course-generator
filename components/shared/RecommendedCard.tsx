import Image from "next/image"
import { useRouter } from "next/navigation"
import { BookOpen, FileQuestion } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type RecommendedItem } from "@/app/utils/get-recommended-items"
import { useGlobalLoader } from '@/store/loaders/global-loader'

interface RecommendedCardProps {
  item: RecommendedItem
  index: number
}

export function RecommendedCard({ item, index }: RecommendedCardProps) {
  const router = useRouter()
  const { startLoading } = useGlobalLoader();
  
  const getUrl = () => {
    if (item.type === "course") {
      return `/dashboard/course/${item.slug}`
    }
    return `/dashboard/quizzes/${item.slug}`
  }

  // Animation variants with staggered delay based on index
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        delay: 0.2 + (index * 0.1) 
      }
    }
  }
  
  const TypeIcon = item.type === "course" ? BookOpen : FileQuestion

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card className="relative overflow-hidden h-full flex flex-col hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-primary/5 via-card to-accent/5 border-primary/10">
        <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-multiply" aria-hidden="true" />
        <div className="relative h-40 w-full">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <Badge 
            variant={item.type === "course" ? "default" : "secondary"}
            className="absolute top-2 right-2 z-10 shadow-sm bg-primary/90 text-primary-foreground hover:bg-primary"
          >
            {item.type === "course" ? "Course" : "Quiz"}
          </Badge>
        </div>
        
        <CardContent className="pt-4 flex-grow">
          <div className="flex items-start gap-3">
            <TypeIcon className="h-5 w-5 shrink-0 mt-1 text-primary" />
            <div>
              <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
              {item.description && (
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pb-4 pt-0">
          <Button 
            onClick={() => {
              startLoading({ message: "Loading...", isBlocking: true, minVisibleMs: 200, autoProgress: true });
              router.push(getUrl());
            }} 
            variant="outline" 
            className="w-full hover:border-primary/40 hover:bg-primary/5"
          >
            {item.type === "course" ? "View Course" : "Take Quiz"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
