import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Navigation, ExternalLink, Tractor, UserCheck, Loader2 } from "lucide-react";

export interface MapItem {
  id: string;
  name: string;
  type: string;
  price: number;
  priceUnit?: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance?: number | null;
  detailUrl?: string;
  image?: string;
  category?: "equipment" | "labour";
}

interface EquipmentMapProps {
  items: MapItem[];
  userLocation?: { lat: number; lng: number } | null;
  height?: string;
  className?: string;
}

export function EquipmentMap({
  items,
  userLocation,
  height = "520px",
  className = "",
}: EquipmentMapProps) {
  const navigate = useNavigate();
  const [mapModules, setMapModules] = useState<any>(null);

  useEffect(() => {
    // Client-side dynamic import to prevent SSR 'window is not defined' errors
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      import("leaflet/dist/leaflet.css"),
    ])
      .then(([reactLeaflet, leafletModule]) => {
        const L = leafletModule.default || leafletModule;
        setMapModules({
          MapContainer: reactLeaflet.MapContainer,
          TileLayer: reactLeaflet.TileLayer,
          Marker: reactLeaflet.Marker,
          Popup: reactLeaflet.Popup,
          useMap: reactLeaflet.useMap,
          L,
        });
      })
      .catch((err) => {
        console.error("Failed to load Leaflet map modules:", err);
      });
  }, []);

  const validItems = useMemo(() => {
    return items.filter((item) => {
      if (
        !item.coordinates ||
        (item.coordinates.lat === 0 && item.coordinates.lng === 0)
      ) {
        console.warn(
          `[EquipmentMap] Excluding item "${item.name}" (ID: ${item.id}) from map due to un-geocoded coordinates {0,0}.`
        );
        return false;
      }
      return true;
    });
  }, [items]);

  if (!mapModules) {
    return (
      <div
        className={`relative w-full rounded-2xl border border-border shadow-card bg-card flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading Interactive Map…</span>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap, L } = mapModules;

  function createCustomIcon(category: "equipment" | "labour" = "equipment", price: number) {
    const isEquipment = category === "equipment";
    const bgGradient = isEquipment
      ? "linear-gradient(135deg, #16a34a, #15803d)"
      : "linear-gradient(135deg, #2563eb, #1d4ed8)";
    const iconEmoji = isEquipment ? "🚜" : "👨‍🌾";

    const html = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 5px 10px;
        background: ${bgGradient};
        color: #ffffff;
        border-radius: 20px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        border: 2px solid #ffffff;
        white-space: nowrap;
        cursor: pointer;
        transform: translate(-50%, -100%);
        transition: transform 0.2s ease;
      ">
        <span>${iconEmoji}</span>
        <span>₹${price}</span>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${isEquipment ? "#15803d" : "#1d4ed8"};
        "></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "custom-leaflet-marker",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  function createUserIcon() {
    const html = `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        background: #ef4444;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.3), 0 4px 10px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
      "></div>
    `;

    return L.divIcon({
      html,
      className: "custom-user-marker",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  function MapBoundsUpdater() {
    const map = useMap();

    useEffect(() => {
      const points: [number, number][] = [];

      if (userLocation) {
        points.push([userLocation.lat, userLocation.lng]);
      }

      validItems.forEach((item) => {
        if (item.coordinates) {
          points.push([item.coordinates.lat, item.coordinates.lng]);
        }
      });

      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }, [map]);

    return null;
  }

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : validItems.length > 0
      ? [validItems[0].coordinates!.lat, validItems[0].coordinates!.lng]
      : [19.7515, 75.7139];

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-border shadow-card bg-card ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={9}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserIcon()}
          >
            <Popup>
              <div className="p-1 text-xs font-semibold flex items-center gap-1.5 text-red-600">
                <Navigation className="h-3.5 w-3.5" />
                <span>Your Location</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Equipment & Labour Markers */}
        {validItems.map((item) => {
          const lat = item.coordinates!.lat;
          const lng = item.coordinates!.lng;
          const icon = createCustomIcon(item.category ?? "equipment", item.price);

          return (
            <Marker key={item.id} position={[lat, lng]} icon={icon}>
              <Popup className="farmfleet-map-popup">
                <div className="w-56 p-1 space-y-2">
                  {item.image && (
                    <div className="h-28 w-full rounded-lg bg-muted overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(ev) => {
                          ev.currentTarget.onerror = null;
                          ev.currentTarget.src =
                            "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=400&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                        {item.category === "labour" ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <Tractor className="h-3 w-3" />
                        )}
                        {item.type}
                      </span>
                      {item.distance != null && (
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          📍 {item.distance.toFixed(1)} km away
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-1">
                      {item.name}
                    </h4>

                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>

                    <div className="pt-1 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-base text-foreground">
                          ₹{item.price}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.priceUnit || (item.category === "labour" ? "/day" : "/hr")}
                        </span>
                      </div>

                      {item.detailUrl && (
                        <button
                          type="button"
                          onClick={() => navigate({ to: item.detailUrl as any })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-soft hover:shadow-elevated transition-all"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default EquipmentMap;
