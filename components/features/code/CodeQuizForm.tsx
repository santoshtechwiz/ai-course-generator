"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronsUpDown, Info, AlertCircle, Code2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { languages, getSubtopics } from "@/config/lang"
import PlanAwareButton from "@/components/PlanAwareButton"
import { SubscriptionSlider } from "@/components/SubscriptionSlider"


interface CodeQuizFormProps {
  credits: number
  maxQuestions: number
  isLoggedIn: boolean
  subscriptionPlan: string
}

const CodeQuizForm: React.FC<CodeQuizFormProps> = ({ credits, maxQuestions, isLoggedIn, subscriptionPlan }) => {
  const [language, setLanguage] = useState("")
  const [subtopic, setSubtopic] = useState("")
  const [difficulty, setDifficulty] = useState(50)
  const [questionCount, setQuestionCount] = useState(maxQuestions)
  const [openLanguage, setOpenLanguage] = useState(false)
  const [openSubtopic, setOpenSubtopic] = useState(false)
  const [customLanguage, setCustomLanguage] = useState("")
  const [customSubtopic, setCustomSubtopic] = useState("")
  const [openInfo, setOpenInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [customSubtopics, setCustomSubtopics] = useState<Record<string, string[]>>({})
  const router = useRouter()

  const handleLanguageSelect = useCallback((selectedLanguage: string) => {
    setLanguage(selectedLanguage)
    setOpenLanguage(false)
    setSubtopic("")
  }, [])

  const handleSubtopicSelect = useCallback((selectedSubtopic: string) => {
    setSubtopic(selectedSubtopic)
    setOpenSubtopic(false)
  }, [])

  const handleCustomLanguageSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (customLanguage.trim()) {
        const newLanguage = {
          name: customLanguage.trim(),
          icon: ({ className }: { className?: string }) => <Code2 className={className} />,
          category: "Custom",
        }
        setLanguage(newLanguage.name)
        setOpenLanguage(false)
        setCustomLanguage("")
        // Add the custom language to the languages array
        languages.push(newLanguage)
      }
    },
    [customLanguage],
  )

  const handleCustomSubtopicSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (customSubtopic.trim()) {
        setSubtopic(customSubtopic.trim())
        setOpenSubtopic(false)
        setCustomSubtopic("")
        // Add the custom subtopic to the subtopics array for the current language
        const currentSubtopics = getSubtopics(language)
        if (!currentSubtopics.includes(customSubtopic.trim())) {
          currentSubtopics.push(customSubtopic.trim())
        }
      }
    },
    [customSubtopic, language],
  )

  const getDifficultyLabel = useCallback((value: number) => {
    if (value <= 33) return "Easy"
    if (value <= 66) return "Medium"
    return "Hard"
  }, [])

  const generateQuiz = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language, subtopic, difficulty: getDifficultyLabel(difficulty), questionCount }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const { slug } = await response.json()
      router.push(`/dashboard/code/${slug}`)
      setIsLoading(true)
    } catch (err) {
      console.error("Error generating quiz:", err)
      setError("Failed to generate quiz. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [language, subtopic, difficulty, questionCount, router, getDifficultyLabel])

  const isDisabled = useMemo(
    () => isLoading || credits < 1 || !language.trim() || !subtopic.trim(),
    [isLoading, credits, language, subtopic],
  )

  useEffect(() => {
    if (language && !customSubtopics[language]) {
      setCustomSubtopics((prev) => ({ ...prev, [language]: [] }))
    }
  }, [language, customSubtopics])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="bg-background border border-border shadow-sm">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex justify-center mb-4">
            <motion.div
              className="p-3 bg-primary/10 rounded-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Code2 className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">
            Coding Quiz Generator
          </CardTitle>
          <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
            Choose a programming language and customize your quiz settings below.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-3">
              <Label htmlFor="language-select" className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Programming Language
              </Label>
              <Popover open={openLanguage} onOpenChange={setOpenLanguage}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openLanguage}
                    className="w-full justify-between"
                  >
                    {language
                      ? languages.find((lang) => lang.name === language)?.icon({ className: "mr-2 h-4 w-4" })
                      : null}
                    {language || "Select language..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search language..." />
                    <CommandList>
                      <CommandEmpty>No language found.</CommandEmpty>
                      {Array.from(new Set(languages.map((lang) => lang.category))).map((category) => (
                        <CommandGroup key={category} heading={category}>
                          {languages
                            .filter((lang) => lang.category === category)
                            .map((lang) => (
                              <CommandItem key={lang.name} onSelect={() => handleLanguageSelect(lang.name)}>
                                <Check
                                  className={cn("mr-2 h-4 w-4", language === lang.name ? "opacity-100" : "opacity-0")}
                                />
                                {lang.icon({ className: "mr-2 h-4 w-4" })}
                                {lang.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      ))}
                      <CommandGroup heading="Custom">
                        <form onSubmit={handleCustomLanguageSubmit} className="flex p-2">
                          <Input
                            value={customLanguage}
                            onChange={(e) => setCustomLanguage(e.target.value)}
                            placeholder="Enter custom language"
                            className="flex-grow"
                          />
                          <Button type="submit" size="sm" className="ml-2">
                            Add
                          </Button>
                        </form>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label htmlFor="subtopic-select" className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Subtopic
              </Label>
              <Popover open={openSubtopic} onOpenChange={setOpenSubtopic}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {subtopic || "Select subtopic..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search subtopic..." />
                    <CommandList>
                      <CommandEmpty>No subtopic found.</CommandEmpty>
                      {[...getSubtopics(language), ...(customSubtopics[language] || [])].map((topic) => (
                        <CommandItem key={topic} onSelect={() => handleSubtopicSelect(topic)}>
                          <Check className={cn("mr-2 h-4 w-4", subtopic === topic ? "opacity-100" : "opacity-0")} />
                          {topic}
                        </CommandItem>
                      ))}
                      <CommandGroup heading="Custom">
                        <form onSubmit={handleCustomSubtopicSubmit} className="flex p-2">
                          <Input
                            value={customSubtopic}
                            onChange={(e) => setCustomSubtopic(e.target.value)}
                            placeholder="Enter custom subtopic"
                            className="flex-grow"
                          />
                          <Button type="submit" size="sm" className="ml-2">
                            Add
                          </Button>
                        </form>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label htmlFor="difficulty-slider" className="text-sm font-medium flex justify-between items-center">
              <span>Difficulty</span>
              <motion.span
                className="text-xl font-bold text-primary tabular-nums"
                key={difficulty}
                initial={{ scale: 1.2, color: "#00ff00" }}
                animate={{ scale: 1, color: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                {getDifficultyLabel(difficulty)}
              </motion.span>
            </Label>
            <Slider
              id="difficulty-slider"
              min={0}
              max={100}
              step={1}
              value={[difficulty]}
              onValueChange={([value]) => setDifficulty(value)}
              className="w-full"
            />
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label htmlFor="questionCount" className="text-sm font-medium flex justify-between items-center">
              <span>Number of Questions</span>
              <motion.span
                className="text-xl font-bold text-primary tabular-nums"
                key={questionCount}
                initial={{ scale: 1.2, color: "#00ff00" }}
                animate={{ scale: 1, color: "var(--primary)" }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                {questionCount}
              </motion.span>
            </Label>

            <SubscriptionSlider
              value={questionCount}
              onValueChange={setQuestionCount}
              ariaLabel="Select number of questions"
            />
          </motion.div>

          <motion.div
            className="bg-primary/5 border border-primary/20 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="p-4 space-y-2">
              <h3 className="text-base font-semibold mb-2">Available Credits</h3>
              <Progress value={(credits / 10) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You have <span className="font-bold text-primary">{credits}</span> credits remaining.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="bg-muted cursor-pointer transition-colors hover:bg-muted/80 rounded-lg"
            onClick={() => setOpenInfo(!openInfo)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex flex-row items-center justify-between py-2 px-4">
              <h3 className="text-sm font-semibold">About Coding Quizzes</h3>
              <motion.div animate={{ rotate: openInfo ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronsUpDown className="h-4 w-4" />
              </motion.div>
            </div>
            <AnimatePresence>
              {openInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-sm px-4 pb-4 space-y-2">
                    <p>Coding quizzes are an excellent way to test and improve your programming skills. They offer:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Practical coding challenges</li>
                      <li>Language-specific questions</li>
                      <li>Varied difficulty levels</li>
                      <li>Immediate feedback on your answers</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Alert variant="destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="pt-4 border-t"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <PlanAwareButton
              label="Generate Quiz"
              onClick={generateQuiz}
              isLoggedIn={isLoggedIn}
              isEnabled={!isDisabled}
              hasCredits={credits > 0}
              loadingLabel="Generating..."
              className="w-full transition-all duration-300 hover:shadow-lg"
              customStates={{
                default: {
                  tooltip: "Click to generate your coding quiz",
                },
                loading: {
                  label: "Crafting Your Quiz...",
                  tooltip: "Our AI is working on your personalized coding challenge",
                },
                notLoggedIn: {
                  label: "Sign in to Create",
                  tooltip: "Join us to start your coding journey",
                },
                notEnabled: {
                  label: "Select Language & Subtopic",
                  tooltip: "Choose a programming language and subtopic to continue",
                },
                noCredits: {
                  label: "Upgrade to Continue",
                  tooltip: "Unlock unlimited quizzes with our premium plans",
                },
              }}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default CodeQuizForm

