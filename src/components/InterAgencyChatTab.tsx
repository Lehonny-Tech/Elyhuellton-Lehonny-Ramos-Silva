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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Agency, AgencyChatMessage } from '../types';
import { formatDateBR } from '../utils/formatters';

interface InterAgencyChatTabProps {
  currentAgency: Agency;
}

export const InterAgencyChatTab: React.FC<InterAgencyChatTabProps> = ({ currentAgency }) => {
  const { agencyChatMessages, sendAgencyChatMessage, agencies, currentUser } = useApp();

  const [activeChannelId, setActiveChannelId] = useState<string>('rede-geral');
  const [messageText, setMessageText] = useState('');
  const [searchAgency, setSearchAgency] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [agencyChatMessages, activeChannelId]);

  // Other partner agencies
  const partnerAgencies = agencies.filter((a) => a.id !== currentAgency.id);

  // Find partner agency for 1-on-1 chat if applicable
  const activePartnerAgency = partnerAgencies.find((a) => {
    const pairId1 = `${currentAgency.id}_${a.id}`;
    const pairId2 = `${a.id}_${currentAgency.id}`;
    return activeChannelId === pairId1 || activeChannelId === pairId2;
  });

  // Filter messages for active channel
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

  const handleQuickTopic = (topicText: string) => {
    setMessageText(topicText);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-1">
            <Handshake className="w-3.5 h-3.5 text-emerald-700" />
            Rede B2B Inter-Imobiliárias
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            Chat & Parcerias entre Imobiliárias
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Canal de comunicação direta para corretores e gestores fecharem negócios em parceria, permutas e clientes regionais.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl text-xs">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <div>
            <div className="text-[10px] text-stone-400 font-semibold">Falando como:</div>
            <div className="font-bold text-stone-900">{currentAgency.tradeName} (CRECI {currentAgency.creci})</div>
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-4 h-[650px]">
        {/* Sidebar Channels & Partner Agencies */}
        <div className="border-r border-stone-200 bg-stone-50/70 p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Canais de Comunicação
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

          {/* List of other agencies */}
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
                      Bate-papo aberto entre corretores e gestores de todas as cidades parceiras
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
                      Conversa com {activePartnerAgency?.tradeName}
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
              Sugestões Rápidas:
            </span>
            <button
              type="button"
              onClick={() => handleQuickTopic('Temos um cliente investidor buscando imóveis comerciais para locação garantida.')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 rounded-lg text-[11px] whitespace-nowrap transition cursor-pointer"
            >
              💼 Cliente Investidor
            </button>
            <button
              type="button"
              onClick={() => handleQuickTopic('Aceitamos parceria 50/50 de comissão para fechamento rápido deste imóvel.')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 rounded-lg text-[11px] whitespace-nowrap transition cursor-pointer"
            >
              🤝 Parceria 50/50
            </button>
            <button
              type="button"
              onClick={() => handleQuickTopic('Cliente com carta de crédito consórcio/financiamento Caixa aprovada para uso imediato.')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 rounded-lg text-[11px] whitespace-nowrap transition cursor-pointer"
            >
              🏦 Financiamento Aprovado
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {channelMessages.length === 0 ? (
              <div className="text-center py-16 text-stone-400 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-xs font-semibold">Nenhuma mensagem neste canal ainda.</p>
                <p className="text-[11px]">Envie uma mensagem abaixo para iniciar a conversa entre imobiliárias!</p>
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
              placeholder={`Escreva uma mensagem para ${
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
    </div>
  );
};
