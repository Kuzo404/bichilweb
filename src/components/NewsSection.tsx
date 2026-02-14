'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { axiosInstance } from '@/lib/axios'
import { useLanguage } from '@/contexts/LanguageContext'

interface ApiTranslation {
  language: number 
  label: string
  font: string
  family: string
  weight: string
  size: string
}

interface ApiImage {
  image: string
}

interface ApiSocial {
  social: string
  icon: string
}

interface ApiNewsItem {
  id: number
  category: number
  image: string 
  image_url?: string
  video: string
  feature: boolean
  render: boolean
  show_on_home: boolean
  readtime: number
  slug: string
  date: string
  images: ApiImage[]
  socials: ApiSocial[]
  title_translations: ApiTranslation[]
  shortdesc_translations: ApiTranslation[]
  content_translations: ApiTranslation[]
}

interface CategoryTranslation {
  id: number
  language: number
  label: string
}

interface CategoryAPI {
  id: number
  translations: CategoryTranslation[]
}

interface NewsItem {
  id: number
  title: string
  slug: string
  bannerImage: string
  category: number
  publishedAt: string
  readTime: number
  isPinnedNews: boolean
  showOnHome: boolean
}

interface Category {
  id: number
  label: string
}

const getTranslation = (translations: ApiTranslation[], language: number): ApiTranslation | undefined => {
  return translations.find(t => t.language === language)
}

const getCategoryTranslation = (translations: CategoryTranslation[], language: number): CategoryTranslation | undefined => {
  return translations.find(t => t.language === language)
}

const mapAPICategoryToCategory = (apiCategory: CategoryAPI, languageId: number): Category => {
  const translation = getCategoryTranslation(apiCategory.translations, languageId)
  return {
    id: apiCategory.id,
    label: translation?.label || '',
  }
}

const mapApiNewsToFrontend = (item: ApiNewsItem, languageId: number): NewsItem => {
  const titleTranslation = getTranslation(item.title_translations, languageId)
  const imageUrl = item.image_url || item.image || '/placeholder-news.jpg'

  return {
    id: item.id,
    title: titleTranslation?.label || '',
    slug: item.slug || `news-${item.id}`,
    bannerImage: imageUrl,
    category: item.category,
    publishedAt: item.date,
    readTime: item.readtime || 5,
    isPinnedNews: item.feature || false,
    showOnHome: item.show_on_home || false,
  }
}

export default function NewsSection() {
  const { language, t } = useLanguage()
  const [news, setNews] = useState<NewsItem[]>([])
  const [rawNews, setRawNews] = useState<ApiNewsItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [rawCategories, setRawCategories] = useState<CategoryAPI[]>([])
  const [loading, setLoading] = useState(true)

  const languageId = language === 'mn' ? 1 : 2

  const trans = {
    sectionLabel: t('Онцолсон мэдээ', 'Featured News'),
    sectionTitle: t('Мэдээ', 'News'),
    readTime: t('минут унших', 'min read'),
    viewAll: t('Дэлгэрэнгүй', 'View All'),
    noNews: t('Нүүр хуудсанд харуулах мэдээ байхгүй байна', 'No news to display on homepage'),
    noNewsDesc: t('Админ дотор мэдээг "Нүүр хуудсанд харуулах" гэж тэмдэглэнэ үү.', 'Mark news as "Show on Homepage" in admin panel.'),
    viewAllNews: t('Бүх мэдээг үзэх', 'View all news'),
    newsLabel: t('Мэдээ', 'News'),
    latestNews: t('Сүүлийн мэдээнүүд', 'Latest News'),
  }

  useEffect(() => {
    fetchCategories()
    fetchNews()
  }, [])

  // Re-map when language changes
  useEffect(() => {
    if (rawNews.length > 0) {
      const transformedNews = rawNews
        .filter(item => item.render && item.show_on_home)
        .map(item => mapApiNewsToFrontend(item, languageId))
      setNews(transformedNews)
    }
  }, [language, rawNews])

  useEffect(() => {
    if (rawCategories.length > 0) {
      const transformedCategories = rawCategories.map(cat => mapAPICategoryToCategory(cat, languageId))
      setCategories(transformedCategories)
    }
  }, [language, rawCategories])

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get<CategoryAPI[]>('/news-category/')
      if (response.data && Array.isArray(response.data)) {
        setRawCategories(response.data)
        const transformedCategories = response.data.map(cat => mapAPICategoryToCategory(cat, languageId))
        setCategories(transformedCategories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchNews = async () => {
    setLoading(true)
    try {
      const response = await axiosInstance.get<ApiNewsItem[]>('/news/')
      if (response.data && Array.isArray(response.data)) {
        setRawNews(response.data)
        const transformedNews = response.data
          .filter(item => item.render && item.show_on_home)
          .map(item => mapApiNewsToFrontend(item, languageId))
        setNews(transformedNews)
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sort: pinned first, then by date
  const sortedNews = [...news].sort((a, b) => {
    if (a.isPinnedNews === b.isPinnedNews) {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    }
    return a.isPinnedNews ? -1 : 1
  })

  // Featured (pinned) news - max 3
  const pinnedNews = sortedNews.filter(item => item.isPinnedNews).slice(0, 3)
  // Regular news (non-pinned)
  const gridItems = sortedNews.filter(item => !item.isPinnedNews)

  const getCategoryLabel = (categoryId: number): string => {
    return categories.find(c => c.id === categoryId)?.label || trans.newsLabel
  }

  return (
    <section className="py-16 sm:py-20 lg:py-32 px-5 sm:px-20 flex flex-col">
      <div className="flex flex-col lg:max-w-[1280px] lg:mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-20">
          <div className="inline-block">
            <p className="text-teal-600 text-sm font-semibold uppercase tracking-wider mb-2">{trans.sectionLabel}</p>
            <h2 className="text-4xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">{trans.sectionTitle}</h2>
            <div className="w-16 h-1 bg-teal-600 mx-auto rounded-full"></div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        )}

        {!loading && sortedNews.length > 0 && (
          <>
            {/* Featured/Pinned News Section */}
            {pinnedNews.length > 0 && (
              <div className="mb-10 sm:mb-16 bg-gray-50 rounded-2xl p-6 sm:p-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  {trans.sectionLabel}
                </h3>
                <div className="grid grid-cols-1 gap-5">
                  {pinnedNews.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] lg:flex-row hover:shadow-lg transition-all border border-gray-200"
                    >
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-none lg:rounded-l-[28px] overflow-hidden h-[200px] sm:h-[300px] lg:h-auto lg:w-2/3 bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-news.jpg'
                          }}
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8 lg:w-1/3">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                              {getCategoryLabel(item.category)}
                            </span>
                          </div>
                          <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis sm:text-2xl sm:leading-10 lg:text-2xl lg:leading-10 lg:max-h-[250px]">
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          {new Date(item.publishedAt).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US')} • {item.readTime} {trans.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Regular News Grid */}
            {gridItems.length > 0 && (
              <div className="mb-10">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{trans.latestNews}</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {gridItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      className="group bg-white cursor-pointer rounded-2xl sm:rounded-[20px] lg:rounded-l-[28px] flex flex-col min-h-[420px] hover:shadow-lg transition-all border border-gray-200 hover:translate-y-[-2px]"
                    >
                      <div className="relative rounded-t-2xl sm:rounded-t-[20px] lg:rounded-t-[28px] overflow-hidden h-[200px] sm:h-[250px] bg-gray-200">
                        <Image
                          src={item.bannerImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-news.jpg'
                          }}
                        />
                      </div>
                      <div className="flex flex-col justify-between flex-1 p-5 lg:p-8">
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                              {getCategoryLabel(item.category)}
                            </span>
                          </div>
                          <p className="text-gray-900 text-xl font-bold leading-8 max-h-[128px] overflow-y-hidden text-ellipsis lg:text-2xl lg:leading-10 transition-all">
                            {item.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-4">
                          {new Date(item.publishedAt).toLocaleDateString(language === 'mn' ? 'mn-MN' : 'en-US')} • {item.readTime} {trans.readTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* View All Button */}
            <div className="flex justify-center mt-6">
              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {trans.viewAll}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        )}

        {!loading && sortedNews.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{trans.noNews}</h3>
            <p className="text-gray-500 mb-6">{trans.noNewsDesc}</p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {trans.viewAllNews}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}