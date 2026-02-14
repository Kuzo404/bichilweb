'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { axiosInstance } from '@/lib/axios'
import { useLanguage } from '@/contexts/LanguageContext'


interface Translation        { id?: number; language: number; label: string }
interface ServiceTranslation { id?: number; language: number; title: string; description: string }
interface CardTranslation    { id?: number; language: number; label: string; short_desc: string }

interface RawDocument   { id: number; translations: Translation[] }
interface RawCollateral { id: number; translations: Translation[] }
interface RawCondition  { id: number; translations: Translation[] }

interface ApiServiceData {
  id: number
  translations: ServiceTranslation[]
  cards: { id: number; title: string; translations: CardTranslation[] }[]
  collaterals: { id: number; collateral: RawCollateral }[]
  conditions:  { id: number; condition:  RawCondition  }[]
  documents:   { id: number; document:   RawDocument   }[]
}


const getLang    = (t: Translation[],        id: number)                            => t.find(x => x.language === id)?.label        || ''
const getCardF   = (t: CardTranslation[],    id: number, f: 'label' | 'short_desc') => t.find(x => x.language === id)?.[f]          || ''
const getSvcF    = (t: ServiceTranslation[], id: number, f: 'title' | 'description')=> t.find(x => x.language === id)?.[f]          || ''


const CheckIcon = ({ color = 'text-teal-500' }: { color?: string }) => (
  <svg className={`w-5 h-5 ${color} mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
)


export default function DynamicServicePage() {
  const params    = useParams()
  const { language, t } = useLanguage()
  const serviceId = params?.serviceName as string

  const [serviceData,   setServiceData]   = useState<ApiServiceData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  const langId = language === 'mn' ? 2 : 1


  useEffect(() => {
    if (!serviceId) {
      setError('Service ID олдсонгүй')
      setLoading(false)
      return
    }

    const fetchService = async () => {
      try {
        setLoading(true)
        const response = await axiosInstance.get<ApiServiceData>(`/services/${serviceId}/`)
        setServiceData(response.data)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching service:', err)
        setError(err.response?.data?.message || err.message || 'Алдаа гарлаа')
      } finally {
        setLoading(false)
      }
    }

    fetchService()
  }, [serviceId])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('Ачаалж байна...', 'Loading...')}</p>
        </div>
      </div>
    )
  }


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {t('Алдаа гарлаа', 'Error')}
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }


  if (!serviceData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <p className="text-gray-600">{t('Үйлчилгээ олдсонгүй', 'Service not found')}</p>
      </div>
    )
  }


  const title       = getSvcF(serviceData.translations, langId, 'title')
  const description = getSvcF(serviceData.translations, langId, 'description')

  const cards = (serviceData.cards || []).map(card => ({
    id:         card.id,
    label:      getCardF(card.translations, langId, 'label'),
    short_desc: getCardF(card.translations, langId, 'short_desc'),
  }))

  const documents = (serviceData.documents || []).map(doc => ({
    id:    doc.document.id,
    label: getLang(doc.document.translations, langId),
  }))

  const collaterals = (serviceData.collaterals || []).map(coll => ({
    id:    coll.collateral.id,
    label: getLang(coll.collateral.translations, langId),
  }))

  const conditions = (serviceData.conditions || []).map(cond => ({
    id:    cond.condition.id,
    label: getLang(cond.condition.translations, langId),
  }))


  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-slate-200/40 blur-3xl rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-24 relative z-10">

        <header className="text-center mb-10 sm:mb-16 max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 text-slate-900">
            {title || t('Үйлчилгээ', 'Service')}
          </h1>

          {description && (
            <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto px-2">
              {description}
            </p>
          )}

          {cards.length > 0 && (
            <div className="mt-8 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {cards.map(card => (
                <div
                  key={card.id}
                  className="rounded-lg sm:rounded-2xl bg-slate-50 border border-slate-100 p-3 sm:p-4 text-center shadow-none"
                >
                  <p className="text-sm sm:text-base font-semibold text-teal-600 mb-1">
                    {card.label}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {card.short_desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </header>

        <div className="max-w-6xl mx-auto">
          <section className="space-y-6 sm:space-y-8">
            <div className="relative bg-white rounded-xl sm:rounded-[32px] p-5 sm:p-10 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100">

              {documents.length > 0 && (
                <div className="mb-8 sm:mb-14">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0" />
                    {t('Шаардагдах материал', 'Required Documents')}
                  </h3>
                  <ul className="space-y-3 sm:space-y-4">
                    {documents.map(doc => (
                      <li key={doc.id} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 leading-relaxed">
                        <CheckIcon />
                        <span>{doc.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {collaterals.length > 0 && (
                <div className="mb-8 sm:mb-14">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <span className="w-2 h-2 rounded-full bg-teal-600 flex-shrink-0" />
                    {t('Барьцаа хөрөнгө', 'Collateral')}
                  </h3>
                  <ul className="space-y-3 sm:space-y-4">
                    {collaterals.map(coll => (
                      <li key={coll.id} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 leading-relaxed">
                        <CheckIcon />
                        <span>{coll.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {conditions.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    {t('Нөхцөл шаардлага', 'Conditions')}
                  </h3>
                  <ul className="space-y-3 sm:space-y-4">
                    {conditions.map(cond => (
                      <li key={cond.id} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 leading-relaxed">
                        <CheckIcon color="text-orange-400" />
                        <span>{cond.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {documents.length === 0 && collaterals.length === 0 && conditions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400 italic">
                    {t('Мэдээлэл байхгүй байна.', 'No information available.')}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-12 sm:mt-20 text-center">
              <div className="inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-slate-50 border border-slate-200">
                <p className="text-xs sm:text-sm text-slate-500 px-2">
                  {t(
                    'Манай үйлчилгээ нь Монгол Улсын холбогдох хууль, журамд нийцсэн.',
                    'Our services comply with applicable laws and regulations.'
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>

      </div>
    </main>
  )
}