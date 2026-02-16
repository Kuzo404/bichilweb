import type { Metadata } from 'next'

const API_BASE = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

interface NewsAPIItem {
  id: number
  slug: string
  image: string
  image_url?: string
  title_translations: { language: number; label: string }[]
  shortdesc_translations: { language: number; label: string }[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params

  try {
    const res = await fetch(`${API_BASE}/news/`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('Failed to fetch')

    const items: NewsAPIItem[] = await res.json()
    const item = items.find(
      (n) => (n.slug || `news-${n.id}`) === id
    )

    if (!item) return { title: 'Мэдээ олдсонгүй' }

    const titleMn = item.title_translations?.find((t) => t.language === 1)
    const titleEn = item.title_translations?.find((t) => t.language === 2)
    const excerptMn = item.shortdesc_translations?.find((t) => t.language === 1)
    const excerptEn = item.shortdesc_translations?.find((t) => t.language === 2)

    const title = stripHtml(titleMn?.label || titleEn?.label || 'News')
    const description = stripHtml(excerptMn?.label || excerptEn?.label || '')
    let imageUrl = item.image_url || item.image || ''
    
    // Ensure absolute URL for OG image
    if (imageUrl && !imageUrl.startsWith('http')) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bichilglobus.mn'
      imageUrl = `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
        type: 'article',
        siteName: 'BichilGlobus',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return {
      title: 'BichilGlobus - Мэдээ',
      description: 'BichilGlobus мэдээ мэдээлэл',
    }
  }
}

export default function NewsDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
