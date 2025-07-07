"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks"
import { useMutation } from "@tanstack/react-query"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn, useSession } from "next-auth/react"
import { Pencil, FileText, Eye } from "lucide-react"


import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/tailwindUtils"

import { type CreateCourseInput, createCourseSchema } from "@/schema/schema"

import type { QueryParams } from "@/app/types/types"
import { useEffect } from "react"
import useSubscription from "@/hooks/use-subscription"
import { courseApiClient } from "../../services/unified-course-service"
import { BasicInfoStep } from "./BasicInfoStep"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { ContentStep } from "./ContentStep"
import { PreviewStep } from "./PreviewStep"


interface CourseCreationFormProps {
  maxQuestions: number
  params: QueryParams
}

export default function CourseCreationForm({ maxQuestions, params }: CourseCreationFormProps) {
  const [step, setStep] = React.useState(1)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const totalSteps = 3

  const { data: subscriptionStatus } = useSubscription()
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
      const response = await courseApiClient.createCourse(data)
      return response.data
    },    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Course created successfully",
      })
      console.log("Course creation response:", data) // Debug log
      
      if (data?.slug) {
        // Ensure we have a valid slug before redirecting
        console.log(`Redirecting to course: ${data.slug}`)
        router.push(`/dashboard/course/create/${data.slug}`)
      } else {
        console.error("Missing slug in course creation response:", data)
        router.push("/dashboard/course")
      }
    },
    onError: (error) => {
      console.error("Error creating course:", error)
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit: SubmitHandler<CreateCourseInput> = async (data) => {
    if (!session?.user) {
      setShowConfirmDialog(true)
      return
    }
    await createCourseMutation.mutate(data)
  }

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleLogin = async () => {
    await signIn("github")
  }

  const calculateProgressWidth = () => {
    return ((step - 1) / (totalSteps - 1)) * 100
  }

  const watchedFields = watch()

  const shouldDisableNext = () => {
    if (step === 1) {
      return !watchedFields.title || !watchedFields.description || !watchedFields.category
    } else if (step === 2) {
      const units = watchedFields.units
      return !units || !units.length || units.some((unit) => !unit)
    }
    return false
  }

  const renderStepIndicator = () => {
    const items = [
      { label: "Basic Info", icon: <Pencil className="h-4 w-4" /> },
      { label: "Content", icon: <FileText className="h-4 w-4" /> },
      { label: "Preview", icon: <Eye className="h-4 w-4" /> },
    ]

    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          {items.map((item, index) => {
            const isCurrent = step === index + 1
            const isPast = step > index + 1

            return (
              <div
                key={`step-${index}`}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all relative cursor-pointer",
                  {
                    "text-primary font-medium": isCurrent,
                    "text-muted-foreground": !isCurrent && !isPast,
                    "text-primary/60": isPast,
                  },
                )}
                onClick={() => setStep(index + 1)}
              >
                <div
                  className={cn("rounded-full p-2", {
                    "bg-primary text-white": isCurrent,
                    "bg-primary/20 text-primary": isPast,
                    "border border-border bg-muted": !isCurrent && !isPast,
                  })}
                >
                  {item.icon}
                </div>
                <span className="text-xs text-center">{item.label}</span>
              </div>
            )
          })}
        </div>
        <Progress value={calculateProgressWidth()} className="h-2" />
      </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <BasicInfoStep
            control={control}
            errors={errors}
            titleDefaultValue={params.title || ""}
            categoryDefaultValue={params.category || ""}
          />
        )
      case 2:
        return <ContentStep control={control} errors={errors} watchedFields={watchedFields} />
      case 3:
        return (
          <PreviewStep
            titleValue={watchedFields.title}
            descriptionValue={watchedFields.description}
            categoryValue={watchedFields.category}
            units={watchedFields.units}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleLogin}
      />

      {renderStepIndicator()}

      <div className="min-h-[400px] md:min-h-[500px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {renderStep()}

          <Separator className="my-4" />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Back
            </Button>
            {step === totalSteps ? (
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Course"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                disabled={shouldDisableNext()}
              >
                Next Step
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
