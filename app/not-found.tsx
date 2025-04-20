"use client"
import { useRouter } from "next/navigation"
import { Home, PlusCircle, Compass, HelpCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import MainNavbar from "@/components/Navbar/MainNavbar"


export default function NotFound() {
  const router = useRouter()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 },
    },
  }

  const suggestedPages = [
    { href: "/", icon: Home, title: "Home", description: "Return to the main page" },
    { href: "/dashboard/explore", icon: PlusCircle, title: "Create", description: "Start creating your own content" },
    { href: "/dashboard", icon: Compass, title: "Explore", description: "Discover new learning opportunities" },
    { href: "/dashboard/quizzes", icon: HelpCircle, title: "Quiz", description: "Discover new quizzes" },
  ]

  const handleNavigation = (href: string) => {
    // Add a small delay to allow exit animations to complete
    setTimeout(() => {
      router.push(href)
    }, 100)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNavbar />
      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <motion.div
          className="max-w-4xl w-full space-y-16 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-7xl font-bold text-primary mb-4">404</h1>
            <p className="text-3xl font-semibold text-foreground">Page Not Found</p>
          </motion.div>

          <motion.p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" variants={itemVariants}>
            Oops! It seems you&apos;ve ventured into uncharted territory. Don&apos;t worry, though – there&apos;s still
            plenty to explore in our digital realm!
          </motion.p>

          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-semibold text-foreground mb-8">Where to next?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {suggestedPages.map((item) => (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNavigation(item.href)}
                  className="cursor-pointer"
                >
                  <Card className="h-full hover:shadow-md transition-all duration-300">
                    <CardContent className="flex flex-col items-center justify-center p-8 h-full">
                      <item.icon className="h-14 w-14 text-primary mb-6" />
                      <h3 className="font-semibold text-xl text-foreground mb-3">{item.title}</h3>
                      <p className="text-base text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              size="lg"
              variant="default"
              onClick={() => handleNavigation("/dashboard")}
              className="h-12 px-8 text-base font-medium"
            >
              <ArrowLeft className="mr-2 h-5 w-5" /> Return to Home
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

