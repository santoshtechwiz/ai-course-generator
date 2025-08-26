"use client"

import { AppProgressBar } from "next-nprogress-bar"
import "next-nprogress-bar/dist/styles.css"

export function NextProgressBar() {
  return (
    <AppProgressBar
      height="3px"
      color="hsl(var(--primary))"
      options={{ 
        showSpinner: false,
        easing: 'ease',
        speed: 300
      }}
      shallowRouting
    />
  )
}

