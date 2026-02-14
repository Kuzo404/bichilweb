import Hero from '@/components/Hero'
import DraggableStatsCarousel from '@/components/CTA'
import AppDownload from '@/components/AppDownload'
import NewsSection from '@/components/NewsSection'

export default function Home() {
  return (
    <div>
      <Hero />

      <DraggableStatsCarousel />

      <AppDownload />

      <NewsSection />
    </div>
  )
}
