'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import axiosInstance from '@/config/axiosConfig'

interface Translation {
  id: number
  language: number
  label: string
}

interface SlideData {
  id: number
  file: string
  file_url: string
  index: number
  font: string
  color: string
  number: string
  description: string
  url: string
  titles: Translation[]
  subtitles: Translation[]
}

export default function AccordionSlider() {
  const [active, setActive] = useState<number>(0)
  const [hoveredSlide, setHoveredSlide] = useState<number>(-1)
  const [isMobile, setIsMobile] = useState(false)
  const [slidesData, setSlidesData] = useState<SlideData[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const { language } = useLanguage()
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const AUTO_PLAY_DURATION = 5000

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await axiosInstance.get('/CTA/')
        if (response && response.status === 200) {
          const sortedSlides = response.data.sort((a: SlideData, b: SlideData) => a.index - b.index)
          setSlidesData(sortedSlides)
        }
      } catch (err) {
        console.error('Error fetching CTA slides:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSlides()
  }, [])

  const getTranslation = useCallback((translations: Translation[]) => {
    const langId = language === 'mn' ? 2 : 1
    const translation = translations.find(t => t.language === langId)
    return translation?.label || translations[0]?.label || ''
  }, [language])

  const getSubtitles = useCallback((subtitles: Translation[]) => {
    const langId = language === 'mn' ? 2 : 1
    return subtitles.filter(sub => sub.language === langId)
  }, [language])

  const getImageUrl = (slide: SlideData): string => {
    if (slide.file_url) {
      if (slide.file_url.startsWith('/')) {
        const baseURL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'
        return `${baseURL}${slide.file_url}`
      }
      return slide.file_url
    }
    if (slide.file) {
      if (slide.file.startsWith('http')) return slide.file
      const baseURL = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'
      return `${baseURL}/${slide.file}`
    }
    return ''
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-play with progress bar
  const startAutoPlay = useCallback(() => {
    if (slidesData.length <= 1) return
    stopAutoPlay()

    let elapsed = 0
    const interval = 30
    progressRef.current = setInterval(() => {
      elapsed += interval
      setProgress((elapsed / AUTO_PLAY_DURATION) * 100)
      if (elapsed >= AUTO_PLAY_DURATION) {
        elapsed = 0
        setActive(prev => (prev + 1) % slidesData.length)
      }
    }, interval)
  }, [slidesData.length])

  const stopAutoPlay = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current)
    if (autoPlayRef.current) clearTimeout(autoPlayRef.current)
    setProgress(0)
  }, [])

  useEffect(() => {
    if (!isMobile && slidesData.length > 1 && hoveredSlide === -1) {
      startAutoPlay()
    }
    return stopAutoPlay
  }, [active, slidesData.length, isMobile, hoveredSlide, startAutoPlay, stopAutoPlay])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setActive(prev => (prev - 1 + slidesData.length) % slidesData.length)
      if (e.key === 'ArrowRight') setActive(prev => (prev + 1) % slidesData.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [slidesData.length])

  const handleDesktopHover = (i: number) => {
    if (!isMobile) {
      setHoveredSlide(i)
      stopAutoPlay()
    }
  }

  const handleDesktopLeave = () => {
    if (!isMobile) {
      setHoveredSlide(-1)
    }
  }

  if (loading) {
    return (
      <section className="w-full py-10 md:py-16">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex gap-3 md:gap-5 h-[70vh] md:h-[75vh]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 rounded-2xl bg-gradient-to-b from-slate-200 to-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (slidesData.length === 0) return null

  const isSlideActive = (i: number) => {
    if (isMobile) return active === i
    return hoveredSlide !== -1 ? hoveredSlide === i : active === i
  }

  return (
    <section className="w-full py-8 md:py-14">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">

        {/* === DESKTOP ACCORDION === */}
        {!isMobile && (
          <div className="flex gap-3 lg:gap-4 h-[70vh] lg:h-[75vh]" ref={containerRef}>
            {slidesData.map((s, i) => {
              const title = getTranslation(s.titles)
              const subtitles = getSubtitles(s.subtitles)
              const imageUrl = getImageUrl(s)
              const isActive = isSlideActive(i)

              return (
                <div
                  key={s.id}
                  className="group relative overflow-hidden rounded-2xl cursor-pointer"
                  style={{
                    flex: isActive ? 3.5 : 1,
                    transition: 'flex 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: 0,
                  }}
                  onMouseEnter={() => handleDesktopHover(i)}
                  onMouseLeave={handleDesktopLeave}
                  onClick={() => {
                    setActive(i)
                    if (isActive && s.url) {
                      window.open(s.url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                  role="listitem"
                  aria-expanded={isActive}
                >
                  {/* Background image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-out"
                    style={{
                      backgroundImage: imageUrl
                        ? `url('${imageUrl}')`
                        : 'linear-gradient(135deg, #0f766e, #1e3a5f)',
                      transform: isActive ? 'scale(1.05)' : 'scale(1.15)',
                      filter: isActive ? 'grayscale(0) brightness(1)' : 'grayscale(0.5) brightness(0.7)',
                    }}
                  />

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background: isActive
                        ? 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 50%, rgba(0,0,0,0.85) 100%)'
                        : 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-8 z-10">
                    {/* Top-left: Number + Title */}
                    <div>
                      {s.number && s.number !== '0' && (
                        <span
                          className="text-[48px] lg:text-[64px] font-black leading-none block transition-all duration-700"
                          style={{
                            color: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
                            transform: isActive ? 'translateY(0)' : 'translateY(6px)',
                          }}
                        >
                          {s.number}
                        </span>
                      )}

                      <h3
                        className="text-lg lg:text-2xl font-bold leading-tight transition-all duration-500"
                        style={{
                          fontFamily: s.font || 'inherit',
                          color: s.color && s.color !== '#' ? s.color : '#fff',
                          transform: isActive ? 'translateY(0)' : 'translateY(4px)',
                        }}
                      >
                        {title}
                      </h3>
                    </div>

                    {/* Bottom: Subtitles + Description (only when active) */}
                    <div>
                      <div
                        className="overflow-hidden transition-all duration-700 ease-out"
                        style={{
                          maxHeight: isActive ? '400px' : '0px',
                          opacity: isActive ? 1 : 0,
                          transform: isActive ? 'translateY(0)' : 'translateY(16px)',
                        }}
                      >
                        {/* Description */}
                        {s.description && (
                          <p className="text-sm text-white/70 leading-relaxed mb-3">
                            {s.description}
                          </p>
                        )}

                        {subtitles.length > 0 && (
                          <ul className="space-y-2">
                            {subtitles.map((sub, idx) => (
                              <li
                                key={sub.id}
                                className="flex items-start gap-2.5 text-sm text-white/85 leading-relaxed"
                                style={{
                                  transition: `opacity 0.4s ease ${idx * 0.08}s, transform 0.4s ease ${idx * 0.08}s`,
                                  opacity: isActive ? 1 : 0,
                                  transform: isActive ? 'translateX(0)' : 'translateX(-12px)',
                                }}
                              >
                                <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                                <span>{sub.label}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* URL indicator */}
                        {s.url && (
                          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400/80">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Дэлгэрэнгүй</span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar on active slide */}
                      {isActive && hoveredSlide === -1 && slidesData.length > 1 && (
                        <div className="mt-5 h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400/60 rounded-full"
                            style={{
                              width: `${progress}%`,
                              transition: 'width 30ms linear',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Side index indicator when collapsed */}
                  {!isActive && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                      <span className="text-xs font-semibold text-white/40 tracking-widest uppercase">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* === MOBILE: HORIZONTAL ACCORDION (tap to expand) === */}
        {isMobile && (
          <div className="flex gap-2 h-[65vh]">
            {slidesData.map((s, i) => {
              const title = getTranslation(s.titles)
              const subtitles = getSubtitles(s.subtitles)
              const imageUrl = getImageUrl(s)
              const isOpen = active === i

              return (
                <div
                  key={s.id}
                  className="relative overflow-hidden rounded-xl cursor-pointer"
                  style={{
                    flex: isOpen ? 4 : 0.6,
                    transition: 'flex 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: 0,
                  }}
                  onClick={() => {
                    if (isOpen && s.url) {
                      window.open(s.url, '_blank', 'noopener,noreferrer')
                    } else {
                      setActive(i)
                    }
                  }}
                >
                  {/* Background image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                    style={{
                      backgroundImage: imageUrl
                        ? `url('${imageUrl}')`
                        : 'linear-gradient(135deg, #0f766e, #1e3a5f)',
                      filter: isOpen ? 'grayscale(0) brightness(1)' : 'grayscale(0.5) brightness(0.6)',
                      transform: isOpen ? 'scale(1.02)' : 'scale(1.15)',
                    }}
                  />

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background: isOpen
                        ? 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 40%, transparent 50%, rgba(0,0,0,0.85) 100%)'
                        : 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />

                  {/* Collapsed: Vertical title */}
                  {!isOpen && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <h3
                        className="text-sm font-bold whitespace-nowrap"
                        style={{
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          fontFamily: s.font || 'inherit',
                          color: s.color && s.color !== '#' ? s.color : '#fff',
                        }}
                      >
                        {title}
                      </h3>
                    </div>
                  )}

                  {/* Expanded: Full content */}
                  {isOpen && (
                    <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                      {/* Top: Number + Title */}
                      <div>
                        {s.number && s.number !== '0' && (
                          <span className="text-[36px] font-black leading-none text-white/15 block">
                            {s.number}
                          </span>
                        )}
                        <h3
                          className="text-base font-bold leading-tight"
                          style={{
                            fontFamily: s.font || 'inherit',
                            color: s.color && s.color !== '#' ? s.color : '#fff',
                          }}
                        >
                          {title}
                        </h3>
                      </div>

                      {/* Bottom: Description + Subtitles */}
                      <div>
                        {s.description && (
                          <p className="text-xs text-white/70 leading-relaxed mb-2">
                            {s.description}
                          </p>
                        )}
                        {subtitles.length > 0 && (
                          <ul className="space-y-1">
                            {subtitles.map((sub, idx) => (
                              <li
                                key={sub.id}
                                className="flex items-start gap-1.5 text-xs text-white/85 leading-relaxed"
                                style={{
                                  transition: `opacity 0.3s ease ${idx * 0.06}s, transform 0.3s ease ${idx * 0.06}s`,
                                  opacity: 1,
                                  transform: 'translateX(0)',
                                }}
                              >
                                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                                <span>{sub.label}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {s.url && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Дэлгэрэнгүй</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Collapsed: index indicator */}
                  {!isOpen && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="text-[10px] font-semibold text-white/40 tracking-widest">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Desktop dot indicators */}
        {!isMobile && slidesData.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            {slidesData.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActive(i)
                  setHoveredSlide(-1)
                }}
                className={`rounded-full transition-all duration-300 ${
                  isSlideActive(i)
                    ? 'w-8 h-2 bg-teal-600'
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
