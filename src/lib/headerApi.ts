// ============================================================================
// HEADER API - Django backend-аас шууд дуудна
// ============================================================================
// Тогтмол өгөгдөл байхгүй - бүх header мэдээллийг PostgreSQL-ээс авна.
// Frontend → Django backend (/api/v1/headers/) → PostgreSQL
// Admin panel дундуур дамжихгүй - шууд Django backend руу хандана.
// ============================================================================

import axios from 'axios';

// ── Django backend-ийн бүтцийн тодорхойлолт ──

// Орчуулгын бүтэц (хэл тус бүрд нэг)
interface ApiTranslation {
  id?: number
  label: string
  language_id: number // 1 = Англи, 2 = Монгол
}

// 3-р түвшний цэс (гуравдагч)
interface ApiTertiaryMenu {
  id: number
  path: string
  font: string
  index: number
  visible: number
  translations: ApiTranslation[]
}

// 2-р түвшний цэс (дэд цэс)
interface ApiSubmenu {
  id: number
  path: string
  font: number | string
  index: number
  visible: number
  translations: ApiTranslation[]
  tertiary_menus: ApiTertiaryMenu[]
}

// 1-р түвшний цэс (үндсэн цэс)
interface ApiMenu {
  id: number
  path: string
  font: number | string
  index: number
  visible: number
  translations: ApiTranslation[]
  submenus: ApiSubmenu[]
}

// Стиль
interface ApiHeaderStyle {
  id: number
  bgcolor: string
  fontcolor: string
  hovercolor: string
  height: number
  sticky: number
}

// Header бүтэц (Django-ийн `/api/v1/headers/` endpoint-аас ирэх)
interface ApiHeaderData {
  id: number
  logo: string
  active: number
  styles: ApiHeaderStyle[]
  menus: ApiMenu[]
}

// ── Frontend-д хэрэглэх бүтцийн тодорхойлолт ──

export interface FrontendSubMenuItem {
  title_mn: string
  title_en: string
  href: string
}

export interface FrontendMenuItem {
  title_mn: string
  title_en: string
  href?: string
  items?: FrontendSubMenuItem[]
  subMenus?: Record<string, FrontendSubMenuItem[]>
}

export interface FrontendHeaderStyle {
  backgroundColor: string
  textColor: string
  hoverColor: string
  height: string
  isSticky: boolean
  logoUrl: string
  maxWidth: string
  logoSize: number
}

export interface FrontendHeaderData {
  menuItems: FrontendMenuItem[]
  style: FrontendHeaderStyle | null
}

// ============================================================================
// Орчуулгаас текст авах туслах функц
// ============================================================================
const getLabelByLang = (translations: ApiTranslation[], langId: number): string => {
  return translations?.find(t => t.language_id === langId)?.label || ''
}

// ============================================================================
// Django backend-аас header өгөгдөл татах
// ============================================================================
// Django-ийн /api/v1/headers/ нь header + menus + submenus + tertiary_menus
// + translations + styles бүгдийг nested JSON байдлаар буцаадаг.
// Энэ функц нь тэр бүтцийг frontend-д тохирох хэлбэрт хөрвүүлнэ.
// ============================================================================
export const fetchHeaderFromDB = async (): Promise<FrontendHeaderData | null> => {
  try {
    // Django backend-ийн URL хаяг
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

    const response = await axios.get<ApiHeaderData[]>(`${backendUrl}/headers/`, {
      timeout: 5000,
    })

    if (response.status !== 200 || !response.data) {
      return null
    }

    // Django жагсаалт буцаадаг - эхний header авна
    const headers = response.data
    if (!Array.isArray(headers) || headers.length === 0) {
      return null
    }

    const headerData = headers[0]
    return transformApiToFrontend(headerData)
  } catch (error) {
    console.error('Header өгөгдөл татахад алдаа:', error)
    return null
  }
}

// ============================================================================
// Django-ийн nested бүтцийг frontend-ийн бүтэц рүү хөрвүүлэх
// ============================================================================
// Django бүтэц:
//   header.menus[].submenus[].tertiary_menus[] (тус бүр translations[]-тай)
// Frontend бүтэц:
//   MenuItem[].items[] (SubMenuItem[]) + subMenus (Record<string, SubMenuItem[]>)
// ============================================================================
const transformApiToFrontend = (data: ApiHeaderData): FrontendHeaderData => {
  const menus = data.menus || []

  // Цэснүүдийг index-ээр нь эрэмбэлэх
  const sortedMenus = [...menus].sort((a, b) => a.index - b.index)

  const menuItems: FrontendMenuItem[] = sortedMenus
    .filter(menu => menu.visible === 1) // Зөвхөн идэвхтэй цэснүүд
    .map(menu => {
      const titleMn = getLabelByLang(menu.translations, 2)
      const titleEn = getLabelByLang(menu.translations, 1)

      const submenus = (menu.submenus || [])
        .filter(sub => sub.visible === 1)
        .sort((a, b) => a.index - b.index)

      // Хэрэв дэд цэсгүй бол шууд линк
      if (submenus.length === 0) {
        return {
          title_mn: titleMn,
          title_en: titleEn,
          href: menu.path !== '#' ? menu.path : undefined,
        } as FrontendMenuItem
      }

      // Дэд цэснүүдийг хөрвүүлэх
      const items: FrontendSubMenuItem[] = submenus.map(sub => ({
        title_mn: getLabelByLang(sub.translations, 2),
        title_en: getLabelByLang(sub.translations, 1),
        href: sub.path || '#',
      }))

      // 3-р түвшний цэснүүдийг subMenus (Record) руу хөрвүүлэх
      // Түлхүүр = дэд цэсний нэр, утга = гуравдагч цэснүүдийн жагсаалт
      const subMenus: Record<string, FrontendSubMenuItem[]> = {}
      submenus.forEach(sub => {
        const tertiaryMenus = (sub.tertiary_menus || [])
          .filter(t => t.visible === 1)
          .sort((a, b) => a.index - b.index)

        if (tertiaryMenus.length > 0) {
          const subLabelMn = getLabelByLang(sub.translations, 2)
          const subLabelEn = getLabelByLang(sub.translations, 1)

          const tertiaryItems = tertiaryMenus.map(t => ({
            title_mn: getLabelByLang(t.translations, 2),
            title_en: getLabelByLang(t.translations, 1),
            href: t.path || '#',
          }))

          // Монгол болон Англи хэл дээрх түлхүүрүүдийг хоёуланг нь нэмнэ
          if (subLabelMn) subMenus[subLabelMn] = tertiaryItems
          if (subLabelEn) subMenus[subLabelEn] = tertiaryItems
        }
      })

      return {
        title_mn: titleMn,
        title_en: titleEn,
        items,
        subMenus: Object.keys(subMenus).length > 0 ? subMenus : undefined,
      } as FrontendMenuItem
    })

  // Стиль хөрвүүлэх
  let style: FrontendHeaderStyle | null = null
  if (data.styles && data.styles.length > 0) {
    const s = data.styles[0]
    style = {
      backgroundColor: s.bgcolor || '#ffffff',
      textColor: s.fontcolor || '#1f2937',
      hoverColor: s.hovercolor || '#0d9488',
      height: `${s.height || 80}px`,
      isSticky: s.sticky === 1,
      logoUrl: data.logo || '',
      maxWidth: s.max_width || '1240px',
      logoSize: s.logo_size || 44,
    }
  }

  return { menuItems, style }
}

// ============================================================================
// Хуучин нэрс (backward compatibility)
// ============================================================================
// Хуучин код дуудаж байвал энэ функц ашиглана
export const fetchAdminHeaderMenu = async (): Promise<FrontendMenuItem[] | null> => {
  const result = await fetchHeaderFromDB()
  return result?.menuItems || null
}
