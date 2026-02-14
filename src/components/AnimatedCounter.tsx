'use client'
import React, { useEffect, useState, useRef } from 'react'

interface AnimatedCounterProps {
  end: number
  duration?: number
  className?: string
  separator?: string
  separatorClassName?: string
  suffix?: string
  suffixClassName?: string
}

export default function AnimatedCounter({
  end,
  duration = 2000,
  className = '',
  separator = ',',
  separatorClassName = 'text-gray-400',
  suffix,
  suffixClassName = 'font-normal text-gray-600',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing function - ease out cubic
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      
      setCount(Math.floor(easeOutCubic * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [isVisible, end, duration])

  // Format number with separators
  const formatNumber = (num: number) => {
    const parts = num.toString().split('')
    const formatted: React.ReactElement[] = []
    const reversed = parts.reverse()
    
    reversed.forEach((digit, index) => {
      if (index > 0 && index % 3 === 0) {
        formatted.unshift(
          <span key={`sep-${index}`} className={separatorClassName}>
            {separator}
          </span>
        )
      }
      formatted.unshift(<span key={`digit-${index}`}>{digit}</span>)
    })

    return formatted
  }

  return (
    <span ref={ref} className={className}>
      {formatNumber(count)}
      {suffix && <span className={suffixClassName}> {suffix}</span>}
    </span>
  )
}
