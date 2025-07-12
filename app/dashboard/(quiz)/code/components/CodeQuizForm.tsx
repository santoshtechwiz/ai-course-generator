"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { HelpCircle, Timer, Sparkles, Check, AlertCircle, Star, Globe, Smartphone, Cpu, Database, Zap, Terminal, Code, Hash, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { usePersistentState } from "@/hooks/usePersistentState"
import { cn } from "@/lib/tailwindUtils"
import { codeQuizSchema } from "@/schema/schema"
import { GlobalLoader } from '@/components/ui/loader'

import type { z } from "zod"
import type { QueryParams } from "@/app/types/types"
import { SubscriptionSlider } from "@/app/dashboard/subscription/components/SubscriptionSlider"
import { ConfirmDialog } from "../../components/ConfirmDialog"
import PlanAwareButton from "../../components/PlanAwareButton"
import useSubscription from "@/hooks/use-subscription"

type CodeQuizFormData = z.infer<typeof codeQuizSchema> & {
  userType?: string
}

interface CodeQuizFormProps {
  credits: number
  isLoggedIn: boolean
  maxQuestions: number
  params?: QueryParams
}

const PROGRAMMING_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "C++",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "PHP",
  "Ruby",
  "HTML/CSS",
  "SQL",
  "Bash/Shell",
  "PowerShell",
  "R",
  "Scala",
  "Dart",
  "Lua",
  "Perl",
  "Haskell",
  "Clojure",
  "F#",
  "VB.NET",
  "Objective-C",
  "Assembly",
  "MATLAB",
  "Groovy",
  "Elixir",
  "Erlang",
  "Crystal",
  "Nim",
  "Zig",
  "Other/Custom",
]

// Group languages by popularity/category for better UX
const LANGUAGE_GROUPS = {
  Popular: ["JavaScript", "Python", "Java", "TypeScript"],
  Web: ["JavaScript", "TypeScript", "HTML/CSS", "PHP", "Go"],
  Mobile: ["Swift", "Kotlin", "Java", "Dart", "Objective-C"],
  Systems: ["C++", "Rust", "Go", "C#", "Assembly"],
  Data: ["Python", "R", "SQL", "MATLAB", "Scala"],
  Functional: ["Haskell", "Clojure", "F#", "Elixir", "Erlang"],
  Scripts: ["Bash/Shell", "PowerShell", "Perl", "Lua"],
  Other: ["Ruby", "Crystal", "Nim", "Zig", "Groovy"],
}

// Define icons and colors for each language group
const LANGUAGE_GROUP_CONFIG = {
  Popular: { 
    icon: Star, 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200", 
    activeColor: "bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600" 
  },
  Web: { 
    icon: Globe, 
    color: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200", 
    activeColor: "bg-blue-500 text-white border-blue-600 hover:bg-blue-600" 
  },
  Mobile: { 
    icon: Smartphone, 
    color: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200", 
    activeColor: "bg-green-500 text-white border-green-600 hover:bg-green-600" 
  },
  Systems: { 
    icon: Cpu, 
    color: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200", 
    activeColor: "bg-red-500 text-white border-red-600 hover:bg-red-600" 
  },
  Data: { 
    icon: Database, 
    color: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200", 
    activeColor: "bg-purple-500 text-white border-purple-600 hover:bg-purple-600" 
  },
  Functional: { 
    icon: Zap, 
    color: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200", 
    activeColor: "bg-orange-500 text-white border-orange-600 hover:bg-orange-600" 
  },
  Scripts: { 
    icon: Terminal, 
    color: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200", 
    activeColor: "bg-gray-500 text-white border-gray-600 hover:bg-gray-600" 
  },
  Other: { 
    icon: Code, 
    color: "bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200", 
    activeColor: "bg-pink-500 text-white border-pink-600 hover:bg-pink-600" 
  },
}

// Define proper type for subscription data
interface Subscription {
  subscriptionPlan?: string
}

// Function to get popular topics for each language
const getPopularTopics = (language: string): string[] => {
  const topicMap: Record<string, string[]> = {
    JavaScript: ["Async/Await", "Promises", "Closures", "ES6 Features", "DOM Manipulation", "Event Handling"],
    TypeScript: ["Types", "Interfaces", "Generics", "Decorators", "Modules", "Type Guards"],
    Python: ["Data Structures", "List Comprehensions", "OOP", "Pandas", "NumPy", "Machine Learning"],
    Java: ["OOP Concepts", "Collections", "Streams", "Exception Handling", "Multithreading", "Design Patterns"],
    "C#": ["LINQ", "Async/Await", "Properties", "Delegates", "Events", "Generics"],
    "C++": ["Pointers", "Memory Management", "STL", "Templates", "OOP", "Smart Pointers"],
    Go: ["Goroutines", "Channels", "Interfaces", "Error Handling", "Packages", "Concurrency"],
    Rust: ["Ownership", "Borrowing", "Lifetimes", "Pattern Matching", "Traits", "Error Handling"],
    Swift: ["Optionals", "Closures", "Properties", "Protocols", "Memory Management", "Concurrency"],
    Kotlin: ["Coroutines", "Extension Functions", "Data Classes", "Null Safety", "Higher-Order Functions"],
    PHP: ["Arrays", "Classes", "Namespaces", "Traits", "Error Handling", "Database Connections"],
    Ruby: ["Blocks", "Modules", "Metaprogramming", "Classes", "Gems", "Exception Handling"],
    SQL: ["Joins", "Subqueries", "Indexes", "Stored Procedures", "Triggers", "Window Functions"],
    "HTML/CSS": ["Flexbox", "Grid", "Responsive Design", "Animations", "Semantic HTML", "CSS Variables"],
  }
  
  return topicMap[language] || ["Basic Concepts", "Syntax", "Functions", "Data Types", "Control Flow", "Best Practices"]
}

export default function CodeQuizForm({ isLoggedIn, maxQuestions, credits, params }: CodeQuizFormProps) {
  const router = useRouter()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const { data: session, status } = useSession()

  // Type the status
  const { data: subscriptionData } = useSubscription() as {
    data?: Subscription
    status?: string
  }

  const [selectedLanguageGroup, setSelectedLanguageGroup] = React.useState<string>("Popular")
  const [showCustomLanguage, setShowCustomLanguage] = React.useState(false)
  const [customLanguage, setCustomLanguage] = React.useState("")
  const [showCustomTitle, setShowCustomTitle] = React.useState(false)
  const [formData, setFormData] = usePersistentState<CodeQuizFormData>("codeQuizFormData", {
    title: (typeof params?.title === 'string' ? params.title : "") || "",
    amount: (typeof params?.amount === 'string' ? Number.parseInt(params.amount, 10) : maxQuestions) || maxQuestions,
    difficulty: (typeof params?.difficulty === 'string' && ["easy", "medium", "hard"].includes(params.difficulty) ? params.difficulty : "easy") as
      | "easy"
      | "medium"
      | "hard",
    language: (typeof params?.language === 'string' ? params.language : "JavaScript") || "JavaScript",
  })

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CodeQuizFormData>({
    resolver: zodResolver(codeQuizSchema),
    defaultValues: formData,
    mode: "onChange",
  })
  React.useEffect(() => {
    if (typeof params?.title === 'string') {
      setValue("title", params.title)
    }
    if (typeof params?.amount === 'string') {
      const amount = Number.parseInt(params.amount, 10)
      if (amount !== maxQuestions) {
        setValue("amount", Math.min(amount, maxQuestions))
      }
    }
    if (typeof params?.difficulty === 'string' && ["easy", "medium", "hard"].includes(params.difficulty)) {
      setValue("difficulty", params.difficulty as "easy" | "medium" | "hard")
    }
    if (typeof params?.language === 'string' && PROGRAMMING_LANGUAGES.includes(params.language)) {
      setValue("language", params.language)
    }
  }, [params?.title, params?.amount, params?.difficulty, params?.language, maxQuestions, setValue])

  React.useEffect(() => {
    const subscription = watch((value) => setFormData(value as CodeQuizFormData))
    return () => subscription.unsubscribe()
  }, [watch, setFormData])

  const { mutateAsync: createCodeQuizMutation } = useMutation({
    mutationFn: async (data: CodeQuizFormData) => {
      data.userType = subscriptionData?.subscriptionPlan
      const response = await axios.post("/api/code-quiz", data)
      return response.data
    },
    onError: (error: any) => {
      console.error("Error creating code quiz:", error)
      setSubmitError(error?.response?.data?.message || "Failed to create code quiz. Please try again.")
    },
  })
  const onSubmit = React.useCallback(
    (data: CodeQuizFormData) => {
      if (isLoading) return

      if (!data.title || !data.amount || !data.difficulty || !data.language) {
        setSubmitError("Please fill in all required fields")
        return
      }

      if (!isLoggedIn) {
        signIn("credentials", { callbackUrl: "/dashboard/code" })
        return
      }

      setSubmitError(null)
      setIsConfirmDialogOpen(true)
    },
    [isLoading, isLoggedIn],
  )
  const handleConfirm = React.useCallback(async () => {
    setIsLoading(true)
    
    try {
      const formValues = watch()
      const response = await createCodeQuizMutation({
        title: formValues.title,
        amount: formValues.amount,
        difficulty: formValues.difficulty,
        language: formValues.language,
        userType: subscriptionData?.subscriptionPlan,
      })
      const userQuizId = response?.userQuizId

      if (!userQuizId) throw new Error("Code Quiz ID not found")

      router.push(`/dashboard/code/${response?.slug}`)
    } catch (error) {
      // Error is handled in the mutation's onError callback
    } finally {
      setIsLoading(false)
    }
  }, [createCodeQuizMutation, watch, router, subscriptionData?.subscriptionPlan])

  const amount = watch("amount")
  const difficulty = watch("difficulty")
  const title = watch("title")
  const language = watch("language")

  const isFormValid = React.useMemo(() => {
    return !!title && !!amount && !!difficulty && !!language && isValid
  }, [title, amount, difficulty, language, isValid])

  const isDisabled = React.useMemo(() => credits < 1 || !isFormValid || isLoading, [credits, isFormValid, isLoading])

  // Memoize the difficulty options to prevent unnecessary re-renders
  const difficultyOptions = React.useMemo(() => {
    return [
      { value: "easy", label: "Easy", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-800 border-amber-200" },
      { value: "hard", label: "Hard", color: "bg-rose-100 text-rose-800 border-rose-200" },
    ]
  }, [])

  // Filter languages based on selected group
  const filteredLanguages = React.useMemo(() => {
    if (selectedLanguageGroup === "All") {
      return PROGRAMMING_LANGUAGES
    }
    return LANGUAGE_GROUPS[selectedLanguageGroup as keyof typeof LANGUAGE_GROUPS] || PROGRAMMING_LANGUAGES
  }, [selectedLanguageGroup])

  // Fix credit percentage calculation to be type-safe and display actual credits
  const creditPercentage = React.useMemo(() => {
    if (typeof credits !== "number" || isNaN(credits) || credits <= 0) {
      return 0
    }
    // Use max value as 100 to create better visual scale for progress bar
    const maxCreditDisplay = 100
    return Math.min((credits / maxCreditDisplay) * 100, 100)
  }, [credits])

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <GlobalLoader message="Creating your code quiz..." />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto space-y-6 lg:space-y-8"
    >
      <Card className="bg-background border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="space-y-8 lg:space-y-10 p-6 lg:p-8">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 lg:space-y-10">
            {/* Programming Language Selection - First */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="language" className="text-base font-medium text-foreground flex items-center gap-2">
                Programming Language *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Select the programming language for your quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>              <div className="space-y-3">
                <div className="mb-3">
                  <Label className="text-sm text-muted-foreground mb-2 block">Choose a category:</Label>
                </div>
                <div className="flex flex-wrap gap-2 lg:gap-3 mb-4 lg:mb-5">
                  {Object.keys(LANGUAGE_GROUPS).map((group) => {
                    const config = LANGUAGE_GROUP_CONFIG[group as keyof typeof LANGUAGE_GROUP_CONFIG]
                    const IconComponent = config.icon
                    const isSelected = selectedLanguageGroup === group
                    
                    return (
                      <motion.div
                        key={group}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-lg text-sm lg:text-base px-3 py-2 lg:px-4 lg:py-2.5 border-2",
                            "flex items-center gap-1.5 font-medium",
                            isSelected ? config.activeColor : config.color
                          )}
                          onClick={() => setSelectedLanguageGroup(group)}
                        >
                          <IconComponent className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
                          {group}
                        </Badge>
                      </motion.div>
                    )
                  })}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg text-sm lg:text-base px-3 py-2 lg:px-4 lg:py-2.5 border-2",
                        "flex items-center gap-1.5 font-medium",
                        selectedLanguageGroup === "All" 
                          ? "bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600" 
                          : "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200"
                      )}
                      onClick={() => setSelectedLanguageGroup("All")}
                    >
                      <Code className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
                      All Languages
                    </Badge>
                  </motion.div>
                </div>

                {!showCustomLanguage ? (
                  <div className="space-y-3">
                    <Controller
                      name="language"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(value) => {
                          if (value === "Other/Custom") {
                            setShowCustomLanguage(true)
                            field.onChange("")
                          } else {
                            field.onChange(value)
                          }
                        }}>
                          <SelectTrigger
                            className={cn(
                              "w-full p-3 lg:p-4 h-12 lg:h-14 text-base lg:text-lg border border-input rounded-lg transition-all",
                              "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
                            )}
                          >
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredLanguages.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomLanguage(true)}
                      className="text-sm border-dashed border-2 hover:border-solid transition-all duration-200 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Enter custom language
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter custom programming language"
                        value={customLanguage}
                        onChange={(e) => {
                          setCustomLanguage(e.target.value)
                          setValue("language", e.target.value)
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomLanguage(false)
                          setValue("language", "JavaScript")
                          setCustomLanguage("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {errors.language && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                  role="alert"
                >
                  {errors.language.message}
                </motion.p>
              )}
            </motion.div>

            {/* Topic/Title Selection - Second */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="title" className="text-base font-medium text-foreground flex items-center gap-2">
                Topic/Title *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Enter any programming topic you'd like to be quizzed on</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
                {!showCustomTitle && (
                <div className="mb-3">
                  <Label className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Hash className="w-3.5 h-3.5" />
                    Popular topics for {language || 'JavaScript'}:
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getPopularTopics(language || 'JavaScript').map((topic, index) => (
                      <Badge
                        key={topic}
                        variant="outline"
                        className={cn(
                          "cursor-pointer transition-all duration-200 text-xs lg:text-sm px-2.5 py-1 lg:px-3 lg:py-1.5",
                          "hover:scale-105 hover:shadow-md border-2",
                          // Add different colors based on index for visual variety
                          index % 6 === 0 && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-500 hover:text-white",
                          index % 6 === 1 && "bg-green-50 text-green-700 border-green-200 hover:bg-green-500 hover:text-white",
                          index % 6 === 2 && "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-500 hover:text-white",
                          index % 6 === 3 && "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-500 hover:text-white",
                          index % 6 === 4 && "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-500 hover:text-white",
                          index % 6 === 5 && "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-500 hover:text-white"
                        )}
                        onClick={() => setValue("title", topic)}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="relative">
                <Input
                  id="title"
                  placeholder="Enter the programming topic (e.g., React Hooks, Data Structures, Async/Await)"
                  className={cn(
                    "w-full p-3 lg:p-4 h-12 lg:h-14 text-base lg:text-lg border border-input rounded-lg transition-all pr-12",
                    "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
                    errors.title ? "border-red-300 focus-visible:ring-red-300" : "",
                  )}
                  {...register("title")}
                  aria-describedby="title-description"
                  aria-invalid={errors.title ? "true" : "false"}
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {errors.title && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                  id="title-error"
                  role="alert"
                >
                  {errors.title.message}
                </motion.p>
              )}
              <p className="text-sm text-muted-foreground" id="title-description">
                Examples: React Hooks, Data Structures, Async/Await, OOP Concepts, etc.
              </p>
            </motion.div>            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Number of Questions
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Select how many code questions you want in your quiz</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="space-y-4 lg:space-y-5 px-2 lg:px-4">
                <div className="flex items-center justify-between px-2 lg:px-4">
                  <Timer className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground" />
                  <motion.span
                    className="text-2xl lg:text-3xl font-bold text-primary tabular-nums"
                    key={amount}
                    initial={{ scale: 1.2, color: "#00ff00" }}
                    animate={{ scale: 1, color: "var(--primary)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                  >
                    {amount}
                  </motion.span>
                </div>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <SubscriptionSlider
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      ariaLabel="Select number of questions"
                    />
                  )}
                />
                <p className="text-sm text-muted-foreground text-center">
                  Select between 1 and {maxQuestions} questions
                </p>
              </div>
              {errors.amount && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive mt-1"
                  role="alert"
                >
                  {errors.amount.message}
                </motion.p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {isLoggedIn
                  ? "Unlimited quizzes available"
                  : `This quiz will use ${amount} credit${amount > 1 ? "s" : ""}`}
              </p>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                Difficulty *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="w-[200px]">Choose how challenging the code questions should be</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                {difficultyOptions.map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    variant={difficulty === level.value ? "default" : "outline"}
                    className={cn(
                      "capitalize w-full h-12 lg:h-14 font-medium transition-all duration-200 text-base lg:text-lg",
                      difficulty === level.value ? "border-primary shadow-sm" : "hover:border-primary/50",
                      "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    )}
                    onClick={() => setValue("difficulty", level.value as "easy" | "medium" | "hard")}
                    aria-pressed={difficulty === level.value}
                  >
                    {level.label}
                    {difficulty === level.value && <Check className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />}
                  </Button>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 lg:p-6 space-y-3 lg:space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-base lg:text-lg font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                Available Credits
              </h3>
              <Progress value={creditPercentage} className="h-2 lg:h-3" />
              <p className="text-xs lg:text-sm text-muted-foreground">
                You have <span className="font-bold text-primary">{credits}</span> credit{credits !== 1 ? "s" : ""}{" "}
                remaining.
              </p>
            </motion.div>

            <AnimatePresence>
              {errors.root && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errors.root.message}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              className="pt-6 lg:pt-8 border-t border-border/60"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <PlanAwareButton
                label="Generate Code Quiz"
                onClick={handleSubmit(onSubmit)}
                isLoggedIn={isLoggedIn}
                isEnabled={!isDisabled}
                isLoading={isLoading}
                hasCredits={credits > 0}
                loadingLabel="Generating Code Quiz..."
                className="w-full h-12 lg:h-14 text-base lg:text-lg font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary focus:ring-offset-2"
                customStates={{
                  default: {
                    tooltip: "Click to generate your code quiz",
                  },
                  notEnabled: {
                    label: "Complete form to generate",
                    tooltip: "Please complete the form before generating the quiz",
                  },
                  noCredits: {
                    label: "Out of credits",
                    tooltip: "You need credits to generate a quiz. Consider upgrading your plan.",
                  },
                }}
              />
            </motion.div>
          </form>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirm}
        onCancel={() => {
          setIsConfirmDialogOpen(false)
          setIsLoading(false)
        }}
        title="Generate Code Quiz"
        description="You are about to use AI to generate a code quiz. This will use credits from your account."
        confirmText="Generate Now"
        cancelText="Cancel"
        showTokenUsage={true}
        status={isLoading ? "loading" : submitError ? "error" : undefined}
        errorMessage={submitError ?? undefined}
        tokenUsage={{
          used: Math.max(0, maxQuestions - credits),
          available: maxQuestions,
          remaining: credits,
          percentage: (Math.max(0, maxQuestions - credits) / maxQuestions) * 100,
        }}
        quizInfo={{
          type: "Code Quiz",
          topic: watch("title"),
          count: watch("amount"),
          difficulty: watch("difficulty"),
          estimatedTokens: Math.min(watch("amount") || 1, 5) * 150, // Code quizzes use more tokens
        }}
      >
        <div className="py-2">
          <p className="text-sm">
            Generating {watch("amount")} code questions at{" "}
            <span className="font-medium capitalize">{watch("difficulty")}</span> difficulty level for{" "}
            <span className="font-medium">{watch("language")}</span> programming on topic:{" "}
            <span className="font-medium">{watch("title")}</span>
          </p>
        </div>
      </ConfirmDialog>
    </motion.div>
  )
}
