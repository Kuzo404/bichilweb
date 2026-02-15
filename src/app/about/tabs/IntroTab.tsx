'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

/* ── Types ─────────────────────────────────────────────────────── */

interface SectionBlock {
  content: string;
  color: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  textAlign: string;
  visible: boolean;
}

interface SectionData {
  title: string;
  titleColor: string;
  titleSize: string;
  titleWeight: string;
  titleFamily: string;
  textAlign: string;
  visible: boolean;
  blocks: SectionBlock[];
}

interface TimelineEvent {
  year: string;
  title: string;
  short: string;
  desc: string;
  yearColor: string;
  titleColor: string;
  shortColor: string;
  descColor: string;
}

/* ── Helpers ────────────────────────────────────────────────────── */

function useInViewAnimation(threshold = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const getMN = (translations: any[], field: string) => {
  const mn = translations?.find((t: any) => t.language === 1 || t.language_code === 'MN');
  return mn?.[field] || '';
};

const getStyle = (translations: any[], field: string) => {
  const mn = translations?.find((t: any) => t.language === 1 || t.language_code === 'MN');
  return mn?.[field] || '';
};

const mapAlign = (val: string) => {
  if (val === 'left' || val === 'right' || val === 'center' || val === 'justify') return val;
  return undefined;
};

/* ── Main Component ────────────────────────────────────────────── */

export default function IntroTab() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [historyEvents, setHistoryEvents] = useState<TimelineEvent[]>([]);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  const [revealedSections, setRevealedSections] = useState<Set<number>>(new Set());
  const [timelineTitleRevealed, setTimelineTitleRevealed] = useState(false);
  const timelineTitle = useInViewAnimation(0.3);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* ── Fetch data from API ─────────────────────────────────────── */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pagesRes = await fetch(`${API_URL}/about-page/`);
        if (!pagesRes.ok) throw new Error('Failed to fetch pages');
        const pages = await pagesRes.json();
        const aboutPage = pages.find((p: any) => p.key === 'intro');
        if (!aboutPage) throw new Error('About page not found');
        const pid = aboutPage.id;

        const [aboutRes, timelineRes] = await Promise.all([
          fetch(`${API_URL}/about-page/${pid}/`),
          fetch(`${API_URL}/timeline/?page=${pid}`),
        ]);

        if (aboutRes.ok) {
          const data = await aboutRes.json();

          // Media
          if (data.media?.length > 0) {
            setImageUrl(data.media[0].file || data.media[0].url || '');
          }

          // Sections - fully dynamic
          const sortedSections = [...(data.sections || [])].sort((a: any, b: any) => a.index - b.index);
          setSections(sortedSections.map((section: any) => {
            const sortedBlocks = [...(section.blocks || [])].sort((a: any, b: any) => a.index - b.index);
            return {
              title: getMN(section.translations, 'title'),
              titleColor: getStyle(section.translations, 'color') || getStyle(section.translations, 'fontcolor') || '#0f172a',
              titleSize: getStyle(section.translations, 'fontsize') || '24',
              titleWeight: getStyle(section.translations, 'fontweight') || '700',
              titleFamily: getStyle(section.translations, 'fontfamily') || 'inherit',
              textAlign: getStyle(section.translations, 'textalign') || 'left',
              visible: section.visible !== false,
              blocks: sortedBlocks.map((block: any) => ({
                content: getMN(block.translations, 'content'),
                color: getStyle(block.translations, 'fontcolor') || getStyle(block.translations, 'color') || '#475569',
                fontSize: getStyle(block.translations, 'fontsize') || '16',
                fontWeight: getStyle(block.translations, 'fontweight') || '400',
                fontFamily: getStyle(block.translations, 'fontfamily') || 'inherit',
                textAlign: getStyle(block.translations, 'textalign') || 'justify',
                visible: block.visible !== false,
              })),
            };
          }));
        }

        // Timeline
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json();
          setHistoryEvents((timelineData || [])
            .filter((ev: any) => ev.visible !== false)
            .map((ev: any) => {
              const mn = ev.translations?.find((t: any) => t.language === 1 || t.language_code === 'MN');
              return {
                year: ev.year || '',
                title: mn?.title || '',
                short: mn?.short_desc || '',
                desc: mn?.full_desc || '',
                yearColor: ev.year_color || '#0d9488',
                titleColor: ev.title_color || '#111827',
                shortColor: ev.short_color || '#4b5563',
                descColor: ev.desc_color || '#4b5563',
              };
            }));
        }
      } catch (error) {
        console.error('Failed to fetch about page:', error);
      }
    };
    fetchData();
  }, []);

  /* ── Section animation observers ─────────────────────────────── */

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-section'));
            setRevealedSections(prev => { const n = new Set(prev); n.add(idx); return n; });
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    sectionRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  /* ── Timeline observers ──────────────────────────────────────── */

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible: number[] = [];
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            newlyVisible.push(Number(entry.target.getAttribute('data-index')));
          }
        });
        if (newlyVisible.length) {
          setActiveIndex(newlyVisible[newlyVisible.length - 1]);
          setRevealedIndexes(prev => { const n = new Set(prev); newlyVisible.forEach(i => n.add(i)); return n; });
        }
      },
      { rootMargin: '-30% 0px -30% 0px', threshold: 0.1 }
    );
    itemRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, [historyEvents]);

  useEffect(() => {
    if (timelineTitle.visible && !timelineTitleRevealed) setTimelineTitleRevealed(true);
  }, [timelineTitle.visible, timelineTitleRevealed]);

  const toggleYear = (index: number) => setExpandedYear(expandedYear === index ? null : index);
  const isTimelineEnd = activeIndex !== null && activeIndex >= historyEvents.length - 2;

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-500">

      {/* ── Dynamic Sections ─────────────────────────────────────── */}
      {sections.map((section, sIdx) => {
        if (!section.visible) return null;
        const isFirst = sIdx === 0;
        const isEvenAfterFirst = sIdx > 0 && sIdx % 2 === 0;

        return (
          <div
            key={sIdx}
            ref={el => { sectionRefs.current[sIdx] = el; }}
            data-section={sIdx}
            className={clsx(
              'transition-all duration-700 ease-out',
              revealedSections.has(sIdx) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
              // First section: 2-column layout with image
              isFirst && 'grid grid-cols-1 md:grid-cols-2 gap-12 items-center',
              // Subsequent pairs
              !isFirst && sIdx <= 2 && 'bg-white p-8 rounded-2xl shadow-sm border border-gray-100',
              !isFirst && sIdx > 2 && 'space-y-4',
            )}
            style={{ transitionDelay: sIdx === 0 ? '0ms' : `${sIdx * 100}ms` }}
          >
            {/* First section with image */}
            {isFirst ? (
              <>
                <div className="space-y-6">
                  {section.title && (
                    <h2 style={{
                      color: section.titleColor,
                      fontSize: `${section.titleSize}px`,
                      fontWeight: section.titleWeight,
                      fontFamily: section.titleFamily !== 'inherit' ? section.titleFamily : undefined,
                      textAlign: mapAlign(section.textAlign) as any,
                    }}
                    className="leading-tight">
                      {section.title}
                    </h2>
                  )}
                  <div className="space-y-4">
                    {section.blocks.map((block, bIdx) =>
                      block.visible && block.content ? (
                        <p key={bIdx} style={{
                          color: block.color,
                          fontSize: `${block.fontSize}px`,
                          fontWeight: block.fontWeight,
                          fontFamily: block.fontFamily !== 'inherit' ? block.fontFamily : undefined,
                          textAlign: mapAlign(block.textAlign) as any,
                        }}
                        className="leading-relaxed">
                          {block.content}
                        </p>
                      ) : null
                    )}
                  </div>
                </div>
                {imageUrl && (
                  <div className="relative h-[500px] md:h-[600px] w-full rounded-2xl overflow-hidden shadow-xl">
                    <Image src={imageUrl} alt="Бидний тухай" fill className="object-cover" />
                  </div>
                )}
              </>
            ) : sIdx === 1 ? (
              /* Second section: card style */
              <>
                {section.title && (
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"
                    style={{
                      color: section.titleColor,
                      fontSize: `${section.titleSize}px`,
                      fontWeight: section.titleWeight,
                      textAlign: mapAlign(section.textAlign) as any,
                    }}>
                    <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    {section.title}
                  </h3>
                )}
                {section.blocks.map((block, bIdx) =>
                  block.visible && block.content ? (
                    <p key={bIdx} style={{
                      color: block.color,
                      fontSize: `${block.fontSize}px`,
                      fontWeight: block.fontWeight,
                      textAlign: mapAlign(block.textAlign) as any,
                    }}
                    className="leading-relaxed">
                      {block.content}
                    </p>
                  ) : null
                )}
              </>
            ) : (
              /* Other sections: default layout */
              <>
                {section.title && (
                  <h3 className="text-2xl font-bold border-b-2 border-teal-500 pb-2 inline-block"
                    style={{
                      color: section.titleColor,
                      fontSize: `${section.titleSize}px`,
                      fontWeight: section.titleWeight,
                      textAlign: mapAlign(section.textAlign) as any,
                    }}>
                    {section.title}
                  </h3>
                )}
                <div className="space-y-4">
                  {section.blocks.map((block, bIdx) =>
                    block.visible && block.content ? (
                      <p key={bIdx} style={{
                        color: block.color,
                        fontSize: `${block.fontSize}px`,
                        fontWeight: block.fontWeight,
                        textAlign: mapAlign(block.textAlign) as any,
                      }}
                      className="leading-relaxed">
                        {block.content}
                      </p>
                    ) : null
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* ── Paired sections (3rd & 4th, 5th & 6th, etc.) ──────── */}
      {/* Already rendered above dynamically */}

      {/* ── Timeline Section ─────────────────────────────────────── */}
      {historyEvents.length > 0 && (
        <div ref={timelineRef} className="py-12 relative overflow-hidden">
          <h3
            ref={timelineTitle.ref}
            className={clsx(
              'text-3xl font-bold text-center mb-16 transition-all duration-600 ease-out',
              timelineTitleRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            Түүхэн замнал
          </h3>

          {/* Vertical Line */}
          <div className="absolute left-[27px] md:left-1/2 top-32 bottom-12 w-0.5 bg-teal-200 transform md:-translate-x-1/2" />

          <div className="space-y-12">
            {historyEvents.map((event, index) => {
              const isExpanded = expandedYear === index;
              const isEven = index % 2 === 0;

              const ContentCard = (
                <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative z-10">
                  <div className="md:hidden flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold" style={{ color: event.yearColor }}>{event.year}</span>
                    <div className="h-px bg-teal-100 flex-1" />
                  </div>

                  <h4 className="text-lg font-bold mb-2 group-hover:text-teal-600 transition-colors" style={{ color: event.titleColor }}>
                    {event.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: event.shortColor }}>
                    {event.short}
                  </p>

                  <div className={clsx(
                    'grid transition-all duration-300 ease-in-out',
                    isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
                  )}>
                    <div className="overflow-hidden min-h-0">
                      <div className="pt-4 border-t border-gray-100 text-sm leading-relaxed text-justify" style={{ color: event.descColor }}>
                        {event.desc}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleYear(index)}
                    className="flex items-center gap-2 text-sm font-medium text-teal-600 mt-4 hover:bg-teal-50 px-3 py-1.5 rounded-lg -ml-3 w-fit transition-colors"
                  >
                    {isExpanded ? 'Хураангуйлах' : 'Дэлгэрэнгүй'}
                    <svg className={clsx('w-4 h-4 transition-transform duration-300', isExpanded ? 'rotate-180' : '')}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              );

              return (
                <div
                  key={index}
                  ref={el => { itemRefs.current[index] = el; }}
                  data-index={index}
                  className={clsx(
                    'relative flex flex-col md:flex-row items-center md:items-start group',
                    'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    revealedIndexes.has(index) ? 'opacity-100 translate-x-0' : isEven ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8',
                    activeIndex === index && 'z-10'
                  )}
                >
                  <div className="absolute left-[18px] md:left-1/2 w-5 h-5 rounded-full border-4 border-white bg-teal-600 shadow-sm z-20 top-0 md:top-8 transform md:-translate-x-1/2" />

                  {/* Left side */}
                  <div className={clsx('w-full md:w-1/2 pl-16 md:pl-0 md:pr-12 md:text-right flex md:block', !isEven && 'md:flex md:justify-end')}>
                    <div className="md:hidden w-full">{ContentCard}</div>
                    <div className="hidden md:block w-full">
                      {isEven ? ContentCard : (
                        <span className={clsx('text-5xl font-bold sticky top-32 transition-colors duration-300', activeIndex === index ? 'text-teal-600' : 'text-teal-300')}
                          style={{ color: activeIndex === index ? event.yearColor : undefined }}>
                          {event.year}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="hidden md:block w-full md:w-1/2 md:pl-12 text-left">
                    {isEven ? (
                      <span className={clsx('text-5xl font-bold sticky top-32 transition-colors duration-300', activeIndex === index ? 'text-teal-600' : 'text-teal-300')}
                        style={{ color: activeIndex === index ? event.yearColor : undefined }}>
                        {event.year}
                      </span>
                    ) : ContentCard}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom blur overlay */}
          <div className={clsx(
            'pointer-events-none absolute bottom-0 left-0 w-full h-32 transition-all duration-700',
            isTimelineEnd ? 'backdrop-blur-0 opacity-0' : 'backdrop-blur-sm opacity-100'
          )}>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}