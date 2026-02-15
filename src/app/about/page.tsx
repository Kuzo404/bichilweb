'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Container from '@/components/Container';
import clsx from 'clsx';
import IntroTab from './tabs/IntroTab';
import ValuesTab from './tabs/ValuesTab';
import GovernanceTab from './tabs/GovernanceTab';
import StructureTab from './tabs/StructureTab';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

interface BannerData {
  id: number;
  image: string;
  translations: { language: number; title: string; subtitle: string }[];
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('intro');
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        // Discover about page ID dynamically
        const pagesRes = await fetch(`${API_URL}/about-page/`);
        if (!pagesRes.ok) return;
        const pages = await pagesRes.json();
        const aboutPage = pages.find((p: any) => p.key === 'intro');
        if (!aboutPage) return;
        const pid = aboutPage.id;

        const res = await fetch(`${API_URL}/about-banner/?page=${pid}`);
        if (!res.ok) return;
        const data: BannerData[] = await res.json();
        if (data.length > 0) {
          setBanner(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch banner:', err);
      }
    };
    fetchBanner();
  }, []);

  // Get Mongolian translation (language 1 = MN)
  const bannerTitle = banner?.translations?.find(t => t.language === 1)?.title || '';
  const bannerSubtitle = banner?.translations?.find(t => t.language === 1)?.subtitle || '';
  const bannerImage = banner?.image || '';

  return (
    <main className="min-h-screen bg-white">
      
      {/* Hero Section */}
      {bannerImage && (
      <section className="relative h-[520px] md:h-[600px] flex items-end justify-center overflow-hidden pb-20">
        <Image
          src={bannerImage}
          alt="About Us Hero"
          fill
          className="object-cover brightness-[0.4]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div className="relative z-10 text-center text-white px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {bannerTitle && (
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight drop-shadow-lg">{bannerTitle}</h1>
          )}
          {bannerSubtitle && (
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">{bannerSubtitle}</p>
          )}
        </div>
      </section>
      )}

      {/* Modern Tabs Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <Container>
          <div className="flex overflow-x-auto no-scrollbar justify-start md:justify-center py-4 gap-2 md:gap-8">
            {[
              { id: 'intro', label: 'Бидний тухай' },
              { id: 'values', label: 'Үнэт зүйлс' },
              { id: 'governance', label: 'Засаглал' },
              { id: 'structure', label: 'Бүтэц' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap select-none",
                  activeTab === tab.id
                    ? "bg-teal-600 text-white shadow-md transform scale-105"
                    : "text-gray-500 hover:text-teal-600 hover:bg-teal-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Container>
      </div>

      {/* Main Content Area */}
      <div className="py-16 md:py-24 bg-gray-50/50">
        <Container>
           {/* Dynamic Content Rendering */}
           <div className="min-h-[600px]">
               {activeTab === 'intro' && <IntroTab />}
               {activeTab === 'values' && <ValuesTab />}
               {activeTab === 'governance' && <GovernanceTab />}
               {activeTab === 'structure' && <StructureTab />}
           </div>
        </Container>
      </div>
    </main>
  );
}

