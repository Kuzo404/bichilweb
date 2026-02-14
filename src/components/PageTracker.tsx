'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Generate a random ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Get or create a persistent visitor ID (stored in localStorage)
function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  let vid = localStorage.getItem('_vid')
  if (!vid) {
    vid = generateId()
    localStorage.setItem('_vid', vid)
  }
  return vid
}

// Get or create a session ID (stored in sessionStorage - resets per tab/session)
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('_sid')
  if (!sid) {
    sid = generateId()
    sessionStorage.setItem('_sid', sid)
  }
  return sid
}

// Detect device type from user agent
function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent.toLowerCase()
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile'
  return 'desktop'
}

export default function PageTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string>('')

  useEffect(() => {
    // Skip tracking if same path (prevents double-tracking on mount)
    if (pathname === lastTracked.current) return
    lastTracked.current = pathname

    const trackPageView = async () => {
      try {
        const data = {
          session_id: getSessionId(),
          visitor_id: getVisitorId(),
          page_path: pathname,
          page_title: document.title,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
        }

        // Use fetch with keepalive for reliability
        const payload = JSON.stringify(data)
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      } catch {
        // Silently fail - never break the user experience
      }
    }

    // Slight delay to ensure page title is updated
    const timer = setTimeout(trackPageView, 100)
    return () => clearTimeout(timer)
  }, [pathname])

  return null // This component renders nothing
}
