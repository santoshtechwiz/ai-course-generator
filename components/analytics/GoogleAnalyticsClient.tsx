"use client"

import React, { useEffect, useState } from 'react'

type Props = { gaId?: string }

export default function GoogleAnalyticsClient({ gaId }: Props) {
  const [GAComponent, setGAComponent] = useState<any>(null)

  useEffect(() => {
    if (!gaId) return
    let mounted = true
    import('@next/third-parties/google')
      .then((mod) => {
        if (mounted) setGAComponent(() => mod.GoogleAnalytics)
      })
      .catch(() => {
        // Ignore - analytics is optional
      })

    return () => {
      mounted = false
    }
  }, [gaId])

  if (!GAComponent) return null
  return <GAComponent gaId={gaId} />
}
