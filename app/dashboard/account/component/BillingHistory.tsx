"use client"

import { useState, useMemo, useCallback } from "react"
import { Download, FileText, ExternalLink, Loader2, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "./status-badge"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const handleDownload = useCallback(async (url: string, id: string) => {
    if (!url) return

    setIsLoading(id)
    try {
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error downloading invoice:", error)
    } finally {
      setTimeout(() => setIsLoading(null), 500) // Add a small delay for better UX
    }
  }, [])

  // Memoize filtered history to prevent recalculation on every render
  const filteredHistory = useMemo(() => {
    return billingHistory.filter((item) => {
      const matchesSearch = item.description?.toLowerCase().includes(searchTerm?.toLowerCase())
      const matchesStatus = statusFilter === "all" || item.status?.toLowerCase() === statusFilter?.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [billingHistory, searchTerm, statusFilter])

  if (billingHistory.length === 0) {
    return (
      <CardContent className="text-center py-8 px-4 sm:py-12 sm:px-6">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-full p-4 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
          <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground opacity-50" />
        </div>
        <h3 className="mt-4 text-lg sm:text-xl font-medium">No billing history</h3>
        <div className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Your billing history will appear here once you have made a payment. Subscribe to a plan to get started.
        </div>
        <Button className="mt-6 bg-gradient-to-r from-primary to-primary-foreground/80 hover:from-primary/90 hover:to-primary-foreground/70 text-primary-foreground">
          View Subscription Plans
        </Button>
      </CardContent>
    )
  }

  return (
    <CardContent className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative w-full sm:w-auto flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-input"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] border-input">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="border-input hidden sm:flex">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Description</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No results found. Try adjusting your search or filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div>{new Date(item.date).toLocaleDateString()}</div>
                      <div className="md:hidden text-xs text-muted-foreground line-clamp-1">{item.description}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{item.description}</TableCell>
                    <TableCell className="font-semibold">${(item.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge status={item?.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        {item.invoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item.invoiceUrl!, item.id)}
                            disabled={isLoading === item.id}
                            className="text-primary hover:text-primary/90 hover:bg-primary/10 h-8 px-2 sm:px-3"
                          >
                            {isLoading === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <ExternalLink className="h-4 w-4 mr-1" />
                            )}
                            <span className="hidden sm:inline">Invoice</span>
                          </Button>
                        )}
                        {item.receiptUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item.receiptUrl!, item.id)}
                            disabled={isLoading === item.id}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 px-2 sm:px-3"
                          >
                            {isLoading === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            <span className="hidden sm:inline">Receipt</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Showing {filteredHistory.length} of {billingHistory.length} transactions
      </div>
    </CardContent>
  )
}
