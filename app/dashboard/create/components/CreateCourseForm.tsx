"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { api } from "@/lib/api-helper"
import { Pencil, FileText, Eye, CheckCircle } from "lucide-react"

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
      const response = await api.post("/api/course", data)
      return response
    },
    onSuccess: async (data) => {
      toast({
        title: "Success",
        description: "Course created successfully",
      })
      try { await forceSubRefresh() } catch {/* ignore */}
      try { await refreshUserData?.() } catch {/* ignore */}

      const slug = data?.slug
      if (slug) {
        router.push(`/dashboard/create/${slug}`)
      } else {
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

  const steps = [
    { icon: <Pencil className="h-5 w-5" />, label: "Basic Info" },
    { icon: <FileText className="h-5 w-5" />, label: "Content" },
    { icon: <Eye className="h-5 w-5" />, label: "Preview" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8 lg:py-10 max-w-4xl">
        <Card className="border-6 border-border shadow-neo bg-card">
          {/* Header with credits */}
          <CardHeader className="bg-primary border-b-6 border-border p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl sm:text-2xl font-black text-background">
                    Create a New Course
                  </CardTitle>
                  <p className="text-sm text-background/80 font-medium">
                    Fill in the details for your new course. Progress is automatically saved.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-4 py-2.5 rounded-none border-3 border-background/40 self-start sm:self-center">
                  <span className="text-sm font-bold text-background">Credits:</span>
                  <Badge variant="secondary" className="text-base font-black px-3 py-1 bg-background text-primary border-0 rounded-none">
                    {availableCredits}
                  </Badge>
                </div>
              </div>

              {/* Step indicators - improved mobile layout */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t-3 border-background/20">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col items-center gap-2 flex-1",
                      i + 1 === step ? "opacity-100" : "opacity-50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-none flex items-center justify-center border-3 transition-all font-black",
                        i + 1 === step 
                          ? "bg-background text-primary border-background scale-110" 
                          : "bg-transparent text-background border-background/40",
                      )}
                    >
                      {i + 1 <= step ? (
                        i + 1 === step ? s.icon : <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm sm:text-base">{i + 1}</span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-background hidden sm:block">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm text-background/90 font-bold">
                  <span>Step {step} of {totalSteps}</span>
                  <span>{Math.round(((step - 1) / (totalSteps - 1)) * 100)}%</span>
                </div>
                <Progress 
                  value={((step - 1) / (totalSteps - 1)) * 100} 
                  className="h-3 bg-background/20 rounded-none border-2 border-background/40" 
                  indicatorClassName="bg-background rounded-none"
                />
              </div>
            </div>
          </CardHeader>

          <Separator className="h-2 bg-border" />

          {/* Form Content */}
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="min-h-[400px]">
              {step === 1 && <BasicInfoStep control={control} errors={errors} params={params} />}
              {step === 2 && <ContentStep control={control} errors={errors} watch={watch} setValue={setValue} />}
              {step === 3 && <PreviewStep watch={watch} />}
            </div>

            {/* Navigation Buttons - improved mobile layout */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t-3 border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="w-full sm:w-auto border-3 border-border font-black rounded-none shadow-neo hover:shadow-neo-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1 sm:flex-initial">
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid() || maxQuestions === 0}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-background font-black border-3 border-border rounded-none shadow-neo hover:shadow-neo-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    Continue →
                  </Button>
                ) : (
                  <PlanAwareButton
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    label={isSubmitting || createCourseMutation.status === "pending" ? "Creating..." : "Create Course"}
                    isLoading={isSubmitting || createCourseMutation.status === "pending"}
                    isEnabled={step === 3 && !showConfirmDialog}
                    creditsRequired={1}
                    requiredPlan="FREE"
                    className="w-full sm:w-auto bg-success hover:bg-success/90 text-background font-black border-3 border-border rounded-none shadow-neo hover:shadow-neo-hover hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    loadingLabel="Creating..."
                    customStates={{
                      noCredits: {
                        label: "Need 1 Credit",
                        tooltip: "You need 1 credit to create a course"
                      }
                    }}
                  />
                )}

                {availableCredits > 0 && !isSubscribed && step === 3 && (
                  <p className="text-xs text-muted-foreground font-medium">
                    Uses <Badge variant="outline" className="mx-1 font-black border-2 rounded-none">1 credit</Badge>
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