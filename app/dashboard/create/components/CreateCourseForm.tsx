"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api-helper"
import { Pencil, FileText, Eye } from "lucide-react"

import { BasicInfoStep } from "./BasicInfoStep"
import { ContentStep } from "./ContentStep"
import { PreviewStep } from "./PreviewStep"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import PlanAwareButton from "@/components/quiz/PlanAwareButton"

import { type CreateCourseInput, createCourseSchema } from "@/schema/schema"

import type { QueryParams } from "@/app/types/types"
import { useEffect } from "react"
import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function CourseCreationForm({ maxQuestions, params }: { 
  maxQuestions: number 
  params: QueryParams 
}) {
  const [step, setStep] = React.useState(1)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const totalSteps = 3
  const { user, refreshUserData } = useAuth() as any
  const unifiedSub = useUnifiedSubscription()
  const { forceRefresh: forceSubRefresh } = unifiedSub
  const router = useRouter()
  const { toast } = useToast()
  
  const isSubscribed = unifiedSub.isSubscribed || false
  const availableCredits = unifiedSub.remainingCredits || user?.credits || 0

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: params.title || "",
      description: "",
      category: "",
      units: [""],
    },
  })

  useEffect(() => {
    if (params.title) {
      setValue("title", params.title)
    }
  }, [params.title, setValue])

  const createCourseMutation = useMutation({
    mutationFn: async (data: CreateCourseInput) => {
      console.log("Creating course with data:", data)
      const response = await api.post("/api/course", data)
      console.log("API response:", response)
      return response
    },
    onSuccess: async (data) => {
      console.log("Course creation success with data:", data)
      console.log("Data type:", typeof data)
      console.log("Data keys:", data ? Object.keys(data) : "data is null/undefined")
      toast({
        title: "Success",
        description: "Course created successfully",
      })
  try { await forceSubRefresh() } catch {/* ignore */}
  try { await refreshUserData?.() } catch {/* ignore */}

      // Extract slug from response
      const slug = data?.slug
      if (slug) {
        console.log("Redirecting to course:", slug)
        router.push(`/dashboard/create/${slug}`)
      } else {
        console.error("Course creation response missing slug:", data)
        toast({
          title: "Warning",
          description: "Course created but redirect failed. Please refresh the page.",
          variant: "destructive",
        })
        // Fallback: redirect to courses list
        router.push("/dashboard/explore")
      }
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
    setShowConfirmDialog(true)
  }

  const handleConfirmCreate = async () => {
    setShowConfirmDialog(false)
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
    isSubmitting ||
    createCourseMutation.status === "pending" ||
    showConfirmDialog

  const steps = [
    { icon: <Pencil className="h-5 w-5" />, label: "Basic Info" },
    { icon: <FileText className="h-5 w-5" />, label: "Content" },
    { icon: <Eye className="h-5 w-5" />, label: "Preview" },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-10 max-w-3xl">
        <Card className="rounded-xl shadow-lg overflow-hidden border-0">
          <CardHeader className="bg-[var(--color-primary)] text-[var(--color-text)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  Create a New Course
                </CardTitle>
                <p className="text-blue-100 mt-2">
                  Fill in the details for your new course. Progress is automatically saved.
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                <span className="text-sm">Available Credits:</span>
                <Badge variant="secondary" className="text-base px-3 py-1 bg-white text-blue-600">
                  {availableCredits}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-4 sm:p-6">
            {/* Step Indicators */}
            <div className="relative mb-6 md:mb-8">
              <div className="flex justify-between items-center relative z-10">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col items-center relative group",
                      i + 1 === step ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-all",
                        i + 1 === step 
                          ? "bg-primary/10 border-2 border-primary text-primary shadow-md" 
                          : "bg-muted text-muted-foreground border border-gray-200",
                        i + 1 <= step ? "ring-2 ring-offset-2 ring-blue-300" : ""
                      )}
                    >
                      {s.icon}
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{s.label}</span>
                    
                    {/* Step number badge */}
                    <span className={cn(
                      "absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      i + 1 === step 
                        ? "bg-primary text-white" 
                        : "bg-gray-200 text-gray-700"
                    )}>
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-6 sm:mt-8">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Step {step} of {totalSteps}</span>
                  <span>{Math.round(((step - 1) / (totalSteps - 1)) * 100)}% Complete</span>
                </div>
                <Progress 
                  value={((step - 1) / (totalSteps - 1)) * 100} 
                  className="h-3 transition-all duration-300 bg-gray-200" 
                  indicatorClassName="bg-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* Form Content */}
            <div className="mt-6 md:mt-8 space-y-8">
              {step === 1 && <BasicInfoStep control={control} errors={errors} params={params} />}
              {step === 2 && <ContentStep control={control} errors={errors} watch={watch} setValue={setValue} />}
              {step === 3 && <PreviewStep watch={watch} />}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="w-full sm:w-auto px-6 py-3 shadow-sm"
              >
                Back
              </Button>

              <div className="flex flex-col items-end gap-3">
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid() || maxQuestions === 0}
                    className="w-full sm:w-auto px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-[var(--color-text)] shadow-neo hover:shadow-neo-hover neo-hover-lift transition-all"
                  >
                    Continue to {steps[step].label} <span className="ml-2">→</span>
                  </Button>
                ) : (
                  <PlanAwareButton
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    label={isSubmitting || createCourseMutation.status === "pending" ? "Creating Course..." : "Create Course"}
                    isLoading={isSubmitting || createCourseMutation.status === "pending"}
                    isEnabled={step === 3 && !showConfirmDialog}
                    creditsRequired={1}
                    requiredPlan="FREE"
                    className="w-full sm:w-auto px-6 py-3 shadow-neo neo-hover-lift bg-[var(--color-success)] hover:bg-[var(--color-accent)] text-[var(--color-text)]"
                    loadingLabel="Creating Course..."
                    customStates={{
                      noCredits: {
                        label: "Need 1 Credit",
                        tooltip: "You need 1 credit to create a course"
                      }
                    }}
                  />
                )}

                {availableCredits > 0 && !isSubscribed && (
                  <p className="text-xs text-muted-foreground text-right max-w-xs">
                    This action will deduct <Badge variant="outline" className="mx-1">1 credit</Badge> from your account
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