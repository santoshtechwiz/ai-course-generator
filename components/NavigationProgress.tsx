"use client"
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'
import '@/styles/nprogress.css'

// Minimal global navigation progress handler
export default function NavigationProgress() {
  const pathname = usePathname()
  const search = useSearchParams()
  const prevPath = useRef<string>('')
  const inFlight = useRef(false)

  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.15 })

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.button !== 0) return
      let el = e.target as HTMLElement | null
      while (el && el.tagName !== 'A') el = el.parentElement
      if (!el) return
      const href = (el as HTMLAnchorElement).getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      try {
        const url = new URL(href, window.location.origin)
        const next = url.pathname + url.search
        const current = window.location.pathname + window.location.search
        if (next !== current) {
          inFlight.current = true
          NProgress.start()
        }
      } catch {}
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  // Complete on route param change
  useEffect(() => {
    const current = pathname + (search?.toString() || '')
    if (inFlight.current && prevPath.current !== current) {
      NProgress.done(true)
      inFlight.current = false
    }
    prevPath.current = current
  }, [pathname, search])

  return null
}
