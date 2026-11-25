import { CartItem, CustomerAddress, CustomerData, DeliveryType, PaymentMethod } from '../types';

export interface WhatsAppOrderPayload {
  customer: CustomerData;
  deliveryType: DeliveryType;
  address?: CustomerAddress;
  paymentMethod: PaymentMethod;
  cashChangeFor?: number;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export function formatWhatsAppMessage(order: WhatsAppOrderPayload): string {
  const lines: string[] = [];

  lines.push('🍕👑 NOVO PEDIDO - KING PIZZARIA 👑🍕');
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('DADOS DO CLIENTE');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`Nome: ${order.customer.name.trim()}`);
  lines.push(`Telefone: ${order.customer.phone.trim()}`);
  lines.push('');
  lines.push('MODALIDADE');
  lines.push(order.deliveryType === 'delivery' ? 'Entrega (Delivery)' : 'Retirada no Balcão');
  lines.push('');

  if (order.deliveryType === 'delivery' && order.address) {
    lines.push('ENDEREÇO');
    const addr = order.address;
    let fullAddr = `${addr.street.trim()}, Nº ${addr.number.trim()} - ${addr.neighborhood.trim()}`;
    if (addr.complement?.trim()) {
      fullAddr += ` (${addr.complement.trim()})`;
    }
    if (addr.cep?.trim()) {
      fullAddr += ` - CEP: ${addr.cep.trim()}`;
    }
    lines.push(fullAddr);
    if (addr.reference?.trim()) {
      lines.push(`Ponto de Referência: ${addr.reference.trim()}`);
    }
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('ITENS DO PEDIDO');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('');

  order.items.forEach((item, index) => {
    lines.push(`${item.quantity}x ${item.name}`);

    if (item.customization) {
      const c = item.customization;
      lines.push(`Tamanho: ${c.size.name}`);

      const flavorNames = c.flavors.map((f) => f.name).join(' / ');
      lines.push(`Sabores: ${flavorNames}`);

      const bordaText = c.crust ? c.crust.name : 'Tradicional (Sem borda recheada)';
      lines.push(`Borda: ${bordaText}`);

      const extrasText = c.extras && c.extras.length > 0 
        ? c.extras.map((e) => e.name).join(', ')
        : 'Nenhum';
      lines.push(`Adicionais: ${extrasText}`);

      const obsText = c.notes?.trim() || item.notes?.trim() || 'Nenhuma';
      lines.push(`Observações: ${obsText}`);
    } else {
      const obsText = item.notes?.trim() || 'Nenhuma';
      lines.push(`Observações: ${obsText}`);
    }

    lines.push(`Valor: R$ ${item.totalPrice.toFixed(2).replace('.', ',')}`);

    if (index < order.items.length - 1) {
      lines.push('----------------');
    }
  });

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('RESUMO FINANCEIRO');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`Subtotal: R$ ${order.subtotal.toFixed(2).replace('.', ',')}`);
  lines.push(`Taxa de entrega: R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}`);
  lines.push(`TOTAL: R$ ${order.total.toFixed(2).replace('.', ',')}`);
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('FORMA DE PAGAMENTO');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('');

  let paymentText = '';
  switch (order.paymentMethod) {
    case 'pix':
      paymentText = 'PIX';
      break;
    case 'cash':
      paymentText = 'Dinheiro';
      break;
    case 'credit':
      paymentText = 'Cartão de Crédito';
      break;
    case 'debit':
      paymentText = 'Cartão de Débito';
      break;
  }
  lines.push(`Pagamento: ${paymentText}`);

  if (order.paymentMethod === 'cash') {
    if (order.cashChangeFor && order.cashChangeFor > order.total) {
      const troco = order.cashChangeFor - order.total;
      lines.push(`Troco: Sim, para R$ ${order.cashChangeFor.toFixed(2).replace('.', ',')} (Troco de R$ ${troco.toFixed(2).replace('.', ',')})`);
    } else {
      lines.push('Troco: Não precisa de troco');
    }
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('👑 Obrigado por escolher a King Pizzaria!');

  return lines.join('\n');
}

/**
 * Builds the official WhatsApp redirect URL.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  // Clean phone number: remove non-digits
  const cleanPhone = phone.replace(/\D/g, '') || '5585985280354';
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
