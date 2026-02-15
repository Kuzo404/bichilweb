'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { useLanguage } from '@/contexts/LanguageContext';

/* ── Intersection Observer hook (callback-ref pattern) ─────────── */
function useInViewAnimation(threshold = 0.1) {
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

/* ── Types ─────────────────────────────────────────────────────────── */

interface Translation {
  language: number;
  name: string;
  role: string;
  description: string;
  location: string;
  district: string;
}

interface MemberAPI {
  id: number;
  type: string;
  image: string;
  sort_order: number;
  active: boolean;
  translations: Translation[];
}

interface CategoryTranslation {
  language: number;
  label: string;
}

interface CategoryAPI {
  id: number;
  key: string;
  sort_order: number;
  active: boolean;
  translations: CategoryTranslation[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

const getCatLabel = (cat: CategoryAPI, langId: number) => {
  const tr = cat.translations.find((t) => t.language === langId);
  return tr?.label || cat.key;
};

const getTrans = (translations: Translation[], langId: number) =>
  translations.find((t) => t.language === langId);

/* ── PersonCard (Modern) ───────────────────────────────────────────── */

function PersonCard({ image, name, subtitle, onClick, priority = false, index = 0, visible = true }: {
  image: string;
  name: string;
  subtitle: string;
  onClick: () => void;
  priority?: boolean;
  index?: number;
  visible?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`group cursor-pointer relative bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:border-teal-200/80 transition-all duration-500 outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 hover:-translate-y-1
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top group-hover:scale-[1.06] transition-transform duration-700 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/img/avatar-placeholder.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-gray-50 text-teal-200">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

      </div>

      {/* Info Section */}
      <div className="p-4 sm:p-5 relative">
        {/* Teal accent line */}
        <div className="absolute top-0 left-4 right-4 sm:left-5 sm:right-5 h-px bg-gradient-to-r from-transparent via-teal-300/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
        
        <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 group-hover:text-teal-700 transition-colors duration-300 line-clamp-2 leading-snug">
          {name}
        </h3>
        <p className="text-[11px] sm:text-xs text-gray-400 uppercase tracking-[0.15em] mt-2 line-clamp-1 font-medium">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

export default function GovernanceTab() {
  const [activeSubTab, setActiveSubTab] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<MemberAPI | null>(null);
  const [members, setMembers] = useState<MemberAPI[]>([]);
  const [categories, setCategories] = useState<CategoryAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const tabsRef = useRef<HTMLDivElement>(null);
  const gridAnim = useInViewAnimation(0.05);

  const langId = language === 'mn' ? 1 : 2;

  /* ── Fetch ───────────────────────────────────────────────────────── */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [membersRes, catsRes] = await Promise.all([
          fetch(`${API_URL}/management/`),
          fetch(`${API_URL}/management-category/`),
        ]);
        if (!membersRes.ok || !catsRes.ok) throw new Error('Failed');
        const membersData: MemberAPI[] = await membersRes.json();
        const catsData: CategoryAPI[] = await catsRes.json();
        setMembers(membersData);
        setCategories(catsData);
        if (catsData.length > 0) {
          setActiveSubTab(catsData[0].key);
        }
      } catch (err) {
        console.error('Failed to fetch governance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayed = members.filter((m) => m.type === activeSubTab);
  const activeCatCount = displayed.length;

  /* ── Body scroll lock ────────────────────────────────────────────── */

  useEffect(() => {
    document.body.style.overflow = selectedPerson ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedPerson]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPerson(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="sr-only">Компанийн засаглал</h2>

      {/* Category Tabs - Modern style */}
      <div className="mb-10 sm:mb-12">
        <div
          ref={tabsRef}
          className="flex overflow-x-auto no-scrollbar gap-2 pb-2 sm:justify-center snap-x snap-mandatory"
        >
          {categories.map((cat) => {
            const isActive = activeSubTab === cat.key;
            const count = members.filter((m) => m.type === cat.key).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveSubTab(cat.key)}
                className={clsx(
                  'relative px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 snap-start flex-shrink-0 flex items-center gap-2',
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/25'
                    : 'bg-white text-gray-500 border border-gray-200/80 hover:border-teal-300 hover:text-teal-600 hover:shadow-md'
                )}
              >
                {getCatLabel(cat, langId)}
                {count > 0 && (
                  <span className={clsx(
                    'text-[11px] font-semibold min-w-[20px] h-5 flex items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 text-center text-gray-500">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">{language === 'mn' ? 'Ачаалж байна...' : 'Loading...'}</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-24 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">{language === 'mn' ? 'Мэдээлэл байхгүй' : 'No data available'}</p>
        </div>
      ) : (
        <div ref={gridAnim.ref}>
          <div className={`grid gap-4 sm:gap-6 ${
            activeCatCount === 1
              ? 'grid-cols-1 max-w-xs mx-auto'
              : activeCatCount === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                : activeCatCount === 3
                  ? 'grid-cols-2 sm:grid-cols-3 max-w-4xl mx-auto'
                  : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {displayed.map((person, idx) => {
              const tr = getTrans(person.translations, langId);
              return (
                <PersonCard
                  key={person.id}
                  image={person.image}
                  name={tr?.name || ''}
                  subtitle={tr?.role || ''}
                  onClick={() => setSelectedPerson(person)}
                  priority={idx < 4}
                  index={idx}
                  visible={gridAnim.visible}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal - Premium */}
      {selectedPerson && (() => {
        const tr = getTrans(selectedPerson.translations, langId);
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedPerson(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:w-[95vw] sm:max-w-5xl sm:rounded-2xl overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedPerson(null)}
                aria-label="Хаах"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-10 h-10 flex items-center justify-center bg-black/30 sm:bg-white/90 backdrop-blur-sm text-white sm:text-gray-400 hover:text-gray-800 hover:bg-white rounded-full transition-all duration-200 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row h-full sm:h-auto">
                {/* Image — flush, no gaps */}
                <div className="w-full md:w-[42%] flex-shrink-0 relative bg-gradient-to-b from-gray-100 to-gray-200">
                  {selectedPerson.image ? (
                    <>
                      {/* Mobile: fixed aspect */}
                      <div className="block md:hidden relative w-full" style={{ aspectRatio: '4/5' }}>
                        <Image
                          src={selectedPerson.image}
                          alt={tr?.name || ''}
                          fill
                          className="object-cover"
                          sizes="100vw"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/img/avatar-placeholder.png'; }}
                        />
                        {/* Bottom gradient for text readability */}
                        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white via-white/60 to-transparent" />
                      </div>
                      {/* Desktop: full height, object-cover, no gaps */}
                      <div className="hidden md:block relative w-full h-full min-h-[480px]">
                        <Image
                          src={selectedPerson.image}
                          alt={tr?.name || ''}
                          fill
                          className="object-cover object-top"
                          sizes="42vw"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/img/avatar-placeholder.png'; }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-64 md:h-full md:min-h-[480px] flex items-center justify-center bg-gradient-to-br from-teal-50 to-gray-100 text-teal-200">
                      <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="w-full md:w-[58%] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-start overflow-y-auto max-h-[50vh] sm:max-h-none md:max-h-[92vh]">
                  {/* Role badge */}
                  {tr?.role && (
                    <div className="inline-flex items-center self-start gap-1.5 bg-gradient-to-r from-teal-50 to-teal-100/60 text-teal-700 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] mb-4 ring-1 ring-teal-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      {tr.role}
                    </div>
                  )}

                  <h3 id="modal-title" className="text-2xl sm:text-3xl md:text-[2rem] lg:text-4xl font-extrabold text-gray-900 leading-[1.15] tracking-tight">
                    {tr?.name}
                  </h3>

                  {selectedPerson.type === 'branch' && tr?.location && (
                    <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {tr.location}{tr.district ? ` - ${tr.district}` : ''}
                    </p>
                  )}

                  {tr?.description && (
                    <>
                      <div className="w-16 h-[2px] bg-gradient-to-r from-teal-500 via-teal-300 to-transparent mt-6 mb-6" />
                      <div className="space-y-4 text-gray-600 leading-[1.85] text-[15px] pr-1">
                        {tr.description.split('\n\n').map((paragraph: string, i: number) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Bottom action on mobile */}
                  <div className="mt-8 pt-6 border-t border-gray-100 md:hidden">
                    <button
                      onClick={() => setSelectedPerson(null)}
                      className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                      {language === 'mn' ? 'Хаах' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}