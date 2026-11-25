import test from 'node:test';
import assert from 'node:assert/strict';
import { formatWhatsAppMessage, buildWhatsAppUrl, WhatsAppOrderPayload } from './whatsapp';

test('formatWhatsAppMessage formats delivery order according to King Pizzaria specification', () => {
  const payload: WhatsAppOrderPayload = {
    customer: {
      name: 'Arthur Real',
      phone: '(85) 99999-8888',
    },
    deliveryType: 'delivery',
    address: {
      cep: '60000-000',
      street: 'Rua das Oliveiras',
      number: '123',
      neighborhood: 'Aldeota',
      complement: 'Apto 402',
      reference: 'Próximo à praça',
    },
    paymentMethod: 'cash',
    cashChangeFor: 100.0,
    items: [
      {
        id: '1',
        name: 'Pizza Grande',
        image: '',
        unitPrice: 65.0,
        quantity: 1,
        totalPrice: 65.0,
        customization: {
          size: {
            id: 'grande',
            name: 'Grande (8 Fatias)',
            slices: 8,
            maxFlavors: 2,
            basePriceMultiplier: 1.0,
            description: '',
          },
          flavors: [
            {
              id: 'calabresa',
              name: 'Calabresa Real',
              category: 'tradicional',
              description: '',
              ingredients: [],
              priceGrande: 45,
              available: true,
            },
            {
              id: 'camarao',
              name: 'Camarão Real ao Catupiry',
              category: 'especial',
              description: '',
              ingredients: [],
              priceGrande: 75,
              available: true,
            },
          ],
          isHalfAndHalf: true,
          crust: {
            id: 'catupiry',
            name: 'Borda Vulcão de Catupiry',
            price: 12,
            available: true,
          },
          extras: [
            {
              id: 'bacon',
              name: 'Bacon Crocante',
              price: 6,
              available: true,
            },
          ],
          notes: 'Massa fina e bem assada',
        },
      },
    ],
    subtotal: 65.0,
    deliveryFee: 8.0,
    total: 73.0,
  };

  const message = formatWhatsAppMessage(payload);

  assert.ok(message.includes('🍕👑 NOVO PEDIDO - KING PIZZARIA 👑🍕'));
  assert.ok(message.includes('Nome: Arthur Real'));
  assert.ok(message.includes('Telefone: (85) 99999-8888'));
  assert.ok(message.includes('MODALIDADE\nEntrega (Delivery)'));
  assert.ok(message.includes('Rua das Oliveiras, Nº 123 - Aldeota (Apto 402) - CEP: 60000-000'));
  assert.ok(message.includes('Ponto de Referência: Próximo à praça'));
  assert.ok(message.includes('1x Pizza Grande'));
  assert.ok(message.includes('Tamanho: Grande (8 Fatias)'));
  assert.ok(message.includes('Sabores: Calabresa Real / Camarão Real ao Catupiry'));
  assert.ok(message.includes('Borda: Borda Vulcão de Catupiry'));
  assert.ok(message.includes('Adicionais: Bacon Crocante'));
  assert.ok(message.includes('Observações: Massa fina e bem assada'));
  assert.ok(message.includes('Subtotal: R$ 65,00'));
  assert.ok(message.includes('Taxa de entrega: R$ 8,00'));
  assert.ok(message.includes('TOTAL: R$ 73,00'));
  assert.ok(message.includes('Pagamento: Dinheiro'));
  assert.ok(message.includes('Troco: Sim, para R$ 100,00 (Troco de R$ 27,00)'));
  assert.ok(message.includes('👑 Obrigado por escolher a King Pizzaria!'));
});

test('buildWhatsAppUrl properly formats and encodes the wa.me url', () => {
  const url = buildWhatsAppUrl('5585985280354', 'Olá Rei!');
  assert.equal(url, 'https://wa.me/5585985280354?text=Ol%C3%A1%20Rei!');
});
