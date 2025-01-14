'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { signIn, useSession } from "next-auth/react"
import { motion } from "framer-motion"

import { StepIndicator } from "./StepIndicator"
import { BasicInfoStep } from "./BasicInfoStep"
import { ContentStep } from "./ContentStep"
import { PreviewStep } from "./PreviewStep"
import { ConfirmationDialog } from "./ConfirmationDialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Save, BookOpen, Info, FileText, Eye } from "lucide-react"

import { SubscriptionStatus, useSubscriptionStatus } from "@/hooks/useSubscroption"
import { CreateCourseInput, createCourseSchema } from "@/schema/schema"
import { SignInBanner } from "../../quiz/components/SignInBanner"

interface CourseCreationFormProps {
  topic: string;
}

export default function CourseCreationForm({ topic }: CourseCreationFormProps) {
  const [step, setStep] = React.useState(1)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const totalSteps = 3

  const status: SubscriptionStatus | null = useSubscriptionStatus()
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [availableCredits, setAvailableCredits] = React.useState(status?.credits)

  React.useEffect(() => {
    if (status) {
      setAvailableCredits(status?.credits)
    }
  }, [status])

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CreateCourseInput>({
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
      setAvailableCredits(prev => (prev ?? 0) - 1)
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

  const onSubmit = async (data: CreateCourseInput) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a course.",
        variant: "destructive",
      })
      signIn()
      return
    }
    if (!status?.isSubscribed && (availableCredits ?? 0) === 0) {
      toast({
        title: "Subscription or Credits Required",
        description: "Please subscribe or buy credits to create a course.",
        variant: "destructive",
      })
      router.push('dashboard/subscription')
      return
    }
    setShowConfirmDialog(true)
  }

  const handleConfirmCreate = async () => {
    setShowConfirmDialog(false)
    if (!status?.isSubscribed && (availableCredits ?? 0) === 0) {
      toast({
        title: "No Credits Available",
        description: "You don't have enough credits to create a course. Please subscribe or buy more credits.",
        variant: "destructive",
      })
      router.push('dashboard/subscription')
      return
    }
    createCourseMutation.mutate(watch())
  }

  const handleNext = () => setStep(step + 1)
  const handleBack = () => setStep(step - 1)

  const isStepValid = () => {
    if (step === 1) {
      return !!watch("title") && !!watch("description") && !!watch("category")
    } else if (step === 2) {
      return watch("units").length > 0 && watch("units").every(unit => !!unit)
    }
    return true
  }

  const isCreateDisabled = step !== 3 || !session || (!status?.isSubscribed && (availableCredits ?? 0) === 0) || isSubmitting || createCourseMutation.status === 'loading'

  const stepIcons = [
    <Info key="1" className="w-6 h-6 text-primary" />,
    <FileText key="2" className="w-6 h-6 text-primary" />,
    <Eye key="3" className="w-6 h-6 text-primary" />,
  ]

  return (
    <div className="py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <SignInBanner isAuthenticated={authStatus === 'authenticated'} />
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <motion.div 
                className="p-3 bg-primary/10 rounded-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
            <CardTitle className="text-3xl font-bold">Create a New Course</CardTitle>
            <CardDescription className="text-lg">
              Fill in the details for your new course. Progress is automatically saved.
            </CardDescription>
          </CardHeader>

          <div className="px-6 mb-8">
            <StepIndicator currentStep={step} totalSteps={totalSteps} />
            <div className="flex justify-between mt-4 md:hidden">
              {stepIcons.map((icon, index) => (
                <div key={index} className={`flex items-center justify-center ${step === index + 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {icon}
                </div>
              ))}
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2 mt-4" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {step === 1 && <BasicInfoStep control={control} errors={errors} />}
              {step === 2 && <ContentStep control={control} errors={errors} watch={watch} setValue={setValue} />}
              {step === 3 && <PreviewStep watch={watch} />}
            </CardContent>

            <CardFooter className="flex justify-between pt-6 pb-8 px-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>

              <div className="flex flex-col items-end space-y-4">
                {step < totalSteps ? (
                  <Button 
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid()}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isCreateDisabled}
                    className="disabled:opacity-50"
                  >
                    {(isSubmitting || createCourseMutation.status === 'pending') ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Course...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Course
                      </>
                    )}
                  </Button>
                )}

                {(!status?.isSubscribed && (availableCredits ?? 0) > 0) && (
                  <p className="text-sm text-muted-foreground">
                    Available credits: {availableCredits} (This action will deduct 1 credit)
                  </p>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={handleConfirmCreate}
        formData={watch()}
        isSubmitting={isSubmitting || createCourseMutation.status === 'pending'}
      />
    </div>
  )
}
