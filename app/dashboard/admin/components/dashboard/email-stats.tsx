"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface EmailStats {
  totalEmails: number
  opens: number
  clicks: number
  openRate: number
  clickRate: number
}

interface ABTestStats {
  variant: string
  sends: number
  opens: number
  clicks: number
  openRate: number
  clickRate: number
}

export function EmailStatsComponent() {
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [abTestStats, setABTestStats] = useState<ABTestStats[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch email stats for the current user
        // In a real app, you'd get the actual userId
        const userId = "current-user-id"
        const response = await fetch(`/api/email/dashboard?userId=${userId}`)

        if (response.ok) {
          const data = await response.json()
          setEmailStats(data.stats)
        }

        // Fetch A/B test stats
        const testId = "quiz-promo-subject"
        const abResponse = await fetch(`/api/email/dashboard?testId=${testId}`)

        if (abResponse.ok) {
          const abData = await abResponse.json()
          setABTestStats(abData.stats)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching email stats:", error)
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"]

  const pieData = emailStats
    ? [
        { name: "Opens", value: emailStats.opens },
        { name: "Unopened", value: emailStats.totalEmails - emailStats.opens },
      ]
    : []

  const barData = abTestStats || []

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Marketing Analytics</CardTitle>
        <CardDescription>Track the performance of your email campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="abTests">A/B Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading stats...</p>
              </div>
            ) : emailStats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{emailStats.totalEmails}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(emailStats.openRate * 100).toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(emailStats.clickRate * 100).toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p>No data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="abTests">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading A/B test data...</p>
              </div>
            ) : abTestStats && abTestStats.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Quiz Promotion Subject Line Test</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="variant" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="openRate" name="Open Rate" fill="#4f46e5" />
                      <Bar dataKey="clickRate" name="Click Rate" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Test Results</h4>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sends
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Opens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clicks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Open Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Click Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {barData.map((variant) => (
                        <tr key={variant.variant}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {variant.variant}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.sends}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.opens}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.clicks}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(variant.openRate * 100).toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(variant.clickRate * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p>No A/B test data available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

