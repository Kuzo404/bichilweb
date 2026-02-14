"use client";

import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin, Clock } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { BranchSettings } from "@/app/branches/page";

interface PhoneItem {
  id: number;
  phone: string;
}

interface Branch {
  id: number;
  name: string;
  location: string;
  image: string;
  image_url: string;
  area: string;
  city: string;
  district: string;
  open: string;
  time: string;
  latitude: string;
  longitude: string;
  phones: PhoneItem[];
}

type Props = {
  branches: Branch[];
  selectedBranch: Branch | null;
  onSelect: (b: Branch) => void;
  settings: BranchSettings;
};

function makeIcon(color: string, size: "normal" | "selected") {
  if (size === "selected") {
    const svg = `<svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg"><path d="M20 2C11.72 2 5 8.72 5 17c0 11.25 15 30 15 30s15-18.75 15-30c0-8.28-6.72-15-15-15z" fill="${color}" stroke="white" stroke-width="2.5"/><circle cx="20" cy="17" r="6" fill="white"/></svg>`;
    return new L.Icon({
      iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
      iconSize: [40, 52],
      iconAnchor: [20, 52],
      popupAnchor: [0, -52],
    });
  }
  const svg = `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 2C9.37 2 4 7.37 4 14c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="16" cy="14" r="5" fill="white"/></svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

// Component to handle map view changes
function MapController({ branches, selectedBranch }: { branches: Branch[]; selectedBranch: Branch | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedBranch?.latitude && selectedBranch.longitude) {
      map.flyTo(
        [parseFloat(selectedBranch.latitude), parseFloat(selectedBranch.longitude)],
        16,
        { duration: 0.8 }
      );
      return;
    }

    const validBranches = branches.filter((b) => b.latitude && b.longitude);
    if (validBranches.length === 0) return;

    if (validBranches.length === 1) {
      map.setView(
        [parseFloat(validBranches[0].latitude), parseFloat(validBranches[0].longitude)],
        15
      );
    } else {
      const bounds = L.latLngBounds(
        validBranches.map((b) => [parseFloat(b.latitude), parseFloat(b.longitude)] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [branches, selectedBranch, map]);

  return null;
}

export default function LeafletMap({ branches, selectedBranch, onSelect, settings }: Props) {
  const markerRefs = useRef<Record<number, L.Marker>>({});
  const s = settings;

  const defaultMarker = useMemo(() => makeIcon(s.marker_color, "normal"), [s.marker_color]);
  const selectedMarker = useMemo(() => makeIcon(s.marker_selected_color, "selected"), [s.marker_selected_color]);

  // Open popup for selected branch
  useEffect(() => {
    if (selectedBranch && markerRefs.current[selectedBranch.id]) {
      markerRefs.current[selectedBranch.id].openPopup();
    }
  }, [selectedBranch]);

  return (
    <MapContainer
      center={[47.9184, 106.9177]}
      zoom={12}
      scrollWheelZoom={true}
      className="w-full h-full rounded-2xl"
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='Tiles &copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution='Labels &copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      />
      <MapController branches={branches} selectedBranch={selectedBranch} />

      {branches.map((b) =>
        b.latitude && b.longitude ? (
          <Marker
            key={b.id}
            position={[parseFloat(b.latitude), parseFloat(b.longitude)]}
            icon={selectedBranch?.id === b.id ? selectedMarker : defaultMarker}
            ref={(ref) => {
              if (ref) markerRefs.current[b.id] = ref;
            }}
            eventHandlers={{
              click: () => onSelect(b),
            }}
          >
            <Popup maxWidth={880} minWidth={420} closeButton={false} autoPan={true}>
              <div
                className="leaflet-popup-clean rounded-xl overflow-hidden"
                style={{ background: s.popup_bg }}
              >
                {/* Branch image — top half */}
                {b.image_url && (
                  <div className="w-full h-[100px] -mt-[10px] -mx-[12px] mb-2 overflow-hidden" style={{ width: 'calc(100% + 24px)' }}>
                    <img
                      src={`${process.env.NEXT_PUBLIC_MEDIA_URL || 'http://127.0.0.1:8000'}${b.image_url}`}
                      alt={b.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Branch name */}
                <h3
                  className="font-bold text-[12px] mb-1 leading-tight"
                  style={{ color: s.popup_title_color }}
                >
                  {b.name}
                </h3>

                {/* Info rows — location & time only */}
                <div className="space-y-0.5 mb-2">
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" style={{ color: s.popup_icon_color }} />
                    <div>
                      <span className="text-[11px] leading-snug block" style={{ color: s.popup_text_color }}>{b.location}</span>
                      {(b.area || b.city) && (
                        <span className="text-[10px] opacity-60 block" style={{ color: s.popup_text_color }}>
                          {[b.area, b.city, b.district ? `${b.district}-р хороо` : ""].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {b.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" style={{ color: s.popup_icon_color }} />
                      <span className="text-[11px]" style={{ color: s.popup_text_color }}>
                        {b.time}
                      </span>
                    </div>
                  )}
                </div>

                {/* Direction button */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 w-full px-2 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-90 text-[11px]"
                  style={{ background: s.popup_btn_bg, color: s.popup_btn_text }}
                >
                  {s.popup_btn_label}
                </a>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}
