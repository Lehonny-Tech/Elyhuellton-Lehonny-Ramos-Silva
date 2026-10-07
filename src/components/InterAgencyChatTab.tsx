import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Building2,
  Users,
  Search,
  Sparkles,
  Paperclip,
  CheckCheck,
  Crown,
  Handshake,
  MapPin,
  Clock,
  User as UserIcon,
  LifeBuoy,
  KeyRound,
  PlusCircle,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Maximize2,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Agency, AgencyChatMessage, SupportTicket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import { formatDateBR } from '../utils/formatters';
import { STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS } from './AgencySupportTicketsTab';

interface InterAgencyChatTabProps {
  currentAgency: Agency;
}

export const InterAgencyChatTab: React.FC<InterAgencyChatTabProps> = ({ currentAgency }) => {
  const {
    agencyChatMessages,
    sendAgencyChatMessage,
    agencies,
    currentUser,
    tickets,
    createSupportTicket,
    addTicketMessage,
  } = useApp();

  // Mode: 'tickets' (Chamados para Correção com Administradores) or 'b2b' (Parcerias entre Imobiliárias)
  const [activeMode, setActiveMode] = useState<'tickets' | 'b2b'>('tickets');

  // ==========================================
  // TICKETS / CHAMADOS STATE (EXCLUSIVO DA IMOBILIÁRIA)
  // ==========================================
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // New ticket modal
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<TicketCategory>('cadastro_imovel');
  const [formPriority, setFormPriority] = useState<TicketPriority>('media');
  const [formDescription, setFormDescription] = useState('');
  const [formRequesterName, setFormRequesterName] = useState(currentUser?.name || currentAgency.tradeName);
  const [formRequesterEmail, setFormRequesterEmail] = useState(currentUser?.email || currentAgency.email);
  const [formRequesterPhone, setFormRequesterPhone] = useState(currentAgency.whatsapp || currentAgency.phone || '');
  const [toastNotice, setToastNotice] = useState('');

  const triggerToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(''), 4500);
  };

  // Strictly filter tickets for this agency ONLY!
  const myAgencyTickets = tickets.filter((t) => t.agencyId === currentAgency.id);

  const filteredTickets = myAgencyTickets.filter((t) => {
    const matchesStatus = ticketFilterStatus === 'all' || t.status === ticketFilterStatus;
    const matchesSearch =
      t.title.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
      String(t.ticketNumber).includes(ticketSearchQuery);
    return matchesStatus && matchesSearch;
  });

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Preencha título e descrição do chamado.');
      return;
    }

    const created = createSupportTicket({
      agencyId: currentAgency.id,
      agencyName: currentAgency.name,
      agencyTradeName: currentAgency.tradeName || currentAgency.name,
      agencyCreci: currentAgency.creci,
      requesterRole: 'agency_admin',
      requesterName: formRequesterName.trim() || currentAgency.tradeName,
      requesterEmail: formRequesterEmail.trim() || currentAgency.email,
      requesterPhone: formRequesterPhone.trim() || undefined,
      title: formTitle.trim(),
      category: formCategory,
      priority: formPriority,
      siteSection: 'Portal Chat & Parcerias > Chamados para Correção',
      description: formDescription.trim(),
      images: [],
      initialMessage: formDescription.trim(),
    });

    triggerToast(`Chamado #${created.ticketNumber} com o título "${created.title}" aberto com sucesso com status "1. Aberto"!`);
    setIsNewTicketModalOpen(false);
    setSelectedTicket(created);
    setFormTitle('');
    setFormDescription('');
  };

  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    addTicketMessage(selectedTicket.id, {
      senderRole: 'agency',
      senderName: currentUser?.name || `${currentAgency.tradeName} (Gestor)`,
      senderEmail: currentAgency.email,
      senderAgencyId: currentAgency.id,
      message: replyText.trim(),
    });

    setReplyText('');
    triggerToast('Mensagem enviada aos administradores do portal!');
    const updated = tickets.find((t) => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  // ==========================================
  // B2B PARTNERSHIP CHAT STATE
  // ==========================================
  const [activeChannelId, setActiveChannelId] = useState<string>('rede-geral');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeMode === 'b2b') {
      scrollToBottom();
    }
  }, [agencyChatMessages, activeChannelId, activeMode]);

  const partnerAgencies = agencies.filter((a) => a.id !== currentAgency.id);
  const activePartnerAgency = partnerAgencies.find((a) => {
    const pairId1 = `${currentAgency.id}_${a.id}`;
    const pairId2 = `${a.id}_${currentAgency.id}`;
    return activeChannelId === pairId1 || activeChannelId === pairId2;
  });

  const channelMessages = agencyChatMessages.filter((msg) => {
    if (activeChannelId === 'rede-geral') {
      return msg.channelId === 'rede-geral' || !msg.channelId;
    }
    const pairId1 = `${currentAgency.id}_${activePartnerAgency?.id}`;
    const pairId2 = `${activePartnerAgency?.id}_${currentAgency.id}`;
    return msg.channelId === pairId1 || msg.channelId === pairId2;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendAgencyChatMessage({
      channelId: activeChannelId,
      senderAgencyId: currentAgency.id,
      senderAgencyName: currentAgency.name,
      senderAgencyTradeName: currentAgency.tradeName || currentAgency.name,
      senderAgencyLogoUrl: currentAgency.logoUrl,
      senderAgencyCreci: currentAgency.creci,
      senderUserName: currentUser?.name || `${currentAgency.tradeName} (Gestor)`,
      text: messageText.trim(),
    });

    setMessageText('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-1">
            <Handshake className="w-3.5 h-3.5 text-emerald-700" />
            Portal Chat & Parcerias entre Imobiliárias
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            Chat & Parcerias entre Imobiliárias
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Acesso exclusivo aos chamados de correção abertos pela sua imobiliária com os administradores do portal e canal B2B de parcerias.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="text-[10px] text-emerald-700 font-bold uppercase">Gestão Isolada e Segura</div>
            <div className="font-bold text-stone-900">{currentAgency.tradeName} (CRECI {currentAgency.creci})</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: 1. Chamados para Correção com Administradores (Default) | 2. Parcerias B2B */}
      <div className="flex border-b border-stone-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveMode('tickets')}
          className={`flex-1 py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMode === 'tickets'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Chamados para Correção com Administradores do Portal ({myAgencyTickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('b2b')}
          className={`flex-1 py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            activeMode === 'b2b'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Parcerias Comerciais entre Imobiliárias (B2B)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CHAMADOS PARA CORREÇÃO JUNTAMENTE AOS ADMINISTRADORES DO PORTAL */}
      {/* ========================================================================= */}
      {activeMode === 'tickets' && (
        <div className="space-y-5 animate-fade-in">
          {/* Action and KPI Strip */}
          <div className="bg-stone-900 text-white p-5 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Acesso Unicamente Exclusivo à Sua Imobiliária</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Chamados Abertos para Correção com a Administração do Portal
              </h3>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl">
                Suas conversas e chamados são sigilosos e acessíveis apenas pela sua imobiliária e pelos administradores do portal. Cada chamado possui rigorosamente 3 status de evolução: <strong>1. Aberto</strong>, <strong>2. Atribuído</strong> e <strong>3. Resolvido</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFormTitle('Redefinição de Senha');
                  setFormCategory('login_usuarios');
                  setFormPriority('alta');
                  setFormDescription('Solicito a redefinição de senha para administrador/corretor da imobiliária.');
                  setIsNewTicketModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <KeyRound className="w-4 h-4 text-stone-950" />
                <span>Redefinição de Senha</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormTitle('');
                  setFormCategory('cadastro_imovel');
                  setFormPriority('media');
                  setFormDescription('');
                  setIsNewTicketModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Novo Chamado de Correção</span>
              </button>
            </div>
          </div>

          {/* 3 Status KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-stone-500 block">Total de Chamados</span>
              <div className="text-2xl font-bold text-stone-900 mt-1 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-emerald-600" />
                <span>{myAgencyTickets.length}</span>
              </div>
              <span className="text-[10px] text-stone-400">Desta imobiliária</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-800 block">1. Aberto</span>
              <div className="text-2xl font-bold text-amber-900 mt-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>{myAgencyTickets.filter((t) => t.status === 'aberto').length}</span>
              </div>
              <span className="text-[10px] text-amber-700">Aguardando atendimento</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-blue-800 block">2. Atribuído</span>
              <div className="text-2xl font-bold text-blue-900 mt-1 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>{myAgencyTickets.filter((t) => t.status === 'atribuido').length}</span>
              </div>
              <span className="text-[10px] text-blue-700">Com administrador responsável</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-800 block">3. Resolvido</span>
              <div className="text-2xl font-bold text-emerald-900 mt-1 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{myAgencyTickets.filter((t) => t.status === 'resolvido').length}</span>
              </div>
              <span className="text-[10px] text-emerald-700">Falhas e dúvidas solucionadas</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por número do ticket (#1001), assunto ou falha..."
                value={ticketSearchQuery}
                onChange={(e) => setTicketSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50/50"
              />
            </div>

            <select
              value={ticketFilterStatus}
              onChange={(e) => setTicketFilterStatus(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white font-medium cursor-pointer w-full sm:w-auto"
            >
              <option value="all">Todos os Status (3 fases)</option>
              <option value="aberto">1. Aberto</option>
              <option value="atribuido">2. Atribuído</option>
              <option value="resolvido">3. Resolvido</option>
            </select>
          </div>

          {/* Main Dual Grid: Tickets List + Real-Time Conversation Desk */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Tickets List */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredTickets.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-500 space-y-2">
                  <LifeBuoy className="w-8 h-8 mx-auto text-stone-400" />
                  <p className="font-semibold text-xs">Nenhum chamado aberto encontrado.</p>
                  <p className="text-[11px] text-stone-400">
                    Use os botões acima para abrir uma solicitação de correção ou redefinição de senha com os administradores do portal.
                  </p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const statusCfg = STATUS_LABELS[ticket.status];
                  const priorityCfg = PRIORITY_LABELS[ticket.priority];
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-200 shadow-sm'
                          : 'border-stone-200 bg-white hover:bg-stone-50/80 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                          <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-lg">
                            #{ticket.ticketNumber}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badgeClass}`}>
                            {statusCfg.label}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityCfg.badgeClass}`}>
                            {priorityCfg.label}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-stone-900 leading-snug">
                          {ticket.title}
                        </h4>

                        <p className="text-[11px] text-stone-600 line-clamp-2 mt-1">
                          {ticket.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                        <span>{formatDateBR(ticket.createdAt)}</span>
                        {ticket.assignedTo && (
                          <span className="text-blue-700 font-semibold truncate max-w-[140px]">
                            Resp: {ticket.assignedTo}
                          </span>
                        )}
                        <span className="text-stone-700 font-semibold flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-stone-400" />
                          {ticket.messages.length} msg(s)
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Conversation Window for the Selected Ticket */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 shadow-md flex flex-col h-[620px] overflow-hidden">
              {selectedTicket ? (
                <>
                  {/* Ticket Header & 3-Status Progress Bar */}
                  <div className="bg-stone-950 text-white p-4 border-b border-stone-800 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-amber-400 bg-stone-900 px-2 py-0.5 rounded border border-amber-400/30">
                            #{selectedTicket.ticketNumber}
                          </span>
                          <h3 className="font-bold text-sm text-white truncate max-w-md">
                            {selectedTicket.title}
                          </h3>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2">
                          <span>{CATEGORY_LABELS[selectedTicket.category]?.label}</span>
                          <span>•</span>
                          <span>Aberto por: {selectedTicket.requesterName}</span>
                          {selectedTicket.assignedTo && (
                            <>
                              <span>•</span>
                              <span className="text-blue-300 font-semibold bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
                                Atribuído: {selectedTicket.assignedTo}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${STATUS_LABELS[selectedTicket.status].badgeClass}`}>
                        {STATUS_LABELS[selectedTicket.status].label}
                      </span>
                    </div>

                    {/* 3 Status Stepper Tracker */}
                    <div className="mt-3 pt-2.5 border-t border-stone-850 flex items-center justify-between text-[11px]">
                      <div className={`flex items-center gap-1.5 ${selectedTicket.status === 'aberto' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${selectedTicket.status === 'aberto' ? 'bg-amber-500 text-stone-950' : 'bg-emerald-600 text-white'}`}>1</span>
                        <span>1. Aberto</span>
                      </div>
                      <div className="text-stone-600">→</div>
                      <div className={`flex items-center gap-1.5 ${selectedTicket.status === 'atribuido' ? 'text-blue-400 font-bold' : selectedTicket.status === 'resolvido' ? 'text-emerald-400 font-semibold' : 'text-stone-500'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${selectedTicket.status === 'atribuido' ? 'bg-blue-500 text-white' : selectedTicket.status === 'resolvido' ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400'}`}>2</span>
                        <span>2. Atribuído</span>
                      </div>
                      <div className="text-stone-600">→</div>
                      <div className={`flex items-center gap-1.5 ${selectedTicket.status === 'resolvido' ? 'text-emerald-400 font-bold' : 'text-stone-500'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${selectedTicket.status === 'resolvido' ? 'bg-emerald-500 text-white' : 'bg-stone-800 text-stone-400'}`}>3</span>
                        <span>3. Resolvido</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/70 text-xs">
                    {/* Original Problem Report */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-2xs space-y-1.5">
                      <div className="text-[10px] text-stone-400 font-semibold uppercase flex items-center justify-between">
                        <span>Relato Inicial da Imobiliária</span>
                        <span>{formatDateBR(selectedTicket.createdAt)}</span>
                      </div>
                      <p className="text-xs text-stone-800 leading-relaxed font-sans">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {/* Subsequent messages between Agency and Portal Administrators */}
                    {selectedTicket.messages.map((m) => {
                      const isSuperadmin = m.senderRole === 'superadmin';

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isSuperadmin ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs ${
                              isSuperadmin
                                ? 'bg-amber-50 text-stone-900 border border-amber-300 rounded-bl-xs'
                                : 'bg-emerald-600 text-white rounded-br-xs'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1 pb-1 border-b border-black/10">
                              {isSuperadmin ? (
                                <>
                                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="text-amber-900">Administrador do Portal ({m.senderName})</span>
                                </>
                              ) : (
                                <>
                                  <Building2 className="w-3.5 h-3.5 text-emerald-200" />
                                  <span>{m.senderName} ({currentAgency.tradeName})</span>
                                </>
                              )}
                            </div>

                            <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>

                            <div
                              className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${
                                isSuperadmin ? 'text-amber-800' : 'text-emerald-200'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{formatDateBR(m.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Form */}
                  <form onSubmit={handleSendTicketReply} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreva uma resposta ou complemento para a administração do portal..."
                      className="flex-1 px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50/50"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-2xs">
                    <LifeBuoy className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-700 text-sm">Selecione um Chamado</h4>
                    <p className="text-xs text-stone-400 max-w-sm mt-1">
                      Clique em qualquer chamado na lista lateral para acompanhar o status (1. Aberto, 2. Atribuído, 3. Resolvido) e conversar diretamente com os administradores do portal.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PARCERIAS COMERCIAIS B2B ENTRE IMOBILIÁRIAS (SEM EXPOR CHAMADOS) */}
      {/* ========================================================================= */}
      {activeMode === 'b2b' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-4 h-[650px] animate-fade-in">
          {/* Sidebar Channels & Partner Agencies */}
          <div className="border-r border-stone-200 bg-stone-50/70 p-4 flex flex-col gap-3">
            <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Canais B2B de Parceria
            </div>

            {/* General Network Channel */}
            <button
              onClick={() => setActiveChannelId('rede-geral')}
              className={`w-full p-3 rounded-2xl text-left transition cursor-pointer flex items-center gap-3 ${
                activeChannelId === 'rede-geral'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 border border-stone-200 text-stone-800'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  activeChannelId === 'rede-geral' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs">Rede Geral ImobiRede</div>
                <div
                  className={`text-[11px] ${
                    activeChannelId === 'rede-geral' ? 'text-emerald-100' : 'text-stone-500'
                  }`}
                >
                  Todas as {agencies.length} imobiliárias
                </div>
              </div>
            </button>

            <div className="text-xs font-bold text-stone-800 uppercase tracking-wider mt-2 flex items-center justify-between">
              <span>Conversas Diretas (1 a 1)</span>
            </div>

            {/* List of other partner agencies */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {partnerAgencies.map((agency) => {
                const pairId = `${currentAgency.id}_${agency.id}`;
                const isSelected = activeChannelId === pairId || activeChannelId === `${agency.id}_${currentAgency.id}`;

                return (
                  <button
                    key={agency.id}
                    onClick={() => setActiveChannelId(pairId)}
                    className={`w-full p-2.5 rounded-xl text-left transition cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white hover:bg-stone-100 border border-stone-200 text-stone-800'
                    }`}
                  >
                    <img
                      src={agency.logoUrl}
                      alt={agency.tradeName}
                      className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                    />
                    <div className="truncate flex-1">
                      <div className="font-bold text-xs truncate">{agency.tradeName}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-stone-400' : 'text-stone-500'
                        }`}
                      >
                        {agency.city}, {agency.state} • CRECI {agency.creci}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Feed & Conversation Area */}
          <div className="md:col-span-3 flex flex-col h-full bg-stone-50/40">
            {/* Channel Header */}
            <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChannelId === 'rede-geral' ? (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900">Canal Geral da Rede ImobiRede</h3>
                      <p className="text-xs text-stone-500">
                        Bate-papo aberto entre corretores e gestores de todas as cidades parceiras para captação cruzada
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={activePartnerAgency?.logoUrl}
                      alt={activePartnerAgency?.tradeName}
                      className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-stone-900">
                        Conversa de Parceria com {activePartnerAgency?.tradeName}
                      </h3>
                      <p className="text-xs text-stone-500">
                        CRECI {activePartnerAgency?.creci} • {activePartnerAgency?.city}, {activePartnerAgency?.state}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="text-[11px] text-stone-500 font-medium hidden sm:block">
                {channelMessages.length} mensagem(ns) no canal
              </div>
            </div>

            {/* Quick Partnership Chips */}
            <div className="px-4 py-2 bg-stone-100/70 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                Sugestões:
              </span>
              <button
                type="button"
                onClick={() => setMessageText('Temos um cliente investidor buscando imóveis comerciais para locação garantida.')}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 rounded-lg text-[11px] whitespace-nowrap transition cursor-pointer"
              >
                💼 Cliente Investidor
              </button>
              <button
                type="button"
                onClick={() => setMessageText('Aceitamos parceria 50/50 de comissão para fechamento rápido deste imóvel.')}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 rounded-lg text-[11px] whitespace-nowrap transition cursor-pointer"
              >
                🤝 Parceria 50/50
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {channelMessages.length === 0 ? (
                <div className="text-center py-16 text-stone-400 space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="text-xs font-semibold">Nenhuma mensagem neste canal de parceria ainda.</p>
                  <p className="text-[11px]">Envie uma mensagem abaixo para iniciar a conversa entre imobiliárias parceiras!</p>
                </div>
              ) : (
                channelMessages.map((msg) => {
                  const isMine = msg.senderAgencyId === currentAgency.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-xs shadow-2xs ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-black/10">
                          {msg.senderAgencyLogoUrl && (
                            <img
                              src={msg.senderAgencyLogoUrl}
                              alt={msg.senderAgencyTradeName}
                              className="w-4 h-4 rounded-full object-cover shrink-0"
                            />
                          )}
                          <span className="font-bold text-[11px]">
                            {msg.senderUserName} ({msg.senderAgencyTradeName})
                          </span>
                          {msg.senderAgencyCreci && (
                            <span className={`text-[10px] ${isMine ? 'text-emerald-200' : 'text-stone-400'}`}>
                              • CRECI {msg.senderAgencyCreci}
                            </span>
                          )}
                        </div>

                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                        <div
                          className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${
                            isMine ? 'text-emerald-200' : 'text-stone-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{formatDateBR(msg.createdAt)}</span>
                          {isMine && <CheckCheck className="w-3 h-3 ml-0.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-stone-200 flex items-center gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Escreva uma mensagem de parceria para ${
                  activeChannelId === 'rede-geral' ? 'toda a rede de imobiliárias' : activePartnerAgency?.tradeName
                }...`}
                className="flex-1 px-4 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50/50"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ABRIR NOVO CHAMADO DE CORREÇÃO OU REDEFINIÇÃO DE SENHA             */}
      {/* ========================================================================= */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden animate-fade-in flex flex-col">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {formTitle === 'Redefinição de Senha' ? <KeyRound className="w-5 h-5 text-amber-300" /> : <LifeBuoy className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {formTitle === 'Redefinição de Senha' ? 'Abrir Chamado: Redefinição de Senha' : 'Abrir Chamado para Correção do Portal'}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {currentAgency.tradeName} • CRECI {currentAgency.creci}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Título do Chamado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Redefinição de Senha ou Correção no Simulador"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Categoria da Correção *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="cadastro_imovel">Cadastro de Imóvel</option>
                    <option value="login_usuarios">Login / Redefinição de Senha</option>
                    <option value="mapa_geolocalizado">Mapa Geolocalizado</option>
                    <option value="simulador">Simulador de Crédito</option>
                    <option value="agendamentos">Agendamento de Visitas</option>
                    <option value="financeiro_planos">Planos & Assinatura</option>
                    <option value="bug_layout">Falha Visual / Layout</option>
                    <option value="outro">Outro Assunto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600 bg-white cursor-pointer"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica / Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Descrição Detalhada do Problema / Solicitação *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva a correção necessária, comportamento esperado e detalhes para a equipe de administração do portal..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nome do Solicitante
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
                    E-mail para Retorno
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

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-semibold hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Chamado com Status "1. Aberto"</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

