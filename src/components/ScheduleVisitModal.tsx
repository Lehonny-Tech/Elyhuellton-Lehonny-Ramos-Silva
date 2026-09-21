import React, { useState } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Mail,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Property, VisitAppointment } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateBR, createWhatsAppLink } from '../utils/formatters';
import { hasFeature } from '../utils/planPermissions';

interface ScheduleVisitModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_TIME_SLOTS = [
  '09:00',
  '10:30',
  '11:30',
  '13:30',
  '14:00',
  '15:30',
  '16:30',
  '18:00',
];

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const { bookVisit, getVisitsForPropertyAndDate, getAgencyById, currentUser } = useApp();

  // Next 7 days default
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Tomorrow or today
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>(currentUser?.name || '');
  const [clientEmail, setClientEmail] = useState<string>(currentUser?.email || '');
  const [clientPhone, setClientPhone] = useState<string>(currentUser?.phone || '(11) 9');
  const [notes, setNotes] = useState<string>('');

  const [confirmedAppointment, setConfirmedAppointment] = useState<VisitAppointment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen || !property) return null;

  const agency = getAgencyById(property.agencyId);
  const occupiedVisits = getVisitsForPropertyAndDate(property.id, selectedDate);
  const occupiedSlots = occupiedVisits.map((v) => v.timeSlot);

  // Quick date options for the next 5 days
  const quickDates = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const iso = d.toISOString().split('T')[0];
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayMonth = `${d.getDate()}/${d.getMonth() + 1}`;
    return { iso, label: `${weekday.toUpperCase()} (${dayMonth})` };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedTime) {
      setErrorMessage('Por favor, selecione um dos horários disponíveis.');
      return;
    }

    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setErrorMessage('Por favor, preencha nome, e-mail e telefone para confirmar o agendamento.');
      return;
    }

    const result = bookVisit({
      propertyId: property.id,
      agencyId: property.agencyId,
      clientName,
      clientEmail,
      clientPhone,
      date: selectedDate,
      timeSlot: selectedTime,
      notes,
    });

    if (result.success && result.appointment) {
      setConfirmedAppointment(result.appointment);
    } else {
      setErrorMessage(result.error || 'Não foi possível agendar este horário.');
    }
  };

  const handleReset = () => {
    setConfirmedAppointment(null);
    setSelectedTime('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Agendamento de Visita Online</h2>
              <p className="text-xs text-stone-400">
                Escolha a melhor data e horário com confirmação imediata
              </p>
            </div>
          </div>
          <button
            id="close-schedule-modal"
            onClick={handleReset}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* If agency does not have online scheduling in plan (e.g. Plano Essencial) */}
          {agency && !hasFeature(agency, 'scheduling') ? (
            <div className="text-center py-6 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <Building className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900 font-serif">
                  Agende sua Visita com a {agency.tradeName || agency.name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md mx-auto">
                  Esta imobiliária oferece atendimento exclusivo e personalizado para agendamento direto de visitas com seus corretores credenciados.
                </p>
              </div>

              {/* Property summary */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Imóvel:</span>
                  <span className="font-semibold text-stone-900 truncate max-w-[240px]">
                    {property.title}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Código:</span>
                  <span className="font-mono text-stone-800">{property.code}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Localização:</span>
                  <span className="text-stone-800">{property.location.neighborhood}, {property.location.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">CRECI da Imobiliária:</span>
                  <span className="font-mono font-semibold text-emerald-700">{agency.creci}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                {agency.whatsapp && (
                  <a
                    href={`https://wa.me/${agency.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá! Gostaria de agendar uma visita para conhecer o imóvel "${property.title}" (Cód: ${property.code}) anunciado no portal ImobiRede.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Falar no WhatsApp</span>
                  </a>
                )}

                {agency.phone && (
                  <a
                    href={`tel:${agency.phone.replace(/\D/g, '')}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs sm:text-sm font-semibold border border-stone-300 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Ligar: {agency.phone}</span>
                  </a>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  Voltar para o anúncio do imóvel
                </button>
              </div>
            </div>
          ) : confirmedAppointment ? (
            <div className="text-center py-6 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">Visita Agendada com Sucesso!</h3>
                <p className="text-sm text-stone-600 mt-1">
                  Seu horário foi reservado exclusivamente com a imobiliária{' '}
                  <span className="font-semibold text-stone-900">{agency?.name}</span>.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-left text-sm space-y-2 max-w-md mx-auto">
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Imóvel:</span>
                  <span className="font-medium text-stone-900 truncate max-w-[240px]">
                    {property.title}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Data e Horário:</span>
                  <span className="font-bold text-emerald-700">
                    {formatDateBR(confirmedAppointment.date)} às {confirmedAppointment.timeSlot}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Cliente:</span>
                  <span className="font-medium text-stone-900">{confirmedAppointment.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Telefone / WhatsApp:</span>
                  <span className="font-medium text-stone-900">{confirmedAppointment.clientPhone}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                {agency?.whatsapp && (
                  <a
                    href={`https://wa.me/${agency.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá! Acabei de agendar uma visita online para o imóvel ${property.title} (Cód: ${property.code}) no dia ${formatDateBR(confirmedAppointment.date)} às ${confirmedAppointment.timeSlot}. Meu nome é ${confirmedAppointment.clientName}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Avisar Imobiliária no WhatsApp
                  </a>
                )}
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mini Property Summary */}
              <div className="flex items-center gap-3.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-16 h-14 object-cover rounded-lg shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-stone-900 truncate">
                    {property.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate">
                    {property.location.neighborhood}, {property.location.city} • Cód: {property.code}
                  </p>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">
                    {property.rentPrice
                      ? `Aluguel: ${formatCurrency(property.rentPrice)}/mês`
                      : `Venda: ${formatCurrency(property.salePrice)}`}
                  </div>
                </div>
              </div>

              {/* Step 1: Select Date */}
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  1. Selecione a Data da Visita
                </label>

                {/* Quick Date Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2.5">
                  {quickDates.map((d) => (
                    <button
                      key={d.iso}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d.iso);
                        setSelectedTime('');
                      }}
                      className={`py-2 px-1.5 text-center rounded-lg text-xs font-medium border transition cursor-pointer ${
                        selectedDate === d.iso
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">Ou escolha outra data:</span>
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    className="text-xs border border-stone-300 rounded-md px-2.5 py-1 text-stone-700 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Step 2: Time Slots with occupied status clearly evidenced */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    2. Escolha o Horário (Status em Tempo Real)
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Data: <strong className="text-stone-800">{formatDateBR(selectedDate)}</strong>
                  </span>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-[11px] mb-3 bg-stone-100 px-3 py-1.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Disponível para agendar
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-700 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Horário Já Preenchido (Ocupado)
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEFAULT_TIME_SLOTS.map((time) => {
                    const isOccupied = occupiedSlots.includes(time);
                    const isSelected = selectedTime === time;

                    if (isOccupied) {
                      return (
                        <div
                          key={time}
                          className="relative p-2.5 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-900 cursor-not-allowed opacity-80 select-none"
                          title="Este horário já foi preenchido por outro visitante"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm line-through text-rose-700">{time}</span>
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                          </div>
                          <span className="text-[10px] font-semibold text-rose-600 block mt-0.5">
                            Ocupado
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{time}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-semibold mt-0.5 ${
                            isSelected ? 'text-emerald-100' : 'text-emerald-700'
                          }`}
                        >
                          Disponível
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Client Information */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  3. Seus Dados de Contato
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mariana Silveira"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 99888-7766"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    E-mail para Confirmação *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@exemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Observações ou Dúvidas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Gostaria de saber se aceita pet ou se tem sol da manhã..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none"
                  />
                </div>
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-schedule-visit-btn"
                  disabled={!selectedTime}
                  className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer ${
                    selectedTime
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedTime
                    ? `Confirmar Agendamento para ${selectedTime}`
                    : 'Selecione um horário disponível acima'}
                </button>
                <p className="text-[11px] text-center text-stone-400 mt-2">
                  Não cobramos nenhuma taxa para agendamento de visitas presenciais.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
