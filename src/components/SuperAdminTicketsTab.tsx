import React, { useState } from 'react';
import {
  LifeBuoy,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Send,
  Image as ImageIcon,
  X,
  Search,
  Filter,
  Maximize2,
  Trash2,
  ExternalLink,
  ChevronDown,
  User as UserIcon,
  Phone,
  Mail,
  ArrowUpDown,
  Tag,
  ShieldAlert,
  Sparkles,
  Crown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupportTicket, TicketCategory, TicketPriority, TicketStatus, Agency } from '../types';
import { formatDateBR } from '../utils/formatters';
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from './AgencySupportTicketsTab';

interface SuperAdminTicketsTabProps {
  agencies: Agency[];
}

export const SuperAdminTicketsTab: React.FC<SuperAdminTicketsTabProps> = ({ agencies }) => {
  const { tickets, updateTicketStatus, addTicketMessage, deleteSupportTicket, currentUser } = useApp();

  // Filters
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // default most recent or strictly increasing

  // Active Ticket Modal for Response & Conversation
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  // Filtered and sorted tickets
  const filteredTickets = tickets
    .filter((t) => {
      const matchesAgency = selectedAgencyId === 'all' || t.agencyId === selectedAgencyId;
      const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;

      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.agencyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(t.ticketNumber).includes(searchQuery);

      return matchesAgency && matchesStatus && matchesPriority && matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.ticketNumber - b.ticketNumber;
      }
      return b.ticketNumber - a.ticketNumber;
    });

  // Calculate statistics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'aberto').length;
  const inAnalysisTickets = tickets.filter((t) => t.status === 'em_analise').length;
  const repliedTickets = tickets.filter((t) => t.status === 'respondido').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolvido').length;

  // Handle Admin Reply
  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !adminReplyText.trim()) return;

    addTicketMessage(activeTicket.id, {
      senderRole: 'superadmin',
      senderName: currentUser?.name || 'Administração do Portal ImobiRede',
      senderEmail: 'suporte@imobirede.com.br',
      message: adminReplyText.trim(),
    });

    setAdminReplyText('');
    triggerToast(`Resposta enviada para a imobiliária no Ticket #${activeTicket.ticketNumber}!`);

    // Refresh active ticket view
    const updated = tickets.find((t) => t.id === activeTicket.id);
    if (updated) setActiveTicket(updated);
  };

  const handleStatusChange = (ticketId: string, status: TicketStatus) => {
    updateTicketStatus(ticketId, status);
    triggerToast(`Status do chamado #${ticketId} atualizado para "${STATUS_LABELS[status].label}".`);
    if (activeTicket && activeTicket.id === ticketId) {
      setActiveTicket((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleDeleteTicket = (ticket: SupportTicket) => {
    const confirmDelete = window.confirm(
      `Deseja realmente excluir permanentemente o chamado #${ticket.ticketNumber} da imobiliária "${ticket.agencyTradeName}"?`
    );
    if (confirmDelete) {
      deleteSupportTicket(ticket.id);
      triggerToast(`Chamado #${ticket.ticketNumber} excluído.`);
      if (activeTicket?.id === ticket.id) setActiveTicket(null);
    }
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

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">
            <Crown className="w-3.5 h-3.5 text-amber-700" />
            Central de Suporte Master
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            Recepção de Chamados & Solicitações de Reparo
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Chamados com numeração crescente, separados por ticket e por imobiliária (com ID e solicitante identificados).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            title="Alternar ordenação numérica dos tickets"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Numeração: {sortOrder === 'asc' ? 'Crescente (#1001 → #...)' : 'Mais Recente Primeiro'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block">Total Geral</span>
          <div className="text-2xl font-bold text-stone-900 mt-1 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-emerald-600" />
            <span>{totalTickets}</span>
          </div>
          <span className="text-[10px] text-stone-400">Em toda a rede</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-800 block">Abertos (Novos)</span>
          <div className="text-2xl font-bold text-amber-900 mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>{openTickets}</span>
          </div>
          <span className="text-[10px] text-amber-700">Aguardando resposta</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-800 block">Em Análise Técnica</span>
          <div className="text-2xl font-bold text-blue-900 mt-1 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span>{inAnalysisTickets}</span>
          </div>
          <span className="text-[10px] text-blue-700">Em investigação</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800 block">Respondidos</span>
          <div className="text-2xl font-bold text-emerald-900 mt-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>{repliedTickets}</span>
          </div>
          <span className="text-[10px] text-emerald-700">Aguardando imobiliária</span>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-stone-500 block">Resolvidos</span>
          <div className="text-2xl font-bold text-stone-800 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{resolvedTickets}</span>
          </div>
          <span className="text-[10px] text-stone-400">Falhas concluídas</span>
        </div>
      </div>

      {/* FILTER BAR: SEPARADOS POR TICKET E POR IMOBILIÁRIA (COM ID) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ticket (#1001), solicitante, falha ou ID da imobiliária..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-stone-50/50"
          />
        </div>

        {/* Agency Filter with explicit ID */}
        <div>
          <select
            value={selectedAgencyId}
            onChange={(e) => setSelectedAgencyId(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white font-semibold cursor-pointer"
          >
            <option value="all">🏢 Todas as Imobiliárias</option>
            {agencies.map((ag) => (
              <option key={ag.id} value={ag.id}>
                [ID: {ag.id}] {ag.tradeName || ag.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="aberto">Aberto</option>
            <option value="em_analise">Em Análise</option>
            <option value="respondido">Respondido</option>
            <option value="resolvido">Resolvido</option>
            <option value="fechado">Fechado</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-emerald-600 bg-white cursor-pointer"
          >
            <option value="all">Todas as Falhas</option>
            <option value="cadastro_imovel">Cadastro de Imóvel</option>
            <option value="simulador">Simulador</option>
            <option value="mapa_geolocalizado">Mapa</option>
            <option value="login_usuarios">Login / Senhas</option>
            <option value="agendamentos">Agendamentos</option>
            <option value="financeiro_planos">Planos</option>
            <option value="bug_layout">Layout</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      {/* TICKETS TABLE */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-4">Ticket #</th>
                <th className="py-3.5 px-4">Imobiliária & ID</th>
                <th className="py-3.5 px-4">Solicitante (Conversação)</th>
                <th className="py-3.5 px-4">Falha / Assunto</th>
                <th className="py-3.5 px-4">Prints Anexados</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Nenhum chamado encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const statusCfg = STATUS_LABELS[ticket.status];
                  const priorityCfg = PRIORITY_LABELS[ticket.priority];
                  const categoryCfg = CATEGORY_LABELS[ticket.category] || CATEGORY_LABELS.outro;
                  const agency = agencies.find((a) => a.id === ticket.agencyId);

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-stone-50/80 transition cursor-pointer"
                      onClick={() => setActiveTicket(ticket)}
                    >
                      {/* Ticket Number */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-1 rounded-lg">
                          #{ticket.ticketNumber}
                        </span>
                      </td>

                      {/* Agency ID & Trade Name */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{ticket.agencyTradeName}</span>
                          </div>
                          <div className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block border border-emerald-200">
                            ID: {ticket.agencyId}
                          </div>
                          <div className="text-[10px] text-stone-400">CRECI {ticket.agencyCreci}</div>
                        </div>
                      </td>

                      {/* Requester Info for Conversation */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-stone-900 flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{ticket.requesterName}</span>
                          </div>
                          <div className="font-mono text-[10px] text-stone-500 mt-0.5">
                            {ticket.requesterEmail}
                          </div>
                          {ticket.requesterPhone && (
                            <div className="text-[10px] text-stone-400 font-mono">
                              {ticket.requesterPhone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Title & Category */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-stone-900 truncate">{ticket.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-stone-500">{categoryCfg.label}</span>
                          <span>•</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border ${priorityCfg.badgeClass}`}>
                            {priorityCfg.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">{formatDateBR(ticket.createdAt)}</div>
                      </td>

                      {/* Attached Images */}
                      <td className="py-3.5 px-4">
                        {ticket.images.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-semibold text-emerald-800">
                              {ticket.images.length} foto(s)
                            </span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[10px]">Sem fotos</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${statusCfg.badgeClass}`}
                        >
                          <option value="aberto">Aberto</option>
                          <option value="em_analise">Em Análise</option>
                          <option value="respondido">Respondido</option>
                          <option value="resolvido">Resolvido</option>
                          <option value="fechado">Fechado</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveTicket(ticket)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Atender ({ticket.messages.length})</span>
                          </button>

                          <button
                            onClick={() => handleDeleteTicket(ticket)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Excluir Chamado"
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

      {/* MODAL: CHAT DE ATENDIMENTO MASTER DO TICKET */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full overflow-hidden animate-fade-in flex flex-col h-[85vh]">
            {/* Header */}
            <div className="bg-stone-950 text-white p-5 flex items-center justify-between shrink-0 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black text-amber-400 bg-stone-900 border border-amber-400/40 px-2.5 py-1 rounded-lg">
                  #{activeTicket.ticketNumber}
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">{activeTicket.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5 flex-wrap">
                    <span>
                      Imobiliária: <strong className="text-amber-400">{activeTicket.agencyTradeName}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono bg-stone-800 px-1 rounded text-stone-300">
                      ID: {activeTicket.agencyId}
                    </span>
                    <span>•</span>
                    <span>CRECI {activeTicket.agencyCreci}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={activeTicket.status}
                  onChange={(e) => handleStatusChange(activeTicket.id, e.target.value as TicketStatus)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                    STATUS_LABELS[activeTicket.status].badgeClass
                  }`}
                >
                  <option value="aberto">Aberto</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="respondido">Respondido</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="fechado">Fechado</option>
                </select>

                <button
                  onClick={() => setActiveTicket(null)}
                  className="text-stone-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Requester Contact Bar */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-stone-800 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span>
                  Solicitante para contato: <strong>{activeTicket.requesterName}</strong>
                </span>
                <span className="font-mono text-[11px] text-stone-600 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-stone-400" />
                  {activeTicket.requesterEmail}
                </span>
                {activeTicket.requesterPhone && (
                  <span className="font-mono text-[11px] text-stone-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" />
                    {activeTicket.requesterPhone}
                  </span>
                )}
              </div>

              <div className="text-[11px] text-stone-500 font-medium">
                Página Afetada: {activeTicket.siteSection || 'Geral'}
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-stone-50/60">
              {/* Initial Report Card */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-bold text-stone-800">
                    Relato Inicial da Imobiliária ({activeTicket.agencyTradeName})
                  </span>
                  <span>{formatDateBR(activeTicket.createdAt)}</span>
                </div>

                <p className="text-xs text-stone-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {activeTicket.description}
                </p>

                {/* Attached Images */}
                {activeTicket.images.length > 0 && (
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-semibold text-stone-500 block mb-1.5">
                      Prints / Fotos Carregadas pela Imobiliária para Análise Técnica:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeTicket.images.map((img, i) => (
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

              {/* Message Exchange */}
              {activeTicket.messages.map((msg) => {
                const isSuperAdmin = msg.senderRole === 'superadmin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSuperAdmin ? 'items-end' : 'items-start'}`}
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

            {/* Admin Reply Input */}
            <form onSubmit={handleSendAdminReply} className="p-4 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder={`Responder a ${activeTicket.requesterName} (${activeTicket.agencyTradeName})...`}
                className="flex-1 px-4 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Responder Chamado</span>
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
