import React from 'react';
import {
  Bed,
  Bath,
  Car,
  Layers,
  MapPin,
  Heart,
  Phone,
  MessageCircle,
  Calendar,
  Flame,
  ShieldAlert,
  Building,
  Calculator,
  Star,
} from 'lucide-react';
import { Property } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, createWhatsAppLink } from '../utils/formatters';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  onScheduleVisit: (property: Property) => void;
  openAuthModal: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelect,
  onScheduleVisit,
  openAuthModal,
}) => {
  const { isFavorite, toggleFavorite, currentUser, getAgencyById, incrementPropertyView } = useApp();
  const agency = getAgencyById(property.agencyId);
  const favorite = isFavorite(property.id);

  const handleCardClick = () => {
    incrementPropertyView(property.id);
    onSelect(property);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      openAuthModal();
      return;
    }
    toggleFavorite(property.id);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agency?.whatsapp) return;
    const priceDesc =
      property.purpose === 'locacao'
        ? `Locação ${formatCurrency(property.rentPrice)}/mês`
        : property.purpose === 'venda'
        ? `Venda ${formatCurrency(property.salePrice)}`
        : `Locação ${formatCurrency(property.rentPrice)}/mês ou Venda ${formatCurrency(property.salePrice)}`;

    const url = createWhatsAppLink(agency.whatsapp, property.title, property.code, priceDesc);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agency?.phone) return;
    window.open(`tel:${agency.phone.replace(/\D/g, '')}`, '_self');
  };

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onScheduleVisit(property);
  };

  return (
    <div
      id={`property-card-${property.id}`}
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
    >
      {/* Image Gallery Preview & Badges */}
      <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
        <img
          src={property.images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Purpose Badge */}
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                property.purpose === 'locacao'
                  ? 'bg-blue-600 text-white'
                  : property.purpose === 'venda'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {property.purpose === 'locacao'
                ? 'Locação'
                : property.purpose === 'venda'
                ? 'Venda'
                : 'Venda & Locação'}
            </span>

            {/* Featured Badge Approved by Site Creator */}
            {property.featured && (
              <span className="bg-amber-400 text-stone-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-amber-300">
                <Star className="w-3 h-3 fill-stone-950 text-stone-950" />
                Destaque
              </span>
            )}

            {/* Trending / Most Searched Badge */}
            {property.searchCount > 2000 && (
              <span className="bg-amber-500/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Flame className="w-3.5 h-3.5 fill-white" />
                {formatNumber(property.searchCount)} buscas
              </span>
            )}
          </div>

          {/* Favorite Button */}
          <button
            id={`fav-btn-${property.id}`}
            onClick={handleFavoriteClick}
            aria-label="Salvar nos favoritos"
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 flex items-center justify-center transition shadow-md hover:scale-110 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${
                favorite ? 'text-rose-500 fill-rose-500' : 'text-stone-600'
              }`}
            />
          </button>
        </div>

        {/* Bottom Image Overlay: Agency & Code */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
          <span className="font-mono text-[11px] bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded">
            Cód: {property.code}
          </span>
          {agency && (
            <span className="text-[11px] bg-emerald-900/80 backdrop-blur-xs px-2 py-0.5 rounded font-medium truncate max-w-[160px]">
              {agency.tradeName}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {property.location.neighborhood}, {property.location.city} - {property.location.state}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-stone-900 group-hover:text-emerald-700 transition line-clamp-1 leading-snug">
            {property.title}
          </h3>

          {/* Pricing Row */}
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {property.rentPrice && (
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Aluguel</div>
                <div className="text-lg font-bold text-stone-900">
                  {formatCurrency(property.rentPrice)}
                  <span className="text-xs font-normal text-stone-500">/mês</span>
                </div>
              </div>
            )}

            {property.salePrice && (
              <div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Venda</div>
                <div className="text-lg font-bold text-emerald-700">
                  {formatCurrency(property.salePrice)}
                </div>
              </div>
            )}
          </div>

          {/* Quick Financing simulation badge for sale properties */}
          {property.salePrice && property.salePrice > 0 && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-900 bg-emerald-50/90 px-2.5 py-1 rounded-md border border-emerald-200/70">
              <span className="flex items-center gap-1 font-medium">
                <Calculator className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Simulação:</span>
                <strong className="text-emerald-800">
                  a partir de {formatCurrency(Math.round(property.salePrice * 0.8 * (0.099 / 12 + 1 / 360)))}/mês
                </strong>
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold underline decoration-emerald-400">
                Simular
              </span>
            </div>
          )}

          {/* Rental Requirements & Caução / Min Term (Key prompt requirement) */}
          {(property.minRentTermMonths || property.depositValue) && (
            <div className="mt-2 bg-stone-50 rounded-lg p-2 text-[11px] text-stone-700 border border-stone-100 space-y-0.5">
              {property.minRentTermMonths && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Prazo Mínimo de Locação:</span>
                  <span className="font-semibold text-stone-800">{property.minRentTermMonths} meses</span>
                </div>
              )}
              {property.depositValue ? (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Valor da Caução:</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(property.depositValue)}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Condo Fee & Floors Badges */}
          <div className="mt-2 flex items-center gap-2 text-[11px] flex-wrap">
            <span className={`px-2 py-0.5 rounded font-medium ${
              property.hasCondo
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {property.hasCondo
                ? `Condomínio: ${formatCurrency(property.condoFee)}`
                : 'Sem condomínio'}
            </span>

            <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200 font-medium flex items-center gap-1">
              <Layers className="w-3 h-3 text-stone-500" />
              {property.floorsCount} {property.floorsCount === 1 ? 'Piso (Térreo)' : 'Pisos'}
            </span>

            {property.apartmentFloor && (
              <span className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200 font-medium flex items-center gap-1">
                <Building className="w-3 h-3 text-sky-600" />
                {property.apartmentFloor}
                {property.buildingBlock ? ` • ${property.buildingBlock}` : ''}
              </span>
            )}
          </div>

          {/* Financing Conditions (MCMV, FGTS, Análise Gratuita) */}
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-1.5 flex-wrap text-[10px]">
            {property.minhaCasaMinhaVida && (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300/80 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <span>🏠</span>
                <span>Minha Casa Minha Vida</span>
              </span>
            )}
            {property.fgts && (
              <span className="bg-blue-50 text-blue-800 border border-blue-300/80 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <span>🛡️</span>
                <span>Uso do FGTS</span>
              </span>
            )}
            {property.analiseCreditoGratuita && (
              <span className="bg-amber-50 text-amber-900 border border-amber-300/80 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                <span>⚡</span>
                <span>Análise Gratuita de Crédito</span>
              </span>
            )}
          </div>

          {/* Core Specs Grid */}
          <div className="grid grid-cols-4 gap-2 pt-3 mt-3 border-t border-stone-100 text-center text-stone-600 text-xs">
            <div className="flex flex-col items-center">
              <Bed className="w-4 h-4 text-stone-400 mb-0.5" />
              <span className="font-semibold text-stone-800">{property.bedrooms}</span>
              <span className="text-[10px] text-stone-400">Quartos</span>
            </div>
            <div className="flex flex-col items-center">
              <Bath className="w-4 h-4 text-stone-400 mb-0.5" />
              <span className="font-semibold text-stone-800">{property.bathrooms}</span>
              <span className="text-[10px] text-stone-400">Banheiros</span>
            </div>
            <div className="flex flex-col items-center">
              <Car className="w-4 h-4 text-stone-400 mb-0.5" />
              <span className="font-semibold text-stone-800">{property.garageSpots}</span>
              <span className="text-[10px] text-stone-400">Vagas</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-stone-400 leading-4">m²</span>
              <span className="font-semibold text-stone-800">{property.usableArea}</span>
              <span className="text-[10px] text-stone-400">Área útil</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: WhatsApp, Telefone & Agendar Visita */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          {/* Direct Schedule Visit Online */}
          <button
            id={`schedule-btn-${property.id}`}
            onClick={handleScheduleClick}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            Agendar Visita Online
          </button>

          {/* WhatsApp & Telefone direct buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id={`whatsapp-btn-${property.id}`}
              onClick={handleWhatsAppClick}
              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 border border-emerald-200 transition cursor-pointer"
              title="Conversar direto no WhatsApp da imobiliária"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp
            </button>

            <button
              id={`phone-btn-${property.id}`}
              onClick={handlePhoneClick}
              className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 border border-stone-200 transition cursor-pointer"
              title="Ligar para a imobiliária"
            >
              <Phone className="w-3.5 h-3.5 text-stone-600" />
              Ligar ({agency?.phone ? agency.phone.split(' ')[0] : 'Fone'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
