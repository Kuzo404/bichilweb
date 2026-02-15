"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Container from "@/components/Container";
import BranchesMap from "@/components/BranchesMap";
import { MapPin, Clock, Phone, Calendar, ChevronDown, ChevronUp, Map } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { useLanguage } from "@/contexts/LanguageContext";

interface PhoneItem {
  id: number;
  phone: string;
}

interface Branch {
  id: number;
  name: string;
  name_en: string;
  location: string;
  location_en: string;
  image: string;
  image_url: string;
  area: string;
  area_en: string;
  city: string;
  city_en: string;
  district: string;
  district_en: string;
  open: string;
  open_en: string;
  time: string;
  latitude: string;
  longitude: string;
  phones: PhoneItem[];
  category_id: number | null;
  category_name: string | null;
  category_name_en: string | null;
}

interface BranchCategory {
  id: number;
  name: string;
  name_en: string;
  sort_order: number;
  active: boolean;
}

export interface BranchSettings {
  popup_bg: string;
  popup_title_color: string;
  popup_text_color: string;
  popup_icon_color: string;
  popup_btn_bg: string;
  popup_btn_text: string;
  popup_btn_label: string;
  popup_btn_label_en: string;
  card_bg: string;
  card_border: string;
  card_title_color: string;
  card_text_color: string;
  card_icon_color: string;
  card_btn_bg: string;
  card_btn_text: string;
  card_btn_label: string;
  card_btn_label_en: string;
  marker_color: string;
  marker_selected_color: string;
  map_btn_bg: string;
  map_btn_text: string;
  map_btn_label: string;
  map_btn_label_en: string;
}

const defaultSettings: BranchSettings = {
  popup_bg: "#ffffff",
  popup_title_color: "#111827",
  popup_text_color: "#374151",
  popup_icon_color: "#0d9488",
  popup_btn_bg: "#0d9488",
  popup_btn_text: "#ffffff",
  popup_btn_label: "Чиглэл авах",
  popup_btn_label_en: "",
  card_bg: "#ffffff",
  card_border: "#e5e7eb",
  card_title_color: "#111827",
  card_text_color: "#4b5563",
  card_icon_color: "#0d9488",
  card_btn_bg: "#f0fdfa",
  card_btn_text: "#0d9488",
  card_btn_label: "Газрын зургаас харах",
  card_btn_label_en: "",
  marker_color: "#0d9488",
  marker_selected_color: "#0f766e",
  map_btn_bg: "#0d9488",
  map_btn_text: "#ffffff",
  map_btn_label: "Газрын зураг",
  map_btn_label_en: "",
};

export default function BranchesPage() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<BranchCategory[]>([]);
  const [settings, setSettings] = useState<BranchSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [mapOpen, setMapOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [branchRes, catRes, settingsRes] = await Promise.all([
          axiosInstance.get("/branch"),
          axiosInstance.get("/branch-category"),
          axiosInstance.get("/branch-settings/"),
        ]);
        setBranches(branchRes.data);
        setCategories(
          (catRes.data as BranchCategory[])
            .filter((c) => c.active)
            .sort((a, b) => a.sort_order - b.sort_order)
        );
        if (settingsRes.data) {
          setSettings({ ...defaultSettings, ...settingsRes.data });
        }
      } catch (err: any) {
        console.error("Error fetching branches:", err);
        setError(err.response?.data?.message || "Салбаруудыг ачааллахад алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredBranches = useMemo(() => {
    if (activeCategoryId === null) return branches;
    return branches.filter((b) => b.category_id === activeCategoryId);
  }, [activeCategoryId, branches]);

  const handleViewOnMap = (branch: Branch) => {
    setSelectedBranch(branch);
    if (!mapOpen) setMapOpen(true);
    setTimeout(() => {
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container>
          <div className="py-6 md:py-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Салбарын байршил</h1>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4" />
                <p className="text-gray-600">Ачааллаж байна...</p>
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container>
          <div className="py-6 md:py-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Салбарын байршил</h1>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Дахин оролдох
                </button>
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const s = settings;

  return (
    <main className="min-h-screen bg-gray-50">
      <Container>
        <div className="py-6 md:py-10">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Салбарын байршил</h1>
            <p className="text-sm text-gray-500 mt-1">Нийт {branches.length} салбар</p>
          </div>

          {/* Category filter - horizontal scroll with arrows */}
          {categories.length > 0 && (
            <div className="mb-6">
              <div
                ref={tabsRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth cursor-grab active:cursor-grabbing"
              >
                <button
                  onClick={() => { setActiveCategoryId(null); setSelectedBranch(null); }}
                  className="px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap flex-shrink-0"
                  style={{
                    background: activeCategoryId === null ? s.card_icon_color : "#fff",
                    color: activeCategoryId === null ? "#fff" : "#4b5563",
                    border: activeCategoryId === null ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  Бүгд ({branches.length})
                </button>
                {categories.map((cat) => {
                  const count = branches.filter((b) => b.category_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategoryId(cat.id); setSelectedBranch(null); }}
                      className="px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap flex-shrink-0"
                      style={{
                        background: activeCategoryId === cat.id ? s.card_icon_color : "#fff",
                        color: activeCategoryId === cat.id ? "#fff" : "#4b5563",
                        border: activeCategoryId === cat.id ? "none" : "1px solid #e5e7eb",
                      }}
                    >
                      {(isEn && cat.name_en) ? cat.name_en : cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Map toggle button */}
            <div ref={mapRef}>
              <button
                onClick={() => setMapOpen(!mapOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm"
                style={{ background: s.map_btn_bg, color: s.map_btn_text }}
              >
                <Map className="w-4 h-4" />
                {(isEn && s.map_btn_label_en) ? s.map_btn_label_en : s.map_btn_label} {mapOpen ? (isEn ? 'close' : 'хаах') : (isEn ? 'open' : 'нээх')}
                {mapOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Map — collapsible, taller, satellite */}
            {mapOpen && (
              <div className="h-[350px] sm:h-[450px] md:h-[550px] bg-gray-100 rounded-2xl overflow-hidden relative shadow-sm transition-all">
                <BranchesMap
                  branches={filteredBranches}
                  selectedBranch={selectedBranch}
                  onSelect={setSelectedBranch}
                  settings={s}
                />
              </div>
            )}

            {/* Branch cards grid — 2 cols on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {filteredBranches.map((branch) => (
                <div
                  key={branch.id}
                  onClick={() => setSelectedBranch(branch)}
                  className="rounded-xl overflow-hidden transition-all cursor-pointer hover:shadow-lg group"
                  style={{
                    background: s.card_bg,
                    border: `1px solid ${selectedBranch?.id === branch.id ? s.card_icon_color : s.card_border}`,
                    boxShadow: selectedBranch?.id === branch.id ? `0 4px 12px ${s.card_icon_color}25` : undefined,
                  }}
                >
                  {/* Image — fills card width */}
                  {branch.image_url && (
                    <div className="relative w-full h-32 sm:h-40 md:h-44 overflow-hidden">
                      <img
                        src={branch.image_url?.startsWith('http') ? branch.image_url : `${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${branch.image_url}`}
                        alt={branch.name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                        }}
                      />
                      {branch.category_name && (
                        <span
                          className="absolute top-2 left-2 px-2 py-0.5 text-white text-[10px] sm:text-xs font-medium rounded-full backdrop-blur-sm"
                          style={{ background: `${s.card_icon_color}e6` }}
                        >
                          {(isEn && branch.category_name_en) ? branch.category_name_en : branch.category_name}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-3 md:p-4 space-y-1.5 md:space-y-2">
                    <h3
                      className="text-sm md:text-base font-bold leading-tight line-clamp-2"
                      style={{ color: s.card_title_color }}
                    >
                      {(isEn && branch.name_en) ? branch.name_en : branch.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: s.card_icon_color }} />
                      <div className="text-xs md:text-sm min-w-0" style={{ color: s.card_text_color }}>
                        <p className="line-clamp-2">{(isEn && branch.location_en) ? branch.location_en : branch.location}</p>
                        {(branch.area || branch.city) && (
                          <p className="text-[10px] md:text-xs opacity-60 mt-0.5 line-clamp-1">
                            {isEn
                              ? [branch.area_en || branch.area, branch.city_en || branch.city, branch.district_en || branch.district].filter(Boolean).join(", ")
                              : [branch.area, branch.city, branch.district ? `${branch.district}-р хороо` : ""].filter(Boolean).join(", ")
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Working days - hidden on mobile to save space */}
                    {branch.open && (
                      <div className="hidden sm:flex items-center gap-1.5" style={{ color: s.card_text_color }}>
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.card_icon_color }} />
                        <p className="text-xs md:text-sm">{(isEn && branch.open_en) ? branch.open_en : branch.open}</p>
                      </div>
                    )}

                    {/* Working hours */}
                    {branch.time && (
                      <div className="flex items-center gap-1.5" style={{ color: s.card_text_color }}>
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.card_icon_color }} />
                        <p className="text-xs md:text-sm">{branch.time}</p>
                      </div>
                    )}

                    {/* Phones - hidden on mobile, each with icon */}
                    {branch.phones && branch.phones.length > 0 && (
                      <div className="hidden sm:block pt-2 border-t space-y-1" style={{ borderColor: s.card_border }}>
                        {branch.phones.slice(0, 3).map((phone) => (
                          <div key={phone.id} className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.card_icon_color }} />
                            <a
                              href={`tel:${phone.phone}`}
                              className="text-xs md:text-sm transition-colors"
                              style={{ color: s.card_text_color }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = s.card_icon_color)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = s.card_text_color)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {phone.phone}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* View on map button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOnMap(branch);
                      }}
                      className="w-full mt-1.5 md:mt-2 px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all"
                      style={{ background: s.card_btn_bg, color: s.card_btn_text }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                      {(isEn && s.card_btn_label_en) ? s.card_btn_label_en : s.card_btn_label}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {filteredBranches.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">Салбар олдсонгүй</p>
                <p className="text-gray-400 text-sm mt-1">Өөр ангилал сонгож үзнэ үү</p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}