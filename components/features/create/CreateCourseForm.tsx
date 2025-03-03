"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { Pencil, FileText, Eye } from "lucide-react"

import { BasicInfoStep } from "./BasicInfoStep"
import { ContentStep } from "./ContentStep"
import { PreviewStep } from "./PreviewStep"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { type CreateCourseInput, createCourseSchema } from "@/schema/schema"

import useSubscriptionStore from "@/store/useSubscriptionStore"

import type { QueryParams } from "@/app/types/types"
import { useEffect } from "react"
import { SignInBanner } from "@/components/features/quiz/SignInBanner"

interface CourseCreationFormProps {
  maxQuestions: number
  params: QueryParams
}

export default function CourseCreationForm({ maxQuestions, params }: CourseCreationFormProps) {
  const [step, setStep] = React.useState(1)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const totalSteps = 3

  const { subscriptionStatus } = useSubscriptionStore()
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [availableCredits, setAvailableCredits] = React.useState(subscriptionStatus?.credits)

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
      title: params.topic || "",
      description: "",
      category: "",
      units: [""],
    },
  })

  useEffect(() => {
    if (params.topic) {
      setValue("title", params.topic)
    }
  }, [params.topic, setValue])

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

  const steps = [
    { icon: <Pencil className="w-6 h-6" />, label: "Basic Info" },
    { icon: <FileText className="w-6 h-6" />, label: "Content" },
    { icon: <Eye className="w-6 h-6" />, label: "Preview" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SignInBanner isAuthenticated={authStatus === "authenticated"} />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-background border border-border shadow-sm">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-2xl md:text-3xl font-bold text-center text-primary">
              Create a New Course
            </CardTitle>
            <p className="text-center text-base md:text-lg text-muted-foreground mt-2">
              Fill in the details for your new course. Progress is automatically saved.
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Step Indicators */}
            <div className="relative mb-8">
              <div className="flex justify-between items-center relative z-10 px-8">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col items-center",
                      i + 1 === step ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                        i + 1 === step ? "bg-primary/10" : "bg-muted",
                      )}
                    >
                      {s.icon}
                    </div>
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-8 px-8">
                <Progress value={((step - 1) / (totalSteps - 1)) * 100} className="h-2 transition-all duration-300" />
              </div>
            </div>

            {/* Form Content */}
            <div className="mt-8">
              {step === 1 && <BasicInfoStep control={control} errors={errors} params={params} />}
              {step === 2 && <ContentStep control={control} errors={errors} watch={watch} setValue={setValue} />}
              {step === 3 && <PreviewStep watch={watch} />}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1}>
                Back
              </Button>

              <div className="space-y-2">
                {step < totalSteps ? (
                  <Button type="button" onClick={handleNext} disabled={!isStepValid() || maxQuestions === 0}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" disabled={isCreateDisabled} onClick={handleSubmit(onSubmit)}>
                    {isSubmitting || createCourseMutation.status === "pending" ? "Creating Course..." : "Create Course"}
                  </Button>
                )}

                {!subscriptionStatus?.isSubscribed && (availableCredits ?? 0) > 0 && (
                  <p className="text-sm text-muted-foreground text-right">
                    Available credits: {availableCredits} (This action will deduct 1 credit)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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

