export type ProductCategory = string;

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  icon: string;
  description: string;
}

export interface PizzaSize {
  id: string;
  name: string;
  slices: number;
  maxFlavors: number;
  basePriceMultiplier: number; // e.g. 1.0 for grande, 0.8 for media, 0.6 for broto, 1.25 for gigante
  description: string;
  defaultPrice?: number;
}

export interface PizzaFlavor {
  id: string;
  name: string;
  category: 'tradicional' | 'especial' | 'premium' | 'doce';
  description: string;
  ingredients: string[];
  priceGrande: number; // reference price for large size
  available: boolean;
  image?: string;
}

export interface PizzaCrust {
  id: string;
  name: string;
  price: number;
  available: boolean;
  description?: string;
}

export interface PizzaExtra {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  category: ProductCategory;
  image: string;
  available: boolean;
  isFeatured?: boolean;
  badge?: string; // e.g. "Mais Vendido", "Promoção do Rei"
  isPizza?: boolean;
}

export interface CartCustomization {
  size: PizzaSize;
  flavors: PizzaFlavor[];
  isHalfAndHalf: boolean;
  crust?: PizzaCrust;
  extras: PizzaExtra[];
  notes?: string;
}

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  customization?: CartCustomization;
  notes?: string;
}

export type DeliveryType = 'delivery' | 'pickup';

export type PaymentMethod = 'pix' | 'cash' | 'credit' | 'debit';

export interface CustomerAddress {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  reference?: string;
}

export interface CustomerData {
  name: string;
  phone: string;
}

export type OrderStatus = 'recebido' | 'preparando' | 'saiu_entrega' | 'finalizado' | 'cancelado';

export interface Order {
  id: string;
  orderNumber: number;
  customer: CustomerData;
  deliveryType: DeliveryType;
  address?: CustomerAddress;
  paymentMethod: PaymentMethod;
  cashChangeFor?: number;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  slogan: string;
  whatsappNumber: string; // e.g. "5585985280354"
  deliveryFee: number; // e.g. 8.00
  halfHalfRule: 'highest_price' | 'average';
  pixKey: string;
  pixKeyType: 'telefone' | 'cpf' | 'cnpj' | 'email' | 'aleatoria';
  pixBeneficiary: string;
  address: string;
  openingHours: {
    days: string;
    openTime: string; // "18:00"
    closeTime: string; // "23:45"
  };
  manualStatusOverride: 'auto' | 'open' | 'closed';
  estimatedDeliveryTime: string; // "35 - 50 min"
  estimatedPickupTime: string; // "20 - 30 min"
  adminPassword?: string;
  instagram?: string;
  flyerImage?: string;
}
