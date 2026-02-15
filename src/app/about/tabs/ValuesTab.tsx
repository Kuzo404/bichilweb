'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/* ── Intersection Observer hook (callback-ref pattern) ────────── */
function useInViewAnimation(threshold = 0.2) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold]);

  const ref = useCallback((el: HTMLDivElement | null) => { setNode(el); }, []);

  return { ref, visible };
}

/* ── Types ─────────────────────────────────────────────────────── */
interface CoreValueAPI {
  id: number;
  file?: string | null;
  file_ratio?: string;
  index: number;
  visible: boolean;
  title_translations: { language: number; title: string; fontcolor?: string; fontsize?: number; fontweight?: string; fontfamily?: string }[];
  desc_translations: { language: number; desc: string; fontcolor?: string; fontsize?: number; fontweight?: string; fontfamily?: string }[];
}

interface CoreValueDisplay {
  id: number;
  title: string;
  desc: string;
  image: string;
  imageRatio: string;
  titleStyle: { color: string; fontSize: string; fontWeight: string; fontFamily: string };
  descStyle: { color: string; fontSize: string; fontWeight: string; fontFamily: string };
  subItems?: { icon: string; title: string; desc: string }[];
}

const getTr = (translations: any[], langId: number, field: string): string => {
  const tr = translations?.find((t: any) => t.language === langId);
  return tr?.[field] || translations?.[0]?.[field] || '';
};

const getStyle = (translations: any[], langId: number) => {
  const tr = translations?.find((t: any) => t.language === langId) || translations?.[0];
  return {
    color: tr?.fontcolor || '',
    fontSize: tr?.fontsize ? `${tr.fontsize}px` : '',
    fontWeight: tr?.fontweight || '',
    fontFamily: tr?.fontfamily || '',
  };
};

/* ── Icon set for core values ──────────────────────────────────── */
const valueIcons = [
  <svg key="0" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  <svg key="1" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  <svg key="2" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  <svg key="3" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  <svg key="4" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="5" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  <svg key="6" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  <svg key="7" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
];

/* ── Main Component ────────────────────────────────────────────── */
export default function ValuesTab() {
  const heroAnim = useInViewAnimation(0.15);
  const gridAnim = useInViewAnimation(0.1);
  const { language } = useLanguage();

  const [allValues, setAllValues] = useState<CoreValueDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchValues = async () => {
      try {
        const res = await fetch(`${API_URL}/core-value/`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: CoreValueAPI[] = await res.json();
        const sorted = [...data].sort((a, b) => a.index - b.index).filter(v => v.visible !== false);
        const langId = language === 'mn' ? 1 : 2;

        setAllValues(sorted.map(cv => {
          const desc = getTr(cv.desc_translations, langId, 'desc');
          let subItems: { icon: string; title: string; desc: string }[] | undefined;
          try {
            const parsed = JSON.parse(desc);
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title !== undefined) {
              subItems = parsed;
            }
          } catch {}
          return {
            id: cv.id,
            title: getTr(cv.title_translations, langId, 'title'),
            desc: subItems ? '' : desc,
            image: cv.file || '',
            imageRatio: cv.file_ratio || '16 / 9',
            titleStyle: getStyle(cv.title_translations, langId),
            descStyle: getStyle(cv.desc_translations, langId),
            subItems,
          };
        }));
      } catch (error) {
        console.error('Failed to fetch core values:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchValues();
  }, [language]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const heroCards = allValues.slice(0, 2);
  const valueCards = allValues.slice(2);

  return (
    <div className="max-w-7xl mx-auto space-y-24">

      {/* ── Hero: Vision & Mission ──────────────────────────────── */}
      <div ref={heroAnim.ref} className="space-y-20">
        {heroCards.map((card, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <section
              key={card.id}
              className={`grid md:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 ease-out
                ${heroAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
              `}
              style={{ transitionDelay: `${idx * 200}ms` }}
            >
              <div className={`space-y-5 ${!isEven ? 'md:order-2' : ''}`}>
                <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  {idx === 0 ? (language === 'mn' ? 'Алсын хараа' : 'Vision') : (language === 'mn' ? 'Эрхэм зорилго' : 'Mission')}
                </div>
                <h2
                  className="text-2xl md:text-3xl font-bold leading-tight text-gray-900"
                  style={card.titleStyle.color ? { color: card.titleStyle.color } : undefined}
                >
                  {card.title}
                </h2>
                <p
                  className="text-gray-600 leading-relaxed text-lg"
                  style={card.descStyle.color ? { color: card.descStyle.color } : undefined}
                >
                  {card.desc}
                </p>
              </div>

              {card.image ? (
                <div className={`relative w-full overflow-hidden rounded-2xl shadow-lg border border-gray-100 ${!isEven ? 'md:order-1' : ''}`}
                  style={{ aspectRatio: card.imageRatio || '16 / 9' }}
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ) : (
                <div className={`relative w-full aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200/50 flex items-center justify-center ${!isEven ? 'md:order-1' : ''}`}>
                  <div className="text-teal-300">
                    <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ── Divider ─────────────────────────────────────────────── */}
      {valueCards.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-6 text-sm font-semibold text-teal-600 tracking-wider uppercase">
              {language === 'mn' ? 'Бидний үнэт зүйлс' : 'Our Core Values'}
            </span>
          </div>
        </div>
      )}

      {/* ── Values Grid ─────────────────────────────────────────── */}
      {valueCards.length > 0 && (
        <section ref={gridAnim.ref}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {valueCards.map((value, index) => (
              <div
                key={value.id}
                className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-200/60 transition-all duration-500
                  ${gridAnim.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {value.image ? (
                  <div className="relative w-full aspect-video overflow-hidden">
                    <Image
                      src={value.image}
                      alt={value.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-400 group-hover:h-3 transition-all duration-300" />
                )}

                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4 group-hover:bg-teal-100 group-hover:scale-110 transition-all duration-300">
                    {valueIcons[index % valueIcons.length]}
                  </div>

                  <h3
                    className="text-lg font-bold text-gray-900 mb-2 group-hover:text-teal-700 transition-colors"
                    style={value.titleStyle.color ? { color: value.titleStyle.color, fontSize: value.titleStyle.fontSize || undefined, fontWeight: value.titleStyle.fontWeight || undefined } : undefined}
                  >
                    {value.title}
                  </h3>
                  {value.subItems && value.subItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {value.subItems.map((item, si) => (
                        <div key={si} className="flex items-start gap-2.5">
                          {item.icon && <span className="text-base mt-0.5 shrink-0">{item.icon}</span>}
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-800">{item.title}</h4>
                            {item.desc && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      className="text-sm text-gray-500 leading-relaxed"
                      style={value.descStyle.color ? { color: value.descStyle.color, fontSize: value.descStyle.fontSize || undefined } : undefined}
                    >
                      {value.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
