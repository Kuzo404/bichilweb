'use client'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import RatesTicker from './RatesTicker'
import axiosInstance from '@/config/axiosConfig'

const BACKEND = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'

interface SliderItem {
  id: number
  type: 'i' | 'v'
  file: string
  time: number
  index: number
  visible: boolean
  file_url: string
  tablet_file: string
  tablet_type: 'i' | 'v'
  tablet_file_url: string
  mobile_file: string
  mobile_type: 'i' | 'v'
  mobile_file_url: string
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'

function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>('desktop')

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth
      if (w < 768) setDevice('mobile')
      else if (w < 1024) setDevice('tablet')
      else setDevice('desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return device
}

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([])
  const [loading, setLoading] = useState(true)
  const heroRef = useRef<HTMLElement>(null)
  const device = useDeviceType()

  useEffect(() => {
    const fetchSliderData = async () => {
      try {
        const response = await axiosInstance.get('/hero-slider/')
        if (response && response.status === 200) {
          const visibleItems = response.data
            .filter((item: SliderItem) => item.visible === true)
            .sort((a: SliderItem, b: SliderItem) => a.index - b.index)
          setSliderItems(visibleItems)
        }
      } catch (err) {
        console.error('Error fetching slider data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSliderData()
  }, [])

  const currentMedia = sliderItems[currentIndex]

  const goToNext = () => {
    if (sliderItems.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderItems.length)
      setIsTransitioning(false)
    }, 500)
  }

  const goToPrevious = () => {
    if (sliderItems.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + sliderItems.length) % sliderItems.length)
      setIsTransitioning(false)
    }, 500)
  }

  const goToSlide = (index: number) => {
    if (index === currentIndex) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsTransitioning(false)
    }, 500)
  }

  useEffect(() => {
    if (!currentMedia || sliderItems.length <= 1) return
    const timer = setTimeout(() => {
      goToNext()
    }, currentMedia.time * 1000)
    return () => clearTimeout(timer)
  }, [currentIndex, currentMedia, sliderItems.length])

  // Get the right media URL and type for the current device
  const getMediaSrc = (media: SliderItem): string => {
    if (device === 'mobile' && media.mobile_file) {
      return `${BACKEND}/${media.mobile_file}`
    }
    if (device === 'tablet' && media.tablet_file) {
      return `${BACKEND}/${media.tablet_file}`
    }
    return `${BACKEND}/${media.file}`
  }

  const getMediaType = (media: SliderItem): 'i' | 'v' => {
    if (device === 'mobile' && media.mobile_file) return media.mobile_type || 'i'
    if (device === 'tablet' && media.tablet_file) return media.tablet_type || 'i'
    return media.type
  }

  if (loading) {
    return (
      <section className="relative h-screen w-full overflow-hidden -mt-20 lg:-mt-24">
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <RatesTicker />
        </div>
      </section>
    )
  }

  if (sliderItems.length === 0) {
    return (
      <section className="relative h-screen w-full overflow-hidden -mt-20 lg:-mt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-blue-700" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-white text-2xl font-semibold">No slider content available</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <RatesTicker />
        </div>
      </section>
    )
  }

  return (
    <section ref={heroRef} className="relative h-screen w-full overflow-hidden -mt-20 lg:-mt-24">
      <div className="absolute inset-0">
        {sliderItems.map((media, index) => {
          const src = getMediaSrc(media)
          const mediaType = getMediaType(media)

          return (
            <div
              key={media.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex && !isTransitioning ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {media.file ? (
                mediaType === 'i' ? (
                  <Image
                    src={src}
                    alt="Hero"
                    fill
                    className="object-cover object-center"
                    priority={index === 0}
                  />
                ) : (
                  <video
                    src={src}
                    className="w-full h-full object-cover object-center"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                )
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white">
                  No Media
                </div>
              )}
            </div>
          )
        })}

        <div className="absolute inset-0 bg-black/40" />
      </div>

      {sliderItems.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {sliderItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Rates Ticker */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <RatesTicker />
      </div>
    </section>
  )
}
