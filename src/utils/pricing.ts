import type { CartItem, DeliveryType, PizzaCrust, PizzaExtra, PizzaFlavor, PizzaSize, StoreSettings } from '../types/index.ts';

/**
 * Calculates the total unit price for a customized pizza.
 */
export function calculatePizzaPrice(
  size: PizzaSize,
  flavors: PizzaFlavor[],
  halfHalfRule: 'highest_price' | 'average' = 'highest_price',
  crust?: PizzaCrust,
  extras: PizzaExtra[] = []
): number {
  if (!flavors || flavors.length === 0) {
    return 0;
  }

  let basePriceGrande: number;

  if (flavors.length === 1) {
    basePriceGrande = flavors[0].priceGrande;
  } else {
    // 2 flavors (Half and Half)
    const prices = flavors.map((f) => f.priceGrande);
    if (halfHalfRule === 'highest_price') {
      basePriceGrande = Math.max(...prices);
    } else {
      const sum = prices.reduce((acc, curr) => acc + curr, 0);
      basePriceGrande = sum / prices.length;
    }
  }

  // Adjust for size
  let basePizzaCost = basePriceGrande * size.basePriceMultiplier;

  // Add stuffed crust if selected
  const crustCost = crust ? crust.price : 0;

  // Add extra ingredients
  const extrasCost = extras.reduce((acc, extra) => acc + (extra.price || 0), 0);

  const total = basePizzaCost + crustCost + extrasCost;
  return Math.round(total * 100) / 100;
}

/**
 * Calculates cart subtotal, delivery fee and grand total.
 */
export function calculateCartTotals(
  items: CartItem[],
  deliveryType: DeliveryType,
  fixedDeliveryFee: number
): { subtotal: number; deliveryFee: number; total: number } {
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  const deliveryFee = deliveryType === 'delivery' ? Math.max(0, fixedDeliveryFee) : 0;
  const total = subtotal + deliveryFee;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Formats a number to Brazilian Real (R$ XX,XX).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Checks if the store is currently open based on settings and time.
 */
export function isStoreOpen(settings: StoreSettings, customDate?: Date): { isOpen: boolean; statusText: string } {
  if (settings.manualStatusOverride === 'open') {
    return { isOpen: true, statusText: 'Aberto agora (Atendimento ativo)' };
  }
  if (settings.manualStatusOverride === 'closed') {
    return { isOpen: false, statusText: 'Fechado no momento' };
  }

  const now = customDate || new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMin] = settings.openingHours.openTime.split(':').map(Number);
  const [closeHour, closeMin] = settings.openingHours.closeTime.split(':').map(Number);

  const openMinutes = openHour * 60 + (openMin || 0);
  let closeMinutes = closeHour * 60 + (closeMin || 0);

  // If closing past midnight (e.g. opens 18:00, closes 01:00)
  if (closeMinutes < openMinutes) {
    // Overnight shift
    if (currentMinutes >= openMinutes || currentMinutes <= closeMinutes) {
      return { isOpen: true, statusText: `Aberto até ${settings.openingHours.closeTime}` };
    }
  } else {
    // Same day shift
    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return { isOpen: true, statusText: `Aberto até ${settings.openingHours.closeTime}` };
    }
  }

  return { 
    isOpen: false, 
    statusText: `Fechado • Abre às ${settings.openingHours.openTime}` 
  };
}
