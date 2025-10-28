"use client"

import type React from "react"

import { useState } from "react"
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { subscribeToNewsletter } from "@/app/actions/newsletter"
import { motion } from "framer-motion"


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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text)]/60 z-10" />
        <Input
          type="email"
          placeholder="Your email address"
          className="pl-12 pr-4 py-3 h-12 neo-input bg-[var(--color-bg)] border-4 border-border neo-shadow font-bold text-[var(--color-text)] placeholder:text-[var(--color-text)]/40 rounded-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "success"}
          aria-label="Email address"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-border)] hover:bg-[var(--color-primary)]/90 hover:scale-105 hover:shadow-lg transition-all duration-200 font-black uppercase tracking-wider group"
        disabled={status === "loading" || status === "success"}
      >
        {status === "loading" ? (
          <>
            <span className="mr-2" aria-hidden></span>
            Subscribing...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Subscribed
          </>
        ) : (
          <>
            Subscribe
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </Button>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`neo-card p-3 text-sm font-bold flex items-center ${
            status === "error"
              ? "bg-[var(--color-error)]/10 border-[var(--color-error)] text-[var(--color-error)]"
              : "bg-[var(--color-success)]/10 border-[var(--color-success)] text-[var(--color-success)]"
          }`}
        >
          {status === "error" ? (
            <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          ) : status === "success" ? (
            <CheckCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          ) : null}
          {message}
        </motion.div>
      )}
    </form>
  )
}

