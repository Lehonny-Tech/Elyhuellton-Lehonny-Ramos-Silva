import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Property } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { Layers, MapPin, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface GeolocatedMapProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onScheduleVisit: (property: Property) => void;
  selectedPropertyId?: string;
}

export const GeolocatedMap: React.FC<GeolocatedMapProps> = ({
  properties,
  onSelectProperty,
  onScheduleVisit,
  selectedPropertyId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const { getAgencyById } = useApp();

  const [activeProperty, setActiveProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center: São Paulo / SP
    const map = L.map(mapContainerRef.current, {
      center: [-23.565, -46.66],
      zoom: 11,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers whenever properties change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    (Object.values(markersRef.current) as L.Marker[]).forEach((m) => m.remove());
    markersRef.current = {};

    if (properties.length === 0) return;

    const bounds = L.latLngBounds([]);

    properties.forEach((prop) => {
      const lat = prop.location.lat;
      const lng = prop.location.lng;

      if (!lat || !lng) return;

      bounds.extend([lat, lng]);

      const priceText =
        prop.purpose === 'locacao'
          ? formatCurrency(prop.rentPrice)
          : prop.purpose === 'venda'
          ? formatCurrency(prop.salePrice)
          : formatCurrency(prop.rentPrice);

      // Custom HTML Pin icon
      const isSelected = selectedPropertyId === prop.id;
      const customHtml = `
        <div style="
          background-color: ${isSelected ? '#059669' : '#1c1917'};
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-family: ui-sans-serif, system-ui, sans-serif;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          border: 2px solid ${isSelected ? '#34d399' : '#ffffff'};
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          transform: translate(-50%, -100%);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ${priceText}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-property-pin',
        html: customHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setActiveProperty(prop);
        onSelectProperty(prop);
      });

      markersRef.current[prop.id] = marker;
    });

    // Fit bounds smoothly
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [properties, selectedPropertyId, onSelectProperty]);

  // Center on user geolocation if requested
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 13);
      },
      (err) => {
        console.warn('Geolocation error:', err);
      }
    );
  };

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-stone-200 shadow-lg bg-stone-100">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Control: Geolocation & Info */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-stone-200 text-xs flex items-center gap-2 text-stone-800">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">
            {properties.length} {properties.length === 1 ? 'imóvel no mapa' : 'imóveis no mapa'}
          </span>
        </div>

        <button
          onClick={handleLocateMe}
          className="bg-white hover:bg-stone-50 text-stone-700 px-3 py-2 rounded-xl shadow-md border border-stone-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          Minha Localização
        </button>
      </div>

      {/* Property Bottom Sheet Preview on Pin Click */}
      {activeProperty && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-10 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 shadow-2xl border border-stone-200 flex gap-3 relative">
            <button
              onClick={() => setActiveProperty(null)}
              className="absolute top-2.5 right-2.5 text-stone-400 hover:text-stone-700 p-1 rounded-md"
            >
              &times;
            </button>

            <img
              src={activeProperty.images[0]}
              alt={activeProperty.title}
              className="w-24 h-24 rounded-xl object-cover shrink-0"
            />

            <div className="flex-1 min-w-0 pr-4">
              <div className="text-[10px] uppercase font-bold text-emerald-700">
                {activeProperty.purpose === 'locacao' ? 'Locação' : 'Venda'}
              </div>
              <h4 className="text-xs font-bold text-stone-900 truncate leading-snug">
                {activeProperty.title}
              </h4>
              <p className="text-[11px] text-stone-500 truncate mt-0.5">
                {activeProperty.location.neighborhood}, {activeProperty.location.city}
              </p>

              <div className="text-sm font-extrabold text-stone-900 mt-1">
                {activeProperty.rentPrice
                  ? `${formatCurrency(activeProperty.rentPrice)}/mês`
                  : formatCurrency(activeProperty.salePrice)}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onSelectProperty(activeProperty)}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold rounded-lg transition cursor-pointer"
                >
                  Ver Detalhes
                </button>
                <button
                  onClick={() => onScheduleVisit(activeProperty)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition cursor-pointer"
                >
                  Agendar Visita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
