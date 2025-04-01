"use client"

import { useState, useEffect } from "react"
import {
  getCampaigns,
  deleteCampaign as deleteCampaignService,
  duplicateCampaign as duplicateCampaignService,
  sendCampaign as sendCampaignService,
  type Campaign,
} from "@/lib/email/campaign-service"

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        setIsLoading(true)
        const data = await getCampaigns()
        setCampaigns(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch campaigns"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  const refreshCampaigns = async () => {
    try {
      setIsLoading(true)
      const data = await getCampaigns()
      setCampaigns(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to refresh campaigns"))
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCampaign = async (id: string) => {
    await deleteCampaignService(id)
    setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id))
  }

  const duplicateCampaign = async (id: string) => {
    const duplicatedCampaign = await duplicateCampaignService(id)
    setCampaigns((prev) => [...prev, duplicatedCampaign])
    return duplicatedCampaign
  }

  const sendCampaign = async (id: string) => {
    await sendCampaignService(id)
    setCampaigns((prev) =>
      prev.map((campaign) => (campaign.id === id ? { ...campaign, status: "SENDING" as const } : campaign)),
    )
  }

  return {
    campaigns,
    isLoading,
    error,
    refreshCampaigns,
    deleteCampaign,
    duplicateCampaign,
    sendCampaign,
  }
}

