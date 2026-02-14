// app/about/hr/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Container from "@/components/Container";
import { axiosInstance } from "@/lib/axios";

/* ───────── API Types ───────── */
interface PolicyTranslation {
  id?: number;
  language: number;
  language_code?: string;
  language_name?: string;
  name: string;
  desc: string;
}
interface PolicyAPI {
  id?: number;
  key: string;
  visual_type: string;
  visual_preset: string;
  font_color: string;
  bg_color: string;
  fontsize: string;
  active: boolean;
  translations: PolicyTranslation[];
}
interface JobTranslation {
  id?: number;
  language: number;
  title: string;
  department: string;
  desc: string;
  requirements: string;
}
interface JobAPI {
  id?: number;
  type: number;
  location: string;
  deadline: string;
  status: number;
  translations: JobTranslation[];
}

/* ───────── Frontend Types ───────── */
interface Policy {
  key: string;
  title: string;
  content: string;
  gradient: string;
  glowColor: string;
  iconBg: string;
  icon: React.ReactElement;
}
interface Job {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  description: string;
  requirements?: string;
  deadline: string;
  status: string;
}

/* ───────── Icon components ───────── */
const PolicyIcon = ({ d }: { d: string }) => (
  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

const POLICY_ICONS: Record<string, React.ReactElement> = {
  equal: <PolicyIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  training: <PolicyIcon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  benefits: <PolicyIcon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  health: <PolicyIcon d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
  insurance: <PolicyIcon d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
};

/* ───────── Mapping helpers ───────── */
const GRADIENT: Record<string, string> = {
  equal: "from-blue-500 via-indigo-500 to-purple-500",
  training: "from-emerald-500 via-teal-500 to-cyan-500",
  benefits: "from-amber-500 via-orange-500 to-rose-500",
  health: "from-rose-500 via-pink-500 to-fuchsia-500",
  insurance: "from-violet-500 via-purple-500 to-indigo-500",
};
const GLOW: Record<string, string> = {
  equal: "rgba(99,102,241,0.4)",
  training: "rgba(20,184,166,0.4)",
  benefits: "rgba(249,115,22,0.4)",
  health: "rgba(236,72,153,0.4)",
  insurance: "rgba(139,92,246,0.4)",
};
const ICON_BG: Record<string, string> = {
  equal: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  training: "linear-gradient(135deg,#10b981,#14b8a6)",
  benefits: "linear-gradient(135deg,#f59e0b,#f97316)",
  health: "linear-gradient(135deg,#f43f5e,#ec4899)",
  insurance: "linear-gradient(135deg,#8b5cf6,#6366f1)",
};
const PRESET_TO_KEY: Record<string, string> = {
  m: "equal", modern: "equal",
  t: "training", training: "training",
  b: "benefits", benefits: "benefits",
  h: "health", health: "health",
  i: "insurance", insurance: "insurance",
};

const toPolicy = (api: PolicyAPI, lang: "en" | "mn" = "mn"): Policy => {
  const tr = api.translations.find((t) => t.language === (lang === "en" ? 1 : 2));
  const k = PRESET_TO_KEY[api.visual_preset?.toLowerCase()] || api.key;
  return {
    key: api.key,
    title: tr?.name || "",
    content: tr?.desc || "",
    gradient: GRADIENT[k] || GRADIENT.equal,
    glowColor: GLOW[k] || GLOW.equal,
    iconBg: ICON_BG[k] || ICON_BG.equal,
    icon: POLICY_ICONS[k] || POLICY_ICONS.equal,
  };
};
const toJob = (api: JobAPI, lang: "en" | "mn" = "mn"): Job => {
  const tr = api.translations.find((t) => t.language === (lang === "en" ? 1 : 2));
  const typeMap: Record<number, string> = { 1: "Бүтэн цагийн", 2: "Хагас цагийн", 3: "Гэрээт" };
  return {
    id: String(api.id || ""),
    title: tr?.title || "",
    department: tr?.department || "",
    type: typeMap[api.type] || "Бүтэн цагийн",
    location: api.location,
    description: tr?.desc || "",
    requirements: tr?.requirements || "",
    deadline: api.deadline,
    status: api.status === 1 ? "active" : "closed",
  };
};

/* ───────── Skeleton ───────── */
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/60 ${className}`} />
);

/* ═══════════════════════════════════════════════════════ */
export default function HRPage() {
  const [language] = useState<"en" | "mn">("mn");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const [policies, setPolicies] = useState<Record<string, Policy>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"policy" | "jobs">("policy");
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── fetch ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [polRes, jobRes] = await Promise.all([
          axiosInstance.get<PolicyAPI[]>("/hrpolicy/"),
          axiosInstance.get<JobAPI[]>("/jobs/"),
        ]);
        const p: Record<string, Policy> = {};
        polRes.data.filter((x) => x.active).forEach((x) => (p[x.key] = toPolicy(x, language)));
        setPolicies(p);
        setJobs(jobRes.data.filter((j) => j.status === 1).map((j) => toJob(j, language)));
      } catch (e) {
        console.error("HR fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [language]);

  /* ── form state ── */
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", position: "", experience: "", message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setShowForm(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", position: "", experience: "", message: "" });
      setSelectedJob(null);
    }, 2200);
  };

  const policyKeys = Object.keys(policies);
  const hasJobs = jobs.length > 0;

  /* ── glass card helpers ── */
  const glass = (extra = "") => `rounded-2xl ${extra}`;
  const glassStyle = (opacity = 0.7): React.CSSProperties => ({
    background: `linear-gradient(135deg,rgba(255,255,255,${opacity}) 0%,rgba(255,255,255,${Math.max(0, opacity - 0.2)}) 100%)`,
    backdropFilter: "blur(40px) saturate(200%)",
    WebkitBackdropFilter: "blur(40px) saturate(200%)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.8),0 8px 32px rgba(0,0,0,0.08),inset 0 1px 1px rgba(255,255,255,0.9)",
  });

  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return d;
    }
  };

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 relative overflow-x-hidden">
      {/* BG blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[600px] md:h-[600px] bg-gradient-to-br from-blue-100/50 via-indigo-100/30 to-purple-100/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -left-32 w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] md:w-[450px] md:h-[450px] bg-gradient-to-br from-cyan-100/40 via-teal-100/20 to-emerald-100/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-10 right-1/4 w-[180px] h-[180px] sm:w-[250px] sm:h-[250px] md:w-[400px] md:h-[400px] bg-gradient-to-br from-rose-100/30 via-pink-100/20 to-fuchsia-100/10 rounded-full blur-[90px]" />
      </div>

      <div className="relative">
        <div className="pt-8 pb-12 sm:pt-10 sm:pb-16 md:pt-20 md:pb-20">
          <Container>
            <div className="max-w-4xl mx-auto">

              {/* ═══════ HERO ═══════ */}
              <div
                className={glass("p-5 sm:p-8 md:p-12 relative overflow-hidden")}
                style={glassStyle(0.7)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />

                {/* decorative dots */}
                <div className="absolute top-4 right-4 hidden md:flex gap-1.5 opacity-30">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  ))}
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                      style={{ background: "linear-gradient(135deg,#1e293b,#475569)" }}>
                      <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                        Хүний нөөц
                      </h1>
                      <p className="text-[11px] sm:text-sm text-slate-500 font-medium mt-0.5">Human Resources</p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mb-5 sm:mb-6">
                    Ажилтнаа дэмжсэн бодлого, сургалт болон урамшуулалтай. Хамтран ажиллах
                    чадвартай шинэ хүнийг урьж байна.
                  </p>

                  <button
                    onClick={() => { setForm({ ...form, position: "" }); setShowForm(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl font-semibold text-sm sm:text-base hover:from-slate-700 hover:to-slate-600 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Анкет бөглөх
                  </button>
                </div>
              </div>

              {/* ═══════ TABS ═══════ */}
              <div className="mt-5 sm:mt-8">
                <div className="flex gap-1.5 sm:gap-2 p-1 rounded-xl w-fit" style={glassStyle(0.6)}>
                  <button
                    onClick={() => { setActiveTab("policy"); setSelectedJob(null); }}
                    className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                      activeTab === "policy"
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="hidden sm:inline">HR Бодлого</span>
                      <span className="sm:hidden">Бодлого</span>
                    </span>
                  </button>
                  {hasJobs && (
                    <button
                      onClick={() => { setActiveTab("jobs"); setActivePolicy(null); }}
                      className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                        activeTab === "jobs"
                          ? "bg-slate-800 text-white shadow-md"
                          : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Ажлын байр</span>
                        <span className="sm:hidden">Ажил</span>
                        <span className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {jobs.length}
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* ═══════ CONTENT ═══════ */}
              <div ref={contentRef} className="mt-4 sm:mt-6">

                {/* Loading skeleton */}
                {loading && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 sm:h-24" />
                      ))}
                    </div>
                    <Skeleton className="h-32" />
                  </div>
                )}

                {/* ─── POLICIES TAB ─── */}
                {!loading && activeTab === "policy" && (
                  <div>
                    <style jsx>{`
                      @keyframes fadeSlideIn {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                    {/* Policy grid — expanded content appears inline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {policyKeys.map((key) => {
                        const p = policies[key];
                        if (!p) return null;
                        const isActive = activePolicy === key;
                        return [
                          <button
                            key={key}
                            onClick={() => setActivePolicy(isActive ? null : key)}
                            className="group relative text-left w-full"
                          >
                            {/* glow */}
                            <div
                              className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${
                                isActive ? "opacity-50 scale-105" : "opacity-0 group-hover:opacity-30"
                              }`}
                              style={{ background: p.glowColor }}
                            />
                            <div
                              className={`relative p-4 sm:p-5 rounded-2xl transition-all duration-300 overflow-hidden ${
                                isActive ? "scale-[1.02]" : "hover:scale-[1.01]"
                              }`}
                              style={{
                                ...glassStyle(isActive ? 0.85 : 0.55),
                                boxShadow: isActive
                                  ? `0 0 0 1px rgba(255,255,255,0.95),0 0 24px ${p.glowColor},0 8px 32px rgba(0,0,0,0.08)`
                                  : "0 0 0 1px rgba(255,255,255,0.6),0 4px 16px rgba(0,0,0,0.05)",
                              }}
                            >
                              {/* top bar */}
                              <div
                                className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${p.gradient} transition-opacity duration-300 ${
                                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                                }`}
                              />
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                                    isActive ? "shadow-lg scale-110" : "group-hover:scale-105"
                                  }`}
                                  style={{
                                    background: p.iconBg,
                                    boxShadow: isActive ? `0 4px 16px ${p.glowColor}` : "0 2px 8px rgba(0,0,0,0.1)",
                                  }}
                                >
                                  {p.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                                    {p.title}
                                  </div>
                                  <div className={`text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 transition-opacity ${isActive ? "opacity-0 h-0" : "opacity-100"}`}>
                                    {p.content.slice(0, 50)}...
                                  </div>
                                </div>
                                <svg
                                  className={`w-4 h-4 text-slate-400 shrink-0 ml-auto transition-transform duration-300 ${
                                    isActive ? "rotate-180" : ""
                                  }`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </button>,
                          /* Inline expanded content — appears right after the card */
                          isActive && (
                            <div
                              key={`${key}-content`}
                              className={glass("p-4 sm:p-6 relative overflow-hidden col-span-1 sm:col-span-2 lg:col-span-3")}
                              style={{
                                ...glassStyle(0.75),
                                animation: "fadeSlideIn 0.3s ease-out",
                              }}
                            >
                              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${p.gradient}`} />
                              <div className="flex items-start gap-3 sm:gap-4">
                                <div
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0"
                                  style={{ background: p.iconBg }}
                                >
                                  {p.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-2">
                                    {p.title}
                                  </h3>
                                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                                    {p.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ),
                        ];
                      })}
                    </div>

                    {/* If no policies */}
                    {policyKeys.length === 0 && (
                      <div className={glass("p-8 sm:p-12 text-center")} style={glassStyle(0.5)}>
                        <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="text-slate-400 text-sm">Бодлого бүртгэгдээгүй</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── JOBS TAB ─── */}
                {!loading && activeTab === "jobs" && (
                  <div className="space-y-3 sm:space-y-4">
                    {jobs.map((job, idx) => {
                      const isExpanded = selectedJob?.id === job.id;
                      return (
                        <div
                          key={job.id}
                          className={glass(`relative overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-slate-300/50" : ""}`)}
                          style={glassStyle(isExpanded ? 0.85 : 0.65)}
                        >
                          {/* top accent */}
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-slate-500 to-slate-700" />

                          <div className="p-4 sm:p-6">
                            {/* Header row */}
                            <div className="flex items-start gap-3 mb-3">
                              <div
                                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-md shrink-0"
                                style={{ background: "linear-gradient(135deg,#475569,#334155)" }}
                              >
                                <span className="text-white text-xs sm:text-sm font-bold">{idx + 1}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight">
                                  {job.title}
                                </h3>
                                {/* Tags */}
                                <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/70 text-[11px] sm:text-xs rounded-full text-slate-600 border border-slate-200/60">
                                    <svg className="w-3 h-3 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    {job.department}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/70 text-[11px] sm:text-xs rounded-full text-slate-600 border border-slate-200/60">
                                    <svg className="w-3 h-3 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {job.type}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/70 text-[11px] sm:text-xs rounded-full text-slate-600 border border-slate-200/60">
                                    <svg className="w-3 h-3 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {job.location}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Footer row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-3 border-t border-slate-200/40">
                              <div className="flex items-center gap-1.5 text-[11px] sm:text-sm text-slate-500">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(job.deadline)}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedJob(isExpanded ? null : job)}
                                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-200 transition-colors"
                                >
                                  {isExpanded ? "Хураах" : "Дэлгэрэнгүй"}
                                </button>
                                <button
                                  onClick={() => { setSelectedJob(job); setForm({ ...form, position: job.title }); setShowForm(true); }}
                                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-700 transition-colors active:scale-[0.97]"
                                >
                                  Анкет бөглөх
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-0 border-t border-slate-200/40">
                              <div className="pt-4 sm:pt-5 space-y-3">
                                <div className="bg-white/50 rounded-xl p-3.5 sm:p-5 border border-slate-200/40">
                                  <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    Ажлын тайлбар
                                  </h4>
                                  <p className="text-slate-600 leading-relaxed text-xs sm:text-sm whitespace-pre-line">{job.description}</p>
                                </div>
                                {job.requirements && (
                                  <div className="bg-white/50 rounded-xl p-3.5 sm:p-5 border border-slate-200/40">
                                    <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base flex items-center gap-2">
                                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Шаардлага
                                    </h4>
                                    <div className="text-slate-600 leading-relaxed text-xs sm:text-sm whitespace-pre-line">{job.requirements}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {jobs.length === 0 && (
                      <div className={glass("p-8 sm:p-12 text-center")} style={glassStyle(0.5)}>
                        <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-slate-400 text-sm">Одоогоор ажлын зар байхгүй</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* ═══════ APPLICATION MODAL ═══════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(15,23,42,0.3)", backdropFilter: "blur(12px)" }}
            onClick={() => setShowForm(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[85vh] sm:max-h-[85vh] mb-16 sm:mb-0 flex flex-col"
            style={{
              background: "linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,0.85))",
              backdropFilter: "blur(50px)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.9),0 -4px 40px rgba(0,0,0,0.1),0 24px 80px rgba(0,0,0,0.18)",
            }}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900">Анкет бөглөх</h3>
                  {(selectedJob?.title || form.position) && (
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">{selectedJob?.title || form.position}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {sent ? (
                <div className="py-8 sm:py-10 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Амжилттай!</div>
                  <p className="text-xs sm:text-sm text-slate-500">Таны анкет амжилттай илгээгдлээ</p>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      name="firstName" value={form.firstName} onChange={handleChange}
                      placeholder="Нэр *" required
                      className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/60 border border-slate-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent placeholder:text-slate-400 transition-all"
                    />
                    <input
                      name="lastName" value={form.lastName} onChange={handleChange}
                      placeholder="Овог *" required
                      className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/60 border border-slate-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent placeholder:text-slate-400 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="Имэйл *" required
                      className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/60 border border-slate-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent placeholder:text-slate-400 transition-all"
                    />
                    <input
                      name="phone" value={form.phone} onChange={handleChange}
                      placeholder="Утас *" required
                      className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/60 border border-slate-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent placeholder:text-slate-400 transition-all"
                    />
                  </div>
                  <select
                    name="experience" value={form.experience} onChange={handleChange} required
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/60 border border-slate-200/60 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent text-slate-600 transition-all"
                  >
                    <option value="">Туршлага *</option>
                    <option value="0-1">0-1 жил</option>
                    <option value="1-3">1-3 жил</option>
                    <option value="3-5">3-5 жил</option>
                    <option value="5+">5+ жил</option>
                  </select>
                  <textarea
                    name="message" value={form.message} onChange={handleChange} rows={3}
                    placeholder="Танилцуулга"
                    className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/60 border border-slate-200/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent placeholder:text-slate-400 transition-all"
                  />
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button" onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                    >
                      Болих
                    </button>
                    <button
                      type="submit" disabled={submitting}
                      className="flex-1 px-4 py-2.5 sm:py-3 text-white rounded-xl font-semibold disabled:opacity-50 transition-all active:scale-[0.98] text-sm"
                      style={{ background: "linear-gradient(135deg,#1e293b,#334155)" }}
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Илгээж байна...
                        </span>
                      ) : "Илгээх"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
