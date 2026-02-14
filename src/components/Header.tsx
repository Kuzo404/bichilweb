'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchPublishedPages, getTranslation, type PageData } from '@/lib/pagesApi'
import axiosInstance from '@/config/axiosConfig'
import { fetchHeaderFromDB, type FrontendMenuItem, type FrontendHeaderStyle } from '@/lib/headerApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubMenuItem {
  title_mn: string
  title_en: string
  href: string
}

interface MenuItem {
  title_mn: string
  title_en: string
  href?: string
  items?: SubMenuItem[]
  subMenus?: Record<string, SubMenuItem[]>
}

// /categories/ API
interface ApiTranslation {
  language: number
  label: string
}
interface ApiProduct {
  id: number
  translations: ApiTranslation[]
}
interface ApiProductType {
  id: number
  translations: ApiTranslation[]
  products: ApiProduct[]
}
interface ApiCategory {
  id: number
  translations: ApiTranslation[]
  product_types: ApiProductType[]
}

// /services/ API
interface ApiServiceTranslation {
  id?: number
  language: number
  title: string
  description?: string | null
}
interface ApiService {
  id: number
  translations: ApiServiceTranslation[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTrans = (translations: ApiTranslation[], langId: number): string =>
  translations.find(t => t.language === langId)?.label || ''

const getSvcTitle = (translations: ApiServiceTranslation[], langId: number): string =>
  translations.find(t => t.language === langId)?.title || ''

// ─── Статик fallback цэснүүд (DB хоосон бол ашиглана) ──────────────────────

const getStaticMenuItems = (
  serviceItems: SubMenuItem[],
  dynamicPages: SubMenuItem[]
): MenuItem[] => {
  const items: MenuItem[] = []

  // Үйлчилгээ (DB-ээс татсан)
  if (serviceItems.length > 0) {
    items.push({
      title_mn: 'Үйлчилгээ',
      title_en: 'Services',
      items: serviceItems,
    })
  }

  // Хуудсууд (DB-ээс татсан)
  if (dynamicPages.length > 0) {
    items.push({
      title_mn: 'Хуудсууд',
      title_en: 'Pages',
      items: dynamicPages,
    })
  }

  return items
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header() {
  const { language, setLanguage } = useLanguage()

  const [mobileOpen,              setMobileOpen]              = useState(false)
  const [activeDropdown,          setActiveDropdown]          = useState<number | null>(null)
  const [activeSubDropdown,       setActiveSubDropdown]       = useState<string | null>(null)
  const [mobileActiveDropdown,    setMobileActiveDropdown]    = useState<number | null>(null)
  const [mobileActiveSubDropdown, setMobileActiveSubDropdown] = useState<string | null>(null)
  const [langOpen,                setLangOpen]                = useState(false)
  const [scrolled,                setScrolled]                = useState(false)
  const [dynamicPages,            setDynamicPages]            = useState<SubMenuItem[]>([])
  const [pagesLoading,            setPagesLoading]            = useState(false)
  const [categoryMenuItems,       setCategoryMenuItems]       = useState<MenuItem[]>([])
  const [serviceItems,            setServiceItems]            = useState<SubMenuItem[]>([])
  const [adminHeaderMenu,         setAdminHeaderMenu]         = useState<MenuItem[]>([])
  const [adminMenuLoading,        setAdminMenuLoading]        = useState(false)
  // Өгөгдлийн сангаас ирсэн header стиль (лого URL-тай)
  const [adminHeaderStyle,        setAdminHeaderStyle]        = useState<FrontendHeaderStyle | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const langRef     = useRef<HTMLDivElement>(null)

  // ── /categories/ татах ───────────────────────────────────────────────────

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get<ApiCategory[]>('/categories/')
        if (res.status !== 200) return

        const items: MenuItem[] = res.data.map((category) => {
          const subMenus: Record<string, SubMenuItem[]> = {}

          const typeItems: SubMenuItem[] = category.product_types.map((pt) => {
            const labelMn = getTrans(pt.translations, 2)
            const labelEn = getTrans(pt.translations, 1)

            if (pt.products.length > 0) {
              const productLinks: SubMenuItem[] = pt.products.map((p) => ({
                title_mn: getTrans(p.translations, 2),
                title_en: getTrans(p.translations, 1),
                href:     `/products/${p.id}`,
              }))
              subMenus[labelMn] = productLinks
              subMenus[labelEn] = productLinks
            }

            return {
              title_mn: labelMn,
              title_en: labelEn,
              href: pt.products.length === 0 ? `/products/type/${pt.id}` : '#',
            }
          })

          return {
            title_mn: getTrans(category.translations, 2),
            title_en: getTrans(category.translations, 1),
            items:    typeItems,
            subMenus,
          }
        })

        setCategoryMenuItems(items)
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }

    fetchCategories()
  }, [])

  // ── Өгөгдлийн сангаас header цэс татах (Django backend) ──────────────────

  useEffect(() => {
    const loadHeaderFromDB = async () => {
      setAdminMenuLoading(true)
      try {
        // Django backend-аас header мэдээлэл шууд татна
        const result = await fetchHeaderFromDB()
        if (result && result.menuItems.length > 0) {
          setAdminHeaderMenu(result.menuItems)
        }
        // Өгөгдлийн сангаас ирсэн стиль (лого URL-тай) хадгалах
        if (result?.style) {
          setAdminHeaderStyle(result.style)
        }
      } catch (err) {
        console.error('Header өгөгдөл татахад алдаа:', err)
      } finally {
        setAdminMenuLoading(false)
      }
    }

    loadHeaderFromDB()
  }, [])

  // ── /services/ татах ─────────────────────────────────────────────────────

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axiosInstance.get<ApiService[]>('/services/')
        if (res.status !== 200) return

        const items: SubMenuItem[] = res.data.map((svc) => ({
          title_mn: getSvcTitle(svc.translations, 2),
          title_en: getSvcTitle(svc.translations, 1),
          href:     `/services/${svc.id}`,
        }))

        setServiceItems(items)
      } catch (err) {
        console.error('Error fetching services:', err)
      }
    }

    fetchServices()
  }, [])

  // ── Dynamic pages татах ───────────────────────────────────────────────────

  useEffect(() => {
    const loadPages = async () => {
      setPagesLoading(true)
      try {
        const pages = await fetchPublishedPages()
        const pagesItems = pages.map((page: PageData) => ({
          title_mn: getTranslation(page.title_translations, 1).label,
          title_en: getTranslation(page.title_translations, 2).label,
          href:     `/pages/${(page.url || '').replace(/^\//, '')}`,
        }))
        setDynamicPages(pagesItems)
      } catch (error) {
        console.error('Error loading pages:', error)
        setDynamicPages([])
      } finally {
        setPagesLoading(false)
      }
    }
    loadPages()
  }, [language])

  // categories эхэнд → services → бусад статик цэснүүд
  // If admin menu is available, use it; otherwise build dynamically
  const menuItems: MenuItem[] = adminHeaderMenu.length > 0 
    ? adminHeaderMenu 
    : [
        ...categoryMenuItems,
        ...getStaticMenuItems(serviceItems, dynamicPages),
      ]

  // ── Scroll ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 6)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ── Click outside ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
        setActiveSubDropdown(null)
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] z-[99999]" style={{ maxWidth: adminHeaderStyle?.maxWidth || '1240px' }}>
        <header
          className={`w-full rounded-2xl transition-all duration-300 border ${
            scrolled
              ? 'bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border-white/50'
              : 'bg-white/70 backdrop-blur-lg shadow-[0_4px_24px_rgba(0,0,0,0.08)] border-white/40'
          }`}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 lg:h-16">

              {/* Logo + Desktop Nav */}
              <div className="flex items-center gap-6 lg:gap-8">
                <Link href="/" className="flex items-center">
                  <div className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: `${adminHeaderStyle?.logoSize || 44}px`, height: `${adminHeaderStyle?.logoSize || 44}px` }}>
                    {/* Лого: өгөгдлийн сангаас татсан URL ашиглана, байхгүй бол анхдагч зураг */}
                    <Image
                      src={
                        adminHeaderStyle?.logoUrl
                          ? adminHeaderStyle.logoUrl.startsWith('/media')
                            ? `${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${adminHeaderStyle.logoUrl}`
                            : adminHeaderStyle.logoUrl.startsWith('blob:')
                              ? '/images/logo.jpg'
                              : adminHeaderStyle.logoUrl
                          : '/images/logo.jpg'
                      }
                      alt="Logo"
                      width={adminHeaderStyle?.logoSize || 44}
                      height={adminHeaderStyle?.logoSize || 44}
                      className="object-cover"
                    />
                  </div>
                </Link>

                <nav className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
                  {menuItems.map((item, index) => {
                    const itemSubMenus = item.subMenus || {}

                    return (
                      <div
                        key={index}
                        className="relative"
                        onMouseEnter={() => item.items && item.items.length > 0 && setActiveDropdown(index)}
                        onMouseLeave={() => {
                          if (!item.items) return
                          setActiveDropdown(null)
                          setActiveSubDropdown(null)
                        }}
                      >
                        {item.items ? (
                          <>
                            <button
                              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeDropdown === index
                                  ? 'bg-gray-100 text-teal-600'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-teal-600'
                              } ${item.items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={item.items.length === 0}
                            >
                              {language === 'mn' ? item.title_mn : item.title_en}
                              {item.items.length > 0 && (
                                <svg
                                  className={`w-4 h-4 transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              )}
                              {item.title_en === 'Pages' && pagesLoading && (
                                <svg className="animate-spin h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              )}
                            </button>

                            {/* 2-р түвшний dropdown */}
                            {activeDropdown === index && item.items.length > 0 && (
                              <div className="absolute top-full left-0 pt-2 w-72">
                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                                  {item.items.map((subItem, subIndex) => {
                                    const key = language === 'mn' ? subItem.title_mn : subItem.title_en
                                    const hasSubMenu = !!itemSubMenus[key]

                                    return (
                                      <div
                                        key={subIndex}
                                        className="relative"
                                        onMouseEnter={() => hasSubMenu && setActiveSubDropdown(key)}
                                      >
                                        {hasSubMenu ? (
                                          <div
                                            className={`flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer ${
                                              activeSubDropdown === key ? 'bg-gray-50' : ''
                                            }`}
                                          >
                                            <span className="text-sm font-medium text-gray-900">
                                              {language === 'mn' ? subItem.title_mn : subItem.title_en}
                                            </span>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                          </div>
                                        ) : (
                                          <Link
                                            href={subItem.href}
                                            className="block px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-900 hover:text-teal-600"
                                            onClick={() => { setActiveDropdown(null); setActiveSubDropdown(null) }}
                                          >
                                            {language === 'mn' ? subItem.title_mn : subItem.title_en}
                                          </Link>
                                        )}

                                        {/* 3-р түвшний dropdown */}
                                        {activeSubDropdown === key && itemSubMenus[key] && (
                                          <div className="absolute left-full top-0 pl-2 w-64">
                                            <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                                              {itemSubMenus[key].map((nestedItem, nestedIndex) => (
                                                <Link
                                                  key={nestedIndex}
                                                  href={nestedItem.href}
                                                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-teal-600"
                                                  onClick={() => { setActiveDropdown(null); setActiveSubDropdown(null) }}
                                                >
                                                  {language === 'mn' ? nestedItem.title_mn : nestedItem.title_en}
                                                </Link>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href || '#'}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors"
                          >
                            {language === 'mn' ? item.title_mn : item.title_en}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </nav>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-2">

                {/* Language Selector */}
                <div className="relative" ref={langRef}>
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                    aria-label="Хэл сонгох"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{language === 'mn' ? 'MN' : 'EN'}</span>
                    <svg className={`w-3 h-3 text-gray-500 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {langOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2">
                      <button
                        onClick={() => { setLanguage('mn'); setLangOpen(false) }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                          language === 'mn' ? 'text-teal-600 bg-teal-50 hover:bg-teal-100' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇲🇳</span>Монгол
                      </button>
                      <button
                        onClick={() => { setLanguage('en'); setLangOpen(false) }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                          language === 'en' ? 'text-teal-600 bg-teal-50 hover:bg-teal-100' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">🇺🇸</span>English
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="lg:hidden p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Цэс"
                >
                  {mobileOpen ? (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileOpen && (
              <div className="lg:hidden py-4 border-t border-gray-100">
                <nav className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {menuItems.map((item, index) => {
                    const itemSubMenus = item.subMenus || {}

                    return (
                      <div key={index}>
                        {item.items && item.items.length > 0 ? (
                          <div>
                            <button
                              onClick={() => setMobileActiveDropdown(mobileActiveDropdown === index ? null : index)}
                              className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-50/80 rounded-lg"
                            >
                              <span className="font-medium">{language === 'mn' ? item.title_mn : item.title_en}</span>
                              <svg
                                className={`w-5 h-5 transition-transform duration-200 ${mobileActiveDropdown === index ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {mobileActiveDropdown === index && (
                              <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                {item.items.map((subItem, subIndex) => {
                                  const key = language === 'mn' ? subItem.title_mn : subItem.title_en
                                  const hasSubMenu = !!itemSubMenus[key]

                                  return (
                                    <div key={subIndex}>
                                      {hasSubMenu ? (
                                        <>
                                          <button
                                            onClick={() => setMobileActiveSubDropdown(mobileActiveSubDropdown === key ? null : key)}
                                            className="flex items-center justify-between w-full px-4 py-2.5 text-gray-600 hover:bg-gray-50/80 rounded-lg"
                                          >
                                            <span className="text-sm">{language === 'mn' ? subItem.title_mn : subItem.title_en}</span>
                                            <svg
                                              className={`w-4 h-4 transition-transform duration-200 ${mobileActiveSubDropdown === key ? 'rotate-90' : ''}`}
                                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                          </button>

                                          {mobileActiveSubDropdown === key && (
                                            <div className="pl-4 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                              {itemSubMenus[key].map((nestedItem, nestedIndex) => (
                                                <Link
                                                  key={nestedIndex}
                                                  href={nestedItem.href}
                                                  className="block px-4 py-2 text-sm text-gray-500 hover:text-teal-600 hover:bg-gray-50/80 rounded-lg"
                                                  onClick={() => { setMobileOpen(false); setMobileActiveDropdown(null); setMobileActiveSubDropdown(null) }}
                                                >
                                                  {language === 'mn' ? nestedItem.title_mn : nestedItem.title_en}
                                                </Link>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <Link
                                          href={subItem.href}
                                          className="block px-4 py-2.5 text-sm text-gray-600 hover:text-teal-600 hover:bg-gray-50/80 rounded-lg"
                                          onClick={() => { setMobileOpen(false); setMobileActiveDropdown(null) }}
                                        >
                                          {language === 'mn' ? subItem.title_mn : subItem.title_en}
                                        </Link>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={item.href || '#'}
                            className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50/80 rounded-lg"
                            onClick={() => setMobileOpen(false)}
                          >
                            {language === 'mn' ? item.title_mn : item.title_en}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </nav>
              </div>
            )}
          </div>
        </header>
      </div>
    </>
  )
}