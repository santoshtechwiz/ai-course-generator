/**
 * Client-side Utilities
 * 
 * Safe client-side operations that handle SSR/client differences.
 */

// ============================================================================
// SAFE CLIENT-SIDE EXECUTION
// ============================================================================

/**
 * Safely execute browser-only code
 */
export function safeClientSide<T>(fn: () => T, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }
  
  try {
    return fn()
  } catch (error) {
    console.error('Client-side error:', error)
    return fallback
  }
}

// ============================================================================
// SAFE STORAGE OPERATIONS
// ============================================================================

/**
 * Safe local storage operations
 */
export const safeStorage = {
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    return safeClientSide(() => {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) as T : defaultValue
    }, defaultValue)
  },
  
  setItem(key: string, value: any): boolean {
    return safeClientSide(() => {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    }, false)
  },
  
  removeItem(key: string): boolean {
    return safeClientSide(() => {
      localStorage.removeItem(key)
      return true
    }, false)
  },
  
  clear(): boolean {
    return safeClientSide(() => {
      localStorage.clear()
      return true
    }, false)
  }
}

/**
 * Safe session storage operations
 */
export const safeSessionStorage = {
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    return safeClientSide(() => {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) as T : defaultValue
    }, defaultValue)
  },
  
  setItem(key: string, value: any): boolean {
    return safeClientSide(() => {
      sessionStorage.setItem(key, JSON.stringify(value))
      return true
    }, false)
  },
  
  removeItem(key: string): boolean {
    return safeClientSide(() => {
      sessionStorage.removeItem(key)
      return true
    }, false)
  },
  
  clear(): boolean {
    return safeClientSide(() => {
      sessionStorage.clear()
      return true
    }, false)
  }
}

// ============================================================================
// BROWSER AND DEVICE DETECTION
// ============================================================================

export interface BrowserInfo {
  name: string
  version: string
  engine: string
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  os: string
  isTouch: boolean
}

/**
 * Get browser information
 */
export function getBrowserInfo(): BrowserInfo {
  return safeClientSide(() => {
    const userAgent = navigator.userAgent
    
    let name = 'Unknown'
    let version = 'Unknown'
    let engine = 'Unknown'
    
    if (userAgent.indexOf('Chrome') > -1) {
      name = 'Chrome'
      engine = 'Blink'
    } else if (userAgent.indexOf('Firefox') > -1) {
      name = 'Firefox'
      engine = 'Gecko'
    } else if (userAgent.indexOf('Safari') > -1) {
      name = 'Safari'
      engine = 'WebKit'
    } else if (userAgent.indexOf('Edge') > -1) {
      name = 'Edge'
      engine = 'Blink'
    }
    
    // Extract version (simplified)
    const versionMatch = userAgent.match(new RegExp(name + '/([0-9.]+)'))
    if (versionMatch) {
      version = versionMatch[1]
    }
    
    return { name, version, engine }
  }, { name: 'Unknown', version: 'Unknown', engine: 'Unknown' })
}

/**
 * Get device information
 */
export function getDeviceInfo(): DeviceInfo {
  return safeClientSide(() => {
    const userAgent = navigator.userAgent
    
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    let os = 'Unknown'
    const isTouch = 'ontouchstart' in window
    
    // Detect device type
    if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      type = 'mobile'
    } else if (/iPad|Tablet/i.test(userAgent)) {
      type = 'tablet'
    }
    
    // Detect OS
    if (/Windows/i.test(userAgent)) os = 'Windows'
    else if (/Mac/i.test(userAgent)) os = 'macOS'
    else if (/Linux/i.test(userAgent)) os = 'Linux'
    else if (/Android/i.test(userAgent)) os = 'Android'
    else if (/iOS|iPhone|iPad/i.test(userAgent)) os = 'iOS'
    
    return { type, os, isTouch }
  }, { type: 'desktop', os: 'Unknown', isTouch: false })
}

// ============================================================================
// FEATURE DETECTION
// ============================================================================

/**
 * Check if browser supports a specific feature
 */
export function supportsFeature(feature: string): boolean {
  return safeClientSide(() => {
    switch (feature) {
      case 'clipboard':
        return 'clipboard' in navigator
      case 'serviceWorker':
        return 'serviceWorker' in navigator
      case 'webp':
        return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0
      case 'localStorage':
        return 'localStorage' in window
      case 'sessionStorage':
        return 'sessionStorage' in window
      case 'geolocation':
        return 'geolocation' in navigator
      case 'camera':
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
      case 'push':
        return 'PushManager' in window
      case 'notifications':
        return 'Notification' in window
      default:
        return false
    }
  }, false)
}

// ============================================================================
// VIEWPORT UTILITIES
// ============================================================================

/**
 * Get viewport dimensions
 */
export function getViewportSize(): { width: number; height: number } {
  return safeClientSide(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }), { width: 0, height: 0 })
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: Element): boolean {
  return safeClientSide(() => {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }, false)
}

// ============================================================================
// SCROLL UTILITIES
// ============================================================================

/**
 * Smooth scroll to element
 */
export function scrollToElement(element: Element | string, offset: number = 0): void {
  safeClientSide(() => {
    const targetElement = typeof element === 'string' 
      ? document.querySelector(element)
      : element
      
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const targetTop = rect.top + scrollTop - offset
      
      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      })
    }
  }, undefined)
}

/**
 * Get scroll position
 */
export function getScrollPosition(): { x: number; y: number } {
  return safeClientSide(() => ({
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  }), { x: 0, y: 0 })
}
