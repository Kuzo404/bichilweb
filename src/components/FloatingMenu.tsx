'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

// ============================================================================
// Django-аас ирэх өгөгдлийн бүтэц
// ============================================================================
interface FloatMenuTranslation {
  id: number
  language: number      // 1=EN, 2=MN
  language_code: string
  label: string
}

interface SubmenuTranslation {
  id: number
  language: number
  language_code: string
  title: string
}

interface FloatMenuSubmenu {
  id: number
  url: string
  file: string | null
  file_url: string | null
  svg: string
  fontfamily: string
  bgcolor: string
  fontcolor: string
  translations: SubmenuTranslation[]
}

interface FloatMenuItem {
  id: number
  iconcolor: string
  fontfamily: string
  bgcolor: string
  fontcolor: string
  image: string | null
  image_url: string | null
  svg: string
  translations: FloatMenuTranslation[]
  submenus: FloatMenuSubmenu[]
}

interface SocialLink {
  id: number
  platform: string
  url: string
  hover_color: string
  sort_order: number
  active: boolean
}

// Django backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

export default function FloatingMenu() {
  const { language } = useLanguage()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [menuData, setMenuData] = useState<FloatMenuItem[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [hoveredSocial, setHoveredSocial] = useState<number | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ bottom: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  // Drag/swipe гүйлгэх state
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  // ============================================================================
  // Өгөгдлийн сангаас floating menu татах
  // ============================================================================
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/float-menu/`, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
        })
        if (res.ok) {
          const data = await res.json()
          setMenuData(data)
        }
      } catch (error) {
        console.error('Floating menu татахад алдаа:', error)
      }
    }
    const fetchSocials = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/float-menu-socials/`, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
        })
        if (res.ok) {
          const data = await res.json()
          setSocialLinks(data.filter((s: SocialLink) => s.active))
        }
      } catch (error) {
        console.error('Social links татахад алдаа:', error)
      }
    }
    fetchMenuData()
    fetchSocials()
  }, [])

  // Гадна дарахад цэс хаах
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
        setDropdownPos(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ============================================================================
  // Mouse drag гүйлгэх (Desktop) — ref ашиглан click/drag ялгах
  // ============================================================================
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDraggingRef.current = true
    hasDraggedRef.current = false
    startXRef.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = x - startXRef.current
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk
  }, [])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  // ============================================================================
  // Touch swipe гүйлгэх (Mobile)
  // ============================================================================
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return
    hasDraggedRef.current = false
    startXRef.current = e.touches[0].pageX - scrollRef.current.offsetLeft
    scrollLeftRef.current = scrollRef.current.scrollLeft
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft
    const walk = x - startXRef.current
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk
  }, [])

  const toggleMenu = (menuId: string) => {
    // drag хийж байх үед цэс нээхгүй
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }
    if (activeMenu === menuId) {
      setActiveMenu(null)
      setDropdownPos(null)
    } else {
      setActiveMenu(menuId)
      // Товчны байрлалыг авч dropdown-г яг дээр нь байрлуулна
      const btn = buttonRefs.current.get(Number(menuId))
      if (btn) {
        const rect = btn.getBoundingClientRect()
        setDropdownPos({
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left + rect.width / 2,
        })
      }
    }
  }

  // Хэлний дагуу орчуулга авах helper
  const getLangId = () => (language === 'mn' ? 2 : 1)

  const getMenuLabel = (menu: FloatMenuItem) => {
    const langId = getLangId()
    const translation = menu.translations.find(t => t.language === langId)
    return translation?.label || menu.translations[0]?.label || ''
  }

  const getSubmenuTitle = (submenu: FloatMenuSubmenu) => {
    const langId = getLangId()
    const translation = submenu.translations.find(t => t.language === langId)
    return translation?.title || submenu.translations[0]?.title || ''
  }

  // Идэвхтэй цэсний submenu олох
  const activeMenuData = activeMenu ? menuData.find(m => String(m.id) === activeMenu) : null

  // Өгөгдөл байхгүй бол юу ч харуулахгүй
  if (menuData.length === 0 && socialLinks.length === 0) return null

  // Social icon SVG map
  const socialIcons: Record<string, React.ReactNode> = {
    facebook: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    instagram: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    x: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    linkedin: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    telegram: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
    tiktok: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
    youtube: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  }

  return (
    <div ref={menuRef} className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 px-3 sm:px-4">
      {/* ============================================================ */}
      {/* Dropdown — submenus + social links                           */}
      {/* ============================================================ */}
      {activeMenuData && dropdownPos && ((activeMenuData.submenus?.length > 0) || socialLinks.length > 0) && (
        <div
          className="fixed z-[60] transition-all duration-200 opacity-100"
          style={{
            bottom: `${dropdownPos.bottom}px`,
            left: `${dropdownPos.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-white rounded-xl shadow-xl p-2 min-w-[160px] border border-gray-100">
            {activeMenuData.submenus.map((submenu) => (
              <Link
                key={submenu.id}
                href={submenu.url || '#'}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group whitespace-nowrap"
                style={{
                  backgroundColor: submenu.bgcolor || undefined,
                  color: submenu.fontcolor || undefined,
                  fontFamily: submenu.fontfamily || undefined,
                }}
                onClick={() => { setActiveMenu(null); setDropdownPos(null) }}
              >
                {submenu.svg ? (
                  <span
                    className="w-5 h-5 flex-shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full text-gray-500 group-hover:text-teal-600"
                    dangerouslySetInnerHTML={{ __html: submenu.svg }}
                  />
                ) : submenu.file_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${submenu.file_url}`}
                    alt=""
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-teal-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {getSubmenuTitle(submenu)}
                </span>
              </Link>
            ))}

            {/* Social Links — dropdown дотор */}
            {socialLinks.length > 0 && (
              <>
                {activeMenuData.submenus.length > 0 && (
                  <div className="border-t border-gray-100 mt-1 mb-1" />
                )}
                <div className="px-3 py-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Social</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    {socialLinks
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((social) => (
                        <a
                          key={social.id}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border border-gray-200 hover:shadow-md"
                          style={{
                            backgroundColor: hoveredSocial === social.id ? social.hover_color : '#ffffff',
                            color: hoveredSocial === social.id ? '#ffffff' : '#6b7280',
                          }}
                          onMouseEnter={() => setHoveredSocial(social.id)}
                          onMouseLeave={() => setHoveredSocial(null)}
                          title={social.platform}
                        >
                          {socialIcons[social.platform] || (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          )}
                        </a>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Бүлэг товчнууд — Desktop: 6, Mobile: 2 + scroll              */}
      {/* ============================================================ */}
      <div className="max-w-5xl mx-auto">
        <style>{`
          .float-menu-item { width: calc((100% - 8px) / 2); }
          @media (min-width: 640px) {
            .float-menu-item { width: calc((100% - 60px) / 6); }
          }
        `}</style>
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-2 sm:gap-3 cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {menuData.map((menu) => (
            <div
              key={menu.id}
              className="float-menu-item flex-none snap-start"
            >
              <button
                ref={(el) => { if (el) buttonRefs.current.set(menu.id, el) }}
                onClick={() => toggleMenu(String(menu.id))}
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 py-2 sm:px-3 sm:py-2.5 rounded-full backdrop-blur-sm hover:opacity-90 transition-all border border-gray-200 whitespace-nowrap select-none"
                style={{
                  backgroundColor: menu.bgcolor || '#ffffff',
                  color: menu.fontcolor || '#374151',
                  fontFamily: menu.fontfamily || undefined,
                }}
              >
                {menu.svg ? (
                  <span
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    style={{ color: menu.iconcolor || '#0d9488' }}
                    dangerouslySetInnerHTML={{ __html: menu.svg }}
                  />
                ) : menu.image_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${menu.image_url}`}
                    alt=""
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 object-contain"
                  />
                ) : (
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                    fill="none"
                    stroke={menu.fontcolor || '#374151'}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                )}
                <span className="text-xs sm:text-sm font-medium truncate">
                  {getMenuLabel(menu)}
                </span>
                <svg
                  className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${
                    activeMenu === String(menu.id) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
