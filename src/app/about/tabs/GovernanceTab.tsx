'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';

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

/* ── Helpers ───────────────────────────────────────────────────────── */

const getTrans = (translations: Translation[], langId: number) =>
  translations.find((t) => t.language === langId);

/* ── PersonCard ────────────────────────────────────────────────────── */

interface PersonCardProps {
  image: string;
  name: string;
  subtitle: string;
  onClick: () => void;
  priority?: boolean;
}

function PersonCard({ image, name, subtitle, onClick, priority = false }: PersonCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group cursor-pointer bg-white border border-gray-200 rounded-xl p-4 sm:p-6 transition-colors duration-200 outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      <div className="relative w-full aspect-[3/4] max-h-[220px] sm:max-h-none mb-3 sm:mb-4 rounded-lg overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/img/avatar-placeholder.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>

      <h3 className="text-sm sm:text-[15px] font-semibold text-gray-900 transition-colors">
        {name}
      </h3>

      <p className="hidden sm:block text-[11px] text-gray-500 uppercase tracking-widest mt-2">
        {subtitle}
      </p>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────── */

export default function GovernanceTab() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'shareholder';

  const [activeSubTab, setActiveSubTab] = useState(tabParam);
  const [selectedPerson, setSelectedPerson] = useState<MemberAPI | null>(null);
  const [members, setMembers] = useState<MemberAPI[]>([]);
  const [categories, setCategories] = useState<CategoryAPI[]>([]);
  const [loading, setLoading] = useState(true);

  // Language: Mongolian by default (language id 1)
  const langId = 1;

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
        // Set initial active tab from first category if tabParam doesn't match
        if (catsData.length > 0 && !catsData.some(c => c.key === tabParam)) {
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
    return () => {
      document.body.style.overflow = '';
    };
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

      {/* Tabs */}
      <div className="flex justify-center gap-8 border-b border-gray-200 mb-12 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveSubTab(cat.key)}
            className={clsx(
              'pb-3 text-sm font-medium transition-colors duration-200 outline-none focus:ring-offset-2 focus:ring-2 focus:ring-teal-500',
              activeSubTab === cat.key
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {getCatLabel(cat, langId)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Ачаалж байна...</p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-24 text-center text-gray-500">
          <p className="text-sm">Мэдээлэл байхгүй</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {displayed.map((person, idx) => {
            const tr = getTrans(person.translations, langId);
            return (
              <PersonCard
                key={person.id}
                image={person.image}
                name={tr?.name || ''}
                subtitle={tr?.role || ''}
                onClick={() => setSelectedPerson(person)}
                priority={idx === 0}
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
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-0 sm:items-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedPerson(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="bg-white w-full max-w-4xl rounded-2xl p-8 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPerson(null)}
                aria-label="Хаах"
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors outline-none focus:ring-2 focus:ring-teal-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                {/* Image */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100">
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
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-2/3 flex flex-col justify-start">
                  <h3 id="modal-title" className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
                    {tr?.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-teal-600 uppercase tracking-wide mt-1 mb-4 sm:mb-6 md:mb-8">
                    {tr?.role}
                  </p>

                  {selectedPerson.type === 'branch' && tr?.location && (
                    <p className="text-xs sm:text-sm text-slate-600 mb-4">
                      <span className="font-medium">Байршил:</span> {tr.location} - {tr.district}
                    </p>
                  )}

                  {tr?.description && (
                    <div className="space-y-3 sm:space-y-4 md:space-y-5 text-gray-600 leading-6 sm:leading-7 md:leading-7 text-xs sm:text-sm">
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