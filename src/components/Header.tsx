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
        if (res.status !== 200 || !Array.isArray(res.data)) {
          console.error('Invalid response format:', res.data);
          return;
        }

        const items: MenuItem[] = res.data.map((category) => {
          const subMenus: Record<string, SubMenuItem[]> = {};

          const typeItems: SubMenuItem[] = Array.isArray(category.product_types) ? category.product_types.map((pt) => {
            const labelMn = getTrans(pt.translations, 2);
            const labelEn = getTrans(pt.translations, 1);

            if (Array.isArray(pt.products) && pt.products.length > 0) {
              const productLinks: SubMenuItem[] = pt.products.map((p) => ({
                title_mn: getTrans(p.translations, 2),
                title_en: getTrans(p.translations, 1),
                href:     `/products/${p.id}`,
              }));
              subMenus[labelMn] = productLinks;
              subMenus[labelEn] = productLinks;
            }

            return {
              title_mn: labelMn,
              title_en: labelEn,
              href: pt.products && pt.products.length === 0 ? `/products/type/${pt.id}` : '#',
            };
          }) : [];

          return {
            title_mn: getTrans(category.translations, 2),
            title_en: getTrans(category.translations, 1),
            items:    typeItems,
            subMenus,
          };
        });

        setCategoryMenuItems(items);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
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
  // Admin-аас удирдсан цэс байвал ашиглана, байхгүй бол динамик цэс
  const menuItems: MenuItem[] = adminHeaderMenu.length > 0 
    ? adminHeaderMenu 
    : [
        ...categoryMenuItems,
        ...getStaticMenuItems(serviceItems, dynamicPages),
      ]

  // DB-д өгөгдөл байхгүй үед default menu харуулахгүй, хоосон байна
  const shouldRenderMenu = menuItems.length > 0 && menuItems.some(item => {
    // Хэрвээ бүх item нь хоосон бол render хийхгүй
    if (item.items && item.items.length > 0) return true
    if (item.href) return true
    return false
  })

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

  if (!shouldRenderMenu) return null

  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] z-99999" style={{ maxWidth: adminHeaderStyle?.maxWidth || '1240px' }}>
        {/* Бүх header render хэсэг өөрчлөгдөөгүй байхюм хоомон орихлоо*/}
      </div>
    </>
  )
}