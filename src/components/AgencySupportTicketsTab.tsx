import React, { useState, useRef } from 'react';
import {
  LifeBuoy,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Send,
  Upload,
  Image as ImageIcon,
  X,
  Search,
  Filter,
  Paperclip,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Building2,
  User as UserIcon,
  Phone,
  Mail,
  Eye,
  Maximize2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupportTicket, TicketCategory, TicketPriority, TicketStatus, Agency } from '../types';
import { formatDateBR } from '../utils/formatters';

interface AgencySupportTicketsTabProps {
  currentAgency: Agency;
}

export const CATEGORY_LABELS: Record<TicketCategory, { label: string; iconColor: string }> = {
  cadastro_imovel: { label: 'Cadastro de Imóvel', iconColor: 'text-emerald-600' },
  simulador: { label: 'Simulador de Financiamento', iconColor: 'text-blue-600' },
  mapa_geolocalizado: { label: 'Mapa Geolocalizado', iconColor: 'text-amber-600' },
  login_usuarios: { label: 'Login & Senhas', iconColor: 'text-purple-600' },
  agendamentos: { label: 'Agendamento de Visitas', iconColor: 'text-rose-600' },
  financeiro_planos: { label: 'Planos & Financeiro', iconColor: 'text-emerald-700' },
  bug_layout: { label: 'Falha Visual / Layout', iconColor: 'text-indigo-600' },
  outro: { label: 'Outro Chamado', iconColor: 'text-stone-600' },
};

export const STATUS_LABELS: Record<TicketStatus, { label: string; badgeClass: string }> = {
  aberto: { label: 'Aberto', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
  em_analise: { label: 'Em Análise', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300' },
  respondido: { label: 'Respondido', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  resolvido: { label: 'Resolvido', badgeClass: 'bg-stone-100 text-stone-700 border-stone-300' },
  fechado: { label: 'Fechado', badgeClass: 'bg-stone-200 text-stone-600 border-stone-300' },
};

export const PRIORITY_LABELS: Record<TicketPriority, { label: string; badgeClass: string }> = {
  baixa: { label: 'Baixa', badgeClass: 'bg-stone-100 text-stone-700 border-stone-200' },
  media: { label: 'Média', badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' },
  alta: { label: 'Alta', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
  critica: { label: 'Crítica / Urgente', badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-bold' },
};

export const AgencySupportTicketsTab: React.FC<AgencySupportTicketsTabProps> = ({ currentAgency }) => {
  const { tickets, createSupportTicket, addTicketMessage, currentUser } = useApp();

  // Active filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Ticket Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('cadastro_imovel');
  const [formSiteSection, setFormSiteSection] = useState('Painel da Imobiliária > Cadastro de Imóvel');
  const [formPriority, setFormPriority] = useState<TicketPriority>('media');
  const [formDescription, setFormDescription] = useState('');
  const [formRequesterName, setFormRequesterName] = useState(currentUser?.name || currentAgency.tradeName);
  const [formRequesterEmail, setFormRequesterEmail] = useState(currentUser?.email || currentAgency.email);
  const [formRequesterPhone, setFormRequesterPhone] = useState(currentAgency.whatsapp || currentAgency.phone || '');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Ticket Details & Conversation Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  // Filter tickets for this agency
  const agencyTickets = tickets.filter((t) => t.agencyId === currentAgency.id);

  const filteredTickets = agencyTickets.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(t.ticketNumber).includes(searchQuery);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Image Upload Handler
  const handleImageUpload = (files: FileList | File[]) => {
    setImageError('');
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (formImages.length + fileArray.length > 8) {
      setImageError('Limite de 8 imagens por chamado atingido.');
      return;
    }

    setIsProcessingImages(true);
    const newImagePromises = fileArray.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve((e.target?.result as string) || '');
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newImagePromises)
      .then((urls) => {
        setFormImages((prev) => [...prev, ...urls.filter(Boolean)]);
      })
      .catch(() => {
        setImageError('Erro ao carregar uma das imagens.');
      })
      .finally(() => {
        setIsProcessingImages(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      setImageError('Por favor, informe o assunto e a descrição da falha.');
      return;
    }

    const created = createSupportTicket({
      agencyId: currentAgency.id,
      agencyName: currentAgency.name,
      agencyTradeName: currentAgency.tradeName,
      agencyCreci: currentAgency.creci,
      requesterName: formRequesterName.trim() || currentAgency.tradeName,
      requesterEmail: formRequesterEmail.trim() || currentAgency.email,
      requesterPhone: formRequesterPhone.trim() || currentAgency.whatsapp,
      title: formTitle.trim(),
      category: formCategory,
      siteSection: formSiteSection,
      priority: formPriority,
      description: formDescription.trim(),
      images: formImages,
      initialMessage: formDescription.trim(),
    });

    triggerToast(`Chamado #${created.ticketNumber} aberto com sucesso! Os administradores do site foram notificados.`);
    setIsCreateModalOpen(false);
    // Reset form
    setFormTitle('');
    setFormDescription('');
    setFormImages([]);
    setImageError('');
  };

  // Handle Send Reply Message in Ticket Chat
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    addTicketMessage(selectedTicket.id, {
      senderRole: 'agency',
      senderName: formRequesterName || currentAgency.tradeName,
      senderEmail: formRequesterEmail || currentAgency.email,
      senderAgencyId: currentAgency.id,
      message: replyMessage.trim(),
    });

    setReplyMessage('');
    triggerToast('Mensagem enviada com sucesso aos administradores!');

    // Update the selectedTicket view locally
    const updated = tickets.find((t) => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  const openTicketDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-1">
            <LifeBuoy className="w-3.5 h-3.5 text-emerald-700" />
            Central de Suporte & Reparos do Portal
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            Chamados de Suporte & Solicitação de Reparo
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Relate qualquer erro, falha ou dúvida técnica à administração do site com envio de imagens para análise.
          </p>
        </div>

        <button
          onClick={() => {
            setFormRequesterName(currentUser?.name || currentAgency.tradeName);
            setFormRequesterEmail(currentUser?.email || currentAgency.email);
            setFormRequesterPhone(currentAgency.whatsapp || currentAgency.phone || '');
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Abrir Chamado / Solicitação de Reparo</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block">Total de Chamados</span>
          <div className="text-2xl font-bold text-stone-900 mt-1 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-emerald-600" />
            <span>{agencyTickets.length}</span>
          </div>
          <span className="text-[10px] text-stone-400">Desta imobiliária</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-800 block">Em Aberto / Em Análise</span>
          <div className="text-2xl font-bold text-amber-900 mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>{agencyTickets.filter((t) => t.status === 'aberto' || t.status === 'em_analise').length}</span>
          </div>
          <span className="text-[10px] text-amber-700">Aguardando resolução</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-800 block">Respondidos pelo Suporte</span>
          <div className="text-2xl font-bold text-blue-900 mt-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>{agencyTickets.filter((t) => t.status === 'respondido').length}</span>
          </div>
          <span className="text-[10px] text-blue-700">Nova resposta disponível</span>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block">Chamados Resolvidos</span>
          <div className="text-2xl font-bold text-stone-800 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{agencyTickets.filter((t) => t.status === 'resolvido').length}</span>
          </div>
          <span className="text-[10px] text-stone-400">Falhas solucionadas</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número do ticket (#1001), assunto ou falha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50/50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white font-medium cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="aberto">Aberto</option>
            <option value="em_analise">Em Análise</option>
            <option value="respondido">Respondido</option>
            <option value="resolvido">Resolvido</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white font-medium cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            <option value="cadastro_imovel">Cadastro de Imóvel</option>
            <option value="simulador">Simulador</option>
            <option value="mapa_geolocalizado">Mapa Geolocalizado</option>
            <option value="login_usuarios">Login & Senhas</option>
            <option value="agendamentos">Agendamento de Visitas</option>
            <option value="financeiro_planos">Planos & Faturas</option>
            <option value="bug_layout">Falha Visual / Layout</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
            <LifeBuoy className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-stone-700 text-sm">Nenhum chamado encontrado</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Sua imobiliária não possui chamados abertos nesta categoria ou com os filtros aplicados.
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const statusCfg = STATUS_LABELS[ticket.status];
            const priorityCfg = PRIORITY_LABELS[ticket.priority];
            const categoryCfg = CATEGORY_LABELS[ticket.category] || CATEGORY_LABELS.outro;

            return (
              <div
                key={ticket.id}
                onClick={() => openTicketDetail(ticket)}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-500 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg">
                      #{ticket.ticketNumber}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badgeClass}`}>
                      {statusCfg.label}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityCfg.badgeClass}`}>
                      {priorityCfg.label}
                    </span>

                    <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                      {categoryCfg.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-stone-900 text-sm">{ticket.title}</h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-stone-400 pt-1 flex-wrap">
                    <span>
                      Aberto por: <strong className="text-stone-700">{ticket.requesterName}</strong>
                    </span>
                    <span>•</span>
                    <span>Data: {formatDateBR(ticket.createdAt)}</span>
                    {ticket.images.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {ticket.images.length} print(s) anexado(s)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-stone-800 flex items-center gap-1 justify-end">
                      <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                      <span>{ticket.messages.length} mensagens</span>
                    </div>
                    <div className="text-[10px] text-stone-400">Clique para abrir chat</div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ABRIR NOVO CHAMADO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Abrir Chamado / Solicitação de Reparo</h3>
                  <p className="text-xs text-stone-400">
                    {currentAgency.tradeName} • ID: <span className="font-mono text-emerald-400">{currentAgency.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {imageError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Assunto / Título da Ocorrência *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Erro ao tentar salvar fotos em alta resolução no imóvel VRT-101"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Categoria da Falha *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="cadastro_imovel">Cadastro de Imóvel</option>
                    <option value="simulador">Simulador de Financiamento</option>
                    <option value="mapa_geolocalizado">Mapa Geolocalizado</option>
                    <option value="login_usuarios">Login / Senha de Usuários</option>
                    <option value="agendamentos">Agendamento de Visitas</option>
                    <option value="financeiro_planos">Planos & Faturas</option>
                    <option value="bug_layout">Bug Visual / Layout quebrado</option>
                    <option value="outro">Outro Tipo de Falha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nível de Urgência / Prioridade *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="baixa">Baixa (Dúvida ou sugestão)</option>
                    <option value="media">Média (Falha pontual)</option>
                    <option value="alta">Alta (Impacta operação comercial)</option>
                    <option value="critica">Crítica (Impedindo cadastros ou logins)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Página / Recurso do Site Afetado
                  </label>
                  <input
                    type="text"
                    value={formSiteSection}
                    onChange={(e) => setFormSiteSection(e.target.value)}
                    placeholder="Ex: Página Inicial > Simulador de Financiamento"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Descrição Detalhada do Problema *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descreva exatamente o que aconteceu, passos para reproduzir e o que esperava que ocorresse..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 leading-relaxed"
                  />
                </div>

                {/* IMAGE UPLOAD SECTION */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    Carregar Imagens / Prints da Tela (Melhor visualização pelos Administradores)
                  </label>

                  <div className="border-2 border-dashed border-stone-300 rounded-2xl p-4 text-center hover:border-emerald-500 bg-stone-50/50 transition">
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      className="hidden"
                      id="ticket-image-input"
                    />

                    <label
                      htmlFor="ticket-image-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="w-6 h-6 text-emerald-600" />
                      <span className="font-bold text-xs text-stone-800">
                        Clique aqui para carregar prints ou fotos do erro
                      </span>
                      <span className="text-[11px] text-stone-400">
                        Suporte a JPG, PNG e WEBP (Até 8 imagens)
                      </span>
                    </label>
                  </div>

                  {/* Image Thumbnails Preview */}
                  {formImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formImages.map((img, idx) => (
                        <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-stone-300">
                          <img src={img} alt="Anexo do chamado" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full opacity-80 group-hover:opacity-100 transition cursor-pointer"
                            title="Remover imagem"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Requester Contact for Conversation */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nome do Solicitante (para fins de conversação) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRequesterName}
                    onChange={(e) => setFormRequesterName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    E-mail para Resposta *
                  </label>
                  <input
                    type="email"
                    required
                    value={formRequesterEmail}
                    onChange={(e) => setFormRequesterEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingImages}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Chamado aos Administradores</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHAT E CONVERSAÇÃO NO TICKET */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in flex flex-col h-[85vh]">
            {/* Ticket Chat Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black text-amber-400 bg-stone-800 px-2.5 py-1 rounded-lg border border-amber-400/40">
                  #{selectedTicket.ticketNumber}
                </span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
                    {selectedTicket.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                    <span>{CATEGORY_LABELS[selectedTicket.category]?.label}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">
                      Status: {STATUS_LABELS[selectedTicket.status]?.label}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Messages Thread */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-stone-50/60">
              {/* Initial Ticket Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedTicket.agencyTradeName} ({selectedTicket.requesterName})
                  </span>
                  <span>{formatDateBR(selectedTicket.createdAt)}</span>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  {selectedTicket.description}
                </p>

                {/* Attached Images */}
                {selectedTicket.images.length > 0 && (
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-semibold text-stone-500 block mb-1.5">
                      Prints / Imagens Anexadas:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setZoomImage(img)}
                          className="w-24 h-24 rounded-xl overflow-hidden border border-stone-300 cursor-pointer hover:opacity-90 relative group"
                        >
                          <img src={img} alt="Anexo do chamado" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message History */}
              {selectedTicket.messages.map((msg) => {
                const isSuperAdmin = msg.senderRole === 'superadmin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSuperAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-2xs ${
                        isSuperAdmin
                          ? 'bg-stone-900 text-stone-100 border border-stone-800'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 mb-1">
                        <span className="font-bold">
                          {isSuperAdmin ? '👑 ' + msg.senderName : msg.senderName}
                        </span>
                        <span>{formatDateBR(msg.createdAt)}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar */}
            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Digite sua mensagem para a equipe de administração do site..."
                className="flex-1 px-4 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={zoomImage} alt="Visualização em tamanho real" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 bg-black/70 hover:bg-rose-600 text-white p-2 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
