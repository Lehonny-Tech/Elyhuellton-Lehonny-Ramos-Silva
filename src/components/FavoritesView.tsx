import React from 'react';
import { Heart, Search, ArrowRight, Sparkles, Building, Phone, MessageCircle } from 'lucide-react';
import { Property } from '../types';
import { PropertyCard } from './PropertyCard';
import { useApp } from '../context/AppContext';

interface FavoritesViewProps {
  onSelectProperty: (property: Property) => void;
  onScheduleVisit: (property: Property) => void;
  onGoToSearch: () => void;
  openAuthModal: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onSelectProperty,
  onScheduleVisit,
  onGoToSearch,
  openAuthModal,
}) => {
  const { currentUser, properties } = useApp();

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
          <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Acesse seus Imóveis Favoritos</h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Para salvar e acompanhar seus imóveis prediletos, calcular garantias e agendar visitas com um clique, faça login ou cadastre-se gratuitamente.
        </p>
        <div className="pt-2">
          <button
            onClick={openAuthModal}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            Fazer Login ou Criar Cadastro
          </button>
        </div>
      </div>
    );
  }

  const favoriteIds = currentUser.favorites || [];
  const favoriteProperties = properties.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-rose-500" />
            Minha Coleção Salva
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Imóveis Favoritos</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Olá, <strong className="text-stone-800">{currentUser.name}</strong>! Você possui{' '}
            <strong className="text-emerald-700">{favoriteProperties.length}</strong>{' '}
            {favoriteProperties.length === 1 ? 'imóvel salvo' : 'imóveis salvos'}.
          </p>
        </div>

        <button
          onClick={onGoToSearch}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <Search className="w-4 h-4" />
          Explorar Mais Imóveis
        </button>
      </div>

      {/* Grid or Empty */}
      {favoriteProperties.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">Sua lista de favoritos está vazia</h3>
          <p className="text-xs text-stone-500">
            Navegue pelos imóveis disponíveis e clique no ícone de coração em qualquer anúncio para salvá-lo aqui.
          </p>
          <button
            onClick={onGoToSearch}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            Explorar Imóveis em Destaque
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onSelect={onSelectProperty}
              onScheduleVisit={onScheduleVisit}
              openAuthModal={openAuthModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};
