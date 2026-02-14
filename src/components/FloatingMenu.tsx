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

// Django backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

export default function FloatingMenu() {
  const { language } = useLanguage()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [menuData, setMenuData] = useState<FloatMenuItem[]>([])
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
    fetchMenuData()
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
  if (menuData.length === 0) return null

  return (
    <div ref={menuRef} className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 px-3 sm:px-4">
      {/* ============================================================ */}
      {/* Dropdown — scroll container-ийн ГАДНА render хийнэ            */}
      {/* overflow-x-auto нь dropdown-г хайчилж байсан тул fixed байрлал */}
      {/* ============================================================ */}
      {activeMenuData && activeMenuData.submenus.length > 0 && dropdownPos && (
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
          </div>
        </div>
      )}

      {/* Баруун зүүн гүйлгэдэг scroll container — зөвхөн товчнууд */}
      <div
        ref={scrollRef}
        className="flex justify-center overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="flex items-center gap-2 sm:gap-3 px-1">
          {menuData.map((menu) => (
            <div key={menu.id} className="flex-shrink-0">
              <button
                ref={(el) => { if (el) buttonRefs.current.set(menu.id, el) }}
                onClick={() => toggleMenu(String(menu.id))}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full backdrop-blur-sm hover:opacity-90 transition-all border border-gray-200 whitespace-nowrap select-none"
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
                <span className="text-xs sm:text-sm font-medium">
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
