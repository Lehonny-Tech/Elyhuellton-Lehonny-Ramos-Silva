export const formatCurrency = (val?: number): string => {
  if (val === undefined || val === null) return 'Sob consulta';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val);
};

export const formatNumber = (val?: number): string => {
  if (val === undefined || val === null) return '0';
  return new Intl.NumberFormat('pt-BR').format(val);
};

export const createWhatsAppLink = (
  phone: string,
  propertyTitle: string,
  propertyCode: string,
  priceText: string
): string => {
  // Clean phone number
  const cleanPhone = phone.replace(/\D/g, '');
  const number = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const text = encodeURIComponent(
    `Olá! Tenho interesse no imóvel *${propertyTitle}* (Cód: ${propertyCode}) anunciado por ${priceText}. Gostaria de mais informações e verificar disponibilidade para visita!`
  );
  return `https://wa.me/${number}?text=${text}`;
};

export const createFinancingWhatsAppLink = (
  phone: string,
  propertyTitle: string,
  propertyCode: string,
  salePrice: number,
  downPayment: number,
  termYears: number,
  monthlyInstallment: number,
  system: string
): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  const number = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const text = encodeURIComponent(
    `Olá! Fiz uma simulação de financiamento para o imóvel *${propertyTitle}* (Cód: ${propertyCode}):\n` +
    `• Valor do Imóvel: ${formatCurrency(salePrice)}\n` +
    `• Entrada: ${formatCurrency(downPayment)}\n` +
    `• Prazo: ${termYears} anos (${termYears * 12} meses) - Tabela ${system}\n` +
    `• Parcela estimada: ${formatCurrency(monthlyInstallment)}/mês\n` +
    `Gostaria de falar com um consultor para simular com meu perfil de crédito e verificar condições bancárias!`
  );
  return `https://wa.me/${number}?text=${text}`;
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};
