import React, { useState, useRef } from 'react';
import {
  Building2,
  PlusCircle,
  Edit,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  DollarSign,
  Bed,
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  Home,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Star,
  X,
  AlertTriangle,
  Crown,
  Check,
  MessageSquare,
  Send,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  KeyRound,
  LifeBuoy,
  Handshake,
} from 'lucide-react';
import { Property, Agency, VisitAppointment, PropertyType, PropertyPurpose, PlanType, SubscriptionStatus } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import {
  PLAN_DETAILS,
  PLAN_FEATURES,
  canCreateProperty,
  hasFeature,
  getAgencyPlan,
  getAgencySubscriptionStatus,
  SUBSCRIPTION_STATUS_CONFIG,
} from '../utils/planPermissions';
import { UpgradePlanModal } from './UpgradePlanModal';
import { ManageAgencyPlanModal } from './ManageAgencyPlanModal';
import { AgencyMyPlanView } from './AgencyMyPlanView';
import { MasterPlanManagementTab } from './MasterPlanManagementTab';
import { SuperAdminUsersManagementTab } from './SuperAdminUsersManagementTab';
import { AgencySupportTicketsTab } from './AgencySupportTicketsTab';
import { InterAgencyChatTab } from './InterAgencyChatTab';
import { SuperAdminTicketsTab } from './SuperAdminTicketsTab';

interface AdminPanelProps {
  onViewProperty: (property: Property) => void;
  openAuthModal?: () => void;
  openSuperAdminLogin?: () => void;
}

const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per file
const MAX_IMAGES_ALLOWED = 20; // 20 files total

export const AGENCY_LOGO_PRESETS = [
  {
    name: 'Mantiqueira / Verde (Extrema)',
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Metrópole / Edifícios (São Paulo)',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Litoral / Oceano (Santos)',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Inovação / Arquitetura (Campinas)',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Residencial Clássico',
    url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=400&q=80',
  },
];

export const APARTMENT_FLOORS = [
  'Térreo',
  '1º Andar',
  '2º Andar',
  '3º Andar',
  '4º Andar',
  '5º Andar',
  '6º Andar',
  '7º Andar',
  '8º Andar',
  '9º Andar',
  '10º Andar',
  '11º Andar',
  '12º Andar',
  '13º Andar',
  '14º Andar',
  '15º Andar',
  '16º Andar',
  '17º Andar',
  '18º Andar',
  '19º Andar',
  '20º Andar',
];

// Convert file to optimized data URL preserving sharpness while avoiding browser memory overflow
const readFileAsOptimizedDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1920;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onViewProperty,
  openAuthModal,
  openSuperAdminLogin,
}) => {
  const {
    currentUser,
    agencies,
    currentAgency,
    selectedAgencyId,
    setSelectedAgencyId,
    addAgency,
    updateAgency,
    updateAgencyPlan,
    properties,
    addProperty,
    updateProperty,
    deleteProperty,
    requestPropertyFeature,
    approvePropertyFeature,
    rejectPropertyFeature,
    togglePropertyFeature,
    visits,
    updateVisitStatus,
    isSiteCreatorMode,
    setIsSiteCreatorMode,
    getAgencyById,
  } = useApp();

  const isSuperAdmin = Boolean(
    currentUser &&
    (currentUser.role === 'super_admin' ||
      currentUser.role === 'site_creator' ||
      currentUser.id === 'user-superadmin')
  );
  const isAgencyAdmin = currentUser?.role === 'agency_admin';
  const effectiveAgencyId = (isAgencyAdmin && currentUser?.agencyId)
    ? currentUser.agencyId
    : selectedAgencyId;

  // Active agency: strictly user's agency for agency_admin, or selectedAgencyId for super admin
  const activeAgency = isAgencyAdmin
    ? (agencies.find((a) => a.id === currentUser?.agencyId) || currentAgency)
    : currentAgency;

  // Permitted tabs for Agency Admins (strictly agency-scoped)
  const allowedAgencyAdminTabs = ['properties', 'new_property', 'visits', 'my_plan', 'tickets', 'agency_chat'];
  const [activeTab, setActiveTab] = useState<'properties' | 'new_property' | 'visits' | 'my_plan' | 'plans_management' | 'agencies' | 'featured_workflow' | 'users' | 'tickets' | 'agency_chat' | 'master_tickets'>('properties');
  const effectiveActiveTab = (!isSuperAdmin && !allowedAgencyAdminTabs.includes(activeTab)) ? 'properties' : activeTab;
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string>('');

  // Master Admin Plan Management Modal State
  const [managePlanAgency, setManagePlanAgency] = useState<Agency | null>(null);
  const [isManagePlanModalOpen, setIsManagePlanModalOpen] = useState(false);

  // Upgrade Plan Modal State (Feature Gating)
  const [upgradeModalState, setUpgradeModalState] = useState<{
    isOpen: boolean;
    featureKey?: string;
    featureTitle?: string;
    requiredPlan: PlanType;
  }>({
    isOpen: false,
    requiredPlan: 'PROFISSIONAL',
  });

  // Agency Edit Modal State (Nome & Logo)
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [editAgencyName, setEditAgencyName] = useState('');
  const [editAgencyTradeName, setEditAgencyTradeName] = useState('');
  const [editAgencyLogoUrl, setEditAgencyLogoUrl] = useState('');
  const [editAgencyCreci, setEditAgencyCreci] = useState('');
  const [editAgencyPhone, setEditAgencyPhone] = useState('');
  const [editAgencyWhatsApp, setEditAgencyWhatsApp] = useState('');
  const [editAgencyEmail, setEditAgencyEmail] = useState('');
  const [editAgencyCity, setEditAgencyCity] = useState('');
  const [editAgencyState, setEditAgencyState] = useState('');
  const [editAgencyAddress, setEditAgencyAddress] = useState('');
  const [editAgencyBio, setEditAgencyBio] = useState('');
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Request Feature Modal State (Agency-side)
  const [requestingFeatureProperty, setRequestingFeatureProperty] = useState<Property | null>(null);
  const [featureRequestNotes, setFeatureRequestNotes] = useState('');

  // Site Creator search filter
  const [siteCreatorSearch, setSiteCreatorSearch] = useState('');

  // Admin filter states for "Gerenciar e filtrar os imóveis por localidade, valor, quantidade de quarto, vagas..."
  const [filterCity, setFilterCity] = useState('todas');
  const [filterBedrooms, setFilterBedrooms] = useState(0);
  const [filterGarage, setFilterGarage] = useState(0);
  const [filterCondo, setFilterCondo] = useState('todos');
  const [filterFloors, setFilterFloors] = useState(0);
  const [filterPurpose, setFilterPurpose] = useState('todos');
  const [filterFinancing, setFilterFinancing] = useState<'todos' | 'mcmv' | 'fgts' | 'analise'>('todos');

  // Form State for Cadastrar Imóvel
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<PropertyType>('apartamento');
  const [formPropertyCategory, setFormPropertyCategory] = useState<'apartamento' | 'casa'>('apartamento');
  const [formBuildingBlock, setFormBuildingBlock] = useState<string>('');
  const [formApartmentFloor, setFormApartmentFloor] = useState<string>('Térreo');
  const [formPurpose, setFormPurpose] = useState<PropertyPurpose>('locacao');

  // 3 Opções Obrigatórias de Financiamento em Todas as Imobiliárias (Minha Casa Minha Vida, FGTS, Análise Gratuita de Crédito)
  const [formMinhaCasaMinhaVida, setFormMinhaCasaMinhaVida] = useState<boolean>(false);
  const [formFgts, setFormFgts] = useState<boolean>(true);
  const [formAnaliseCreditoGratuita, setFormAnaliseCreditoGratuita] = useState<boolean>(true);
  const [showFinancingDialog, setShowFinancingDialog] = useState<boolean>(false);
  const [formRentPrice, setFormRentPrice] = useState<number | ''>('');
  const [formSalePrice, setFormSalePrice] = useState<number | ''>('');
  const [formMinRentTerm, setFormMinRentTerm] = useState<number | ''>(12);
  const [formDepositValue, setFormDepositValue] = useState<number | ''>('');
  const [formDepositDetails, setFormDepositDetails] = useState('');
  const [formHasCondo, setFormHasCondo] = useState<boolean>(true);
  const [formCondoFee, setFormCondoFee] = useState<number | ''>('');
  const [formIptuFee, setFormIptuFee] = useState<number | ''>('');
  const [formFloorsCount, setFormFloorsCount] = useState<number>(1);
  const [formBedrooms, setFormBedrooms] = useState<number>(2);
  const [formSuites, setFormSuites] = useState<number>(1);
  const [formBathrooms, setFormBathrooms] = useState<number>(2);
  const [formGarageSpots, setFormGarageSpots] = useState<number>(1);
  const [formUsableArea, setFormUsableArea] = useState<number | ''>(85);
  const [formAddress, setFormAddress] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formCity, setFormCity] = useState('São Paulo');
  const [formState, setFormState] = useState('SP');
  const [formZipCode, setFormZipCode] = useState('');
  const [formLat, setFormLat] = useState<number>(-23.565);
  const [formLng, setFormLng] = useState<number>(-46.66);
  const [formImages, setFormImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  ]);
  const [isDraggingImages, setIsDraggingImages] = useState<boolean>(false);
  const [isProcessingImages, setIsProcessingImages] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = async (fileList: FileList | File[]) => {
    setImageUploadError('');
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const currentCount = formImages.length;
    const availableSlots = MAX_IMAGES_ALLOWED - currentCount;

    if (availableSlots <= 0) {
      setImageUploadError(
        `Limite atingido: O imóvel já possui o total máximo de ${MAX_IMAGES_ALLOWED} fotos permitidas.`
      );
      return;
    }

    const oversizedFiles: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue;
      }
      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        oversizedFiles.push(`"${file.name}" (${sizeMb} MB)`);
      } else {
        validFiles.push(file);
      }
    }

    let warningMessage = '';
    if (oversizedFiles.length > 0) {
      warningMessage += `Os seguintes arquivos excedem o limite de 5 MB por arquivo e foram ignorados: ${oversizedFiles.join(', ')}. `;
    }

    const filesToProcess = validFiles.slice(0, availableSlots);
    if (validFiles.length > availableSlots) {
      warningMessage += `Foram anexadas apenas ${availableSlots} fotos válidas, respeitando o limite máximo de ${MAX_IMAGES_ALLOWED} fotos no total.`;
    }

    if (warningMessage) {
      setImageUploadError(warningMessage);
    }

    if (filesToProcess.length === 0) {
      return;
    }

    setIsProcessingImages(true);
    try {
      const processedUrls: string[] = [];
      for (const file of filesToProcess) {
        const dataUrl = await readFileAsOptimizedDataUrl(file);
        processedUrls.push(dataUrl);
      }
      setFormImages((prev) => [...prev, ...processedUrls]);
    } catch (err) {
      console.error('Erro ao ler arquivos de imagem:', err);
      setImageUploadError('Ocorreu um erro ao processar uma das fotos anexadas.');
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCoverImage = (indexToCover: number) => {
    setFormImages((prev) => {
      const target = prev[indexToCover];
      const rest = prev.filter((_, idx) => idx !== indexToCover);
      return [target, ...rest];
    });
  };
  const [formFeatures, setFormFeatures] = useState<string>('Piscina, Varanda Gourmet, Ar Condicionado, Pet Friendly');

  // Form State for Cadastrar Nova Imobiliária
  const [agencyName, setAgencyName] = useState('');
  const [agencyTradeName, setAgencyTradeName] = useState('');
  const [agencyCreci, setAgencyCreci] = useState('');
  const [agencyPhone, setAgencyPhone] = useState('');
  const [agencyWhatsApp, setAgencyWhatsApp] = useState('');
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyCity, setAgencyCity] = useState('');
  const [agencyState, setAgencyState] = useState('SP');
  const [agencyAddress, setAgencyAddress] = useState('');
  const [agencyBio, setAgencyBio] = useState('');
  const [agencyPlan, setAgencyPlan] = useState<PlanType>('PROFISSIONAL');
  const [agencyStatus, setAgencyStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [agencyRenewalDate, setAgencyRenewalDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Agency properties - STRICTLY isolated to the active agency
  const currentAgencyProperties = properties.filter((p) => p.agencyId === effectiveAgencyId);

  // Agency visits - STRICTLY isolated to the active agency
  const currentAgencyVisits = visits.filter((v) => v.agencyId === effectiveAgencyId);

  // Current Agency Plan & Permissions
  const currentAgencyPlan = getAgencyPlan(activeAgency);
  const currentAgencyStatus = getAgencySubscriptionStatus(activeAgency);
  const currentAgencyPlanDetail = PLAN_DETAILS[currentAgencyPlan];
  const currentAgencyStatusConfig = SUBSCRIPTION_STATUS_CONFIG[currentAgencyStatus];
  const currentAgencyMaxLimit = PLAN_FEATURES[currentAgencyPlan].maxProperties;
  const propertyLimitCheck = canCreateProperty(activeAgency, currentAgencyProperties.length);

  // Filtered properties for current agency in admin panel
  const adminFilteredProperties = currentAgencyProperties.filter((p) => {
    if (filterCity !== 'todas' && p.location.city !== filterCity) return false;
    if (filterBedrooms > 0 && p.bedrooms < filterBedrooms) return false;
    if (filterGarage > 0 && p.garageSpots < filterGarage) return false;
    if (filterCondo === 'sim' && !p.hasCondo) return false;
    if (filterCondo === 'nao' && p.hasCondo) return false;
    if (filterFloors > 0 && p.floorsCount !== filterFloors) return false;
    if (filterPurpose !== 'todos' && p.purpose !== 'ambos' && p.purpose !== filterPurpose) return false;
    if (filterFinancing === 'mcmv' && !p.minhaCasaMinhaVida) return false;
    if (filterFinancing === 'fgts' && !p.fgts) return false;
    if (filterFinancing === 'analise' && !p.analiseCreditoGratuita) return false;
    return true;
  });

  const handleCreateAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Acesso negado: Apenas o Super Administrador Master pode cadastrar novas imobiliárias na rede.');
      return;
    }
    if (!agencyName || !agencyCreci || !agencyWhatsApp) {
      alert('Por favor, preencha Razão Social, CRECI e WhatsApp da imobiliária.');
      return;
    }

    const created = addAgency({
      name: agencyName,
      tradeName: agencyTradeName || agencyName,
      creci: agencyCreci,
      phone: agencyPhone || agencyWhatsApp,
      whatsapp: agencyWhatsApp,
      email: agencyEmail || 'contato@imobiliaria.com.br',
      address: agencyAddress,
      city: agencyCity || 'São Paulo',
      state: agencyState || 'SP',
      description: agencyBio || 'Imobiliária cadastrada na rede com gestão independente de imóveis.',
      adminEmail: agencyEmail || `admin@${agencyName.toLowerCase().replace(/\s+/g, '')}.com.br`,
      logoUrl:
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
      plano: agencyPlan,
      status_assinatura: agencyStatus,
      subscriptionStartDate: new Date().toISOString().split('T')[0],
      subscriptionRenewalDate: agencyRenewalDate,
    });

    setSelectedAgencyId(created.id);
    setSuccessNotice(`Imobiliária "${created.name}" cadastrada com sucesso no Plano ${PLAN_DETAILS[agencyPlan].name}!`);
    setTimeout(() => setSuccessNotice(''), 4000);
    setActiveTab('properties');

    // Clear form
    setAgencyName('');
    setAgencyTradeName('');
    setAgencyCreci('');
    setAgencyPhone('');
    setAgencyWhatsApp('');
  };

  const openEditAgencyModal = (agency: Agency) => {
    if (isAgencyAdmin && agency.id !== currentUser?.agencyId) {
      alert('Acesso negado: Você só pode editar as informações da sua própria imobiliária.');
      return;
    }
    setEditingAgency(agency);
    setEditAgencyName(agency.name);
    setEditAgencyTradeName(agency.tradeName || agency.name);
    setEditAgencyLogoUrl(agency.logoUrl);
    setEditAgencyCreci(agency.creci);
    setEditAgencyPhone(agency.phone || '');
    setEditAgencyWhatsApp(agency.whatsapp);
    setEditAgencyEmail(agency.email || '');
    setEditAgencyCity(agency.city);
    setEditAgencyState(agency.state);
    setEditAgencyAddress(agency.address || '');
    setEditAgencyBio(agency.description || '');
  };

  const handleLogoFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo de imagem deve ter no máximo 5 MB.');
      return;
    }
    setIsProcessingLogo(true);
    try {
      const dataUrl = await readFileAsOptimizedDataUrl(file);
      setEditAgencyLogoUrl(dataUrl);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem de logotipo.');
    } finally {
      setIsProcessingLogo(false);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    }
  };

  const handleSaveAgencyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency) return;
    if (isAgencyAdmin && editingAgency.id !== currentUser?.agencyId) {
      alert('Acesso negado: Você só pode editar as informações da sua própria imobiliária.');
      return;
    }
    if (!editAgencyName.trim()) {
      alert('A Razão Social da imobiliária não pode ficar vazia.');
      return;
    }
    if (!editAgencyLogoUrl.trim()) {
      alert('O logotipo da imobiliária não pode ficar vazio.');
      return;
    }

    updateAgency(editingAgency.id, {
      name: editAgencyName.trim(),
      tradeName: editAgencyTradeName.trim() || editAgencyName.trim(),
      logoUrl: editAgencyLogoUrl.trim(),
      creci: editAgencyCreci.trim(),
      phone: editAgencyPhone.trim(),
      whatsapp: editAgencyWhatsApp.trim(),
      email: editAgencyEmail.trim(),
      city: editAgencyCity.trim(),
      state: editAgencyState.trim(),
      address: editAgencyAddress.trim(),
      description: editAgencyBio.trim(),
    });

    setSuccessNotice(`Dados e logotipo da imobiliária "${editAgencyTradeName.trim() || editAgencyName.trim()}" atualizados com sucesso!`);
    setTimeout(() => setSuccessNotice(''), 4500);
    setEditingAgency(null);
  };

  const openFeatureRequestModal = (property: Property) => {
    if (isAgencyAdmin && property.agencyId !== effectiveAgencyId) {
      alert('Acesso negado: Você só pode solicitar destaque para imóveis da sua própria imobiliária.');
      return;
    }
    const agency = getAgencyById(property.agencyId);
    if (agency && !hasFeature(agency, 'propertyHighlight') && !isSiteCreatorMode) {
      setUpgradeModalState({
        isOpen: true,
        featureKey: 'propertyHighlight',
        featureTitle: 'Destaque de Imóveis no Portal',
        requiredPlan: 'PROFISSIONAL',
      });
      return;
    }
    setRequestingFeatureProperty(property);
    setFeatureRequestNotes(
      property.featuredRequestNotes ||
      `Solicitação da imobiliária ${agency?.tradeName || agency?.name || ''}: Imóvel com alto apelo comercial em ${property.location.city}, excelente acabamento e documentação pronta. Solicitamos inserção na Seção de Destaque!`
    );
  };

  const handleSendFeatureRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingFeatureProperty) return;
    requestPropertyFeature(requestingFeatureProperty.id, featureRequestNotes.trim());
    setSuccessNotice(`Solicitação de destaque do imóvel "${requestingFeatureProperty.title}" enviada ao Super Administrador (Master) para avaliação!`);
    setTimeout(() => setSuccessNotice(''), 4500);
    setRequestingFeatureProperty(null);
  };

  const pendingFeaturedRequests = properties.filter((p) => p.featuredRequestStatus === 'pending');
  const activeFeaturedProperties = properties.filter((p) => p.featured);

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveAgencyId) {
      alert('Erro: Nenhuma imobiliária selecionada ou vinculada.');
      return;
    }

    if (!formTitle.trim()) {
      alert('Informe o título do imóvel.');
      return;
    }

    if (formImages.length === 0) {
      alert('Por favor, anexe ao menos 1 foto do imóvel na Galeria de Fotos.');
      return;
    }

    const featureArray = formFeatures
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const propData = {
      agencyId: effectiveAgencyId,
      title: formTitle,
      description: formDescription || 'Excelente imóvel em localização privilegiada.',
      type: formType,
      purpose: formPurpose,
      rentPrice: formRentPrice ? Number(formRentPrice) : undefined,
      salePrice: formSalePrice ? Number(formSalePrice) : undefined,
      minRentTermMonths: formMinRentTerm ? Number(formMinRentTerm) : undefined,
      depositValue: formDepositValue ? Number(formDepositValue) : undefined,
      depositDetails: formDepositDetails || (formDepositValue ? 'Garantia caução locatícia' : undefined),
      hasCondo: formHasCondo,
      condoFee: formHasCondo && formCondoFee ? Number(formCondoFee) : 0,
      iptuFee: formIptuFee ? Number(formIptuFee) : undefined,
      floorsCount: formFloorsCount,
      buildingBlock: formPropertyCategory === 'apartamento' ? (formBuildingBlock.trim() || undefined) : undefined,
      apartmentFloor: formPropertyCategory === 'apartamento' ? formApartmentFloor : undefined,
      bedrooms: formBedrooms,
      suites: formSuites,
      bathrooms: formBathrooms,
      garageSpots: formGarageSpots,
      usableArea: Number(formUsableArea) || 60,
      features: featureArray,
      minhaCasaMinhaVida: formMinhaCasaMinhaVida,
      fgts: formFgts,
      analiseCreditoGratuita: formAnaliseCreditoGratuita,
      location: {
        address: formAddress || 'Rua Principal, 100',
        neighborhood: formNeighborhood || 'Centro',
        city: formCity,
        state: formState,
        zipCode: formZipCode || '01000-000',
        lat: formLat,
        lng: formLng,
      },
      images: formImages.length > 0 ? formImages : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
      status: 'disponivel' as const,
    };

    if (editingPropertyId) {
      const existingProp = properties.find((p) => p.id === editingPropertyId);
      if (isAgencyAdmin && existingProp && existingProp.agencyId !== effectiveAgencyId) {
        alert('Acesso negado: Você não tem permissão para editar imóveis de outra imobiliária.');
        return;
      }
      updateProperty(editingPropertyId, { ...propData, agencyId: effectiveAgencyId });
      setSuccessNotice('Imóvel atualizado com sucesso!');
      setEditingPropertyId(null);
    } else {
      const creationCheck = canCreateProperty(activeAgency, currentAgencyProperties.length);
      if (!creationCheck.allowed && !isSiteCreatorMode) {
        setUpgradeModalState({
          isOpen: true,
          featureKey: 'propertyLimit',
          featureTitle: 'Limite de Imóveis do Plano',
          requiredPlan: currentAgencyPlan === 'ESSENCIAL' ? 'PROFISSIONAL' : 'PREMIUM',
        });
        return;
      }

      try {
        addProperty(propData);
        setSuccessNotice('Novo imóvel cadastrado com sucesso!');
      } catch (err: any) {
        setUpgradeModalState({
          isOpen: true,
          featureKey: 'propertyLimit',
          featureTitle: 'Limite de Imóveis do Plano',
          requiredPlan: currentAgencyPlan === 'ESSENCIAL' ? 'PROFISSIONAL' : 'PREMIUM',
        });
        return;
      }
    }

    setTimeout(() => setSuccessNotice(''), 4000);
    setActiveTab('properties');
    resetPropertyForm();
  };

  const startEditProperty = (prop: Property) => {
    if (isAgencyAdmin && prop.agencyId !== effectiveAgencyId) {
      alert('Acesso negado: Você só pode gerenciar imóveis pertencentes à sua própria imobiliária.');
      return;
    }
    setEditingPropertyId(prop.id);
    setFormTitle(prop.title);
    setFormDescription(prop.description);
    setFormType(prop.type);
    setFormPurpose(prop.purpose);
    setFormRentPrice(prop.rentPrice || '');
    setFormSalePrice(prop.salePrice || '');
    setFormMinRentTerm(prop.minRentTermMonths || '');
    setFormDepositValue(prop.depositValue || '');
    setFormDepositDetails(prop.depositDetails || '');
    setFormHasCondo(prop.hasCondo);
    setFormCondoFee(prop.condoFee || '');
    setFormIptuFee(prop.iptuFee || '');
    setFormFloorsCount(prop.floorsCount);
    setFormPropertyCategory(prop.type === 'casa' ? 'casa' : 'apartamento');
    setFormBuildingBlock(prop.buildingBlock || '');
    setFormApartmentFloor(prop.apartmentFloor || 'Térreo');
    setFormBedrooms(prop.bedrooms);
    setFormSuites(prop.suites);
    setFormBathrooms(prop.bathrooms);
    setFormGarageSpots(prop.garageSpots);
    setFormUsableArea(prop.usableArea);
    setFormAddress(prop.location.address);
    setFormNeighborhood(prop.location.neighborhood);
    setFormCity(prop.location.city);
    setFormState(prop.location.state);
    setFormZipCode(prop.location.zipCode);
    setFormLat(prop.location.lat);
    setFormLng(prop.location.lng);
    setFormImages(prop.images && prop.images.length > 0 ? [...prop.images] : []);
    setImageUploadError('');
    setFormFeatures(prop.features.join(', '));
    setFormMinhaCasaMinhaVida(prop.minhaCasaMinhaVida ?? false);
    setFormFgts(prop.fgts ?? true);
    setFormAnaliseCreditoGratuita(prop.analiseCreditoGratuita ?? true);
    setActiveTab('new_property');
  };

  const resetPropertyForm = () => {
    setEditingPropertyId(null);
    setFormTitle('');
    setFormDescription('');
    setFormRentPrice('');
    setFormSalePrice('');
    setFormMinRentTerm(12);
    setFormDepositValue('');
    setFormDepositDetails('');
    setFormCondoFee('');
    setFormIptuFee('');
    setFormAddress('');
    setFormNeighborhood('');
    setFormPropertyCategory('apartamento');
    setFormBuildingBlock('');
    setFormApartmentFloor('Térreo');
    setFormMinhaCasaMinhaVida(false);
    setFormFgts(true);
    setFormAnaliseCreditoGratuita(true);
    setFormImages([]);
    setImageUploadError('');
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl space-y-6 my-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
          <ShieldCheck className="w-8 h-8 text-emerald-700" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300 uppercase tracking-wider">
            Acesso Restrito
          </span>
          <h2 className="text-2xl font-bold text-stone-900 font-serif">
            Painel da Imobiliária
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
            Esta área é exclusiva para imobiliárias credenciadas e administradores. Para gerenciar os imóveis, visualizar visitas e ajustar as configurações do seu plano contratado, realize o login.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={openAuthModal}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Fazer Login da Imobiliária</span>
          </button>
          <button
            type="button"
            onClick={openSuperAdminLogin}
            className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Login Super Admin Master</span>
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'client') {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-xl space-y-6 my-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
          <AlertCircle className="w-8 h-8 text-amber-700" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
            Perfil de Cliente Conectado
          </span>
          <h2 className="text-2xl font-bold text-stone-900 font-serif">
            Área de Gestão Imobiliária
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
            Você está conectado como <strong>{currentUser.name}</strong> ({currentUser.email}), com perfil de <strong>Cliente / Comprador</strong>. O cadastro de imóveis e as configurações de planos são reservados às imobiliárias credenciadas e administradores.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={openAuthModal}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Trocar de Conta / Entrar como Imobiliária</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notice */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Header with Multi-Agency Switcher and Criador do Site mode */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-md border border-stone-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            {activeAgency?.logoUrl && (
              <img
                src={activeAgency.logoUrl}
                alt={activeAgency.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-stone-700 shrink-0 bg-white"
              />
            )}
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                Painel Administrativo da Imobiliária
              </div>
              <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                <h1 className="text-2xl font-bold">
                  {activeAgency ? activeAgency.tradeName || activeAgency.name : 'Gestão Imobiliária'}
                </h1>
                {activeAgency && (
                  <button
                    onClick={() => openEditAgencyModal(activeAgency)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 transition cursor-pointer"
                    title="Alterar Razão Social, Nome Fantasia e Logotipo desta Imobiliária"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Editar Nome & Logo</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-stone-300 mt-1">
                Razão Social: <span className="text-stone-100 font-medium">{activeAgency?.name}</span> • CRECI:{' '}
                <span className="font-mono text-emerald-300">{activeAgency?.creci}</span> •{' '}
                {activeAgency?.city}, {activeAgency?.state} • WhatsApp:{' '}
                <span className="font-mono text-stone-200">{activeAgency?.whatsapp}</span>
              </p>

              {/* Plan & Capacity Indicator Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-stone-800">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentAgencyPlanDetail.badgeClass}`}>
                  {currentAgencyPlan === 'PREMIUM' && <Crown className="w-3 h-3 text-amber-400" />}
                  {currentAgencyPlanDetail.badgeLabel} • {currentAgencyPlanDetail.priceFormatted}
                </span>

                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentAgencyStatusConfig.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentAgencyStatusConfig.dotClass}`} />
                  {currentAgencyStatusConfig.label}
                </span>

                <span className="text-xs text-stone-300">
                  Capacidade:{' '}
                  <strong className={!propertyLimitCheck.allowed ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {currentAgencyProperties.length}
                  </strong>{' '}
                  / {currentAgencyMaxLimit === Infinity ? 'Sem limite comercial' : `${currentAgencyMaxLimit} imóveis`}
                </span>

                <button
                  type="button"
                  onClick={() => setActiveTab('my_plan')}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer ml-1"
                >
                  Consultar Meu Plano
                </button>
              </div>
            </div>
          </div>

          {/* Agency Switcher (Super Admin) or Exclusive Security Badge (Agency Admin) */}
          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin ? (
              <>
                <div className="bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-xs">
                  <label className="block text-[10px] text-amber-400 font-semibold mb-0.5">
                    Imobiliária em Foco (Master):
                  </label>
                  <select
                    value={selectedAgencyId || ''}
                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                    className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer"
                  >
                    {agencies.map((ag) => {
                      const agPlan = getAgencyPlan(ag);
                      return (
                        <option key={ag.id} value={ag.id} className="bg-stone-900 text-white">
                          {ag.tradeName || ag.name} ({ag.city} - {PLAN_DETAILS[agPlan].badgeLabel})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  onClick={() => setActiveTab('agencies')}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  Nova Imobiliária
                </button>
              </>
            ) : (
              <div className="bg-stone-800/95 border border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span>Acesso Exclusivo à Sua Imobiliária</span>
                  </div>
                  <div className="font-bold text-white text-xs">{activeAgency?.tradeName || activeAgency?.name}</div>
                  <div className="text-[10px] text-stone-300 font-mono">
                    CRECI {activeAgency?.creci} • Gestão 100% Isolada
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Super-Admin Status Strip (Only visible to authenticated Super Admin) */}
        {isSuperAdmin && (
          <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-stone-950 font-bold">
                <Crown className="w-3.5 h-3.5" />
                Painel Master Ativo
              </span>
              <span className="text-stone-300 text-xs">
                Controle irrestrito de dados e configurações da plataforma.
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('plans_management')}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
              >
                <Crown className="w-3.5 h-3.5 text-stone-950" />
                <span>Gestão de Planos Master</span>
              </button>

              {pendingFeaturedRequests.length > 0 ? (
                <button
                  onClick={() => setActiveTab('featured_workflow')}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>{pendingFeaturedRequests.length} solicitações de destaque</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </button>
              ) : (
                <span className="text-stone-400 text-[11px]">
                  Todas as solicitações de destaque estão em dia.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('properties')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            effectiveActiveTab === 'properties'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Home className="w-4 h-4" />
          Imóveis Cadastrados ({currentAgencyProperties.length})
        </button>

        <button
          onClick={() => {
            resetPropertyForm();
            setActiveTab('new_property');
          }}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            effectiveActiveTab === 'new_property'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          {editingPropertyId ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel'}
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            effectiveActiveTab === 'visits'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Visitas Agendadas ({currentAgencyVisits.length})</span>
          {!hasFeature(activeAgency, 'scheduling') && (
            <span className="text-[10px] bg-stone-100 text-stone-600 border border-stone-300 px-1.5 py-0.2 rounded font-bold">
              Plano Pro
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_plan')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            effectiveActiveTab === 'my_plan'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Meu Plano ({currentAgencyPlanDetail.name})</span>
        </button>

        {/* Master Admin Plan Management Tab */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('plans_management')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              effectiveActiveTab === 'plans_management'
                ? 'border-amber-500 text-amber-900 bg-amber-50/80 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Gestão de Planos (Master)</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-black border border-amber-300">
              {agencies.length}
            </span>
          </button>
        )}

        {/* Master Admin Users & Passwords Tab */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              effectiveActiveTab === 'users'
                ? 'border-amber-500 text-amber-950 bg-amber-100/90 font-black'
                : 'border-transparent text-amber-800 hover:text-amber-950 hover:bg-amber-50/50'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Usuários & Senhas Master</span>
          </button>
        )}

        {/* Exclusively Super Admin: Todas as Imobiliárias da Rede */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('agencies')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              effectiveActiveTab === 'agencies'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Imobiliárias da Rede ({agencies.length})
          </button>
        )}

        {/* Master Central de Destaques Tab */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('featured_workflow')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              effectiveActiveTab === 'featured_workflow'
                ? 'border-amber-500 text-amber-800 bg-amber-50/70 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Central de Destaques (Super Administrador Master)</span>
            {pendingFeaturedRequests.length > 0 && (
              <span className="bg-amber-500 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                {pendingFeaturedRequests.length}
              </span>
            )}
          </button>
        )}

        {/* Agency Support Tickets & Repair Request Tab */}
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            effectiveActiveTab === 'tickets'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70 font-bold'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-emerald-600" />
          <span>Chamados & Reparos</span>
        </button>

        {/* Inter-Agency B2B Chat Tab */}
        <button
          onClick={() => setActiveTab('agency_chat')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            effectiveActiveTab === 'agency_chat'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70 font-bold'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Handshake className="w-4 h-4 text-emerald-600" />
          <span>Chat da Rede (B2B)</span>
        </button>

        {/* Master Site Admin Ticket Desk */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('master_tickets')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              effectiveActiveTab === 'master_tickets'
                ? 'border-amber-500 text-amber-950 bg-amber-100 font-black'
                : 'border-transparent text-amber-800 hover:text-amber-950 hover:bg-amber-50/50'
            }`}
          >
            <LifeBuoy className="w-4 h-4 text-amber-600" />
            <span>Recepção de Chamados (Master)</span>
          </button>
        )}
      </div>

      {/* TAB 1: GERENCIAR IMÓVEIS DA IMOBILIÁRIA (com todos os filtros solicitados) */}
      {effectiveActiveTab === 'properties' && (
        <div className="space-y-4">
          {/* Admin Specific Filters Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5">
              Filtrar Imóveis da Imobiliária (Gestão de Carteira)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Localidade</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800"
                >
                  <option value="todas">Todas Cidades</option>
                  {Array.from(new Set(currentAgencyProperties.map((p) => p.location.city))).filter(Boolean).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Finalidade</label>
                <select
                  value={filterPurpose}
                  onChange={(e) => setFilterPurpose(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="locacao">Locação</option>
                  <option value="venda">Venda</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Quartos Mínimos</label>
                <select
                  value={filterBedrooms}
                  onChange={(e) => setFilterBedrooms(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800"
                >
                  <option value={0}>Qualquer</option>
                  <option value={1}>1+</option>
                  <option value={2}>2+</option>
                  <option value={3}>3+</option>
                  <option value={4}>4+</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Vagas de Garagem</label>
                <select
                  value={filterGarage}
                  onChange={(e) => setFilterGarage(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800"
                >
                  <option value={0}>Qualquer</option>
                  <option value={1}>1+</option>
                  <option value={2}>2+</option>
                  <option value={3}>3+</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Condomínio</label>
                <select
                  value={filterCondo}
                  onChange={(e) => setFilterCondo(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800"
                >
                  <option value="todos">Todos</option>
                  <option value="sim">Com Condomínio</option>
                  <option value="nao">Sem Condomínio</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Quantidade de Pisos</label>
                <select
                  value={filterFloors}
                  onChange={(e) => setFilterFloors(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800"
                >
                  <option value={0}>Todos os Pisos</option>
                  <option value={1}>1 Piso (Térreo)</option>
                  <option value={2}>2 Pisos</option>
                  <option value={3}>3 Pisos</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Financiamento (Obrigatório)</label>
                <select
                  value={filterFinancing}
                  onChange={(e) => setFilterFinancing(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800"
                >
                  <option value="todos">Todas as Condições</option>
                  <option value="mcmv">🏠 Minha Casa Minha Vida</option>
                  <option value="fgts">🛡️ Aceita FGTS</option>
                  <option value="analise">⚡ Análise Gratuita</option>
                </select>
              </div>
            </div>
          </div>

          {/* Properties Table / List */}
          {adminFilteredProperties.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
              Nenhum imóvel encontrado nesta imobiliária com os filtros selecionados.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Imóvel</th>
                      <th className="py-3 px-3">Valores & Condições</th>
                      <th className="py-3 px-3">Prazo / Caução</th>
                      <th className="py-3 px-3">Pisos / Quartos</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Destaque na Home</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {adminFilteredProperties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prop.images[0]}
                              alt={prop.title}
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0 max-w-xs">
                              <span className="font-mono text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                                {prop.code}
                              </span>
                              <div className="font-bold text-stone-900 truncate mt-0.5">
                                {prop.title}
                              </div>
                              <div className="text-[11px] text-stone-500 truncate">
                                {prop.location.neighborhood}, {prop.location.city}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            {prop.rentPrice && (
                              <div className="font-bold text-stone-900">
                                {formatCurrency(prop.rentPrice)}
                                <span className="text-[10px] font-normal text-stone-500"> /mês</span>
                              </div>
                            )}
                            {prop.salePrice && (
                              <div className="text-emerald-700 font-bold text-[11px]">
                                Venda: {formatCurrency(prop.salePrice)}
                              </div>
                            )}
                            <div className="text-[10px] text-stone-500">
                              {prop.hasCondo
                                ? `Condomínio: ${formatCurrency(prop.condoFee)}`
                                : 'Sem condomínio'}
                            </div>
                            <div className="flex items-center gap-1 pt-1 flex-wrap">
                              {prop.minhaCasaMinhaVida && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  MCMV
                                </span>
                              )}
                              {prop.fgts && (
                                <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  FGTS
                                </span>
                              )}
                              {prop.analiseCreditoGratuita && (
                                <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Análise Grátis
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-0.5 text-[11px]">
                            {prop.minRentTermMonths && (
                              <div>
                                Prazo mín:{' '}
                                <strong className="text-stone-800">{prop.minRentTermMonths} meses</strong>
                              </div>
                            )}
                            {prop.depositValue ? (
                              <div className="text-emerald-800">
                                Caução: <strong>{formatCurrency(prop.depositValue)}</strong>
                              </div>
                            ) : (
                              <div className="text-stone-400">Caução: N/A</div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-0.5 text-[11px]">
                            <div>
                              Pisos: <strong className="text-stone-800">{prop.floorsCount}</strong>
                              {prop.apartmentFloor && (
                                <span className="text-emerald-700 font-medium ml-1">
                                  ({prop.apartmentFloor}{prop.buildingBlock ? `, ${prop.buildingBlock}` : ''})
                                </span>
                              )}
                            </div>
                            <div>
                              Quartos: <strong className="text-stone-800">{prop.bedrooms}</strong> • Vagas:{' '}
                              <strong className="text-stone-800">{prop.garageSpots}</strong>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {prop.status}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {prop.featured ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-800" />
                                Destaque Ativo
                              </span>
                              {isSiteCreatorMode && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    togglePropertyFeature(prop.id);
                                    setSuccessNotice(`Destaque do imóvel "${prop.title}" desativado.`);
                                    setTimeout(() => setSuccessNotice(''), 3000);
                                  }}
                                  className="block text-[10px] text-stone-500 hover:text-rose-600 underline cursor-pointer"
                                >
                                  Remover Destaque
                                </button>
                              )}
                            </div>
                          ) : prop.featuredRequestStatus === 'pending' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <Clock className="w-3 h-3 text-blue-600" />
                                Aguardando Super Admin
                              </span>
                              {isSiteCreatorMode && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    approvePropertyFeature(prop.id);
                                    setSuccessNotice(`Imóvel "${prop.title}" aprovado e adicionado à Seção de Destaque!`);
                                    setTimeout(() => setSuccessNotice(''), 3500);
                                  }}
                                  className="block text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                                >
                                  ✓ Avaliar e Aceitar
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <button
                                type="button"
                                onClick={() => openFeatureRequestModal(prop)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs"
                                title="Solicitar ao Super Administrador para colocar este imóvel em destaque na Home"
                              >
                                <Star className="w-3 h-3 fill-amber-400 text-amber-700" />
                                Solicitar Destaque
                              </button>
                              {prop.featuredRequestStatus === 'rejected' && (
                                <div className="text-[9px] text-stone-400 mt-0.5">Recusado anteriormente</div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewProperty(prop)}
                              title="Visualizar no site"
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => startEditProperty(prop)}
                              title="Editar imóvel"
                              className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (isAgencyAdmin && prop.agencyId !== effectiveAgencyId) {
                                  alert('Acesso negado: Você não tem permissão para excluir imóveis de outra imobiliária.');
                                  return;
                                }
                                if (confirm(`Deseja realmente excluir o imóvel "${prop.title}"?`)) {
                                  deleteProperty(prop.id);
                                }
                              }}
                              title="Excluir imóvel"
                              className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CADASTRAR OU EDITAR IMÓVEL COM TODOS OS CAMPOS SOLICITADOS */}
      {effectiveActiveTab === 'new_property' && (
        <div className="space-y-6">
          {!editingPropertyId && !propertyLimitCheck.allowed && !isSiteCreatorMode && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    Limite de Cadastro Atingido ({currentAgencyPlanDetail.name})
                  </h3>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    Seu plano atual permite até {currentAgencyMaxLimit} imóveis. Você possui {currentAgencyProperties.length} imóveis cadastrados. Seus imóveis foram preservados, porém novos cadastros estão temporariamente bloqueados. Faça upgrade do plano ou reduza a quantidade de imóveis ativos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setUpgradeModalState({
                    isOpen: true,
                    featureKey: 'propertyLimit',
                    featureTitle: 'Limite de Imóveis do Plano',
                    requiredPlan: currentAgencyPlan === 'ESSENCIAL' ? 'PROFISSIONAL' : 'PREMIUM',
                  })
                }
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Fazer Upgrade do Plano</span>
              </button>
            </div>
          )}

          <form
            onSubmit={handleSaveProperty}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6"
          >
          <div className="border-b border-stone-200 pb-3">
            <h2 className="text-lg font-bold text-stone-900">
              {editingPropertyId ? 'Editar Imóvel' : 'Cadastrar Novo Imóvel no Sistema'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Preencha os valores de locação, venda, prazo mínimo de contrato, caução, condomínio, pisos e localização geolocalizada.
            </p>
          </div>

          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              1. Identificação do Imóvel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">Título do Anúncio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apartamento Duplex com Vista Panorâmica nos Jardins"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Tipo de Imóvel *</label>
                <select
                  value={formType}
                  onChange={(e) => {
                    const val = e.target.value as PropertyType;
                    setFormType(val);
                    if (val === 'casa') {
                      setFormPropertyCategory('casa');
                    } else {
                      setFormPropertyCategory('apartamento');
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                >
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="cobertura">Cobertura</option>
                  <option value="studio">Studio</option>
                  <option value="comercial">Comercial / Laje</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Descrição Detalhada *</label>
              <textarea
                rows={3}
                required
                placeholder="Descreva o imóvel, acabamentos, iluminação natural, sol da manhã, entorno..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 resize-none"
              />
            </div>
          </div>

          {/* Valores, Caução, Locação e Venda (Exigência chave do prompt) */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              2. Valores Financeiros, Prazo Mínimo & Caução
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Finalidade da Transação *</label>
                <select
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value as PropertyPurpose)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                >
                  <option value="locacao">Apenas Locação (Aluguel)</option>
                  <option value="venda">Apenas Venda</option>
                  <option value="ambos">Disponível para Ambos (Locação ou Venda)</option>
                </select>
              </div>

              {/* Valor de Locação */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Valor de Locação (R$/mês)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 4500"
                  value={formRentPrice}
                  onChange={(e) => setFormRentPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              {/* Valor de Venda se disponível */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Valor de Venda (R$, se disponível)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 850000"
                  value={formSalePrice}
                  onChange={(e) => setFormSalePrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              {/* Prazo mínimo de locação */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Prazo Mínimo de Locação (Meses)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 12 ou 30 meses"
                  value={formMinRentTerm}
                  onChange={(e) => setFormMinRentTerm(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              {/* Valor da Caução se aplicado */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Valor da Caução (R$, se aplicado)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 13500 (3 meses)"
                  value={formDepositValue}
                  onChange={(e) => setFormDepositValue(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              {/* Descrição da Caução */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Detalhes da Garantia de Caução
                </label>
                <input
                  type="text"
                  placeholder="Ex: 3 aluguéis em conta poupança caução"
                  value={formDepositDetails}
                  onChange={(e) => setFormDepositDetails(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              {/* Se tem condomínio */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Tem Condomínio?
                </label>
                <select
                  value={formHasCondo ? 'sim' : 'nao'}
                  onChange={(e) => setFormHasCondo(e.target.value === 'sim')}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                >
                  <option value="sim">Sim (Com taxa de condomínio)</option>
                  <option value="nao">Não (Isento de condomínio)</option>
                </select>
              </div>

              {/* Valor do Condomínio se tem */}
              {formHasCondo && (
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Valor Mensal do Condomínio (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 890"
                    value={formCondoFee}
                    onChange={(e) => setFormCondoFee(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                  />
                </div>
              )}

              {/* IPTU */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  IPTU Estimado (R$/mês)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 280"
                  value={formIptuFee}
                  onChange={(e) => setFormIptuFee(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Características Físicas: Dimensões, Pisos, Casa ou Apartamento (Bloco e Andar) */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                3. Dimensões, Pisos e Características
              </h3>
              <span className="text-[11px] font-medium text-stone-500">
                Selecione Casa ou Apartamento (com bloco e andar)
              </span>
            </div>

            {/* Escolha entre Casa ou Apartamento */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  Escolha do Tipo: Casa ou Apartamento *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setFormPropertyCategory('apartamento');
                      setFormType('apartamento');
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                      formPropertyCategory === 'apartamento'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 text-emerald-950 shadow-xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-lg ${
                          formPropertyCategory === 'apartamento'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Apartamento</div>
                        <div className="text-[10px] text-stone-500">Condomínio vertical com bloco e andar</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formPropertyCategory === 'apartamento'
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-stone-300'
                      }`}
                    >
                      {formPropertyCategory === 'apartamento' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormPropertyCategory('casa');
                      setFormType('casa');
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                      formPropertyCategory === 'casa'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20 text-emerald-950 shadow-xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-lg ${
                          formPropertyCategory === 'casa' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Casa</div>
                        <div className="text-[10px] text-stone-500">Térrea, sobrado ou condomínio fechado</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formPropertyCategory === 'casa' ? 'border-emerald-600 bg-emerald-600' : 'border-stone-300'
                      }`}
                    >
                      {formPropertyCategory === 'casa' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Opções condicionais para APARTAMENTO: Bloco e Andar (do Térreo ao 20º Andar) */}
              {formPropertyCategory === 'apartamento' ? (
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Configuração do Apartamento (Bloco e Andar)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Escolha do Bloco / Torre
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Bloco A, Bloco 2, Torre Norte..."
                        value={formBuildingBlock}
                        onChange={(e) => setFormBuildingBlock(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                      />
                      <span className="text-[10px] text-stone-500 mt-0.5 block">
                        Identificação do bloco ou torre no condomínio
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Escolha do Andar * (Do Térreo até o 20º Andar)
                      </label>
                      <select
                        value={formApartmentFloor}
                        onChange={(e) => setFormApartmentFloor(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 font-semibold text-stone-800"
                      >
                        {APARTMENT_FLOORS.map((floor) => (
                          <option key={floor} value={floor}>
                            {floor}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">
                        Andar selecionado: <strong className="text-emerald-700">{formApartmentFloor}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-lg border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Imóvel definido como <strong>Casa</strong>. Não requer seleção de bloco ou andar de edifício.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Quantidade de Pisos (específico do prompt) */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Quantidade de Pisos *
                </label>
                <select
                  value={formFloorsCount}
                  onChange={(e) => setFormFloorsCount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 font-semibold"
                >
                  <option value={1}>1 Piso (Térreo)</option>
                  <option value={2}>2 Pisos (Duplex/Sobrado)</option>
                  <option value={3}>3 Pisos (Triplex)</option>
                  <option value={4}>4+ Pisos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Quartos *</label>
                <input
                  type="number"
                  min={0}
                  value={formBedrooms}
                  onChange={(e) => setFormBedrooms(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Suítes</label>
                <input
                  type="number"
                  min={0}
                  value={formSuites}
                  onChange={(e) => setFormSuites(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Banheiros</label>
                <input
                  type="number"
                  min={1}
                  value={formBathrooms}
                  onChange={(e) => setFormBathrooms(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Vagas Garagem *</label>
                <input
                  type="number"
                  min={0}
                  value={formGarageSpots}
                  onChange={(e) => setFormGarageSpots(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Área Útil (m²)</label>
                <input
                  type="number"
                  min={10}
                  value={formUsableArea}
                  onChange={(e) => setFormUsableArea(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Diferenciais (Separados por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex: Piscina, Churrasqueira, Mobiliado, Varanda Gourmet, Ar Condicionado, Pet Friendly"
                value={formFeatures}
                onChange={(e) => setFormFeatures(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* 4. Condições e Facilidades de Financiamento (OBRIGATÓRIO EM TODAS AS IMOBILIÁRIAS) */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    4. Condições de Financiamento & Crédito
                  </h3>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-rose-200">
                    Obrigatório em Todas as Imobiliárias
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Item obrigatório em todos os cadastros no sistema. Defina as 3 opções nas caixinhas de diálogo multi-selecionáveis abaixo.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowFinancingDialog(true)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Caixa de Diálogo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormMinhaCasaMinhaVida(true);
                    setFormFgts(true);
                    setFormAnaliseCreditoGratuita(true);
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-[11px] font-medium transition cursor-pointer"
                >
                  Marcar Todas (3)
                </button>
              </div>
            </div>

            {/* 3 Interactive Multi-Selectable Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Minha Casa Minha Vida */}
              <div
                onClick={() => setFormMinhaCasaMinhaVida((prev) => !prev)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${
                  formMinhaCasaMinhaVida
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-stone-50 border-stone-300 hover:border-stone-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formMinhaCasaMinhaVida}
                        onChange={(e) => setFormMinhaCasaMinhaVida(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                        <span>🏠</span>
                        1. Minha Casa Minha Vida
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        formMinhaCasaMinhaVida
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {formMinhaCasaMinhaVida ? 'Ativo' : 'Não'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug pl-6">
                    Enquadra o imóvel nas regras com taxas reduzidas e subsídios federais do programa MCMV.
                  </p>
                </div>
                <div className="pt-2.5 mt-2.5 border-t border-stone-200/80 flex items-center justify-between text-[10px] text-stone-500 pl-6">
                  <span className="font-semibold text-rose-700">Obrigatório</span>
                  <span className="font-medium text-emerald-700">Clique para alternar</span>
                </div>
              </div>

              {/* Option 2: Uso do FGTS */}
              <div
                onClick={() => setFormFgts((prev) => !prev)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${
                  formFgts
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-stone-50 border-stone-300 hover:border-stone-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formFgts}
                        onChange={(e) => setFormFgts(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                        <span>🛡️</span>
                        2. Uso do FGTS
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        formFgts
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {formFgts ? 'Ativo' : 'Não'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug pl-6">
                    Permite que o comprador utilize o saldo de contas ativas ou inativas do FGTS na entrada ou quitação.
                  </p>
                </div>
                <div className="pt-2.5 mt-2.5 border-t border-stone-200/80 flex items-center justify-between text-[10px] text-stone-500 pl-6">
                  <span className="font-semibold text-rose-700">Obrigatório</span>
                  <span className="font-medium text-blue-700">Clique para alternar</span>
                </div>
              </div>

              {/* Option 3: Análise Gratuita de Crédito */}
              <div
                onClick={() => setFormAnaliseCreditoGratuita((prev) => !prev)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${
                  formAnaliseCreditoGratuita
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-stone-50 border-stone-300 hover:border-stone-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formAnaliseCreditoGratuita}
                        onChange={(e) => setFormAnaliseCreditoGratuita(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                        <span>⚡</span>
                        3. Análise Gratuita de Crédito
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        formAnaliseCreditoGratuita
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {formAnaliseCreditoGratuita ? 'Ativo' : 'Não'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug pl-6">
                    A imobiliária oferece assessoria gratuita para pré-aprovação nos principais bancos (Caixa, Itaú, Bradesco, Santander).
                  </p>
                </div>
                <div className="pt-2.5 mt-2.5 border-t border-stone-200/80 flex items-center justify-between text-[10px] text-stone-500 pl-6">
                  <span className="font-semibold text-rose-700">Obrigatório</span>
                  <span className="font-medium text-amber-700">Clique para alternar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Localização & Coordenadas no Mapa */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              5. Localização & Coordenadas para o Mapa Geolocalizado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Rua Oscar Freire, 920"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Bairro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cerqueira César"
                  value={formNeighborhood}
                  onChange={(e) => setFormNeighborhood(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Cidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: São Paulo"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formState}
                  onChange={(e) => setFormState(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">CEP</label>
                <input
                  type="text"
                  placeholder="01426-000"
                  value={formZipCode}
                  onChange={(e) => setFormZipCode(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Latitude (Mapa)</label>
                <input
                  type="number"
                  step="any"
                  value={formLat}
                  onChange={(e) => setFormLat(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Longitude (Mapa)</label>
                <input
                  type="number"
                  step="any"
                  value={formLng}
                  onChange={(e) => setFormLng(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Fotos Detalhadas com Upload de Arquivos */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  6. Galeria de Fotos do Imóvel (Anexar Imagens)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Anexe os arquivos de imagem do seu computador ou celular. Máximo de 5 MB por arquivo e até 20 fotos no total.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    formImages.length >= MAX_IMAGES_ALLOWED
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : formImages.length > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {formImages.length} de {MAX_IMAGES_ALLOWED} fotos
                  {formImages.length >= MAX_IMAGES_ALLOWED ? ' (Limite máximo atingido)' : ''}
                </span>
              </div>
            </div>

            {/* Error / Warning Alert */}
            {imageUploadError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-semibold">Atenção ao anexo:</span> {imageUploadError}
                </div>
                <button
                  type="button"
                  onClick={() => setImageUploadError('')}
                  className="text-amber-700 hover:text-amber-900 p-0.5 cursor-pointer"
                  title="Fechar aviso"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleFilesAdded(e.target.files);
                }
              }}
              className="hidden"
              id="property-images-file-input"
            />

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (formImages.length < MAX_IMAGES_ALLOWED) {
                  setIsDraggingImages(true);
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingImages(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingImages(false);
                if (e.dataTransfer.files) {
                  handleFilesAdded(e.dataTransfer.files);
                }
              }}
              onClick={() => {
                if (formImages.length < MAX_IMAGES_ALLOWED && !isProcessingImages) {
                  fileInputRef.current?.click();
                }
              }}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDraggingImages
                  ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                  : formImages.length >= MAX_IMAGES_ALLOWED
                  ? 'border-stone-200 bg-stone-50 cursor-not-allowed opacity-75'
                  : 'border-stone-300 bg-stone-50/60 hover:bg-stone-50 hover:border-emerald-500'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-2.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
                    isDraggingImages
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-emerald-600 border border-stone-200'
                  }`}
                >
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-stone-800">
                    {formImages.length >= MAX_IMAGES_ALLOWED
                      ? 'Limite máximo de 20 fotos atingido'
                      : 'Clique para selecionar fotos ou arraste os arquivos para cá'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Formatos suportados: JPG, PNG, WEBP • Limite de 5 MB por arquivo • Até 20 fotos no total
                  </p>
                </div>

                {formImages.length < MAX_IMAGES_ALLOWED && (
                  <button
                    type="button"
                    disabled={isProcessingImages}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-1 px-4 py-1.5 bg-white border border-stone-300 hover:border-emerald-600 text-stone-700 hover:text-emerald-700 rounded-lg text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Procurar arquivos no computador</span>
                  </button>
                )}
              </div>

              {/* Processing overlay */}
              {isProcessingImages && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-emerald-800">
                    Processando e anexando fotos...
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails Gallery */}
            {formImages.length > 0 ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-stone-700">
                    Fotos anexadas ({formImages.length})
                    <span className="text-stone-400 font-normal ml-2">
                      (A primeira foto será a capa principal do imóvel)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {formImages.length < MAX_IMAGES_ALLOWED && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" />
                        Adicionar mais
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Deseja realmente remover todas as fotos anexadas?')) {
                          setFormImages([]);
                          setImageUploadError('');
                        }
                      }}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1 ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar todas
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {formImages.map((imgUrl, idx) => {
                    const isCover = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`group relative aspect-4/3 rounded-xl overflow-hidden border bg-stone-100 shadow-2xs transition-all ${
                          isCover
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                          {isCover ? (
                            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs pointer-events-auto">
                              <Star className="w-2.5 h-2.5 fill-white" />
                              Capa
                            </span>
                          ) : (
                            <span className="bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md shadow-xs">
                              #{idx + 1}
                            </span>
                          )}

                          {/* Delete photo button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition shadow-xs pointer-events-auto cursor-pointer"
                            title="Remover esta foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Bottom Actions overlay for non-cover photos */}
                        {!isCover && (
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-stone-950/80 via-stone-950/40 to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCoverImage(idx);
                              }}
                              className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs cursor-pointer transition"
                            >
                              <Star className="w-2.5 h-2.5 fill-white" />
                              Definir como Capa
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-500 text-xs">
                Nenhuma foto anexada ainda. Por favor, anexe ao menos 1 foto para o imóvel.
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormImages([
                        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
                        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
                      ]);
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    Usar fotos de exemplo do sistema
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetPropertyForm();
                setActiveTab('properties');
              }}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
            >
              {editingPropertyId ? 'Salvar Alterações no Imóvel' : 'Cadastrar Imóvel na Imobiliária'}
            </button>
          </div>
        </form>
        </div>
      )}

      {/* TAB 3: VISITAS AGENDADAS PARA ESTA IMOBILIÁRIA */}
      {effectiveActiveTab === 'visits' && (
        <>
          {activeAgency && !hasFeature(activeAgency, 'scheduling') && !isSiteCreatorMode ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
                <Calendar className="w-8 h-8 text-amber-700" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  Recurso Disponível no Plano Profissional e Premium
                </div>
                <h3 className="text-2xl font-bold text-stone-900 font-serif">
                  Agendamento Online de Visitas
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  A imobiliária <strong>{activeAgency.name}</strong> está atualmente no{' '}
                  <strong className="text-stone-900">Plano Essencial</strong>, que não inclui a agenda integrada de marcação de visitas online. Faça upgrade para o{' '}
                  <strong className="text-emerald-700">Plano Profissional</strong> para permitir que clientes agendem visitas 24 horas por dia diretamente no portal.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setUpgradeModalState({
                      isOpen: true,
                      featureKey: 'scheduling',
                      featureTitle: 'Agendamento Online de Visitas',
                      requiredPlan: 'PROFISSIONAL',
                    })
                  }
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Fazer Upgrade para Plano Profissional (R$ 297/mês)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs space-y-4 p-5">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    Agenda de Visitas Online dos Clientes
                  </h2>
                  <p className="text-xs text-stone-500">
                    Acompanhe agendamentos, clientes confirmados e horários reservados nos seus imóveis.
                  </p>
                </div>
              </div>

              {currentAgencyVisits.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs">
                  Nenhuma visita agendada para esta imobiliária até o momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-3">Data e Horário</th>
                        <th className="py-3 px-3">Imóvel Solicitado</th>
                        <th className="py-3 px-3">Cliente</th>
                        <th className="py-3 px-3">Telefone / WhatsApp</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {currentAgencyVisits.map((vis) => {
                        const prop = properties.find((p) => p.id === vis.propertyId);
                        return (
                          <tr key={vis.id} className="hover:bg-stone-50/80">
                            <td className="py-3 px-3">
                              <div className="font-bold text-stone-900">{formatDateBR(vis.date)}</div>
                              <div className="text-emerald-700 font-bold">{vis.timeSlot}</div>
                            </td>

                            <td className="py-3 px-3 max-w-xs truncate">
                              <span className="font-medium text-stone-900">{prop?.title || 'Imóvel'}</span>
                              <div className="text-[10px] text-stone-400">Cód: {prop?.code}</div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-medium text-stone-900">{vis.clientName}</div>
                              <div className="text-stone-400 text-[10px]">{vis.clientEmail}</div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-mono text-stone-800">{vis.clientPhone}</div>
                            </td>

                            <td className="py-3 px-3">
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

                            <td className="py-3 px-3 text-right">
                              <select
                                value={vis.status}
                                onChange={(e) =>
                                  updateVisitStatus(
                                    vis.id,
                                    e.target.value as VisitAppointment['status']
                                  )
                                }
                                className="text-xs bg-stone-100 border border-stone-200 rounded px-2 py-1 cursor-pointer"
                              >
                                <option value="agendado">Agendado</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="concluido">Concluído</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB: MEU PLANO (VISÃO DA IMOBILIÁRIA) */}
      {effectiveActiveTab === 'my_plan' && activeAgency && (
        <AgencyMyPlanView
          agency={activeAgency}
          propertyCount={currentAgencyProperties.length}
          onOpenUpgradeModal={(requiredPlan, featureTitle) =>
            setUpgradeModalState({
              isOpen: true,
              requiredPlan,
              featureTitle,
            })
          }
        />
      )}

      {/* TAB: GESTÃO MASTER DE PLANOS (SUPER ADMIN) */}
      {effectiveActiveTab === 'plans_management' && isSuperAdmin && (
        <MasterPlanManagementTab
          agencies={agencies}
          properties={properties}
          onOpenManagePlanModal={(agency) => {
            setManagePlanAgency(agency);
            setIsManagePlanModalOpen(true);
          }}
          onSelectAgencyToView={(agencyId) => {
            setSelectedAgencyId(agencyId);
            setActiveTab('properties');
          }}
        />
      )}

      {/* TAB: GESTÃO DE USUÁRIOS & SENHAS MASTER */}
      {effectiveActiveTab === 'users' && isSuperAdmin && (
        <SuperAdminUsersManagementTab agencies={agencies} />
      )}

      {/* TAB: CHAMADOS & SUPORTE DA IMOBILIÁRIA */}
      {effectiveActiveTab === 'tickets' && activeAgency && (
        <AgencySupportTicketsTab currentAgency={activeAgency} />
      )}

      {/* TAB: CHAT INTER-IMOBILIÁRIAS (B2B) */}
      {effectiveActiveTab === 'agency_chat' && activeAgency && (
        <InterAgencyChatTab currentAgency={activeAgency} />
      )}

      {/* TAB: RECEPÇÃO DE CHAMADOS MASTER (SITE ADMINISTRATORS) */}
      {effectiveActiveTab === 'master_tickets' && isSuperAdmin && (
        <SuperAdminTicketsTab agencies={agencies} />
      )}

      {/* TAB 4: CADASTRAR NOVA IMOBILIÁRIA (Multi-empresa total - EXCLUSIVO SUPER ADMIN) */}
      {effectiveActiveTab === 'agencies' && isSuperAdmin && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateAgency}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4"
          >
            <div className="border-b border-stone-200 pb-3">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Cadastrar Nova Imobiliária Parceira
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                O portal é multi-imobiliária. Cadastre uma nova empresa imobiliária para gerenciar seus próprios imóveis e corretores individualmente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Razão Social da Imobiliária *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nova Era Gestão Imobiliária LTDA"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nome Fantasia / Marca
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nova Era Imóveis"
                  value={agencyTradeName}
                  onChange={(e) => setAgencyTradeName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  CRECI Jurídico *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 51230-J"
                  value={agencyCreci}
                  onChange={(e) => setAgencyCreci(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  WhatsApp de Atendimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5511988887777"
                  value={agencyWhatsApp}
                  onChange={(e) => setAgencyWhatsApp(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Telefone Fixo
                </label>
                <input
                  type="text"
                  placeholder="(11) 3344-5566"
                  value={agencyPhone}
                  onChange={(e) => setAgencyPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  E-mail do Administrador
                </label>
                <input
                  type="email"
                  placeholder="admin@novaera.com.br"
                  value={agencyEmail}
                  onChange={(e) => setAgencyEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={agencyCity}
                  onChange={(e) => setAgencyCity(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Estado</label>
                <input
                  type="text"
                  maxLength={2}
                  value={agencyState}
                  onChange={(e) => setAgencyState(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Endereço da Sede</label>
                <input
                  type="text"
                  placeholder="Av. Paulista, 1000 - Bela Vista"
                  value={agencyAddress}
                  onChange={(e) => setAgencyAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>

            {/* Definição do Plano da Nova Imobiliária */}
            <div className="pt-4 border-t border-stone-200 space-y-3">
              <label className="block text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                Selecione o Plano Contratado desta Imobiliária *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['ESSENCIAL', 'PROFISSIONAL', 'PREMIUM'] as PlanType[]).map((planKey) => {
                  const details = PLAN_DETAILS[planKey];
                  const isSelected = agencyPlan === planKey;
                  return (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => setAgencyPlan(planKey)}
                      className={`text-left p-3.5 rounded-xl border-2 transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-200'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-stone-900">{details.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                      </div>
                      <div className="text-emerald-700 font-black text-sm">{details.priceFormatted}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">Capacidade: {details.maxPropertiesLabel}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Status da Assinatura</label>
                  <select
                    value={agencyStatus}
                    onChange={(e) => setAgencyStatus(e.target.value as SubscriptionStatus)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 bg-white"
                  >
                    <option value="ACTIVE">Ativo (Em dia)</option>
                    <option value="TRIAL">Degustação / Teste</option>
                    <option value="SUSPENDED">Suspenso (Inadimplência)</option>
                    <option value="CANCELED">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Data da Próxima Renovação</label>
                  <input
                    type="date"
                    value={agencyRenewalDate}
                    onChange={(e) => setAgencyRenewalDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Cadastrar Imobiliária e Ativar Plano
              </button>
            </div>
          </form>

          {/* List of Registered Agencies */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                Imobiliárias Cadastradas na Plataforma ({agencies.length})
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('plans_management')}
                className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Painel Completo de Gestão de Planos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agencies.map((ag) => {
                const count = properties.filter((p) => p.agencyId === ag.id).length;
                const agPlan = getAgencyPlan(ag);
                const planDetail = PLAN_DETAILS[agPlan];
                const status = getAgencySubscriptionStatus(ag);
                const statusCfg = SUBSCRIPTION_STATUS_CONFIG[status];
                const max = PLAN_FEATURES[agPlan].maxProperties;

                return (
                  <div
                    key={ag.id}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                      selectedAgencyId === ag.id
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-200'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={ag.logoUrl}
                          alt={ag.name}
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200 bg-white"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-stone-900 truncate">{ag.tradeName || ag.name}</div>
                          <div className="text-[10px] text-stone-500 font-mono">CRECI {ag.creci}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 my-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${planDetail.badgeClass}`}>
                          {planDetail.badgeLabel}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusCfg.badgeClass}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-600 mb-3">
                        {ag.city}, {ag.state} • <strong>{count}</strong> / {max === Infinity ? 'Ilimitado' : max} imóveis
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => {
                          setManagePlanAgency(ag);
                          setIsManagePlanModalOpen(true);
                        }}
                        className="w-full py-1 px-2 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span>Mudar / Gerenciar Plano</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditAgencyModal(ag)}
                          className="flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 flex items-center justify-center gap-1 cursor-pointer transition"
                          title="Alterar Nome e Logotipo"
                        >
                          <Edit className="w-3 h-3 text-stone-500" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgencyId(ag.id);
                            setActiveTab('properties');
                          }}
                          className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold cursor-pointer transition text-center ${
                            selectedAgencyId === ag.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                          }`}
                        >
                          {selectedAgencyId === ag.id ? '✓ Ativa' : 'Entrar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CENTRAL DE DESTAQUES (SUPER ADMIN) */}
      {effectiveActiveTab === 'featured_workflow' && isSuperAdmin && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 text-white p-6 rounded-2xl border border-amber-500/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                Painel do Super Administrador (Master) • Gestão de Destaques
              </div>
              <h2 className="text-xl font-bold font-serif">
                Avaliação e Curadoria de Imóveis em Destaque
              </h2>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl">
                As imobiliárias solicitam destaque através de seus painéis. Como Super Administrador (Master), você avalia cada solicitação e aceita para promover automaticamente o imóvel para a <strong>Seção de Destaque</strong> da página inicial.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-stone-800/80 border border-stone-700 rounded-xl px-4 py-2 text-center">
                <div className="text-2xl font-black text-amber-400">{pendingFeaturedRequests.length}</div>
                <div className="text-[10px] text-stone-300 font-semibold uppercase">Pendentes</div>
              </div>
              <div className="bg-stone-800/80 border border-stone-700 rounded-xl px-4 py-2 text-center">
                <div className="text-2xl font-black text-emerald-400">{activeFeaturedProperties.length}</div>
                <div className="text-[10px] text-stone-300 font-semibold uppercase">No Ar (Home)</div>
              </div>
            </div>
          </div>

          {/* SECTION 1: SOLICITAÇÕES PENDENTES DAS IMOBILIÁRIAS */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Solicitações Pendentes de Avaliação ({pendingFeaturedRequests.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Avalie a proposta da imobiliária e clique em "Aceitar" para colocar o imóvel em destaque imediatamente no topo do site.
                </p>
              </div>
            </div>

            {pendingFeaturedRequests.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-xs bg-stone-50 rounded-xl border border-dashed border-stone-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                Nenhuma solicitação pendente no momento. Todas as requisições foram avaliadas!
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

                          {/* Agency info */}
                          <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center gap-2 text-[11px] text-stone-600">
                            {propAgency?.logoUrl && (
                              <img src={propAgency.logoUrl} alt={propAgency.name} className="w-4 h-4 rounded object-cover" />
                            )}
                            <span className="font-medium text-stone-800">{propAgency?.tradeName || propAgency?.name}</span>
                            <span className="text-stone-400">• CRECI {propAgency?.creci}</span>
                          </div>
                        </div>
                      </div>

                      {/* Request Notes / Justification */}
                      {prop.featuredRequestNotes && (
                        <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-[11px] text-stone-700">
                          <strong className="text-amber-900 block mb-0.5">Justificativa da Imobiliária:</strong>
                          "{prop.featuredRequestNotes}"
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            approvePropertyFeature(prop.id);
                            setSuccessNotice(`Imóvel "${prop.title}" aceito e adicionado à Seção de Destaque com sucesso!`);
                            setTimeout(() => setSuccessNotice(''), 4500);
                          }}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          Avaliar e Aceitar Destaque
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            rejectPropertyFeature(prop.id);
                            setSuccessNotice(`Solicitação de destaque recusada para "${prop.title}".`);
                            setTimeout(() => setSuccessNotice(''), 4500);
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

          {/* SECTION 2: IMÓVEIS ATUALMENTE EM DESTAQUE NA HOME */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Imóveis Atualmente na Seção de Destaque ({activeFeaturedProperties.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Estes imóveis são exibidos na Seção de Destaque no topo da página inicial do portal.
                </p>
              </div>
            </div>

            {activeFeaturedProperties.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs bg-stone-50 rounded-xl">
                Nenhum imóvel em destaque no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFeaturedProperties.map((prop) => {
                  const propAgency = getAgencyById(prop.agencyId);
                  return (
                    <div
                      key={prop.id}
                      className="border border-stone-200 rounded-xl p-3 bg-white flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs transition"
                    >
                      <div className="flex gap-3">
                        <img
                          src={prop.images[0]}
                          alt={prop.title}
                          className="w-16 h-16 object-cover rounded-lg shrink-0 border border-stone-200"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.5 rounded">
                              DESTAQUE
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">{prop.code}</span>
                          </div>
                          <div className="font-bold text-xs text-stone-900 truncate mt-0.5">{prop.title}</div>
                          <div className="text-[10px] text-stone-500 truncate">
                            {prop.location.city} • {propAgency?.tradeName || propAgency?.name}
                          </div>
                          <div className="text-[11px] font-bold text-stone-900 mt-1">
                            {prop.purpose === 'locacao'
                              ? `${formatCurrency(prop.rentPrice)}/mês`
                              : prop.purpose === 'venda'
                              ? formatCurrency(prop.salePrice)
                              : `${formatCurrency(prop.rentPrice)}/mês ou ${formatCurrency(prop.salePrice)}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => onViewProperty(prop)}
                          className="text-[11px] text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                        >
                          Ver no site →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            togglePropertyFeature(prop.id);
                            setSuccessNotice(`Imóvel "${prop.title}" removido da Seção de Destaque.`);
                            setTimeout(() => setSuccessNotice(''), 4000);
                          }}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 transition"
                        >
                          Remover Destaque
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: DESTAQUE DIRETO PELO CRIADOR DO SITE */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Adicionar Qualquer Imóvel da Rede Diretamente ao Destaque
                </h3>
                <p className="text-xs text-stone-500">
                  Como Criador do Site, você pode colocar qualquer imóvel de qualquer imobiliária em destaque a qualquer momento.
                </p>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, título ou cidade..."
                  value={siteCreatorSearch}
                  onChange={(e) => setSiteCreatorSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-emerald-600 bg-stone-50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">Imóvel</th>
                    <th className="py-2.5 px-3">Imobiliária</th>
                    <th className="py-2.5 px-3">Cidade / Local</th>
                    <th className="py-2.5 px-3">Valor</th>
                    <th className="py-2.5 px-3 text-right">Controle do Criador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {properties
                    .filter((p) => {
                      if (!siteCreatorSearch) return true;
                      const q = siteCreatorSearch.toLowerCase();
                      return (
                        p.title.toLowerCase().includes(q) ||
                        p.code.toLowerCase().includes(q) ||
                        p.location.city.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 15)
                    .map((prop) => {
                      const propAgency = getAgencyById(prop.agencyId);
                      return (
                        <tr key={prop.id} className="hover:bg-stone-50/80">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <img src={prop.images[0]} alt="" className="w-9 h-9 rounded object-cover" />
                              <div>
                                <div className="font-bold text-stone-900 truncate max-w-xs">{prop.title}</div>
                                <div className="text-[10px] text-stone-400 font-mono">{prop.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-stone-800">{propAgency?.tradeName || propAgency?.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">
                            {prop.location.city} - {prop.location.state}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">
                            {prop.rentPrice ? formatCurrency(prop.rentPrice) : formatCurrency(prop.salePrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {prop.featured ? (
                              <button
                                type="button"
                                onClick={() => {
                                  togglePropertyFeature(prop.id);
                                  setSuccessNotice(`Destaque removido do imóvel ${prop.code}.`);
                                  setTimeout(() => setSuccessNotice(''), 3000);
                                }}
                                className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                ✓ Em Destaque (Remover)
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  approvePropertyFeature(prop.id);
                                  setSuccessNotice(`Imóvel ${prop.code} adicionado à Seção de Destaque pelo Criador do Site!`);
                                  setTimeout(() => setSuccessNotice(''), 3000);
                                }}
                                className="px-3 py-1 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                + Colocar em Destaque
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDITAR NOME E LOGOTIPO DA IMOBILIÁRIA */}
      {editingAgency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-stone-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-stone-900 font-serif">
                  Editar Nome e Logotipo da Imobiliária
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAgency(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgencyEdit} className="space-y-4">
              {/* Logo Preview and Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-2">
                  Logotipo da Imobiliária *
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <img
                    src={editAgencyLogoUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80'}
                    alt="Logo Preview"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-stone-300 bg-white shrink-0 shadow-xs"
                  />
                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={isProcessingLogo}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isProcessingLogo ? 'Processando...' : 'Carregar Nova Imagem do Computador'}</span>
                      </button>
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoFileUpload(file);
                        }}
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        value={editAgencyLogoUrl}
                        onChange={(e) => setEditAgencyLogoUrl(e.target.value)}
                        placeholder="Ou cole o link direto da imagem (URL)..."
                        className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-stone-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Logos */}
                <div className="mt-2.5">
                  <label className="block text-[11px] text-stone-500 mb-1.5">
                    Ou escolha um logotipo predefinido com 1 clique:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {AGENCY_LOGO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAgencyLogoUrl(preset.url)}
                        className={`p-1.5 rounded-lg border text-left flex items-center gap-2 text-[10px] transition cursor-pointer ${
                          editAgencyLogoUrl === preset.url
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <img src={preset.url} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Razão Social (Nome Oficial) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editAgencyName}
                    onChange={(e) => setEditAgencyName(e.target.value)}
                    placeholder="Ex: Imobiliária Extrema Mantiqueira Ltda"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Nome Fantasia (Como aparece no site) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editAgencyTradeName}
                    onChange={(e) => setEditAgencyTradeName(e.target.value)}
                    placeholder="Ex: Mantiqueira Imóveis Extrema"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 font-medium"
                  />
                </div>
              </div>

              {/* CRECI & Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Registro CRECI *</label>
                  <input
                    type="text"
                    required
                    value={editAgencyCreci}
                    onChange={(e) => setEditAgencyCreci(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">WhatsApp de Atendimento *</label>
                  <input
                    type="text"
                    required
                    value={editAgencyWhatsApp}
                    onChange={(e) => setEditAgencyWhatsApp(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Telefone Fixo</label>
                  <input
                    type="text"
                    value={editAgencyPhone}
                    onChange={(e) => setEditAgencyPhone(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-stone-600 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={editAgencyCity}
                    onChange={(e) => setEditAgencyCity(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-600 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={editAgencyState}
                    onChange={(e) => setEditAgencyState(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs text-stone-600 mb-1">Descrição / Biografia</label>
                <textarea
                  rows={2}
                  value={editAgencyBio}
                  onChange={(e) => setEditAgencyBio(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 text-stone-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingAgency(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SOLICITAR DESTAQUE AO CRIADOR DO SITE */}
      {requestingFeatureProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <Star className="w-5 h-5 fill-amber-500 text-amber-600" />
                <h3 className="text-base font-bold font-serif text-stone-900">
                  Solicitar Destaque ao Criador do Site
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestingFeatureProperty(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex gap-3 items-center">
              <img
                src={requestingFeatureProperty.images[0]}
                alt=""
                className="w-16 h-16 rounded-lg object-cover border border-amber-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-stone-500">{requestingFeatureProperty.code}</div>
                <div className="font-bold text-xs text-stone-900 truncate">{requestingFeatureProperty.title}</div>
                <div className="text-[11px] text-stone-600">
                  {requestingFeatureProperty.location.city} •{' '}
                  {requestingFeatureProperty.purpose === 'locacao'
                    ? `${formatCurrency(requestingFeatureProperty.rentPrice)}/mês`
                    : requestingFeatureProperty.purpose === 'venda'
                    ? formatCurrency(requestingFeatureProperty.salePrice)
                    : `${formatCurrency(requestingFeatureProperty.rentPrice)} ou ${formatCurrency(requestingFeatureProperty.salePrice)}`}
                </div>
              </div>
            </div>

            <form onSubmit={handleSendFeatureRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Justificativa / Motivo da Solicitação:
                </label>
                <p className="text-[11px] text-stone-500 mb-2">
                  Essa mensagem será enviada diretamente à <strong>Central de Destaques do Criador do Site</strong>, que avaliará o imóvel e o aprovará para a Seção de Destaque da página principal.
                </p>
                <textarea
                  required
                  rows={4}
                  value={featureRequestNotes}
                  onChange={(e) => setFeatureRequestNotes(e.target.value)}
                  placeholder="Ex: Imóvel com alto padrão de acabamento, excelente rentabilidade e alta procura em nossa cidade..."
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-800 focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestingFeatureProperty(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar Solicitação ao Criador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Caixinha de Diálogo Multi-Selecionável para Condições de Financiamento */}
      {showFinancingDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold mb-1.5 border border-rose-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Item Obrigatório em Todas as Imobiliárias
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Caixa de Diálogo Multi-Selecionável
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Marque as facilidades de financiamento aplicáveis a este imóvel cadastrado na rede.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFinancingDialog(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Minha Casa Minha Vida */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                  formMinhaCasaMinhaVida
                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formMinhaCasaMinhaVida}
                  onChange={(e) => setFormMinhaCasaMinhaVida(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">🏠</span>
                      1. Minha Casa Minha Vida
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formMinhaCasaMinhaVida
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {formMinhaCasaMinhaVida ? 'Selecionado' : 'Desmarcado'}
                    </span>
                  </div>
                  <p className="text-stone-500 mt-1 leading-snug">
                    O imóvel atende aos critérios do programa com subsídios federais e juros reduzidos.
                  </p>
                </div>
              </label>

              {/* Option 2: Uso do FGTS */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                  formFgts
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formFgts}
                  onChange={(e) => setFormFgts(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">🛡️</span>
                      2. Uso do FGTS
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formFgts
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {formFgts ? 'Selecionado' : 'Desmarcado'}
                    </span>
                  </div>
                  <p className="text-stone-500 mt-1 leading-snug">
                    Permite que o comprador use o saldo do FGTS como parte do pagamento na entrada ou amortização.
                  </p>
                </div>
              </label>

              {/* Option 3: Análise Gratuita de Crédito */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                  formAnaliseCreditoGratuita
                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formAnaliseCreditoGratuita}
                  onChange={(e) => setFormAnaliseCreditoGratuita(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">⚡</span>
                      3. Análise Gratuita de Crédito
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        formAnaliseCreditoGratuita
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {formAnaliseCreditoGratuita ? 'Selecionado' : 'Desmarcado'}
                    </span>
                  </div>
                  <p className="text-stone-500 mt-1 leading-snug">
                    A imobiliária presta assessoria completa e pré-aprova o financiamento nos bancos sem custo.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <span className="text-xs text-stone-500 font-medium">
                Selecionadas:{' '}
                <strong className="text-emerald-700">
                  {[formMinhaCasaMinhaVida, formFgts, formAnaliseCreditoGratuita].filter(Boolean).length} de 3
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setShowFinancingDialog(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Confirmar e Aplicar ao Cadastro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN SYSTEM MODALS */}
      <UpgradePlanModal
        isOpen={upgradeModalState.isOpen}
        onClose={() => setUpgradeModalState((prev) => ({ ...prev, isOpen: false }))}
        featureKey={upgradeModalState.featureKey}
        featureTitle={upgradeModalState.featureTitle}
        requiredPlan={upgradeModalState.requiredPlan}
        agency={activeAgency || null}
      />

      {managePlanAgency && (
        <ManageAgencyPlanModal
          agency={managePlanAgency}
          isOpen={isManagePlanModalOpen}
          onClose={() => {
            setIsManagePlanModalOpen(false);
            setManagePlanAgency(null);
          }}
          onSavePlan={(agencyId, plan, status, renewalDate) => {
            updateAgencyPlan(agencyId, plan, status, renewalDate);
            setSuccessNotice(`Plano da imobiliária atualizado para ${plan} (${status}) com sucesso!`);
            setTimeout(() => setSuccessNotice(''), 4500);
          }}
        />
      )}
    </div>
  );
};
