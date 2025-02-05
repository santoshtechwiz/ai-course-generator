"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CourseQuizCarousel from "../dashboard/CourseQuizCarousel"


export default function ShowcaseSection() {
  const showcaseRef = useRef(null)
  const isShowcaseInView = useInView(showcaseRef, { once: true, amount: 0.2 })

  return (
    <section ref={showcaseRef} className="container mx-auto py-12 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isShowcaseInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="space-y-12"
      >
        {/* <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Explore Our Platform</h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Discover a world of interactive courses and engaging quizzes designed to enhance your learning experience.
          </p>
        </div> */}

        <Card className="bg-card/80 backdrop-blur-sm border-primary/10 shadow-lg overflow-hidden">
          <CardHeader className="p-6 md:p-8 border-b">
            {/* <CardTitle className="text-2xl font-bold">Featured Content</CardTitle>
            <CardDescription>Browse through our latest courses and quizzes.</CardDescription> */}
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                {["all", "courses", "quizzes"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-none border-b-2 border-transparent px-4 py-2 font-semibold text-muted-foreground transition-all hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all" className="p-6 md:p-8">
                <CourseQuizCarousel filter="all" />
              </TabsContent>
              <TabsContent value="courses" className="p-6 md:p-8">
                <CourseQuizCarousel filter="course" />
              </TabsContent>
              <TabsContent value="quizzes" className="p-6 md:p-8">
                <CourseQuizCarousel filter="quiz" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  )
}
