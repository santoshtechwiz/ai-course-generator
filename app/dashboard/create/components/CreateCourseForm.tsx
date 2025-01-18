'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useForm, SubmitHandler } from "react-hook-form"
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
import { Loader2, Save, BookOpen, Info, FileText, Eye } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { SubscriptionStatus, useSubscriptionStatus } from "@/hooks/useSubscroption"
import { CreateCourseInput, createCourseSchema } from "@/schema/schema"
import { SignInBanner } from "../../quiz/components/SignInBanner"
import { useTheme } from "next-themes"
import { CreditButton } from '@/app/components/shared/CreditButton';

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
  const { theme } = useTheme()

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
    await createCourseMutation.mutateAsync(watch())
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

  const isCreateDisabled = step !== 3 || !session || (!status?.isSubscribed && (availableCredits ?? 0) === 0) || isSubmitting || createCourseMutation.status === 'loading' || showConfirmDialog

  const stepIcons = [
    <Info key="1" className="w-6 h-6 text-primary" />,
    <FileText key="2" className="w-6 h-6 text-primary" />,
    <Eye key="3" className="w-6 h-6 text-primary" />,
  ]

  return (
    <div className={`py-6 px-4 md:py-12 md:px-6 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-white'}`}>
      <div className="max-w-4xl mx-auto">
        <Card className={`w-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <SignInBanner isAuthenticated={authStatus === 'authenticated'} />
          <CardHeader className="text-center space-y-2 p-4 md:p-6">
            <div className="flex justify-center mb-4">
              <motion.div 
                className="p-3 bg-primary/10 rounded-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold">Create a New Course</CardTitle>
            <CardDescription className="text-base md:text-lg">
              Fill in the details for your new course. Progress is automatically saved.
            </CardDescription>
          </CardHeader>

          <div className="px-4 md:px-6 mb-6 md:mb-8">
            <div className="hidden md:block">
              <StepIndicator currentStep={step} totalSteps={totalSteps} />
            </div>
            <div className="flex justify-between items-center md:hidden">
              {stepIcons.map((icon, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={`flex flex-col items-center justify-center ${step === index + 1 ? 'text-primary' : 'text-gray-500'}`}>
                        {icon}
                        <span className="text-xs mt-1">{`Step ${index + 1}`}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {index === 0 ? 'Basic Info' : index === 1 ? 'Content' : 'Preview'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2 mt-4" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              {step === 1 && <BasicInfoStep control={control} errors={errors} />}
              {step === 2 && <ContentStep control={control} errors={errors} watch={watch} setValue={setValue} />}
              {step === 3 && <PreviewStep watch={watch} />}
            </CardContent>

            <CardFooter className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 pt-4 pb-4 md:pt-6 md:pb-8 px-4 md:px-6 border-t">
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
                    disabled={!isStepValid()}
                    className="w-full md:w-auto"
                  >
                    Continue
                  </Button>
                ) : (
                  <CreditButton
                    type="submit"
                    label={isSubmitting || createCourseMutation.status === 'pending' ? (
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
                    onClick={handleSubmit(onSubmit)}
                    requiredCredits={1}
                    disabled={isCreateDisabled || showConfirmDialog}
                    className="w-full md:w-auto disabled:opacity-50"
                  />
                )}

                {(!status?.isSubscribed && (availableCredits ?? 0) > 0) && (
                  <p className="text-sm text-gray-500 text-center md:text-right">
                    Available credits: {availableCredits} <br className="md:hidden" />(This action will deduct 1 credit)
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

