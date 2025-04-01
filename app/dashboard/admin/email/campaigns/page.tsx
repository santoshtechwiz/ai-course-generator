"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState([
    {
      id: "1",
      name: "Welcome Series",
      status: "Active",
      sent: 1245,
      opens: 876,
      clicks: 432,
    },
    {
      id: "2",
      name: "Course Promotion - April",
      status: "Completed",
      sent: 5678,
      opens: 3456,
      clicks: 1234,
    },
    {
      id: "3",
      name: "Quiz Challenge",
      status: "Draft",
      sent: 0,
      opens: 0,
      clicks: 0,
    },
  ])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Campaigns</h1>
        <Button>Create New Campaign</Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opens</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>{campaign.name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "Completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                    <TableCell>{campaign.opens.toLocaleString()}</TableCell>
                    <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input id="campaign-name" placeholder="Enter campaign name" />
              </div>

              <div>
                <Label htmlFor="campaign-template">Email Template</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="quiz-promo">Quiz Promotion</SelectItem>
                    <SelectItem value="course-promo">Course Promotion</SelectItem>
                    <SelectItem value="reengagement">Re-engagement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="campaign-segment">Audience Segment</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="new">New Users</SelectItem>
                    <SelectItem value="inactive">Inactive Users</SelectItem>
                    <SelectItem value="engaged">Highly Engaged Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="campaign-schedule">Schedule</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" />
                  <Input type="time" />
                </div>
              </div>

              <div>
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea id="campaign-description" placeholder="Enter campaign description" />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Save as Draft</Button>
                <Button>Schedule Campaign</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

