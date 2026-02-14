'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

// Reusable IntersectionObserver hook for animations
function useInViewAnimation() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      {
        threshold: 0.35,
        rootMargin: '0px 0px -80px 0px',
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

export default function IntroTab() {
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set());
  const [timelineTitleRevealed, setTimelineTitleRevealed] = useState(false);
  const whatWeDo = useInViewAnimation();
  const smeSection = useInViewAnimation();
  const citizenSection = useInViewAnimation();
  const timelineTitle = useInViewAnimation();
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Content from API
  const [originTitle, setOriginTitle] = useState('');
  const [originP1, setOriginP1] = useState('');
  const [originP2, setOriginP2] = useState('');
  const [originP3, setOriginP3] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [whatWeDoTitle, setWhatWeDoTitle] = useState('');
  const [whatWeDoContent, setWhatWeDoContent] = useState('');
  const [smeTitle, setSmeTitle] = useState('');
  const [smeP1, setSmeP1] = useState('');
  const [smeP2, setSmeP2] = useState('');
  const [citizenTitle, setCitizenTitle] = useState('');
  const [citizenP1, setCitizenP1] = useState('');
  const [citizenP2, setCitizenP2] = useState('');
  // Timeline events from API
  const [historyEvents, setHistoryEvents] = useState<{ year: string; title: string; short: string; desc: string }[]>([]);

  // Fetch about-page content + timeline from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aboutRes, timelineRes] = await Promise.all([
          fetch(`${API_URL}/about-page/3/`),
          fetch(`${API_URL}/timeline/?page=3`),
        ]);

        if (aboutRes.ok) {
          const data = await aboutRes.json();

          const getMN = (translations: any[], field: string) => {
            const mn = translations?.find((t: any) => t.language === 2 || t.language_code === 'MN');
            return mn?.[field] || '';
          };

          data.sections?.forEach((section: any) => {
          if (section.index === 0) {
            setOriginTitle(getMN(section.translations, 'title'));
            section.blocks?.forEach((block: any, idx: number) => {
              const content = getMN(block.translations, 'content');
              if (idx === 0) setOriginP1(content);
              if (idx === 1) setOriginP2(content);
              if (idx === 2) setOriginP3(content);
            });
          } else if (section.index === 1) {
            setWhatWeDoTitle(getMN(section.translations, 'title'));
            if (section.blocks?.[0]) setWhatWeDoContent(getMN(section.blocks[0].translations, 'content'));
          } else if (section.index === 2) {
            setSmeTitle(getMN(section.translations, 'title'));
            section.blocks?.forEach((block: any, idx: number) => {
              const content = getMN(block.translations, 'content');
              if (idx === 0) setSmeP1(content);
              if (idx === 1) setSmeP2(content);
            });
          } else if (section.index === 3) {
            setCitizenTitle(getMN(section.translations, 'title'));
            section.blocks?.forEach((block: any, idx: number) => {
              const content = getMN(block.translations, 'content');
              if (idx === 0) setCitizenP1(content);
              if (idx === 1) setCitizenP2(content);
            });
          }
        });

        if (data.media?.length > 0) {
          setImageUrl(data.media[0].file);
        }
        }

        // Load timeline events
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json();
          const events = (timelineData || [])
            .filter((ev: any) => ev.visible !== false)
            .map((ev: any) => {
              const mn = ev.translations?.find((t: any) => t.language === 2 || t.language_code === 'MN');
              return {
                year: ev.year || '',
                title: mn?.title || '',
                short: mn?.short_desc || '',
                desc: mn?.full_desc || '',
              };
            });
          setHistoryEvents(events);
        }
      } catch (error) {
        console.error('Failed to fetch about page:', error);
      }
    };
    fetchData();
  }, []);

  // IntersectionObserver for timeline items (viewport band reveal)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisible: number[] = [];

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            newlyVisible.push(index);
          }
        });

        if (newlyVisible.length) {
          setActiveIndex(newlyVisible[newlyVisible.length - 1]);

          setRevealedIndexes(prev => {
            const next = new Set(prev);
            newlyVisible.forEach(i => next.add(i));
            return next;
          });
        }
      },
      {
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0.1,
      }
    );

    itemRefs.current.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [historyEvents]);

  const isTimelineEnd = activeIndex !== null && activeIndex >= historyEvents.length - 2;

  // Track SME and Citizen section reveals (one-time animation)
  useEffect(() => {
    if (smeSection.visible && !revealedSections.has('sme')) {
      setRevealedSections(prev => {
        const next = new Set(prev);
        next.add('sme');
        return next;
      });
    }
  }, [smeSection.visible, revealedSections]);

  useEffect(() => {
    if (citizenSection.visible && !revealedSections.has('citizen')) {
      setRevealedSections(prev => {
        const next = new Set(prev);
        next.add('citizen');
        return next;
      });
    }
  }, [citizenSection.visible, revealedSections]);

  useEffect(() => {
    if (whatWeDo.visible && !revealedSections.has('whatWeDo')) {
      setRevealedSections(prev => {
        const next = new Set(prev);
        next.add('whatWeDo');
        return next;
      });
    }
  }, [whatWeDo.visible, revealedSections]);

  useEffect(() => {
    if (timelineTitle.visible && !timelineTitleRevealed) {
      setTimelineTitleRevealed(true);
    }
  }, [timelineTitle.visible, timelineTitleRevealed]);

  const toggleYear = (index: number) => {
    setExpandedYear(expandedYear === index ? null : index);
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Origin Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6"> 
          <div className="inline-block bg-teal-50 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium">
             Бидний түүх
          </div>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">
            {originTitle}
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed text-lg text-justify">
            {originP1 && <p>{originP1}</p>}
            {originP2 && <p>{originP2}</p>}
            {originP3 && <p className="font-semibold text-teal-800">{originP3}</p>}
          </div>
        </div>
        {imageUrl && (
        <div className="relative h-[600px] w-full rounded-2xl overflow-hidden shadow-xl">
          <Image
            src={imageUrl}
            alt="About Us"
            fill
            className="object-cover"
          />
        </div>
        )}
      </div>

       {/* What We Do Section */}
       <div 
         ref={whatWeDo.ref}
         className={`bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
           ${revealedSections.has('whatWeDo')
             ? 'opacity-100 translate-y-0'
             : 'opacity-0 translate-y-12'}
         `}
       >
           <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
               <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </span>
               Юу хийдэг вэ?
           </h3>
           <p className="text-gray-600 leading-relaxed text-justify">
               {whatWeDoContent}
           </p>
       </div>

       {/* SME and Citizen Wealth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {/* SME */}
            <div 
              ref={smeSection.ref}
              className={`space-y-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${revealedSections.has('sme')
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-8'}
              `}
            >
                <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-teal-500 pb-2 inline-block">{smeTitle}</h3>
                <div className="text-gray-600 text-justify leading-relaxed space-y-4">
                    {smeP1 && <p>{smeP1}</p>}
                    {smeP2 && <p>{smeP2}</p>}
                </div>
            </div>
             {/* Citizen Wealth */}
            <div 
              ref={citizenSection.ref}
              className={`space-y-4 transition-all duration-900 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${revealedSections.has('citizen')
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-8'}
              `}
            >
                <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-teal-500 pb-2 inline-block">{citizenTitle}</h3>
                 <div className="text-gray-600 text-justify leading-relaxed space-y-4">
                    {citizenP1 && <p>{citizenP1}</p>}
                    {citizenP2 && <p>{citizenP2}</p>}
                </div>
            </div>
        </div>


        {/* Timeline Section */}
        <div ref={timelineRef} className="py-12 relative overflow-hidden">
            <h3 
              ref={timelineTitle.ref}
              className={`text-3xl font-bold text-center mb-16
                transition-all duration-600 ease-out
                ${timelineTitleRevealed
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'}
              `}
            >
              Түүхэн замнал
            </h3>
            
            {/* Vertical Line */}
            <div className="absolute left-[27px] md:left-1/2 top-32 bottom-12 w-0.5 bg-teal-200 transform md:-translate-x-1/2"></div>

            <div className="space-y-12">
                {historyEvents.map((event, index) => {
                     const isExpanded = expandedYear === index;
                     const isEven = index % 2 === 0;

                     // Content Card Component
                     const ContentCard = (
                        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group relative z-10">
                            <div className="md:hidden flex items-center gap-3 mb-4">
                                <span className="text-2xl font-bold text-teal-600">{event.year}</span>
                                <div className="h-px bg-teal-100 flex-1"></div>
                            </div>

                            <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{event.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {event.short}
                            </p>
                            
                            <div className={clsx(
                                "grid transition-all duration-300 ease-in-out",
                                isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                            )}>
                                <div className="overflow-hidden min-h-0">
                                    <div className="pt-4 border-t border-gray-100 text-gray-600 text-sm leading-relaxed text-justify">
                                        {event.desc}
                                    </div>
                                </div>
                            </div>

                           <button
                              onClick={() => toggleYear(index)}
                              className="flex items-center gap-2 text-sm font-medium text-teal-600 mt-4 hover:bg-teal-50 px-3 py-1.5 rounded-lg -ml-3 w-fit transition-colors"
                            >
                              {isExpanded ? 'Хураангуйлах' : 'Дэлгэрэнгүй'}
                              <svg 
                                className={clsx("w-4 h-4 transition-transform duration-300", isExpanded ? "rotate-180" : "")} 
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                        </div>
                     );

                     return (
                        <div 
                          key={index}
                          ref={(el) => (itemRefs.current[index] = el)}
                          data-index={index}
                          className={clsx(
                            "relative flex flex-col md:flex-row items-center md:items-start group",
                            "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                            revealedIndexes.has(index)
                              ? "opacity-100 translate-x-0"
                              : isEven
                                ? "opacity-0 -translate-x-8"
                                : "opacity-0 translate-x-8",
                            activeIndex === index && "z-10"
                          )}
                        >
                            {/* Mobile/Desktop Dot */}
                            <div className="absolute left-[18px] md:left-1/2 w-5 h-5 rounded-full border-4 border-white bg-teal-600 shadow-sm z-20 top-0 md:top-8 transform md:-translate-x-1/2"></div>
                            
                            {/* Left Side (Desktop) */}
                            <div className={clsx(
                                "w-full md:w-1/2 pl-16 md:pl-0 md:pr-12 md:text-right flex md:block",
                                isEven ? "" : "md:flex md:justify-end" 
                            )}>
                                {/* Mobile: Always Show Card */}
                                <div className="md:hidden w-full">
                                    {ContentCard}
                                </div>

                                {/* Desktop: Show Card if Even, Year if Odd */}
                                <div className="hidden md:block w-full">
                                    {isEven ? ContentCard : (
                                         <span className={clsx(
                                           "text-5xl font-bold sticky top-32 transition-colors duration-300",
                                           activeIndex === index ? "text-teal-600" : "text-teal-300"
                                         )}>
                                           {event.year}
                                         </span>
                                    )}
                                </div>
                            </div>

                            {/* Right Side (Desktop) */}
                            <div className="hidden md:block w-full md:w-1/2 md:pl-12 text-left">
                                 {/* Desktop: Show Year if Even, Card if Odd */}
                                 {isEven ? (
                                      <span className={clsx(
                                        "text-5xl font-bold sticky top-32 transition-colors duration-300",
                                        activeIndex === index ? "text-teal-600" : "text-teal-300"
                                      )}>
                                        {event.year}
                                      </span>
                                 ) : ContentCard}
                            </div>
                        </div>
                     );
                })}
            </div>

            {/* Bottom Blur Overlay */}
            <div
              className={clsx(
                "pointer-events-none absolute bottom-0 left-0 w-full h-32 transition-all duration-700",
                isTimelineEnd
                  ? "backdrop-blur-0 opacity-0"
                  : "backdrop-blur-sm opacity-100"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>
        </div>

    </div>
  );
}