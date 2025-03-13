"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import Logo from "@/components/shared/Logo"

export function ImprovedContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const [success, setSuccess] = useState(false)

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch("https://getform.io/f/apjjwpla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSuccess(true)
        reset()
        toast({ title: "Success!", description: "Your message has been sent." })
      } else {
        toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit the form.", variant: "destructive" })
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-10 shadow-sm border-muted/40">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="w-24 h-24 mx-auto mb-2">
          <Logo></Logo>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">Contact Us</CardTitle>
        <CardDescription className="mt-2 text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
          Have questions about our courses? Need technical support? Or just want to share your learning experience?
          We're here to help! Reach out to us, and our team will get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center p-8 bg-primary/10 rounded-lg space-y-3">
            <p className="text-xl font-semibold text-primary">Thank you for reaching out!</p>
            <p className="mt-2 text-muted-foreground">We appreciate your message and will get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                {...register("name", { required: "Name is required" })}
                placeholder="Your Name"
                className="w-full h-11"
              />
              {errors.name && <p className="mt-2 text-sm text-destructive">{errors.name.message as string}</p>}
            </div>

            <div>
              <Input
                type="email"
                {...register("email", { required: "Email is required" })}
                placeholder="Your Email"
                className="w-full h-11"
              />
              {errors.email && <p className="mt-2 text-sm text-destructive">{errors.email.message as string}</p>}
            </div>

            <div>
              <Textarea
                {...register("message", { required: "Message is required" })}
                placeholder="Your Message"
                className="w-full min-h-[160px] resize-y"
              />
              {errors.message && <p className="mt-2 text-sm text-destructive">{errors.message.message as string}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base font-medium">
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

