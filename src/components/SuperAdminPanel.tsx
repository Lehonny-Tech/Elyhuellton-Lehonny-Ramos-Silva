import React, { useState } from 'react';
import {
  Crown,
  Users,
  Building2,
  Home,
  Calendar,
  KeyRound,
  Shield,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Trash2,
  Edit,
  ExternalLink,
  Search,
  Filter,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Percent,
  RefreshCw,
  LogOut,
  LifeBuoy,
  Handshake,
  Star,
  Clock,
  Check,
  MapPin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Property, Agency, VisitAppointment, PlanType, SubscriptionStatus } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { PLAN_DETAILS, SUBSCRIPTION_STATUS_CONFIG, getAgencyPlan, getAgencySubscriptionStatus } from '../utils/planPermissions';
import { SuperAdminUsersManagementTab } from './SuperAdminUsersManagementTab';
import { MasterPlanManagementTab } from './MasterPlanManagementTab';
import { ManageAgencyPlanModal } from './ManageAgencyPlanModal';
import { SuperAdminTicketsTab } from './SuperAdminTicketsTab';
import { InterAgencyChatTab } from './InterAgencyChatTab';

interface SuperAdminPanelProps {
  onViewProperty: (property: Property) => void;
  onSelectTab?: (tab: 'home' | 'properties' | 'map' | 'favorites' | 'simulator' | 'admin') => void;
  openSuperAdminLogin?: () => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  onViewProperty,
  onSelectTab,
  openSuperAdminLogin,
}) => {
  const {
    currentUser,
    users,
    agencies,
    properties,
    visits,
    tickets,
    updateProperty,
    deleteProperty,
    addProperty,
    togglePropertyFeature,
    approvePropertyFeature,
    rejectPropertyFeature,
    getAgencyById,
    updateAgency,
    deleteAgency,
    addAgency,
    updateVisitStatus,
    setSelectedAgencyId,
    setIsSiteCreatorMode,
    resetToDefaults,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'featured' | 'agencies' | 'properties' | 'plans' | 'visits' | 'agency_chat' | 'overview'>('users');

  const pendingFeaturedRequests = properties.filter((p) => p.featuredRequestStatus === 'pending');
  const activeFeaturedProperties = properties.filter((p) => p.featured);

  // Master Plan Modal State
  const [selectedPlanAgency, setSelectedPlanAgency] = useState<Agency | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Property Filters
  const [propSearch, setPropSearch] = useState('');
  const [propAgencyFilter, setPropAgencyFilter] = useState('all');
  const [propTypeFilter, setPropTypeFilter] = useState('all');
  const [propPurposeFilter, setPropPurposeFilter] = useState('all');

  // Agency Edit Modal
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editAgencyName, setEditAgencyName] = useState('');
  const [editAgencyTradeName, setEditAgencyTradeName] = useState('');
  const [editAgencyCreci, setEditAgencyCreci] = useState('');
  const [editAgencyPhone, setEditAgencyPhone] = useState('');
  const [editAgencyWhatsApp, setEditAgencyWhatsApp] = useState('');
  const [editAgencyEmail, setEditAgencyEmail] = useState('');
  const [editAgencyCity, setEditAgencyCity] = useState('');
  const [editAgencyState, setEditAgencyState] = useState('');
  const [editAgencyAddress, setEditAgencyAddress] = useState('');
  const [editAgencyLogoUrl, setEditAgencyLogoUrl] = useState('');
  const [editAgencyPlano, setEditAgencyPlano] = useState<PlanType>('PROFISSIONAL');
  const [editAgencyStatus, setEditAgencyStatus] = useState<SubscriptionStatus>('ACTIVE');

  // Create Agency Modal
  const [isCreateAgencyOpen, setIsCreateAgencyOpen] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyTradeName, setNewAgencyTradeName] = useState('');
  const [newAgencyCreci, setNewAgencyCreci] = useState('');
  const [newAgencyPhone, setNewAgencyPhone] = useState('');
  const [newAgencyWhatsApp, setNewAgencyWhatsApp] = useState('');
  const [newAgencyEmail, setNewAgencyEmail] = useState('');
  const [newAgencyCity, setNewAgencyCity] = useState('');
  const [newAgencyState, setNewAgencyState] = useState('SP');
  const [newAgencyPlano, setNewAgencyPlano] = useState<PlanType>('PROFISSIONAL');

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Agency Search Filter
  const [agencySearch, setAgencySearch] = useState('');

  // Property create modal (Super Admin Master)
  const [isCreatePropertyOpen, setIsCreatePropertyOpen] = useState(false);
  const [newPropTitle, setNewPropTitle] = useState('');
  const [newPropAgencyId, setNewPropAgencyId] = useState('');
  const [newPropType, setNewPropType] = useState<Property['type']>('apartamento');
  const [newPropPurpose, setNewPropPurpose] = useState<Property['purpose']>('venda');
  const [newPropRent, setNewPropRent] = useState<number | ''>('');
  const [newPropSale, setNewPropSale] = useState<number | ''>('');
  const [newPropBedrooms, setNewPropBedrooms] = useState(2);
  const [newPropBathrooms, setNewPropBathrooms] = useState(1);
  const [newPropSuites, setNewPropSuites] = useState(0);
  const [newPropGarage, setNewPropGarage] = useState(1);
  const [newPropArea, setNewPropArea] = useState<number | ''>(75);
  const [newPropCity, setNewPropCity] = useState('');
  const [newPropState, setNewPropState] = useState('SP');
  const [newPropNeighborhood, setNewPropNeighborhood] = useState('');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropDescription, setNewPropDescription] = useState('');
  const [newPropImageUrl, setNewPropImageUrl] = useState('');
  const [newPropMcmv, setNewPropMcmv] = useState(false);
  const [newPropFgts, setNewPropFgts] = useState(true);
  const [newPropAnalise, setNewPropAnalise] = useState(true);

  // Property edit modal (Full Master Control)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editPropTitle, setEditPropTitle] = useState('');
  const [editPropAgencyId, setEditPropAgencyId] = useState('');
  const [editPropType, setEditPropType] = useState<Property['type']>('apartamento');
  const [editPropPurpose, setEditPropPurpose] = useState<Property['purpose']>('venda');
  const [editPropRent, setEditPropRent] = useState<number | ''>('');
  const [editPropSale, setEditPropSale] = useState<number | ''>('');
  const [editPropBedrooms, setEditPropBedrooms] = useState(2);
  const [editPropBathrooms, setEditPropBathrooms] = useState(1);
  const [editPropSuites, setEditPropSuites] = useState(0);
  const [editPropGarage, setEditPropGarage] = useState(1);
  const [editPropArea, setEditPropArea] = useState<number | ''>(80);
  const [editPropCity, setEditPropCity] = useState('');
  const [editPropState, setEditPropState] = useState('SP');
  const [editPropNeighborhood, setEditPropNeighborhood] = useState('');
  const [editPropAddress, setEditPropAddress] = useState('');
  const [editPropDescription, setEditPropDescription] = useState('');
  const [editPropImageUrl, setNewEditPropImageUrl] = useState('');
  const [editPropMcmv, setEditPropMcmv] = useState(false);
  const [editPropFgts, setEditPropFgts] = useState(true);
  const [editPropAnalise, setEditPropAnalise] = useState(true);

  // Property filtering calculation
  const filteredProperties = properties.filter((p) => {
    const q = (propSearch || '').toLowerCase();
    const matchesSearch =
      (p.title || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.location?.city || '').toLowerCase().includes(q) ||
      (p.location?.neighborhood || '').toLowerCase().includes(q);

    const matchesAgency = propAgencyFilter === 'all' || p.agencyId === propAgencyFilter;
    const matchesType = propTypeFilter === 'all' || p.type === propTypeFilter;
    const matchesPurpose = propPurposeFilter === 'all' || p.purpose === propPurposeFilter || p.purpose === 'ambos';

    return matchesSearch && matchesAgency && matchesType && matchesPurpose;
  });

  // Calculate metrics
  const totalPropertyValue = properties.reduce((acc, p) => acc + (p.salePrice || 0) + (p.rentPrice ? p.rentPrice * 12 : 0), 0);
  const activeAgenciesCount = agencies.filter((a) => a.status_assinatura === 'ACTIVE').length;
  const pendingVisitsCount = visits.filter((v) => v.status === 'agendado').length;

  const handleOpenEditAgency = (ag: Agency) => {
    setEditingAgency(ag);
    setEditAgencyName(ag.name);
    setEditAgencyTradeName(ag.tradeName || ag.name);
    setEditAgencyCreci(ag.creci);
    setEditAgencyPhone(ag.phone);
    setEditAgencyWhatsApp(ag.whatsapp);
    setEditAgencyEmail(ag.email);
    setEditAgencyCity(ag.city);
    setEditAgencyState(ag.state);
    setEditAgencyAddress(ag.address || '');
    setEditAgencyLogoUrl(ag.logoUrl || '');
    setEditAgencyPlano(ag.plano || 'PROFISSIONAL');
    setEditAgencyStatus(ag.status_assinatura || 'ACTIVE');
  };

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency) return;

    updateAgency(editingAgency.id, {
      name: editAgencyName.trim(),
      tradeName: editAgencyTradeName.trim(),
      creci: editAgencyCreci.trim(),
      phone: editAgencyPhone.trim(),
      whatsapp: editAgencyWhatsApp.trim(),
      email: editAgencyEmail.trim().toLowerCase(),
      city: editAgencyCity.trim(),
      state: editAgencyState.trim(),
      address: editAgencyAddress.trim(),
      logoUrl: editAgencyLogoUrl.trim() || editingAgency.logoUrl,
      plano: editAgencyPlano,
      status_assinatura: editAgencyStatus,
    });

    triggerToast(`Imobiliária "${editAgencyTradeName}" atualizada com sucesso!`);
    setEditingAgency(null);
  };

  const handleDeleteAgency = (ag: Agency) => {
    const confirmDelete = window.confirm(
      `ATENÇÃO: Deseja realmente excluir a imobiliária "${ag.tradeName || ag.name}"? Todos os ${
        properties.filter((p) => p.agencyId === ag.id).length
      } imóveis dela serão removidos do portal!`
    );

    if (confirmDelete) {
      deleteAgency(ag.id);
      triggerToast(`Imobiliária "${ag.tradeName || ag.name}" foi removida.`);
    }
  };

  const handleCreateAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyName.trim() || !newAgencyCreci.trim()) {
      triggerToast('Razão Social e CRECI são obrigatórios!');
      return;
    }

    addAgency({
      name: newAgencyName.trim(),
      tradeName: newAgencyTradeName.trim() || newAgencyName.trim(),
      creci: newAgencyCreci.trim(),
      phone: newAgencyPhone.trim() || '(11) 3300-0000',
      whatsapp: newAgencyWhatsApp.trim() || '5511999998888',
      email: newAgencyEmail.trim().toLowerCase() || 'contato@imobiliaria.com.br',
      adminEmail: newAgencyEmail.trim().toLowerCase() || 'admin@imobiliaria.com.br',
      address: 'Endereço Comercial Central',
      city: newAgencyCity.trim() || 'São Paulo',
      state: newAgencyState.trim() || 'SP',
      description: 'Imobiliária credenciada na rede integrada de imóveis.',
      logoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
      plano: newAgencyPlano,
      status_assinatura: 'ACTIVE',
      subscriptionStartDate: new Date().toISOString().split('T')[0],
      subscriptionRenewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });

    triggerToast(`Nova imobiliária "${newAgencyTradeName || newAgencyName}" criada com sucesso!`);
    setIsCreateAgencyOpen(false);
    setNewAgencyName('');
    setNewAgencyTradeName('');
    setNewAgencyCreci('');
    setNewAgencyPhone('');
    setNewAgencyWhatsApp('');
    setNewAgencyEmail('');
    setNewAgencyCity('');
  };

  const handleOpenCreateProperty = (preselectedAgencyId?: string) => {
    const targetAgId = preselectedAgencyId || agencies[0]?.id || '';
    const chosenAgency = agencies.find((a) => a.id === targetAgId);
    setNewPropAgencyId(targetAgId);
    setNewPropTitle('');
    setNewPropType('apartamento');
    setNewPropPurpose('venda');
    setNewPropRent('');
    setNewPropSale('');
    setNewPropBedrooms(2);
    setNewPropBathrooms(1);
    setNewPropSuites(0);
    setNewPropGarage(1);
    setNewPropArea(75);
    setNewPropCity(chosenAgency?.city || 'São Paulo');
    setNewPropState(chosenAgency?.state || 'SP');
    setNewPropNeighborhood('');
    setNewPropAddress('');
    setNewPropDescription('');
    setNewPropImageUrl('');
    setNewPropMcmv(false);
    setNewPropFgts(true);
    setNewPropAnalise(true);
    setIsCreatePropertyOpen(true);
  };

  const handleCreatePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropTitle.trim() || !newPropAgencyId) {
      triggerToast('Título do imóvel e Imobiliária são obrigatórios!');
      return;
    }
    const chosenAgency = getAgencyById(newPropAgencyId);
    const newProp = addProperty({
      title: newPropTitle.trim(),
      agencyId: newPropAgencyId,
      type: newPropType,
      purpose: newPropPurpose,
      rentPrice: newPropRent !== '' ? Number(newPropRent) : undefined,
      salePrice: newPropSale !== '' ? Number(newPropSale) : undefined,
      bedrooms: Number(newPropBedrooms) || 1,
      bathrooms: Number(newPropBathrooms) || 1,
      suites: Number(newPropSuites) || 0,
      garageSpots: Number(newPropGarage) || 0,
      usableArea: Number(newPropArea) || 60,
      totalArea: (Number(newPropArea) || 60) + 15,
      description:
        newPropDescription.trim() ||
        `Excelente imóvel cadastrado pelo Super Administrador Master para a imobiliária ${chosenAgency?.tradeName || chosenAgency?.name}.`,
      location: {
        city: newPropCity.trim() || chosenAgency?.city || 'São Paulo',
        state: newPropState.trim() || chosenAgency?.state || 'SP',
        neighborhood: newPropNeighborhood.trim() || 'Centro',
        address: newPropAddress.trim() || 'Rua Comercial Principal',
        zipCode: '01000-000',
        lat: -23.5505,
        lng: -46.6333,
      },
      images: newPropImageUrl.trim()
        ? [newPropImageUrl.trim()]
        : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
      status: 'disponivel',
      minhaCasaMinhaVida: newPropMcmv,
      fgts: newPropFgts,
      analiseCreditoGratuita: newPropAnalise,
    });
    triggerToast(`Imóvel "${newProp.title}" (Cód: ${newProp.code}) cadastrado com sucesso!`);
    setIsCreatePropertyOpen(false);
  };

  const handleOpenEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    setEditPropTitle(prop.title);
    setEditPropAgencyId(prop.agencyId);
    setEditPropType(prop.type || 'apartamento');
    setEditPropPurpose(prop.purpose || 'venda');
    setEditPropRent(prop.rentPrice || '');
    setEditPropSale(prop.salePrice || '');
    setEditPropBedrooms(prop.bedrooms);
    setEditPropBathrooms(prop.bathrooms || 1);
    setEditPropSuites(prop.suites || 0);
    setEditPropGarage(prop.garageSpots);
    setEditPropArea(prop.usableArea);
    setEditPropCity(prop.location.city || '');
    setEditPropState(prop.location.state || 'SP');
    setEditPropNeighborhood(prop.location.neighborhood || '');
    setEditPropAddress(prop.location.address || '');
    setEditPropDescription(prop.description || '');
    setNewEditPropImageUrl(prop.images?.[0] || '');
    setEditPropMcmv(prop.minhaCasaMinhaVida ?? false);
    setEditPropFgts(prop.fgts ?? true);
    setEditPropAnalise(prop.analiseCreditoGratuita ?? true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    updateProperty(editingProperty.id, {
      title: editPropTitle.trim(),
      agencyId: editPropAgencyId,
      type: editPropType,
      purpose: editPropPurpose,
      rentPrice: editPropRent !== '' ? Number(editPropRent) : undefined,
      salePrice: editPropSale !== '' ? Number(editPropSale) : undefined,
      bedrooms: Number(editPropBedrooms) || 1,
      bathrooms: Number(editPropBathrooms) || 1,
      suites: Number(editPropSuites) || 0,
      garageSpots: Number(editPropGarage) || 0,
      usableArea: Number(editPropArea) || 80,
      description: editPropDescription.trim(),
      location: {
        ...editingProperty.location,
        city: editPropCity.trim() || editingProperty.location.city,
        state: editPropState.trim() || editingProperty.location.state,
        neighborhood: editPropNeighborhood.trim() || editingProperty.location.neighborhood,
        address: editPropAddress.trim() || editingProperty.location.address,
      },
      images: editPropImageUrl.trim()
        ? [editPropImageUrl.trim(), ...(editingProperty.images?.slice(1) || [])]
        : editingProperty.images,
      minhaCasaMinhaVida: editPropMcmv,
      fgts: editPropFgts,
      analiseCreditoGratuita: editPropAnalise,
    });

    triggerToast(`Imóvel "${editPropTitle}" atualizado com sucesso!`);
    setEditingProperty(null);
  };

  const handleDeleteProperty = (prop: Property) => {
    const confirmDelete = window.confirm(`Deseja excluir o imóvel código ${prop.code} ("${prop.title}")?`);
    if (confirmDelete) {
      deleteProperty(prop.id);
      triggerToast(`Imóvel ${prop.code} excluído com sucesso.`);
    }
  };

  const isSuperAdmin = Boolean(
    currentUser &&
    (currentUser.role === 'super_admin' ||
      currentUser.role === 'site_creator' ||
      currentUser.id === 'user-superadmin')
  );

  if (!isSuperAdmin) {
    return (
      <div className="bg-stone-900 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto shadow-2xl space-y-6 my-8 animate-fade-in text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 shadow-inner">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            Acesso Restrito ao Painel Master
          </span>
          <h2 className="text-2xl font-bold font-serif text-white">
            Super Administrador (Master)
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed max-w-md mx-auto">
            Esta área é de acesso restrito ao Super Administrador Master para gerenciamento irrestrito de usuários, senhas, planos de assinatura, chamados e moderação de destaques.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center relative z-10">
          <button
            type="button"
            onClick={openSuperAdminLogin}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4 text-stone-950" />
            <span>Fazer Login como Super Administrador</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab?.('home')}
            className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Super Admin Master Header Card */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
              <Crown className="w-8 h-8 text-stone-950" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Painel do Super Administrador Master
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                Controle Geral do Portal ImobiRede
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
                Acesso irrestrito: você pode gerenciar todos os imóveis, alterar dados de imobiliárias e alterar a senha de qualquer usuário (corretores e clientes).
              </p>
            </div>
          </div>

          {/* Quick Info & User indicator */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <div className="bg-stone-800/90 border border-stone-700 px-3.5 py-2 rounded-xl text-xs">
              <div className="text-[10px] text-stone-400 font-semibold uppercase">Super Admin Conectado</div>
              <div className="font-bold text-amber-400">{currentUser?.name || 'Administrador Master'}</div>
            </div>

            <button
              onClick={() => {
                if (onSelectTab) onSelectTab('home');
              }}
              className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Ver Site Inicial</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Global Key Metrics summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-stone-800 relative z-10">
          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Total de Imóveis</span>
              <Home className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{properties.length}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">Em {agencies.length} imobiliárias</div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Imobiliárias Ativas</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{activeAgenciesCount}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">De {agencies.length} cadastradas</div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Usuários & Senhas</span>
              <KeyRound className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">Senhas editáveis</div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Chamados (#Tickets)</span>
              <LifeBuoy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{tickets.length}</div>
            <div className="text-[11px] text-amber-400 mt-0.5">
              {tickets.filter((t) => t.status === 'aberto').length} novos abertos
            </div>
          </div>

          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-stone-400 text-xs">
              <span>Visitas no Portal</span>
              <Calendar className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{visits.length}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">{pendingVisitsCount} agendadas</div>
          </div>
        </div>
      </div>

      {/* Main Super Admin Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Usuários & Senhas ({users.length})</span>
        </button>

        {/* Central de Chamados Master */}
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'tickets'
              ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-amber-600" />
          <span>Chamados de Suporte ({tickets.length})</span>
          {tickets.filter((t) => t.status === 'aberto').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {tickets.filter((t) => t.status === 'aberto').length}
            </span>
          )}
        </button>

        {/* Curadoria & Destaques Master */}
        <button
          onClick={() => setActiveTab('featured')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'featured'
              ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span>Destaques & Curadoria ({activeFeaturedProperties.length})</span>
          {pendingFeaturedRequests.length > 0 && (
            <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {pendingFeaturedRequests.length} pendentes
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('agencies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'agencies'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Imobiliárias ({agencies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'properties'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Home className="w-4 h-4 text-emerald-400" />
          <span>Todos os Imóveis ({properties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'plans'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Planos & Assinaturas Master</span>
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'visits'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Visitas Agendadas ({visits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('agency_chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'agency_chat'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Handshake className="w-4 h-4 text-emerald-400" />
          <span>Chat da Rede B2B</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span>Métricas & Backup</span>
        </button>
      </div>

      {/* TAB CONTENT: USERS & PASSWORDS (CRITICAL) */}
      {activeTab === 'users' && (
        <SuperAdminUsersManagementTab agencies={agencies} />
      )}

      {/* TAB CONTENT: CENTRAL DE CHAMADOS DE SUPORTE */}
      {activeTab === 'tickets' && (
        <SuperAdminTicketsTab agencies={agencies} />
      )}

      {/* TAB CONTENT: CURADORIA & DESTAQUES MASTER */}
      {activeTab === 'featured' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">
                <Crown className="w-3.5 h-3.5 text-amber-700" />
                Painel do Super Administrador (Master) • Curadoria
              </div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>Avaliação e Curadoria de Imóveis em Destaque</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Avalie solicitações de destaque enviadas pelas imobiliárias parceiras e promova imóveis para a vitrine principal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2 text-center">
                <div className="text-xl font-black text-amber-900">{pendingFeaturedRequests.length}</div>
                <div className="text-[10px] text-amber-700 font-semibold uppercase">Solicitações Pendentes</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-2 text-center">
                <div className="text-xl font-black text-emerald-900">{activeFeaturedProperties.length}</div>
                <div className="text-[10px] text-emerald-700 font-semibold uppercase">Destaques no Ar</div>
              </div>
            </div>
          </div>

          {/* SECTION: SOLICITAÇÕES PENDENTES */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-3">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Solicitações Pendentes de Avaliação ({pendingFeaturedRequests.length})</span>
            </h3>

            {pendingFeaturedRequests.length === 0 ? (
              <div className="py-10 text-center text-stone-500 text-xs bg-stone-50 rounded-xl border border-dashed border-stone-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Nenhuma solicitação pendente no momento. Todas as requisições estão avaliadas!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingFeaturedRequests.map((prop) => {
                  const propAgency = getAgencyById(prop.agencyId);
                  return (
                    <div
                      key={prop.id}
                      className="border border-amber-300 bg-amber-50/40 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition"
                    >
                      <div className="flex gap-3">
                        <img
                          src={prop.images[0]}
                          alt={prop.title}
                          className="w-24 h-24 object-cover rounded-lg shrink-0 border border-stone-200"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                              Solicitação de Destaque
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">{prop.code}</span>
                          </div>
                          <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{prop.title}</h4>
                          <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            {prop.location.neighborhood}, {prop.location.city} - {prop.location.state}
                          </div>

                          <div className="mt-1.5 flex items-center gap-2">
                            {prop.rentPrice && (
                              <span className="text-xs font-bold text-stone-900">
                                {formatCurrency(prop.rentPrice)}/mês
                              </span>
                            )}
                            {prop.salePrice && (
                              <span className="text-xs font-bold text-emerald-700">
                                Venda: {formatCurrency(prop.salePrice)}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center gap-2 text-[11px] text-stone-600">
                            {propAgency?.logoUrl && (
                              <img src={propAgency.logoUrl} alt={propAgency.name} className="w-4 h-4 rounded object-cover" />
                            )}
                            <span className="font-medium text-stone-800">{propAgency?.tradeName || propAgency?.name}</span>
                            <span className="text-stone-400">• CRECI {propAgency?.creci}</span>
                          </div>
                        </div>
                      </div>

                      {prop.featuredRequestNotes && (
                        <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-[11px] text-stone-700">
                          <strong className="text-amber-900 block mb-0.5">Justificativa da Imobiliária:</strong>
                          "{prop.featuredRequestNotes}"
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            approvePropertyFeature(prop.id);
                            triggerToast(`Imóvel "${prop.title}" aceito e promovido a destaque com sucesso!`);
                          }}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          Avaliar e Aceitar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            rejectPropertyFeature(prop.id);
                            triggerToast(`Solicitação de destaque recusada para "${prop.title}".`);
                          }}
                          className="py-2 px-3 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewProperty(prop)}
                          className="p-2 text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                          title="Visualizar imóvel completo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION: IMÓVEIS ATUALMENTE EM DESTAQUE */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-3">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Imóveis em Destaque na Página Inicial ({activeFeaturedProperties.length})</span>
            </h3>

            {activeFeaturedProperties.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                Nenhum imóvel em destaque no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFeaturedProperties.map((p) => {
                  const ag = agencies.find((a) => a.id === p.agencyId);
                  return (
                    <div
                      key={p.id}
                      className="border border-amber-200 bg-stone-50/50 rounded-xl p-3.5 flex flex-col justify-between gap-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-16 h-16 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{p.title}</h4>
                          <div className="text-[11px] text-stone-500 truncate">{p.location.neighborhood}, {p.location.city}</div>
                          <div className="text-emerald-700 font-bold text-xs mt-1">
                            {p.rentPrice ? formatCurrency(p.rentPrice) + '/mês' : p.salePrice ? formatCurrency(p.salePrice) : ''}
                          </div>
                          <div className="text-[10px] text-stone-400 mt-0.5 truncate">{ag?.tradeName || ag?.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            togglePropertyFeature(p.id);
                            triggerToast(`Destaque do imóvel "${p.title}" alterado.`);
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Remover Destaque
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewProperty(p)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-lg cursor-pointer"
                          title="Ver detalhes"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHAT DA REDE B2B */}
      {activeTab === 'agency_chat' && agencies[0] && (
        <InterAgencyChatTab currentAgency={agencies[0]} />
      )}

      {/* TAB CONTENT: AGENCIES */}
      {activeTab === 'agencies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Gestão Completa de Imobiliárias Parceiras</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  {agencies.length} cadastradas
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Acesso total de Super Administrador: controle irrestrito de cadastros, planos, limites de imóveis e dados de todas as imobiliárias cadastradas no portal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateAgencyOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Imobiliária</span>
              </button>
            </div>
          </div>

          {/* Agency Search Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-stone-400 shrink-0 ml-2" />
            <input
              type="text"
              placeholder="Buscar imobiliária por Razão Social, Nome Fantasia, CRECI, Cidade, Estado ou E-mail..."
              value={agencySearch}
              onChange={(e) => setAgencySearch(e.target.value)}
              className="w-full text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
            />
            {agencySearch && (
              <button
                type="button"
                onClick={() => setAgencySearch('')}
                className="text-stone-400 hover:text-stone-700 text-xs px-2 font-bold cursor-pointer"
              >
                ✕ Limpar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencies
              .filter((ag) => {
                if (!agencySearch.trim()) return true;
                const q = agencySearch.toLowerCase();
                return (
                  ag.name.toLowerCase().includes(q) ||
                  (ag.tradeName && ag.tradeName.toLowerCase().includes(q)) ||
                  ag.creci.toLowerCase().includes(q) ||
                  ag.city.toLowerCase().includes(q) ||
                  ag.state.toLowerCase().includes(q) ||
                  ag.email.toLowerCase().includes(q)
                );
              })
              .map((ag) => {
                const agPlan = getAgencyPlan(ag);
                const agPlanDetail = PLAN_DETAILS[agPlan];
                const agStatusConfig = SUBSCRIPTION_STATUS_CONFIG[ag.status_assinatura || 'ACTIVE'];
                const agProperties = properties.filter((p) => p.agencyId === ag.id);

                return (
                  <div
                    key={ag.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-stone-300 transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={ag.logoUrl}
                            alt={ag.tradeName || ag.name}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0 bg-stone-50"
                          />
                          <div>
                            <h3 className="font-bold text-sm text-stone-900">{ag.tradeName || ag.name}</h3>
                            <p className="text-xs text-stone-500 font-mono">CRECI {ag.creci} • {ag.city}, {ag.state}</p>
                            <p className="text-[11px] text-stone-400 truncate max-w-xs">{ag.name}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${agPlanDetail.badgeClass}`}>
                          {agPlanDetail.badgeLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-stone-50 rounded-xl p-3 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Imóveis</span>
                          <strong className="text-stone-900 font-bold">{agProperties.length}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Status</span>
                          <span className={`text-[10px] font-bold ${agStatusConfig.badgeClass}`}>
                            {agStatusConfig.label}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Mensalidade</span>
                          <strong className="text-emerald-700 font-bold">{agPlanDetail.priceFormatted}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="text-[11px] text-stone-500 truncate">
                        Tel: <span className="font-mono text-stone-800">{ag.phone}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCreateProperty(ag.id)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Cadastrar Novo Imóvel nesta Imobiliária"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cadastrar Imóvel</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPropAgencyFilter(ag.id);
                            setActiveTab('properties');
                          }}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Ver Imóveis desta Imobiliária"
                        >
                          Imóveis ({agProperties.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgencyId(ag.id);
                            onSelectTab?.('admin');
                          }}
                          className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          title="Abrir Painel Administrativo desta Imobiliária"
                        >
                          Entrar
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlanAgency(ag);
                            setIsPlanModalOpen(true);
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Gerenciar Plano Comercial"
                        >
                          Plano
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditAgency(ag)}
                          className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Editar Informações"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAgency(ag)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Excluir Imobiliária"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ALL PROPERTIES */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-emerald-600" />
                  <span>Gestão Global de Imóveis do Portal</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  {properties.length} imóveis
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Poderes totais de Super Administrador: cadastre, edite ou exclua qualquer imóvel de qualquer imobiliária parceira sem restrições de limites de plano.
              </p>
            </div>

            <button
              onClick={() => handleOpenCreateProperty()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm self-start sm:self-auto shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Cadastrar Novo Imóvel (Master)</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="relative sm:col-span-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Código, título, cidade..."
                value={propSearch}
                onChange={(e) => setPropSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
              />
            </div>

            <div>
              <select
                value={propAgencyFilter}
                onChange={(e) => setPropAgencyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
              >
                <option value="all">Todas as Imobiliárias</option>
                {agencies.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.tradeName || ag.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={propTypeFilter}
                onChange={(e) => setPropTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
              >
                <option value="all">Todos os Tipos</option>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="cobertura">Cobertura</option>
                <option value="terreno">Terreno</option>
                <option value="comercial">Comercial</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            <div>
              <select
                value={propPurposeFilter}
                onChange={(e) => setPropPurposeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
              >
                <option value="all">Locação & Venda</option>
                <option value="locacao">Apenas Locação</option>
                <option value="venda">Apenas Venda</option>
              </select>
            </div>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Imóvel</th>
                    <th className="py-3 px-4">Imobiliária</th>
                    <th className="py-3 px-4">Valores (R$)</th>
                    <th className="py-3 px-4">Destaque</th>
                    <th className="py-3 px-4">Financiamento</th>
                    <th className="py-3 px-4 text-right">Ações Master</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-stone-400">
                        Nenhum imóvel encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((p) => {
                      const agency = agencies.find((a) => a.id === p.agencyId);
                      return (
                        <tr key={p.id} className="hover:bg-stone-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {p.images[0] && (
                                <img
                                  src={p.images[0]}
                                  alt={p.title}
                                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-bold text-stone-900">{p.title}</div>
                                <div className="text-[11px] text-stone-500 font-mono">
                                  {p.code} • {p.type} • {p.bedrooms} qtos • {p.location.city}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-stone-900">{agency?.tradeName || agency?.name || p.agencyId}</span>
                            <div className="text-[10px] text-stone-400 font-mono">CRECI {agency?.creci}</div>
                          </td>

                          <td className="py-3 px-4">
                            {p.rentPrice && (
                              <div className="text-emerald-700 font-bold">
                                Locação: {formatCurrency(p.rentPrice)}/mês
                              </div>
                            )}
                            {p.salePrice && (
                              <div className="text-stone-900 font-semibold text-[11px]">
                                Venda: {formatCurrency(p.salePrice)}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => togglePropertyFeature(p.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                p.featured
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                              }`}
                            >
                              {p.featured ? '⭐ Destaque Ativo' : 'Comum'}
                            </button>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 text-[10px]">
                              {p.minhaCasaMinhaVida && (
                                <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                                  MCMV
                                </span>
                              )}
                              {p.fgts && (
                                <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                                  FGTS
                                </span>
                              )}
                              {p.analiseCreditoGratuita && (
                                <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                                  Análise Grátis
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => onViewProperty(p)}
                                className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition cursor-pointer"
                                title="Visualizar Detalhes"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEditProperty(p)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition cursor-pointer"
                                title="Editar Imóvel"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteProperty(p)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer"
                                title="Excluir Imóvel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PLANS MANAGEMENT */}
      {activeTab === 'plans' && (
        <MasterPlanManagementTab
          agencies={agencies}
          properties={properties}
          onOpenManagePlanModal={(ag) => {
            setSelectedPlanAgency(ag);
            setIsPlanModalOpen(true);
          }}
          onSelectAgencyToView={(agencyId) => {
            setSelectedAgencyId(agencyId);
            setActiveTab('agencies');
          }}
        />
      )}

      {/* TAB CONTENT: VISITS */}
      {activeTab === 'visits' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Controle Global de Visitas e Agendamentos</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Todos os agendamentos realizados pelos clientes em todas as imobiliárias do portal.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Data & Horário</th>
                    <th className="py-3 px-4">Imóvel</th>
                    <th className="py-3 px-4">Imobiliária</th>
                    <th className="py-3 px-4">Cliente / Contato</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Alterar Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {visits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-stone-400">
                        Nenhuma visita agendada.
                      </td>
                    </tr>
                  ) : (
                    visits.map((vis) => {
                      const prop = properties.find((p) => p.id === vis.propertyId);
                      const agency = agencies.find((a) => a.id === vis.agencyId);

                      return (
                        <tr key={vis.id} className="hover:bg-stone-50/80">
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">{formatDateBR(vis.date)}</div>
                            <div className="text-emerald-700 font-bold">{vis.timeSlot}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium text-stone-900">{prop?.title || 'Imóvel'}</span>
                            <div className="text-[10px] text-stone-400 font-mono">Cód: {prop?.code}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-stone-900">{agency?.tradeName || agency?.name}</span>
                            <div className="text-[10px] text-stone-400">{agency?.city}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-stone-900">{vis.clientName}</div>
                            <div className="text-stone-400 text-[10px] font-mono">{vis.clientEmail} • {vis.clientPhone}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                vis.status === 'confirmado'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : vis.status === 'concluido'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {vis.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <select
                              value={vis.status}
                              onChange={(e) => updateVisitStatus(vis.id, e.target.value as VisitAppointment['status'])}
                              className="text-xs bg-stone-100 border border-stone-200 rounded-lg px-2 py-1 cursor-pointer font-semibold"
                            >
                              <option value="agendado">Agendado</option>
                              <option value="confirmado">Confirmado</option>
                              <option value="concluido">Concluído</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW & BACKUP */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Visão Geral & Ferramentas Master</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Métricas financeiras consolidadas e ferramentas de integridade do portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-stone-500">Valor de Carteira Estimado</div>
              <div className="text-2xl font-bold text-stone-900 mt-1">
                {formatCurrency(totalPropertyValue)}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Soma de todos os valores de venda e locação anualizada dos imóveis anunciados.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-stone-500">Imobiliárias Ativas</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {activeAgenciesCount} / {agencies.length}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Todas em dia com planos comerciais e publicando imóveis normalmente.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <div className="text-xs font-semibold text-stone-500">Restauração de Fábrica</div>
              <button
                onClick={() => {
                  const ok = window.confirm('Deseja redefinir todo o portal para as configurações iniciais padrão?');
                  if (ok) {
                    resetToDefaults();
                    triggerToast('Portal redefinido para os dados padrão com sucesso!');
                  }
                }}
                className="mt-3 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Resetar Dados de Fábrica</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN MANAGEMENT MODAL */}
      <ManageAgencyPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        agency={selectedPlanAgency}
      />

      {/* EDIT AGENCY MODAL */}
      {editingAgency && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden animate-fade-in">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Editar Imobiliária (Master)</h3>
                  <p className="text-xs text-stone-400">Controle irrestrito do Super Administrador</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAgency(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAgency} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={editAgencyName}
                    onChange={(e) => setEditAgencyName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={editAgencyTradeName}
                    onChange={(e) => setEditAgencyTradeName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">CRECI *</label>
                  <input
                    type="text"
                    required
                    value={editAgencyCreci}
                    onChange={(e) => setEditAgencyCreci(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={editAgencyEmail}
                    onChange={(e) => setEditAgencyEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={editAgencyPhone}
                    onChange={(e) => setEditAgencyPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={editAgencyWhatsApp}
                    onChange={(e) => setEditAgencyWhatsApp(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={editAgencyCity}
                    onChange={(e) => setEditAgencyCity(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={editAgencyState}
                    onChange={(e) => setEditAgencyState(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">URL da Logomarca</label>
                  <input
                    type="text"
                    value={editAgencyLogoUrl}
                    onChange={(e) => setEditAgencyLogoUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Plano Comercial</label>
                  <select
                    value={editAgencyPlano}
                    onChange={(e) => setEditAgencyPlano(e.target.value as PlanType)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="ESSENCIAL">Essencial (R$ 197/mês)</option>
                    <option value="PROFISSIONAL">Profissional (R$ 397/mês)</option>
                    <option value="PREMIUM">Premium (R$ 697/mês)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Status da Assinatura</label>
                  <select
                    value={editAgencyStatus}
                    onChange={(e) => setEditAgencyStatus(e.target.value as SubscriptionStatus)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="ACTIVE">Ativa (Acesso Liberado)</option>
                    <option value="PENDING">Pendente</option>
                    <option value="SUSPENDED">Suspensa</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingAgency(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
                >
                  Salvar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE AGENCY MODAL */}
      {isCreateAgencyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in my-8 max-h-[90vh] flex flex-col">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Cadastrar Nova Imobiliária</h3>
                  <p className="text-xs text-stone-400">Adicionar empresa imobiliária à rede e vincular administrador</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateAgencyOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAgency} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prime Gestão Imobiliária LTDA"
                    value={newAgencyName}
                    onChange={(e) => setNewAgencyName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prime Imóveis"
                    value={newAgencyTradeName}
                    onChange={(e) => setNewAgencyTradeName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">CRECI Jurídico *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 54321-J"
                    value={newAgencyCreci}
                    onChange={(e) => setNewAgencyCreci(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">E-mail Comercial *</label>
                  <input
                    type="email"
                    required
                    placeholder="contato@empresa.com.br"
                    value={newAgencyEmail}
                    onChange={(e) => setNewAgencyEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Cidade Sede</label>
                  <input
                    type="text"
                    placeholder="Ex: Extrema"
                    value={newAgencyCity}
                    onChange={(e) => setNewAgencyCity(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    placeholder="MG ou SP"
                    value={newAgencyState}
                    onChange={(e) => setNewAgencyState(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Plano Contratado Inicial</label>
                  <select
                    value={newAgencyPlano}
                    onChange={(e) => setNewAgencyPlano(e.target.value as PlanType)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="ESSENCIAL">Essencial (Até 50 imóveis - R$ 197/mês)</option>
                    <option value="PROFISSIONAL">Profissional (Até 250 imóveis - R$ 397/mês)</option>
                    <option value="PREMIUM">Premium (Ilimitado - R$ 697/mês)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateAgencyOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
                >
                  Criar Imobiliária
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROPERTY MODAL (SUPER ADMIN MASTER) */}
      {isCreatePropertyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in my-8 max-h-[90vh] flex flex-col">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Cadastrar Novo Imóvel (Master)</h3>
                  <p className="text-xs text-stone-400">Poder total: cadastro direto em qualquer imobiliária parceira</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePropertyOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePropertySubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Imobiliária Responsável pelo Imóvel *
                </label>
                <select
                  required
                  value={newPropAgencyId}
                  onChange={(e) => {
                    setNewPropAgencyId(e.target.value);
                    const ag = agencies.find((a) => a.id === e.target.value);
                    if (ag) {
                      setNewPropCity(ag.city);
                      setNewPropState(ag.state);
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white font-bold text-stone-900 cursor-pointer"
                >
                  <option value="">Selecione a Imobiliária...</option>
                  {agencies.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.tradeName || ag.name} (CRECI {ag.creci} • {ag.city}/{ag.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Título do Imóvel *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apartamento Moderno com Varanda Gourmet"
                  value={newPropTitle}
                  onChange={(e) => setNewPropTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo de Imóvel</label>
                  <select
                    value={newPropType}
                    onChange={(e) => setNewPropType(e.target.value as Property['type'])}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="apartamento">Apartamento</option>
                    <option value="casa">Casa</option>
                    <option value="cobertura">Cobertura</option>
                    <option value="terreno">Terreno</option>
                    <option value="comercial">Comercial</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Finalidade</label>
                  <select
                    value={newPropPurpose}
                    onChange={(e) => setNewPropPurpose(e.target.value as Property['purpose'])}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="venda">Apenas Venda</option>
                    <option value="locacao">Apenas Locação</option>
                    <option value="ambos">Venda & Locação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Aluguel (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 2500"
                    value={newPropRent}
                    onChange={(e) => setNewPropRent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Venda (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 450000"
                    value={newPropSale}
                    onChange={(e) => setNewPropSale(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Quartos</label>
                  <input
                    type="number"
                    min="0"
                    value={newPropBedrooms}
                    onChange={(e) => setNewPropBedrooms(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Suítes</label>
                  <input
                    type="number"
                    min="0"
                    value={newPropSuites}
                    onChange={(e) => setNewPropSuites(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Banheiros</label>
                  <input
                    type="number"
                    min="1"
                    value={newPropBathrooms}
                    onChange={(e) => setNewPropBathrooms(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Vagas</label>
                  <input
                    type="number"
                    min="0"
                    value={newPropGarage}
                    onChange={(e) => setNewPropGarage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Área Útil (m²)</label>
                  <input
                    type="number"
                    min="1"
                    value={newPropArea}
                    onChange={(e) => setNewPropArea(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Endereço / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Paulista, 1000"
                    value={newPropAddress}
                    onChange={(e) => setNewPropAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    placeholder="Ex: Bela Vista"
                    value={newPropNeighborhood}
                    onChange={(e) => setNewPropNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Cidade / UF</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={newPropCity}
                      onChange={(e) => setNewPropCity(e.target.value)}
                      className="col-span-2 px-2 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                    />
                    <input
                      type="text"
                      placeholder="UF"
                      value={newPropState}
                      onChange={(e) => setNewPropState(e.target.value)}
                      className="px-2 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">URL da Imagem Principal</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newPropImageUrl}
                  onChange={(e) => setNewPropImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição do Imóvel</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes sobre acabamentos, localização, condomínio..."
                  value={newPropDescription}
                  onChange={(e) => setNewPropDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
                <div className="font-semibold text-stone-700">Condições e Financiamento</div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPropMcmv}
                      onChange={(e) => setNewPropMcmv(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Minha Casa Minha Vida</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPropFgts}
                      onChange={(e) => setNewPropFgts(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Uso do FGTS</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPropAnalise}
                      onChange={(e) => setNewPropAnalise(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Análise Gratuita</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreatePropertyOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Imóvel (Master)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROPERTY MODAL (FULL MASTER CONTROL) */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in my-8 max-h-[90vh] flex flex-col">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Editar Imóvel (Super Admin Master)</h3>
                  <p className="text-xs text-stone-400">Cód: {editingProperty.code} • Poder irrestrito de edição</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Imobiliária Responsável (Transferir Imóvel)
                </label>
                <select
                  value={editPropAgencyId}
                  onChange={(e) => setEditPropAgencyId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white font-bold text-stone-900 cursor-pointer"
                >
                  {agencies.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.tradeName || ag.name} (CRECI {ag.creci} • {ag.city}/{ag.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Título do Imóvel *</label>
                <input
                  type="text"
                  required
                  value={editPropTitle}
                  onChange={(e) => setEditPropTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Tipo</label>
                  <select
                    value={editPropType}
                    onChange={(e) => setEditPropType(e.target.value as Property['type'])}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="apartamento">Apartamento</option>
                    <option value="casa">Casa</option>
                    <option value="cobertura">Cobertura</option>
                    <option value="terreno">Terreno</option>
                    <option value="comercial">Comercial</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Finalidade</label>
                  <select
                    value={editPropPurpose}
                    onChange={(e) => setEditPropPurpose(e.target.value as Property['purpose'])}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="venda">Apenas Venda</option>
                    <option value="locacao">Apenas Locação</option>
                    <option value="ambos">Venda & Locação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Aluguel (R$)</label>
                  <input
                    type="number"
                    value={editPropRent}
                    onChange={(e) => setEditPropRent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Venda (R$)</label>
                  <input
                    type="number"
                    value={editPropSale}
                    onChange={(e) => setEditPropSale(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Quartos</label>
                  <input
                    type="number"
                    min="0"
                    value={editPropBedrooms}
                    onChange={(e) => setEditPropBedrooms(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Suítes</label>
                  <input
                    type="number"
                    min="0"
                    value={editPropSuites}
                    onChange={(e) => setEditPropSuites(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Banheiros</label>
                  <input
                    type="number"
                    min="1"
                    value={editPropBathrooms}
                    onChange={(e) => setEditPropBathrooms(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Vagas</label>
                  <input
                    type="number"
                    min="0"
                    value={editPropGarage}
                    onChange={(e) => setEditPropGarage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Área Útil (m²)</label>
                  <input
                    type="number"
                    min="1"
                    value={editPropArea}
                    onChange={(e) => setEditPropArea(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Endereço / Logradouro</label>
                  <input
                    type="text"
                    value={editPropAddress}
                    onChange={(e) => setEditPropAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={editPropNeighborhood}
                    onChange={(e) => setEditPropNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Cidade / UF</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={editPropCity}
                      onChange={(e) => setEditPropCity(e.target.value)}
                      className="col-span-2 px-2 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                    />
                    <input
                      type="text"
                      value={editPropState}
                      onChange={(e) => setEditPropState(e.target.value)}
                      className="px-2 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={editPropImageUrl}
                  onChange={(e) => setNewEditPropImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editPropDescription}
                  onChange={(e) => setEditPropDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600"
                />
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
                <div className="font-semibold text-stone-700">Programas de Financiamento</div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPropMcmv}
                      onChange={(e) => setEditPropMcmv(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Minha Casa Minha Vida</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPropFgts}
                      onChange={(e) => setEditPropFgts(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Uso do FGTS</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPropAnalise}
                      onChange={(e) => setEditPropAnalise(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Análise Gratuita</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
