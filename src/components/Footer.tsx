"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// ============================================================================
// Django-аас ирэх Footer өгөгдлийн бүтэц
// ============================================================================
interface FooterSocial {
  id: number;
  social: string;
  url: string;
  index: number;
  active?: boolean;
}

interface FooterUrl {
  id: number;
  nameen: string;
  namemn: string;
  url: string;
}

interface FooterData {
  id: number;
  logotext: string;
  logo: string;
  logo_url: string | null;
  svg: string;
  descmn: string;
  descen: string;
  locationmn: string;
  locationen: string;
  email: string;
  phone: string;
  bgcolor: string;
  fontcolor: string;
  featurecolor: string;
  socialiconcolor: string;
  titlesize: string;
  fontsize: string;
  copyrighten: string;
  copyrightmn: string;
  logo_size: string;
  socials: FooterSocial[];
  urls: FooterUrl[];
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

// Social icon SVG paths
const socialIcons: Record<string, string> = {
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram:
    "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
  twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  telegram:
    "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.332-.373-.119l-6.869 4.332-2.993-.937c-.651-.213-.666-.651.136-.968l11.707-4.514c.55-.213 1.028.145.848.957z",
};

export default function Footer() {
  const { language } = useLanguage();
  const [footerData, setFooterData] = useState<FooterData | null>(null);

  // DB-ээс footer өгөгдөл татах
  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/footer/`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setFooterData(data[0]);
          }
        }
      } catch (error) {
        console.error("Footer татахад алдаа:", error);
      }
    };
    fetchFooter();
  }, []);

  // Хэлний дагуу текст авах
  const t = (mn: string, en: string) => (language === "mn" ? mn : en);

  // Fallback — DB өгөгдөл ирээгүй бол default footer
  if (!footerData) {
    return (
      <footer className="bg-white border-t mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center text-gray-400 text-sm">Loading...</div>
        </div>
      </footer>
    );
  }

  const {
    logotext,
    logo_url,
    svg,
    descmn,
    descen,
    locationmn,
    locationen,
    email,
    phone,
    bgcolor,
    fontcolor,
    featurecolor,
    socialiconcolor,
    titlesize,
    fontsize,
    copyrighten,
    copyrightmn,
    socials,
    urls,
  } = footerData;

  const titleClass =
    parseInt(titlesize || "16") >= 20
      ? "text-xl"
      : parseInt(titlesize || "16") >= 18
      ? "text-lg"
      : "text-base";

  const textClass =
    parseInt(fontsize || "14") >= 16
      ? "text-base"
      : parseInt(fontsize || "14") >= 14
      ? "text-sm"
      : "text-xs";

  return (
    <footer
      className="border-t mt-8 sm:mt-12"
      style={{ backgroundColor: bgcolor || "#ffffff", color: fontcolor || "#4b5563" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo + Description */}
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className={`${titleClass} font-extrabold tracking-tight hover:opacity-80 transition`}
              style={{ color: featurecolor || "#14b8a6" }}
            >
              {svg ? (
                <span
                  className="inline-block [&>svg]:w-full [&>svg]:h-full"
                  style={{ height: `${footerData.logo_size || '56'}px`, width: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : logo_url ? (
                <img
                  src={
                    logo_url.startsWith("http")
                      ? logo_url
                      : `${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${logo_url}`
                  }
                  alt={logotext}
                  style={{ height: `${footerData.logo_size || '56'}px` }}
                  className="object-contain"
                />
              ) : (
                logotext || "BichilGlobus"
              )}
            </Link>

            <p
              className={`mt-3 ${textClass} leading-relaxed`}
              style={{ color: fontcolor || "#4b5563" }}
            >
              {t(descmn || "", descen || "")}
            </p>

            {/* Social icons */}
            {socials && socials.length > 0 && (
              <div className="flex gap-4 mt-5">
                {socials
                  .filter((s) => s.active !== false)
                  .sort((a, b) => (a.index || 0) - (b.index || 0))
                  .map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.social}
                      className="hover:opacity-70 transition"
                      style={{ color: socialiconcolor || featurecolor || "#14b8a6" }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d={socialIcons[social.social] || ""} />
                      </svg>
                    </a>
                  ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {urls && urls.length > 0 && (
            <div>
              <h3
                className={`${titleClass} font-semibold mb-4`}
                style={{ color: featurecolor || "#14b8a6" }}
              >
                {t("Холбоосууд", "Quick Links")}
              </h3>
              <nav className={`flex flex-col gap-2 ${textClass}`}>
                {urls.map((link) => (
                  <Link
                    key={link.id}
                    href={link.url || "#"}
                    className="hover:opacity-70 transition"
                    style={{ color: fontcolor || "#4b5563" }}
                  >
                    {t(link.namemn || "", link.nameen || "")}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Contact */}
          <div>
            <h3
              className={`${titleClass} font-semibold mb-4`}
              style={{ color: featurecolor || "#14b8a6" }}
            >
              {t("Холбоо барих", "Contact Us")}
            </h3>
            <div className={`${textClass} space-y-2`} style={{ color: fontcolor || "#4b5563" }}>
              {(locationmn || locationen) && (
                <p className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: featurecolor || "#14b8a6" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {t(locationmn || "", locationen || "")}
                </p>
              )}

              {email && (
                <p className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: featurecolor || "#14b8a6" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a href={`mailto:${email}`} className="hover:opacity-70 transition">
                    {email}
                  </a>
                </p>
              )}

              {phone && (
                <p className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: featurecolor || "#14b8a6" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <a href={`tel:${phone}`} className="hover:opacity-70 transition">
                    {phone}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar — Copyright */}
        <div
          className={`mt-10 pt-6 border-t ${textClass} flex justify-center items-center`}
          style={{ borderColor: `${fontcolor || "#4b5563"}20`, color: fontcolor || "#4b5563" }}
        >
          <div className="text-center">
            {t(copyrightmn || "", copyrighten || "")}
          </div>
        </div>
      </div>
    </footer>
  );
}
