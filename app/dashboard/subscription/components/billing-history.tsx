"use client"

import { useState } from "react"
import { Download, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"

interface BillingHistoryProps {
  billingHistory: Array<{
    id: string
    amount: number
    status: string
    date: string
    invoiceUrl?: string
    receiptUrl?: string
    description: string
  }>
}

export function BillingHistory({ billingHistory }: BillingHistoryProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleDownload = async (url: string, id: string) => {
    if (!url) return

    setIsLoading(id)
    try {
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error downloading invoice:", error)
    } finally {
      setIsLoading(null)
    }
  }

  if (billingHistory.length === 0) {
    return (
      <CardContent className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-medium">No billing history</h3>
        <div className="text-sm text-muted-foreground mt-2">
          Your billing history will appear here once you have made a payment.
        </div>
      </CardContent>
    )
  }

  return (
    <CardContent className="p-0">
      {billingHistory.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download All Invoices
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {billingHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>${(item.amount / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {item.invoiceUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(item.invoiceUrl!, item.id)}
                        disabled={isLoading === item.id}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
                    )}
                    {item.receiptUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(item.receiptUrl!, item.id)}
                        disabled={isLoading === item.id}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "paid":
      return (
        <Badge variant="default" className="bg-green-500">
          Paid
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline" className="text-orange-500 border-orange-500">
          Pending
        </Badge>
      )
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    case "refunded":
      return (
        <Badge variant="outline" className="text-blue-500 border-blue-500">
          Refunded
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

