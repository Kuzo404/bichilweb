'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

// Reusable IntersectionObserver hook for animations
function useInViewAnimation() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

interface CoreValueAPI {
  id: number;
  file?: string | null;
  file_ratio?: string;
  index: number;
  visible: boolean;
  title_translations: { language: number; title: string }[];
  desc_translations: { language: number; desc: string }[];
}

const getMN = (translations: any[], field: string): string => {
  const mn = translations?.find((t: any) => t.language === 2);
  return mn?.[field] || translations?.[0]?.[field] || '';
};

export default function ValuesTab() {
  const vision = useInViewAnimation();
  const mission = useInViewAnimation();
  const valuesSection = useInViewAnimation();

  const [visionData, setVisionData] = useState({ title: '', desc: '', image: '' });
  const [missionData, setMissionData] = useState({ title: '', desc: '', image: '' });
  const [coreValues, setCoreValues] = useState<{ title: string; desc: string }[]>([]);

  useEffect(() => {
    const fetchValues = async () => {
      try {
        const res = await fetch(`${API_URL}/core-value/`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data: CoreValueAPI[] = await res.json();

        const sorted = [...data].sort((a, b) => a.index - b.index);

        // First item = Vision, Second = Mission, Rest = Core values
        if (sorted.length > 0) {
          const v = sorted[0];
          setVisionData({
            title: getMN(v.title_translations, 'title') + '. ' + getMN(v.desc_translations, 'desc'),
            desc: getMN(v.desc_translations, 'desc'),
            image: v.file || '',
          });
        }
        if (sorted.length > 1) {
          const m = sorted[1];
          setMissionData({
            title: getMN(m.title_translations, 'title') + '. ' + getMN(m.desc_translations, 'desc'),
            desc: getMN(m.desc_translations, 'desc'),
            image: m.file || '',
          });
        }
        if (sorted.length > 2) {
          setCoreValues(
            sorted.slice(2).map((cv) => ({
              title: getMN(cv.title_translations, 'title'),
              desc: getMN(cv.desc_translations, 'desc'),
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch core values:', error);
      }
    };
    fetchValues();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-32">
        
        {/* 1. VISION */}
        <section 
          ref={vision.ref}
          className={`grid md:grid-cols-2 gap-16 items-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform will-change-opacity
            ${vision.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}
          `}
        >
            <div className="space-y-6">
                <span className="text-sm font-semibold tracking-wider text-teal-600 uppercase">
                    Алсын хараа
                </span>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                    {visionData.desc}
                </h2>
            </div>
            {visionData.image && (
            <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-gray-100">
                <Image
                    src={visionData.image}
                    alt="Vision"
                    fill
                    className={`object-cover transition-transform duration-1000 ease-out
                      ${vision.visible ? 'scale-100' : 'scale-105'}
                    `}
                />
            </div>
            )}
        </section>

        {/* Divider */}
        <div className="hidden md:block h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* 2. MISSION */}
        <section 
          ref={mission.ref}
          className={`grid md:grid-cols-2 gap-16 items-center transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform will-change-opacity
            ${mission.visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}
          `}
        >
             {missionData.image && (
             <div className="order-2 md:order-1 relative h-[360px] w-full overflow-hidden rounded-2xl border border-gray-100">
                 <Image
                    src={missionData.image}
                    alt="Mission"
                    fill
                    className={`object-cover transition-transform duration-1000 ease-out
                      ${mission.visible ? 'scale-100' : 'scale-105'}
                    `}
                />
            </div>
             )}

            <div className="order-1 md:order-2 space-y-6">
                 <span className="text-sm font-semibold tracking-wider text-teal-600 uppercase">
                    Эрхэм зорилго
                </span>
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                    {missionData.desc}
                </h2>
            </div>
        </section>

        {/* 3. CORE VALUES */}
        {coreValues.length > 0 && (
        <section
          ref={valuesSection.ref}
          className={`transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform will-change-opacity
            ${valuesSection.visible
              ? 'motion-safe:opacity-100 motion-safe:translate-y-0 motion-reduce:opacity-100'
              : 'motion-safe:opacity-0 motion-safe:translate-y-10 motion-reduce:opacity-0'}
          `}
        >
             <div className="max-w-3xl mb-16">
                <h2 className="text-2xl font-semibold text-teal-600 mb-4 font-serif">Бидний үнэт зүйлс</h2>
                <div className="w-12 h-px bg-gray-300 mb-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coreValues.map((value, index) => (
                    <div 
                        key={index}
                        role="article"
                        aria-label={value.title}
                        className={`bg-white border border-gray-200 rounded-lg p-6
                          transition-all duration-1000 sm:duration-700
                          hover:border-gray-300 hover:bg-gray-50
                          ${valuesSection.visible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-6'}
                        `}
                        style={{ transitionDelay: `${index * 150}ms` }}
                    >
                        <h3 className="text-base font-semibold text-gray-600 mb-1">
                          {value.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            {value.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
        )}

    </div>
  );
}
