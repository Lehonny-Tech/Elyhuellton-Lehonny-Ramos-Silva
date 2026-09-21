import React, { useState } from 'react';
import {
  X,
  MapPin,
  Bed,
  Bath,
  Car,
  Layers,
  Heart,
  Phone,
  MessageCircle,
  Calendar,
  Share2,
  ShieldCheck,
  Check,
  Building,
  Maximize2,
  Flame,
  Info,
  Calculator,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Property } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, createWhatsAppLink } from '../utils/formatters';
import { MortgageSimulator } from './MortgageSimulator';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleVisit: (property: Property) => void;
  openAuthModal: () => void;
  onOpenSimulatorTab?: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  onScheduleVisit,
  openAuthModal,
  onOpenSimulatorTab,
}) => {
  const { isFavorite, toggleFavorite, currentUser, getAgencyById } = useApp();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmbeddedSimulator, setShowEmbeddedSimulator] = useState(false);

  if (!isOpen || !property) return null;

  const agency = getAgencyById(property.agencyId);
  const favorite = isFavorite(property.id);

  const handleFavoriteClick = () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    toggleFavorite(property.id);
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const priceDesc =
    property.purpose === 'locacao'
      ? `Locação ${formatCurrency(property.rentPrice)}/mês`
      : property.purpose === 'venda'
      ? `Venda ${formatCurrency(property.salePrice)}`
      : `Locação ${formatCurrency(property.rentPrice)}/mês ou Venda ${formatCurrency(property.salePrice)}`;

  const whatsappLink = agency?.whatsapp
    ? createWhatsAppLink(agency.whatsapp, property.title, property.code, priceDesc)
    : '#';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Top Floating Control Bar */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs bg-stone-800 text-emerald-400 px-2 py-0.5 rounded border border-stone-700">
              Cód: {property.code}
            </span>
            <span className="text-xs text-stone-300 hidden sm:inline">•</span>
            <span className="text-xs text-stone-300 hidden sm:inline">
              {agency?.tradeName} (CRECI {agency?.creci})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShare}
              title="Compartilhar link do imóvel"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copiado!' : 'Compartilhar'}</span>
            </button>

            <button
              onClick={handleFavoriteClick}
              title="Favoritar imóvel"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${
                  favorite ? 'text-rose-500 fill-rose-500' : 'text-stone-300'
                }`}
              />
            </button>

            <button
              id="close-detail-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-600 text-stone-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Photo Gallery with Thumbnails */}
          <div className="space-y-2.5">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-stone-900 rounded-xl overflow-hidden shadow-inner group">
              <img
                src={property.images[activeImageIndex] || property.images[0]}
                alt={`${property.title} - Foto ${activeImageIndex + 1}`}
                className="w-full h-full object-cover transition duration-300"
              />

              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="bg-black/60 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  Foto {activeImageIndex + 1} de {property.images.length}
                </span>

                {property.searchCount > 2000 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    {formatNumber(property.searchCount)} pessoas buscaram este imóvel
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {property.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                      activeImageIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-300'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title and Key Details */}
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {property.location.address} • {property.location.neighborhood}, {property.location.city} - {property.location.state}
              </span>
              <span className="text-stone-400 font-mono">CEP {property.location.zipCode}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
              {property.title}
            </h1>
          </div>

          {/* Pricing & Terms Breakdown Box (Explicit User Requirements) */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
              Condições Financeiras & Garantias de Locação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Valor de Locação */}
              {property.rentPrice && (
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <div className="text-xs text-stone-500 font-medium">Valor de Locação</div>
                  <div className="text-xl font-extrabold text-stone-900 mt-0.5">
                    {formatCurrency(property.rentPrice)}
                    <span className="text-xs font-normal text-stone-500"> /mês</span>
                  </div>
                </div>
              )}

              {/* Valor de Venda se disponível */}
              {property.salePrice && (
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <div className="text-xs text-stone-500 font-medium">Valor de Venda</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                    {formatCurrency(property.salePrice)}
                  </div>
                </div>
              )}

              {/* Prazo Mínimo de Locação */}
              {property.minRentTermMonths ? (
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <div className="text-xs text-stone-500 font-medium">Prazo Mínimo de Contrato</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">
                    {property.minRentTermMonths} meses
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">Renovação automática</div>
                </div>
              ) : null}

              {/* Valor da Caução se aplicado */}
              {property.depositValue ? (
                <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                  <div className="text-xs text-stone-500 font-medium">Valor da Caução (Depósito)</div>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">
                    {formatCurrency(property.depositValue)}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5">
                    {property.depositDetails || 'Reembolsável ao fim do contrato'}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Condomínio e IPTU row */}
            <div className="mt-3 pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-stone-900">
                  Condomínio:{' '}
                  {property.hasCondo ? (
                    <span className="text-stone-800">{formatCurrency(property.condoFee)}/mês</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">Sem taxa de condomínio (Isento)</span>
                  )}
                </span>
                {property.iptuFee && (
                  <span className="text-stone-500">
                    IPTU: <strong className="text-stone-700">{formatCurrency(property.iptuFee)}/mês</strong>
                  </span>
                )}
              </div>

              {property.rentPrice && property.hasCondo && (
                <div className="text-xs font-semibold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-md">
                  Pacote Estimado (Aluguel + Condomínio):{' '}
                  <span className="text-emerald-800 font-bold">
                    {formatCurrency((property.rentPrice || 0) + (property.condoFee || 0))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mortgage / Installment Simulation Area for Properties with Sale Price */}
          {property.salePrice && property.salePrice > 0 && (
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-stone-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                    <Calculator className="w-3.5 h-3.5" />
                    Simulação de Financiamento Bancário (Venda)
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    Parcelas a partir de{' '}
                    <span className="text-emerald-400 font-extrabold font-mono">
                      {formatCurrency(
                        Math.round(
                          (property.salePrice * 0.8 * (0.099 / 12 + 1 / 360))
                        )
                      )}
                      /mês
                    </span>
                  </div>
                  <div className="text-xs text-stone-300">
                    Estimativa calculada com 20% de entrada ({formatCurrency(property.salePrice * 0.2)}), prazo de 30 anos e taxa de 9,9% a.a.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmbeddedSimulator(!showEmbeddedSimulator)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>{showEmbeddedSimulator ? 'Ocultar Simulador' : 'Personalizar Simulação'}</span>
                    {showEmbeddedSimulator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {onOpenSimulatorTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSimulatorTab(property);
                      }}
                      className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
                      title="Abrir Simulador em tela cheia"
                    >
                      Tela Cheia
                    </button>
                  )}
                </div>
              </div>

              {/* Embedded Simulator Display when toggled */}
              {showEmbeddedSimulator && (
                <div className="mt-5 pt-5 border-t border-stone-700">
                  <MortgageSimulator
                    isEmbedded={true}
                    initialProperty={property}
                    onScheduleVisit={(prop) => {
                      onClose();
                      onScheduleVisit(prop);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Condições e Facilidades Obrigatórias de Financiamento */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Condições de Financiamento & Crédito do Imóvel
                </h3>
                <p className="text-[11px] text-stone-500">
                  Facilidades cadastradas e verificadas pela imobiliária parceira ({agency?.tradeName})
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full w-fit">
                Cadastrado em Todas as Imobiliárias
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Minha Casa Minha Vida */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  property.minhaCasaMinhaVida
                    ? 'bg-white border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs'
                    : 'bg-stone-100/70 border-stone-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="text-base">🏠</span>
                    1. Minha Casa Minha Vida
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      property.minhaCasaMinhaVida
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {property.minhaCasaMinhaVida ? 'Enquadrável' : 'Não Enquadrado'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  {property.minhaCasaMinhaVida
                    ? 'Permite taxas de juros reduzidas e subsídios do Governo Federal pelo programa habitacional.'
                    : 'Este imóvel ultrapassa o teto do programa ou possui perfil fora das faixas do MCMV.'}
                </p>
              </div>

              {/* 2. Uso do FGTS */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  property.fgts
                    ? 'bg-white border-blue-300 ring-2 ring-blue-500/10 shadow-xs'
                    : 'bg-stone-100/70 border-stone-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="text-base">🛡️</span>
                    2. Uso do FGTS
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      property.fgts
                        ? 'bg-blue-600 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {property.fgts ? 'Aceita FGTS' : 'Não Aplicável'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  {property.fgts
                    ? 'O saldo das contas ativas ou inativas do FGTS pode ser utilizado como entrada ou para amortizar parcelas.'
                    : 'Imóvel sem enquadramento para uso de FGTS (ou categoria estritamente comercial).'}
                </p>
              </div>

              {/* 3. Análise Gratuita de Crédito */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  property.analiseCreditoGratuita
                    ? 'bg-white border-amber-300 ring-2 ring-amber-500/10 shadow-xs'
                    : 'bg-stone-100/70 border-stone-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="text-base">⚡</span>
                    3. Análise Gratuita de Crédito
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      property.analiseCreditoGratuita
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {property.analiseCreditoGratuita ? '100% Gratuita' : 'Consulte'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  {property.analiseCreditoGratuita
                    ? 'A imobiliária realiza a pré-aprovação nos principais bancos sem nenhum custo ou taxa de assessoria.'
                    : 'Consulte a imobiliária para simular condições de crédito e documentação.'}
                </p>
              </div>
            </div>

            {property.analiseCreditoGratuita && agency?.whatsapp && (
              <div className="pt-1 flex items-center justify-between gap-3 text-xs bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                <span className="text-emerald-950 font-medium">
                  Quer saber na hora quanto o banco aprova para este imóvel com seu FGTS ou MCMV?
                </span>
                <a
                  href={`https://wa.me/${agency.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá, ${agency.tradeName}! Vi o imóvel código ${property.code} (${property.title}) no ImobiRede e gostaria de solicitar a Análise Gratuita de Crédito com verificação de FGTS/Minha Casa Minha Vida.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0 flex items-center gap-1.5 shadow-2xs transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Pedir Análise Gratuita</span>
                </a>
              </div>
            )}
          </div>

          {/* Technical Specifications Grid */}
          <div>
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3">
              Ficha Técnica do Imóvel
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center gap-3">
                <Bed className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs text-stone-500">Quartos</div>
                  <div className="text-sm font-bold text-stone-900">{property.bedrooms}</div>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs text-stone-500">Suítes</div>
                  <div className="text-sm font-bold text-stone-900">{property.suites}</div>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center gap-3">
                <Bath className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs text-stone-500">Banheiros</div>
                  <div className="text-sm font-bold text-stone-900">{property.bathrooms}</div>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center gap-3">
                <Car className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs text-stone-500">Vagas de Garagem</div>
                  <div className="text-sm font-bold text-stone-900">{property.garageSpots}</div>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center gap-3">
                <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs text-stone-500">Quantidade de Pisos</div>
                  <div className="text-sm font-bold text-stone-900">
                    {property.floorsCount} {property.floorsCount === 1 ? 'Piso (Térreo)' : 'Pisos'}
                  </div>
                </div>
              </div>

              {property.apartmentFloor && (
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center gap-3">
                  <Building className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs text-stone-500">Andar / Bloco</div>
                    <div className="text-sm font-bold text-stone-900">
                      {property.apartmentFloor}
                      {property.buildingBlock ? ` (${property.buildingBlock})` : ''}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center gap-3">
                <Maximize2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs text-stone-500">Área Útil</div>
                  <div className="text-sm font-bold text-stone-900">{property.usableArea} m²</div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Sobre o Imóvel
            </h3>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Features / Amenities */}
          {property.features && property.features.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
                Diferenciais & Infraestrutura
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Agency Profile & Direct Contacts (WhatsApp + Telefone requirement) */}
          {agency && (
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={agency.logoUrl}
                    alt={agency.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-500/50"
                  />
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Imobiliária Responsável
                    </div>
                    <div className="text-lg font-bold">{agency.name}</div>
                    <div className="text-xs text-stone-300">
                      CRECI: <span className="font-mono text-emerald-300">{agency.creci}</span> • {agency.city}, {agency.state}
                    </div>
                  </div>
                </div>

                {/* Direct Action Contacts */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Falar no WhatsApp
                  </a>

                  <a
                    href={`tel:${agency.phone.replace(/\D/g, '')}`}
                    className="px-4 py-2.5 bg-stone-700 hover:bg-stone-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-stone-600 transition cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    Ligar: {agency.phone}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom CTA */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-xs text-stone-500">Pronto para conhecer o imóvel?</div>
            <div className="text-sm font-bold text-stone-900">
              Agende uma visita presencial online sem burocracia
            </div>
          </div>

          <button
            id="modal-schedule-btn"
            onClick={() => {
              onClose();
              onScheduleVisit(property);
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Agendar Visita Agora
          </button>
        </div>
      </div>
    </div>
  );
};
