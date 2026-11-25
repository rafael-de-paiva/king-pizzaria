import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePizzaPrice, calculateCartTotals, isStoreOpen } from './pricing';
import { PizzaSize, PizzaFlavor, PizzaCrust, PizzaExtra, StoreSettings, CartItem } from '../types';

const mockSizeGrande: PizzaSize = {
  id: 'grande',
  name: 'Grande (8 Fatias)',
  slices: 8,
  maxFlavors: 2,
  basePriceMultiplier: 1.0,
  description: 'Até 2 sabores',
};

const mockSizeBroto: PizzaSize = {
  id: 'broto',
  name: 'Broto (4 Fatias)',
  slices: 4,
  maxFlavors: 1,
  basePriceMultiplier: 0.65,
  description: '1 sabor',
};

const flavorCalabresa: PizzaFlavor = {
  id: 'calabresa',
  name: 'Calabresa Real',
  category: 'tradicional',
  description: 'Mussarela, calabresa e cebola',
  ingredients: ['mussarela', 'calabresa', 'cebola'],
  priceGrande: 45.0,
  available: true,
};

const flavorCamarao: PizzaFlavor = {
  id: 'camarao',
  name: 'Camarão Real ao Catupiry',
  category: 'especial',
  description: 'Camarão e catupiry legítimo',
  ingredients: ['camarão', 'catupiry'],
  priceGrande: 75.0,
  available: true,
};

const crustCatupiry: PizzaCrust = {
  id: 'borda-catupiry',
  name: 'Borda de Catupiry Original',
  price: 12.0,
  available: true,
};

const extraBacon: PizzaExtra = {
  id: 'extra-bacon',
  name: 'Bacon Crocante',
  price: 6.0,
  available: true,
};

test('calculatePizzaPrice with 1 flavor and no crust/extras', () => {
  const price = calculatePizzaPrice(mockSizeGrande, [flavorCalabresa]);
  assert.equal(price, 45.0);
});

test('calculatePizzaPrice with 2 flavors and highest_price rule', () => {
  const price = calculatePizzaPrice(
    mockSizeGrande,
    [flavorCalabresa, flavorCamarao],
    'highest_price'
  );
  assert.equal(price, 75.0);
});

test('calculatePizzaPrice with 2 flavors and average rule', () => {
  const price = calculatePizzaPrice(
    mockSizeGrande,
    [flavorCalabresa, flavorCamarao],
    'average'
  );
  // (45 + 75) / 2 = 60
  assert.equal(price, 60.0);
});

test('calculatePizzaPrice with crust, extra, and size multiplier', () => {
  // Broto (0.65) * 45 = 29.25 + 12 (crust) + 6 (bacon) = 47.25
  const price = calculatePizzaPrice(
    mockSizeBroto,
    [flavorCalabresa],
    'highest_price',
    crustCatupiry,
    [extraBacon]
  );
  assert.equal(price, 47.25);
});

test('calculateCartTotals applies fixed fee for delivery and 0 for pickup', () => {
  const items: CartItem[] = [
    {
      id: 'item-1',
      name: 'Pizza Grande',
      image: '',
      unitPrice: 50.0,
      quantity: 2,
      totalPrice: 100.0,
    },
    {
      id: 'item-2',
      name: 'Coca-Cola 2L',
      image: '',
      unitPrice: 14.0,
      quantity: 1,
      totalPrice: 14.0,
    },
  ];

  const deliveryResult = calculateCartTotals(items, 'delivery', 8.5);
  assert.equal(deliveryResult.subtotal, 114.0);
  assert.equal(deliveryResult.deliveryFee, 8.5);
  assert.equal(deliveryResult.total, 122.5);

  const pickupResult = calculateCartTotals(items, 'pickup', 8.5);
  assert.equal(pickupResult.subtotal, 114.0);
  assert.equal(pickupResult.deliveryFee, 0);
  assert.equal(pickupResult.total, 114.0);
});

test('isStoreOpen handles manual overrides and hourly range', () => {
  const baseSettings: StoreSettings = {
    storeName: 'King Pizzaria',
    slogan: 'O sabor que merece uma coroa!',
    whatsappNumber: '5585985280354',
    deliveryFee: 8.0,
    halfHalfRule: 'highest_price',
    pixKey: '85985280354',
    pixKeyType: 'telefone',
    pixBeneficiary: 'King Pizzaria',
    address: 'Av dos Reis',
    openingHours: {
      days: 'Terça a Domingo',
      openTime: '18:00',
      closeTime: '23:30',
    },
    manualStatusOverride: 'open',
    estimatedDeliveryTime: '40 min',
    estimatedPickupTime: '25 min',
    adminPassword: '123',
  };

  const forcedOpen = isStoreOpen(baseSettings);
  assert.equal(forcedOpen.isOpen, true);

  const forcedClosed = isStoreOpen({ ...baseSettings, manualStatusOverride: 'closed' });
  assert.equal(forcedClosed.isOpen, false);

  // Auto mode with time inside range (20:00)
  const autoSettings: StoreSettings = { ...baseSettings, manualStatusOverride: 'auto' };
  const dateDuringOpen = new Date('2026-10-30T20:00:00');
  const autoOpen = isStoreOpen(autoSettings, dateDuringOpen);
  assert.equal(autoOpen.isOpen, true);

  // Auto mode outside range (15:00)
  const dateDuringClosed = new Date('2026-10-30T15:00:00');
  const autoClosed = isStoreOpen(autoSettings, dateDuringClosed);
  assert.equal(autoClosed.isOpen, false);
});
