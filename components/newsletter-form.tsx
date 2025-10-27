"use client"

import type React from "react"

import { useState } from "react"
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { subscribeToNewsletter } from "@/app/actions/newsletter"


export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      setStatus("error")
      setMessage("Please enter a valid email address")
      return
    }

    setStatus("loading")

    try {
      const result = await subscribeToNewsletter(email)

      if (result.success) {
        setStatus("success")
      } else {
        setStatus("error")
      }

      setMessage(result.message)
    } catch (error) {
      setStatus("error")
      setMessage("Something went wrong. Please try again later.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Your email address"
          className="pl-10 rounded-none border-border"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "success"}
          aria-label="Email address"
        />
      </div>

      <Button type="submit" className="w-full group" disabled={status === "loading" || status === "success"}>
        {status === "loading" ? (
          <>
            <span className="mr-2" aria-hidden></span>
            Subscribing...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Subscribed
          </>
        ) : (
          <>
            Subscribe
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      {message && (
        <div className={`text-sm flex items-center ${status === "error" ? "text-destructive" : "text-primary"}`}>
          {status === "error" ? (
            <AlertCircle className="mr-2 h-4 w-4" />
          ) : status === "success" ? (
            <CheckCircle className="mr-2 h-4 w-4" />
          ) : null}
          {message}
        </div>
      )}
    </form>
  )
}

