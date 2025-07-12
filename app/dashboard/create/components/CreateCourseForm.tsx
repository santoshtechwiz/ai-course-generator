"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { Pencil, FileText, Eye } from "lucide-react"

import { BasicInfoStep } from "./BasicInfoStep"
import { ContentStep } from "./ContentStep"
import { PreviewStep } from "./PreviewStep"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/tailwindUtils"
import PlanAwareButton from "@/app/dashboard/(quiz)/components/PlanAwareButton"

import { type CreateCourseInput, createCourseSchema } from "@/schema/schema"

import type { QueryParams } from "@/app/types/types"
import { useEffect } from "react"
// ✅ UNIFIED: Use unified auth system
import { useAuth, useSubscription } from "@/modules/auth"


interface CourseCreationFormProps {
  maxQuestions: number
  params: QueryParams
}

export default function CourseCreationForm({ maxQuestions, params }: CourseCreationFormProps) {  const [step, setStep] = React.useState(1)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const totalSteps = 3  // ✅ UNIFIED: Using unified auth system
  const { subscription, isAuthenticated, user, refreshSubscription } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Extract subscription status
  const isSubscribed = subscription?.isActive || false
  
  // Get available credits from user object
  const availableCredits = React.useMemo(() => {
    return user?.credits || 0
  }, [user?.credits])

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
      const response = await axios.post("/api/course", data)
      return response.data
    },    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Course created successfully",
      })
      refreshSubscription() // Refresh subscription data to get updated credits
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
    // PlanAwareButton handles authentication and credit checking, 
    // so we just need to handle the confirmation dialog
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

  // This is only used for regular buttons, not the PlanAwareButton which handles these checks internally
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-10 max-w-3xl">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden">
          <div className="bg-muted/40 px-4 py-6 sm:px-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-foreground">
              Create a New Course
            </h1>
            <p className="text-center text-sm sm:text-base text-muted-foreground mt-2">
              Fill in the details for your new course. Progress is automatically saved.
            </p>
          </div>

          <Separator />

          <div className="p-4 sm:p-6">
            {/* Step Indicators */}
            <div className="relative mb-6 md:mb-8">
              <div className="flex justify-between items-center relative z-10">
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
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-colors",
                        i + 1 === step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.icon}
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-6 sm:mt-8">
                <Progress value={((step - 1) / (totalSteps - 1)) * 100} className="h-2 transition-all duration-300" />
              </div>
            </div>

            {/* Form Content */}
            <div className="mt-6 md:mt-8 space-y-6">
              {step === 1 && <BasicInfoStep control={control} errors={errors} params={params} />}
              {step === 2 && <ContentStep control={control} errors={errors} watch={watch} setValue={setValue} />}
              {step === 3 && <PreviewStep watch={watch} />}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between mt-8 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="w-full sm:w-auto"
              >
                Back
              </Button>

              <div className="space-y-2 w-full sm:w-auto">                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid() || maxQuestions === 0}
                    className="w-full sm:w-auto"
                  >
                    Continue
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
                    className="w-full sm:w-auto"
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
                  <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right">
                    Available credits: {availableCredits} (This action will deduct 1 credit)
                  </p>
                )}
              </div>
            </div>
          </div>
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
