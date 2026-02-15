'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { useLanguage } from '@/contexts/LanguageContext';

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

/* ── PersonCard ────────────────────────────────────────────────────── */

function PersonCard({ image, name, subtitle, onClick, priority = false }: {
  image: string;
  name: string;
  subtitle: string;
  onClick: () => void;
  priority?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-teal-200/60 transition-all duration-300 outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/img/avatar-placeholder.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-sm sm:text-[15px] font-semibold text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-2">
          {name}
        </h3>
        <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-widest mt-1.5 line-clamp-1">
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

      {/* Category Tabs */}
      <div className="flex flex-col gap-4 mb-10">
        {/* Category Tabs - horizontal scroll on mobile */}
        <div
          ref={tabsRef}
          className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-3 pb-2 sm:justify-center snap-x snap-mandatory"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveSubTab(cat.key)}
              className={clsx(
                'px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 snap-start flex-shrink-0',
                activeSubTab === cat.key
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-600'
              )}
            >
              {getCatLabel(cat, langId)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Ачаалж байна...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-24 text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Мэдээлэл байхгүй</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
              />
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPerson && (() => {
        const tr = getTrans(selectedPerson.translations, langId);
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-0 sm:items-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedPerson(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPerson(null)}
                aria-label="Хаах"
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm text-gray-500 hover:text-gray-700 rounded-full transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="w-full md:w-2/5 flex-shrink-0">
                  <div className="relative aspect-[3/4] w-full bg-gray-100">
                    {selectedPerson.image ? (
                      <Image
                        src={selectedPerson.image}
                        alt={tr?.name || ''}
                        fill
                        className="object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/img/avatar-placeholder.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-3/5 p-6 sm:p-8 flex flex-col justify-start">
                  <h3 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-900">
                    {tr?.name}
                  </h3>
                  <p className="text-sm text-teal-600 uppercase tracking-wide mt-1 mb-6 font-medium">
                    {tr?.role}
                  </p>

                  {selectedPerson.type === 'branch' && tr?.location && (
                    <p className="text-sm text-slate-600 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {tr.location}{tr.district ? ` - ${tr.district}` : ''}
                    </p>
                  )}

                  {tr?.description && (
                    <div className="space-y-3 text-gray-600 leading-7 text-sm overflow-y-auto max-h-[50vh]">
                      {tr.description.split('\n\n').map((paragraph: string, i: number) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}