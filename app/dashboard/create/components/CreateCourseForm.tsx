"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { motion } from "framer-motion"

import { StepIndicator } from "./StepIndicator"
import { BasicInfoStep } from "./BasicInfoStep"
import { ContentStep } from "./ContentStep"
import { PreviewStep } from "./PreviewStep"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Info, FileText, Eye } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { type CreateCourseInput, createCourseSchema } from "@/schema/schema"
import { SignInBanner } from "../../quiz/components/SignInBanner"
import { useTheme } from "next-themes"
import { useSubscription } from "@/hooks/useSubscription"
import { PlanAwareButton } from "@/app/components/PlanAwareButton"

interface CourseCreationFormProps {
  topic: string
  maxQuestions: number
}

export default function CourseCreationForm({ topic, maxQuestions }: CourseCreationFormProps) {
  const [step, setStep] = React.useState(1)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const totalSteps = 3

  const { subscriptionStatus, isLoading } = useSubscription()
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [availableCredits, setAvailableCredits] = React.useState(subscriptionStatus?.credits)
  const { theme } = useTheme()

  React.useEffect(() => {
    if (subscriptionStatus) {
      setAvailableCredits(subscriptionStatus.credits)
    }
  }, [subscriptionStatus])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: topic || "",
      description: "",
      category: "",
      units: [""],
    },
  })

  const createCourseMutation = useMutation({
    mutationFn: async (data: CreateCourseInput) => {
      const response = await axios.post("/api/course", data)
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Course created successfully",
      })
      setAvailableCredits((prev) => (prev ?? 0) - 1)
      router.push(`/dashboard/create/${data.slug}`)
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    },
  })

  const onSubmit: SubmitHandler<CreateCourseInput> = async (data) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a course.",
        variant: "destructive",
      })
      signIn()
      return
    }
    if (!subscriptionStatus?.isSubscribed && (availableCredits ?? 0) === 0) {
      toast({
        title: "Subscription or Credits Required",
        description: "Please subscribe or buy credits to create a course.",
        variant: "destructive",
      })
      router.push("dashboard/subscription")
      return
    }
    setShowConfirmDialog(true)
  }

  const handleConfirmCreate = async () => {
    setShowConfirmDialog(false)
    if (!subscriptionStatus?.isSubscribed && (availableCredits ?? 0) === 0) {
      toast({
        title: "No Credits Available",
        description: "You don't have enough credits to create a course. Please subscribe or buy more credits.",
        variant: "destructive",
      })
      router.push("dashboard/subscription")
      return
    }
    await createCourseMutation.mutateAsync(watch())
  }

  const handleNext = () => setStep(step + 1)
  const handleBack = () => setStep(step - 1)

  const isStepValid = () => {
    if (step === 1) {
      return !!watch("title") && !!watch("description") && !!watch("category")
    } else if (step === 2) {
      return watch("units").length > 0 && watch("units").every((unit) => !!unit)
    }
    return true
  }

  const isCreateDisabled =
    step !== 3 ||
    !session ||
    (!subscriptionStatus?.isSubscribed && (availableCredits ?? 0) === 0) ||
    isSubmitting ||
    createCourseMutation.status === "pending" ||
    showConfirmDialog

  const stepIcons = [
    <Info key="1" className="w-6 h-6" />,
    <FileText key="2" className="w-6 h-6" />,
    <Eye key="3" className="w-6 h-6" />,
  ]

  return (
    <div className="w-full bg-background">
      <div className="w-full">
        <div className="bg-background border border-border shadow-sm">
          <SignInBanner isAuthenticated={authStatus === "authenticated"} />
          <div className="text-center space-y-2 px-2 sm:px-4 py-4">
            <div className="flex justify-center mb-4">
              <motion.div
                className="p-3 bg-primary/10 rounded-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="h-8 w-8 text-primary" />
              </motion.div>
            </div>
            <h2 className="text-2xl font-semibold">Create a New Course</h2>
            <p className="text-muted-foreground">
              Fill in the details for your new course. Progress is automatically saved.
            </p>
          </div>

          <div className="px-2 sm:px-4 mb-6">
            <div className="hidden md:block">
              <StepIndicator currentStep={step} totalSteps={totalSteps} />
            </div>
            <div className="flex justify-between items-center md:hidden">
              {stepIcons.map((icon, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div
                        className={`flex flex-col items-center justify-center ${
                          step === index + 1 ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {icon}
                        <span className="text-xs mt-1">{`Step ${index + 1}`}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{index === 0 ? "Basic Info" : index === 1 ? "Content" : "Preview"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            <Progress value={(step / totalSteps) * 100} className="mt-4" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6 px-2 sm:px-4">
              {step === 1 && <BasicInfoStep control={control} errors={errors} />}
              {step === 2 && <ContentStep control={control} errors={errors} watch={watch} setValue={setValue} />}
              {step === 3 && <PreviewStep watch={watch} />}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 border-t px-2 sm:px-4 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="w-full md:w-auto"
              >
                Back
              </Button>

              <div className="flex flex-col items-center md:items-end space-y-4 w-full md:w-auto">
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid() || maxQuestions === 0}
                    className="w-full md:w-auto"
                  >
                    Continue
                  </Button>
                ) : (
                  <PlanAwareButton
                    type="submit"
                    isLoggedIn={!!session}
                    label={
                      isSubmitting || createCourseMutation.status === "pending" ? "Creating Course..." : "Create Course"
                    }
                    onClick={handleSubmit(onSubmit)}
                    disabled={isCreateDisabled || showConfirmDialog}
                    className="w-full md:w-auto disabled:opacity-50"
                  />
                )}

                {!subscriptionStatus?.isSubscribed && (availableCredits ?? 0) > 0 && (
                  <p className="text-sm text-muted-foreground text-center md:text-right">
                    Available credits: {availableCredits} <br className="md:hidden" />
                    (This action will deduct 1 credit)
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmCreate}
        formData={watch()}
        isSubmitting={isSubmitting || createCourseMutation.status === "pending"}
      />
    </div>
  )
}

