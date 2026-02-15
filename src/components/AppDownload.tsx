'use client'

import { useState, useEffect } from 'react'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

interface TitleItem {
  id: number
  index: number
  labelmn: string
  labelen: string
  color: string
  fontsize: string
  fontweight: string
  top: number
  left: number
  rotate: number
  size: number
}

interface ListItem {
  id: number
  index: number
  labelmn: string
  labelen: string
  icon: string
  icon_url: string
}

interface AppDownloadData {
  id: number
  image: string | null
  image_url: string | null
  appstore: string
  playstore: string
  bgcolor: string
  fontcolor: string
  titlecolor: string
  iconcolor: string
  buttonbgcolor: string
  buttonfontcolor: string
  googlebuttonbgcolor: string
  googlebuttonfontcolor: string
  active: boolean
  layout: string
  features_layout: string
  titles: TitleItem[]
  lists: ListItem[]
}

const iconMap: Record<string, string> = {
  check: '✓',
  shield: '🛡',
  bolt: '⚡',
  clock: '🕐',
  star: '⭐',
}

// Cloudinary URL мөн эсэхийг шалгах helper
function getImageSrc(imageUrl: string | null): string {
  if (!imageUrl) return '/App.svg'
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  return `${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${imageUrl}`
}

export default function AppDownload() {
  const [data, setData] = useState<AppDownloadData | null>(null)
  const [lang] = useState<'mn' | 'en'>('mn')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/app-download/`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        })
        if (res.ok) {
          const items = await res.json()
          if (items.length > 0 && items[0].active) {
            setData(items[0])
            // Animate in after a short delay
            setTimeout(() => setIsVisible(true), 100)
          }
        }
      } catch (error) {
        console.error('Error fetching app download data:', error)
      }
    }
    fetchData()
  }, [])

  if (!data) return null

  const sortedTitles = [...data.titles].sort((a, b) => (a.index || 0) - (b.index || 0))
  const sortedLists = [...data.lists].sort((a, b) => (a.index || 0) - (b.index || 0))
  const imageUrl = getImageSrc(data.image_url)

  // Layout logic
  const layout = data.layout || 'standard'
  const isHorizontal = layout === 'standard' || layout === 'reverse'
  const isReverse = layout === 'reverse'
  const isTextTop = layout === 'text-top'
  const isImageTop = layout === 'image-top'
  const featuresLayout = data.features_layout || 'vertical'

  // Features layout classes
  const featuresContainerClass =
    featuresLayout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'
      : featuresLayout === 'horizontal'
        ? 'flex flex-wrap gap-3 sm:gap-4'
        : 'flex flex-col gap-3 sm:gap-4'

  const featureItemClass =
    featuresLayout === 'grid'
      ? 'flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300'
      : featuresLayout === 'horizontal'
        ? 'flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300'
        : 'flex items-center gap-3 group'

  const iconContainerClass =
    featuresLayout === 'grid'
      ? 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0'
      : 'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0'

  const iconSizeClass =
    featuresLayout === 'grid' ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'

  const renderIcon = (item: ListItem) => {
    if (item.icon === 'custom' && item.icon_url) {
      return (
        <img
          src={item.icon_url}
          alt=""
          className={`object-contain ${featuresLayout === 'grid' ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'}`}
        />
      )
    }
    return (
      <span className={`font-semibold ${iconSizeClass}`}>
        {iconMap[item.icon] || '✓'}
      </span>
    )
  }

  // Grid layout classes based on layout type
  const gridClass = isHorizontal
    ? 'grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center'
    : 'flex flex-col gap-10 lg:gap-14 items-center max-w-3xl mx-auto'

  // Order classes
  const textOrder = isHorizontal
    ? (isReverse ? 'lg:order-2 order-last' : 'lg:order-1 order-last')
    : (isTextTop ? 'order-1' : 'order-2')

  const imageOrder = isHorizontal
    ? (isReverse ? 'lg:order-1 order-first' : 'lg:order-2 order-first')
    : (isImageTop ? 'order-1' : 'order-2')

  const textAlign = isHorizontal ? 'text-center lg:text-left' : 'text-center'

  return (
    <section
      className={`relative overflow-hidden py-16 sm:py-20 md:py-28 px-4 sm:px-5 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ backgroundColor: data.bgcolor }}
    >
      {/* Animated background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] sm:w-[420px] md:w-[520px] h-[300px] sm:h-[420px] md:h-[520px] blur-3xl rounded-full animate-pulse"
        style={{ backgroundColor: `${data.iconcolor}12` }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] blur-3xl rounded-full animate-pulse"
        style={{ backgroundColor: `${data.buttonbgcolor}08`, animationDelay: '2s' }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className={gridClass}>

          {/* Phone image */}
          <div className={`flex justify-center ${isHorizontal ? (isReverse ? 'lg:justify-start' : 'lg:justify-end') : ''} relative ${imageOrder}`}>
            <div className="absolute -inset-10 blur-3xl rounded-full" style={{ backgroundColor: `${data.iconcolor}08` }} />
            <img
              src={imageUrl}
              alt="Mobile App"
              className={`relative z-10 w-full drop-shadow-[0_40px_80px_rgba(0,0,0,0.12)] transition-transform duration-500 hover:-translate-y-2 ${
                isHorizontal ? 'max-w-[280px] sm:max-w-[340px] md:max-w-md' : 'max-w-[220px] sm:max-w-[280px] md:max-w-[340px]'
              }`}
            />
          </div>

          {/* Text content */}
          <div className={`flex flex-col gap-6 sm:gap-8 ${textAlign} ${textOrder}`}>

            {/* Scattered headline - mobile: normal flow, desktop: absolute positioned */}
            {/* Mobile: normal stacked text */}
            <div className={`flex flex-wrap gap-x-2 sm:gap-x-3 gap-y-1 md:hidden ${!isHorizontal ? 'justify-center' : ''}`}>
              {sortedTitles.map((t) => (
                <span
                  key={t.id}
                  style={{
                    color: t.color,
                    fontSize: `clamp(${Math.min(t.size || 48, 24)}px, 5vw, ${Math.min(t.size || 48, 36)}px)`,
                    fontWeight: Number(t.fontweight) || 800,
                    lineHeight: 1.2,
                  }}
                >
                  {lang === 'mn' ? t.labelmn : t.labelen}
                </span>
              ))}
            </div>
            {/* Desktop: scattered absolute positioning */}
            <div className={`relative min-h-[260px] sm:min-h-[300px] md:min-h-[340px] hidden md:block`}>
              {sortedTitles.map((t) => (
                <span
                  key={t.id}
                  className="absolute transition-all duration-300"
                  style={{
                    top: `${t.top * 4}px`,
                    left: `${t.left * 4}px`,
                    color: t.color,
                    fontSize: `${t.size || 48}px`,
                    fontWeight: Number(t.fontweight) || 800,
                    transform: `rotate(${t.rotate}deg)`,
                    textShadow: '0 2px 20px rgba(0,0,0,0.05)',
                  }}
                >
                  {lang === 'mn' ? t.labelmn : t.labelen}
                </span>
              ))}
            </div>

            {/* Features - layout dependent */}
            <div className={`${featuresContainerClass} mt-1 sm:mt-2 ${!isHorizontal ? 'max-w-lg mx-auto w-full' : ''}`}>
              {sortedLists.map((item, idx) => (
                <div
                  key={item.id}
                  className={featureItemClass}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div
                    className={`${iconContainerClass} overflow-hidden transition-transform duration-300 group-hover:scale-110`}
                    style={{ backgroundColor: `${data.iconcolor}15`, color: data.iconcolor }}
                  >
                    {renderIcon(item)}
                  </div>
                  <span
                    className={`${featuresLayout === 'grid' ? 'text-xs sm:text-sm md:text-base leading-snug' : 'text-xs sm:text-sm md:text-base'}`}
                    style={{ color: data.fontcolor }}
                  >
                    {lang === 'mn' ? item.labelmn : item.labelen}
                  </span>
                </div>
              ))}
            </div>

            {/* Download Buttons */}
            <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6 ${isHorizontal ? 'justify-center lg:justify-start' : 'justify-center'}`}>
              {data.appstore && (
                <a
                  href={data.appstore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 sm:gap-3 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-xl hover:opacity-90 hover:-translate-y-0.5 text-sm sm:text-base"
                  style={{ backgroundColor: data.buttonbgcolor, color: data.buttonfontcolor }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                </a>
              )}

              {data.playstore && (
                <a
                  href={data.playstore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 sm:gap-3 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-medium transition-all duration-300 border hover:opacity-80 hover:-translate-y-0.5 text-sm sm:text-base"
                  style={{
                    backgroundColor: data.googlebuttonbgcolor || 'transparent',
                    color: data.googlebuttonfontcolor,
                    borderColor: `${data.googlebuttonfontcolor}30`,
                  }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
                  </svg>
                  Google Play
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
