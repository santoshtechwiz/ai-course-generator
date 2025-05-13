"use client"

import { Table, TableHeader, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Check, X, CreditCard, Zap, Rocket, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { SUBSCRIPTION_PLANS } from "../subscription-plans"
import { motion } from "framer-motion"

export default function ComparisonTable({ plans }: { plans: typeof SUBSCRIPTION_PLANS }) {
  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
        Compare Plans
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
        <motion.div
          variants={tableVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Table>
            <TableHeader>
              <motion.tr variants={rowVariants}>
                <TableHead className="w-48 bg-slate-50 dark:bg-slate-800 font-semibold">Feature</TableHead>
                {plans.map((plan) => (
                  <TableHead
                    key={plan.name}
                    className={`text-center bg-slate-50 dark:bg-slate-800 font-semibold ${
                      plan.id === "PRO" ? "bg-purple-50 dark:bg-purple-900/20" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {plan.id === "FREE" && <CreditCard className="h-5 w-5 mb-1 text-slate-500" />}
                      {plan.id === "BASIC" && <Zap className="h-5 w-5 mb-1 text-blue-500" />}
                      {plan.id === "PRO" && <Rocket className="h-5 w-5 mb-1 text-purple-500" />}
                      {plan.id === "ULTIMATE" && <Crown className="h-5 w-5 mb-1 text-amber-500" />}
                      {plan.name}
                      {plan.id === "PRO" && (
                        <Badge className="mt-1 bg-purple-500 text-white text-xs">Recommended</Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
              </motion.tr>
            </TableHeader>
            <TableBody>
              <motion.tr variants={rowVariants} className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableCell className="font-medium">Price</TableCell>
                {plans.map((plan) => (
                  <TableCell
                    key={plan.name}
                    className={`text-center font-semibold ${
                      plan.id === "PRO" ? "bg-purple-50/50 dark:bg-purple-900/10" : ""
                    }`}
                  >
                    ${plan.options[0].price}/mo
                  </TableCell>
                ))}
              </motion.tr>
              <motion.tr variants={rowVariants}>
                <TableCell className="font-medium">Tokens</TableCell>
                {plans.map((plan) => (
                  <TableCell
                    key={plan.name}
                    className={`text-center ${plan.id === "PRO" ? "bg-purple-50/50 dark:bg-purple-900/10" : ""}`}
                  >
                    <span className="font-semibold">{plan.tokens}</span>
                  </TableCell>
                ))}
              </motion.tr>
              <motion.tr variants={rowVariants} className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableCell className="font-medium">Max Questions Per Quiz</TableCell>
                {plans.map((plan) => (
                  <TableCell
                    key={plan.name}
                    className={`text-center ${plan.id === "PRO" ? "bg-purple-50/50 dark:bg-purple-900/10" : ""}`}
                  >
                    {plan.limits.maxQuestionsPerQuiz || "N/A"}
                  </TableCell>
                ))}
              </motion.tr>
              {[
                "MCQ Generator",
                "Fill in the Blanks",
                "Open-ended Questions",
                "Code Quiz",
                "Video Quiz",
                "PDF Downloads",
                "Video Transcripts",
                "AI Accuracy",
                "Priority Support",
              ].map((feature, index) => (
                <motion.tr
                  key={feature}
                  variants={rowVariants}
                  className={index % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/50" : ""}
                >
                  <TableCell className="font-medium">{feature}</TableCell>
                  {plans.map((plan) => {
                    const featureInfo = plan.features.find((f) => f.name === feature)
                    return (
                      <TableCell
                        key={plan.name}
                        className={`text-center ${plan.id === "PRO" ? "bg-purple-50/50 dark:bg-purple-900/10" : ""}`}
                      >
                        {featureInfo?.available ? (
                          <div className="flex justify-center">
                            <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        ) : featureInfo?.comingSoon ? (
                          <Badge
                            variant="outline"
                            className="mx-auto bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                          >
                            Soon
                          </Badge>
                        ) : (
                          <div className="flex justify-center">
                            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
                              <X className="h-4 w-4 text-slate-400" />
                            </div>
                          </div>
                        )}
                      </TableCell>
                    )
                  })}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </div>
  )
}
