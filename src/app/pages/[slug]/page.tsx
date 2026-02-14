'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Container from '@/components/Container';
import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchPageBySlug, getTranslation, type PageData } from '@/lib/pagesApi';

const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
  .animate-scale-in {
    animation: scaleIn 0.4s ease-out;
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK TYPES & RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

interface Block {
  id: string;
  type: string;
  content: Record<string, any>;
  style: Record<string, string>;
}

interface LayoutSettings {
  maxWidth: string;
  fullWidth: boolean;
  pagePaddingTop: string;
  pagePaddingBottom: string;
  pagePaddingLeft: string;
  pagePaddingRight: string;
}

function RenderBlock({ block, lang }: { block: Block; lang: string }) {
  const c = block.content;
  const s = block.style || {};
  const wrap: React.CSSProperties = {
    textAlign: (s.textAlign as any) || 'left',
    backgroundColor: s.backgroundColor || undefined,
    color: s.textColor || undefined,
    paddingTop: `${s.paddingTop || 16}px`,
    paddingBottom: `${s.paddingBottom || 16}px`,
    paddingLeft: `${s.paddingLeft || 0}px`,
    paddingRight: `${s.paddingRight || 0}px`,
    borderRadius: `${s.borderRadius || 0}px`,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    fontFamily: s.fontFamily || undefined,
    fontWeight: (s.fontWeight as any) || undefined,
  };

  switch (block.type) {
    case 'heading': {
      const text = lang === 'mn' ? c.text_mn : c.text_en;
      const sizes: Record<string, string> = { h1: '2.5rem', h2: '2rem', h3: '1.5rem', h4: '1.25rem' };
      if (!text) return null;
      return <div style={wrap}><div style={{ fontSize: sizes[c.level] || '2rem', fontWeight: 'bold', lineHeight: 1.3 }}>{text}</div></div>;
    }
    case 'text': {
      const text = lang === 'mn' ? c.text_mn : c.text_en;
      if (!text) return null;
      return <div style={wrap}><div className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: '17px', lineHeight: '1.8' }}>{text}</div></div>;
    }
    case 'image':
      return c.url ? (
        <div style={wrap}>
          <img src={c.url} alt={c.alt || ''} className="max-w-full h-auto rounded-lg" />
          {(lang === 'mn' ? c.caption_mn : c.caption_en) && (
            <p className="text-sm text-gray-500 mt-2 text-center">{lang === 'mn' ? c.caption_mn : c.caption_en}</p>
          )}
        </div>
      ) : null;
    case 'video': {
      const match = (c.url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
      const ytId = match ? match[1] : null;
      const isFile = c._isFile || (c.url && !c.url.includes('youtube') && !c.url.includes('youtu.be'));
      return c.url ? (
        <div style={wrap}>
          {ytId ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe src={`https://www.youtube.com/embed/${ytId}`} className="absolute inset-0 w-full h-full rounded-lg" allowFullScreen />
            </div>
          ) : isFile ? (
            <video src={c.url} controls className="w-full rounded-lg" style={{ maxHeight: '500px' }} />
          ) : null}
        </div>
      ) : null;
    }
    case 'button': {
      const text = lang === 'mn' ? c.text_mn : c.text_en;
      const vars: Record<string, string> = {
        primary: 'bg-teal-600 text-white hover:bg-teal-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        outline: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50',
      };
      return (
        <div style={wrap}>
          <a href={c.url || '#'} className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors ${vars[c.variant] || vars.primary}`}>
            {text || 'Товч'}
          </a>
        </div>
      );
    }
    case 'spacer':
      return <div style={{ height: `${c.height || 40}px` }} />;
    case 'divider':
      return <div style={wrap}><hr style={{ border: 'none', borderTop: `${c.thickness || 1}px solid ${c.color || '#e5e7eb'}`, margin: 0 }} /></div>;
    case 'banner':
      return (
        <div style={{ ...wrap, position: 'relative', height: `${c.height || 400}px`, overflow: 'hidden', borderRadius: `${s.borderRadius || 0}px` }}>
          {c.imageUrl ? <img src={c.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-blue-700" />}
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(parseInt(c.overlayOpacity) || 40) / 100})` }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{(lang === 'mn' ? c.title_mn : c.title_en) || ''}</h2>
            {(lang === 'mn' ? c.subtitle_mn : c.subtitle_en) && <p className="text-lg md:text-xl opacity-90">{lang === 'mn' ? c.subtitle_mn : c.subtitle_en}</p>}
          </div>
        </div>
      );
    case 'columns': {
      const n = parseInt(c.count) || 2;
      const cols = n >= 3
        ? [lang === 'mn' ? c.col1_mn : c.col1_en, lang === 'mn' ? c.col2_mn : c.col2_en, lang === 'mn' ? c.col3_mn : c.col3_en]
        : [lang === 'mn' ? c.col1_mn : c.col1_en, lang === 'mn' ? c.col2_mn : c.col2_en];
      return (
        <div style={wrap}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: `${c.gap || 24}px` }}>
            {cols.map((col, i) => <div key={i} className="whitespace-pre-wrap">{col || ''}</div>)}
          </div>
        </div>
      );
    }
    case 'html':
      return c.code ? <div style={wrap} dangerouslySetInnerHTML={{ __html: c.code }} /> : null;
    case 'list': {
      const items = ((lang === 'mn' ? c.items_mn : c.items_en) || '').split('\n').filter(Boolean);
      if (items.length === 0) return null;
      const Tag = c.listType === 'numbered' ? 'ol' : 'ul';
      return (
        <div style={wrap}>
          <Tag className={c.listType === 'numbered' ? 'list-decimal pl-6 space-y-1' : 'list-disc pl-6 space-y-1'}>
            {items.map((x: string, i: number) => <li key={i}>{x}</li>)}
          </Tag>
        </div>
      );
    }
    case 'quote': {
      const text = lang === 'mn' ? c.text_mn : c.text_en;
      if (!text) return null;
      return (
        <div style={wrap}>
          <blockquote className="border-l-4 border-teal-500 pl-6 py-2 italic text-lg text-gray-700">
            <p>{text}</p>
            {c.author && <footer className="mt-2 text-sm font-medium text-gray-500 not-italic">— {c.author}</footer>}
          </blockquote>
        </div>
      );
    }
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DynamicPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { language } = useLanguage();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentLanguageId = language === 'mn' ? 1 : 2;

  useEffect(() => {
    if (!slug) return;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchPageBySlug(slug);
        
        if (!data) {
          setError('NOT_FOUND');
          return;
        }
        
        if (!data.active) {
          setError('INACTIVE');
          return;
        }
        
        setPage(data);
      } catch (err) {
        console.error('Error loading page:', err);
        setError('NETWORK_ERROR');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert(language === 'mn' ? 'Линк хуулагдлаа!' : 'Link copied!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <Header />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-teal-100 rounded-full mx-auto mb-6"></div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-transparent border-t-teal-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-teal-600 font-medium">
              {language === 'mn' ? 'Уншиж байна...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (error || !page) {
    const errorMessages = {
      NOT_FOUND: {
        mn: { title: 'Хуудас олдсонгүй', message: 'Уучлаарай, таны хайсан хуудас олдсонгүй.' },
        en: { title: 'Page Not Found', message: 'Sorry, the page you are looking for could not be found.' }
      },
      INACTIVE: {
        mn: { title: 'Хуудас идэвхгүй', message: 'Энэ хуудас одоогоор идэвхгүй байна.' },
        en: { title: 'Page Inactive', message: 'This page is currently inactive.' }
      },
      NETWORK_ERROR: {
        mn: { title: 'Сүлжээний алдаа', message: 'Сүлжээний холболт тасарсан байна.' },
        en: { title: 'Network Error', message: 'Network connection failed.' }
      }
    };

    const currentError = errorMessages[error as keyof typeof errorMessages] || errorMessages.NOT_FOUND;
    const errorText = language === 'mn' ? currentError.mn : currentError.en;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <Header />
        <Container>
          <div className="py-24 text-center animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-100">
              <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">404</h1>
            <p className="text-xl text-slate-600 mb-4">{errorText.title}</p>
            <p className="text-slate-500 mb-10 max-w-md mx-auto">{errorText.message}</p>
            <a href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white rounded-2xl hover:bg-teal-700 transition-all duration-300 font-medium shadow-lg shadow-teal-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {language === 'mn' ? 'Нүүр хуудас руу буцах' : 'Back to Home'}
            </a>
          </div>
        </Container>
      </div>
    );
  }

  // Parse content_blocks
  let contentBlocks: Block[] = [];
  let layoutSettings: LayoutSettings = {
    maxWidth: '1200',
    fullWidth: false,
    pagePaddingTop: '0',
    pagePaddingBottom: '0',
    pagePaddingLeft: '0',
    pagePaddingRight: '0',
  };

  try {
    const raw = page.content_blocks ? JSON.parse(page.content_blocks) : [];
    if (Array.isArray(raw)) {
      contentBlocks = raw;
    } else if (raw && raw.blocks) {
      contentBlocks = raw.blocks || [];
      layoutSettings = { ...layoutSettings, ...(raw.layout || {}) };
    }
  } catch {
    contentBlocks = [];
  }

  const hasBlocks = contentBlocks.length > 0;
  const title = getTranslation(page.title_translations, currentLanguageId);
  const description = getTranslation(page.description_translations, currentLanguageId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <Header />
      
      <main className="py-8 md:py-16 lg:py-20">
        {/* Back Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:fixed md:bottom-auto md:top-24 md:left-8 md:translate-x-0 animate-fade-in">
          <a
            href="/"
            className="inline-flex items-center justify-center w-12 h-12 bg-white/95 backdrop-blur-sm text-slate-700 rounded-full hover:bg-teal-50 hover:text-teal-600 hover:shadow-xl transition-all duration-300 group shadow-lg border border-slate-200/80 hover:border-teal-300/80"
            title={language === 'mn' ? 'Нүүр хуудас' : 'Home'}
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
        </div>

        {hasBlocks ? (
          /* ── Block-based page rendering ── */
          <div
            className="animate-fade-in-up"
            style={{
              maxWidth: layoutSettings.fullWidth ? '100%' : `${layoutSettings.maxWidth || 1200}px`,
              margin: '0 auto',
              paddingTop: `${layoutSettings.pagePaddingTop || 0}px`,
              paddingBottom: `${layoutSettings.pagePaddingBottom || 0}px`,
              paddingLeft: `${layoutSettings.pagePaddingLeft || 16}px`,
              paddingRight: `${layoutSettings.pagePaddingRight || 16}px`,
            }}
          >
            {/* Page Title */}
            {title.label && (
              <div className="text-center mb-8 animate-fade-in">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
                  {title.label}
                </h1>
                <div className="h-1 w-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mx-auto"></div>
              </div>
            )}

            {/* Feature Image */}
            {page.image && (
              <div className="relative rounded-2xl overflow-hidden shadow-xl animate-scale-in mb-10 group">
                <img
                  src={page.image}
                  alt={title.label}
                  className="w-full h-[280px] md:h-[380px] object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  loading="lazy"
                />
              </div>
            )}

            {/* Render Blocks */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="relative" style={{
                paddingLeft: '16px', paddingRight: '16px',
                minHeight: `${Math.max(400, contentBlocks.reduce((max: number, b: Block) => {
                  const bottom = parseInt(b.style?.posY || '0') + parseInt(b.style?.height || '200')
                  return Math.max(max, bottom)
                }, 0) + 100)}px`,
              }}>
                {contentBlocks.map((block) => {
                  const hasPosition = block.style?.posX || block.style?.posY
                  return hasPosition ? (
                    <div key={block.id} style={{
                      position: 'absolute',
                      left: `${block.style.posX || 0}px`,
                      top: `${block.style.posY || 0}px`,
                      width: block.style.width ? `${block.style.width}px` : 'auto',
                      height: block.style.height ? `${block.style.height}px` : 'auto',
                      zIndex: parseInt(block.style.zIndex || '1'),
                      overflow: 'hidden',
                    }}>
                      <RenderBlock block={block} lang={language} />
                    </div>
                  ) : (
                    <RenderBlock key={block.id} block={block} lang={language} />
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── Legacy fallback: title + description ── */
          <Container>
            <article className="max-w-3xl mx-auto animate-fade-in-up">
              <div className="mb-12 animate-fade-in md:pt-8">
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
                    {title.label}
                  </h1>
                  <div className="h-1 w-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full mx-auto"></div>
                </div>

                {page.image && (
                  <div className="relative rounded-2xl overflow-hidden shadow-xl animate-scale-in mb-12 group">
                    <img
                      src={page.image}
                      alt={title.label}
                      className="w-full h-[280px] md:h-[380px] object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden bg-white">
                <div className="px-6 md:px-10 lg:px-12 py-10 md:py-14">
                  <div className="prose prose-slate max-w-none">
                    <div className="whitespace-pre-wrap space-y-4" style={{ fontSize: '17px', lineHeight: '1.8' }}>
                      {description.label}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </Container>
        )}
      </main>
    </div>
  );
}