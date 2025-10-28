"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api-helper"
import { Pencil, FileText, Eye, Sparkles, Zap, CheckCircle2, ArrowRight, Star } from "lucide-react"

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
      toast({
        title: "Success!",
        description: "Course created successfully",
      })
      
      try { await forceSubRefresh() } catch {/* ignore */}
      try { await refreshUserData?.() } catch {/* ignore */}

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
    { icon: <Pencil className="h-4 w-4 md:h-5 md:w-5" />, label: "Basic Info", color: "bg-primary" },
    { icon: <FileText className="h-4 w-4 md:h-5 md:w-5" />, label: "Content", color: "bg-secondary" },
    { icon: <Eye className="h-4 w-4 md:h-5 md:w-5" />, label: "Preview", color: "bg-success" },
  ]

  return (
    <div className="w-full h-full">
      <Card className="h-full flex flex-col border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
        {/* Header with gradient accent */}
        <CardHeader className="bg-gradient-to-r from-primary to-secondary border-b-4 border-border flex-shrink-0 p-4 md:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 md:p-2 rounded-none bg-warning border-2 border-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
                  </div>
                  <CardTitle className="text-lg md:text-xl lg:text-2xl font-black text-black">
                    Create Your Course
                  </CardTitle>
                </div>
                <p className="text-xs md:text-sm text-black/80 font-bold">
                  Transform your knowledge into engaging content
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <Badge className="bg-warning text-foreground border-2 border-border font-black text-xs md:text-sm px-2 md:px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Star className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  {availableCredits} Credits
                </Badge>
              </div>
            </div>

            {/* Step Progress Indicator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 md:gap-2 transition-all duration-300",
                      i + 1 === step ? "scale-105" : "opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "w-full aspect-square max-w-[50px] md:max-w-[60px] rounded-xl flex items-center justify-center border-3 md:border-4 border-black transition-all duration-300",
                        i + 1 === step 
                          ? `${s.color} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]` 
                          : "bg-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                        i + 1 < step && "bg-success"
                      )}
                    >
                      {i + 1 < step ? (
                        <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-black" />
                      ) : (
                        s.icon
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] md:text-xs font-black text-center leading-tight",
                      i + 1 === step ? "text-black" : "text-black/60"
                    )}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-black/80">
                  <span>Step {step} of {totalSteps}</span>
                  <span>{Math.round(((step - 1) / (totalSteps - 1)) * 100)}% Complete</span>
                </div>
                <div className="relative h-3 md:h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden">
                  <Progress 
                    value={((step - 1) / (totalSteps - 1)) * 100} 
                    className="h-full bg-transparent"
                    indicatorClassName="bg-gradient-to-r from-success to-success border-r-2 border-border transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <Separator className="h-1 bg-black" />

        {/* Form Content - Scrollable */}
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-6 md:space-y-8">
            {step === 1 && <BasicInfoStep control={control} errors={errors} params={params} />}
            {step === 2 && <ContentStep control={control} errors={errors} watch={watch} setValue={setValue} />}
            {step === 3 && <PreviewStep watch={watch} />}
          </div>
        </CardContent>

        {/* Footer Navigation */}
        <div className="border-t-4 border-black bg-gradient-to-r from-gray-50 to-gray-100 p-3 md:p-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="order-2 sm:order-1 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-white hover:bg-gray-100 font-bold disabled:opacity-40 disabled:cursor-not-allowed text-sm md:text-base h-10 md:h-12"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back
            </Button>

            <div className="flex flex-col items-stretch sm:items-end gap-2 order-1 sm:order-2 flex-1 sm:flex-initial">
              {step < totalSteps ? (
                <>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid() || maxQuestions === 0}
                    className="w-full sm:w-auto border-3 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-foreground font-black disabled:opacity-40 disabled:cursor-not-allowed text-sm md:text-base h-10 md:h-12 px-6 md:px-8"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-[10px] md:text-xs text-gray-600 text-center sm:text-right font-bold">
                    Next: {steps[step].label}
                  </p>
                </>
              ) : (
                <>
                  <PlanAwareButton
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    label={isSubmitting || createCourseMutation.status === "pending" ? "Creating..." : "Create Course"}
                    isLoading={isSubmitting || createCourseMutation.status === "pending"}
                    isEnabled={step === 3 && !showConfirmDialog}
                    creditsRequired={1}
                    requiredPlan="FREE"
                    className="w-full sm:w-auto border-3 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] bg-gradient-to-r from-success to-success hover:from-success hover:to-success text-foreground font-black text-sm md:text-base h-10 md:h-12 px-6 md:px-8"
                    loadingLabel="Creating Course..."
                    customStates={{
                      noCredits: {
                        label: "Need 1 Credit",
                        tooltip: "You need 1 credit to create a course"
                      }
                    }}
                  />
                  {availableCredits > 0 && !isSubscribed && (
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[10px] md:text-xs font-bold">
                      <div className="px-2 py-1 bg-warning border-2 border-border rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Zap className="h-3 w-3 md:h-4 md:w-4 inline mr-1" />
                        1 credit will be used
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

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