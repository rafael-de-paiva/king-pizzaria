import type {
  CartItem,
  CategoryInfo,
  Order,
  OrderStatus,
  PizzaCrust,
  PizzaExtra,
  PizzaFlavor,
  PizzaSize,
  Product,
  StoreSettings,
} from '../types';

const CART_SESSION_KEY = 'king_pizzaria_cart_session_id';
let memoryCartId: string | null = null;

function getCartId(): string {
  if (memoryCartId) return memoryCartId;
  try {
    const existing = localStorage.getItem(CART_SESSION_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
      memoryCartId = existing;
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CART_SESSION_KEY, generated);
    memoryCartId = generated;
    return generated;
  } catch {
    memoryCartId = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    return memoryCartId;
  }
}

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('X-Cart-Id', getCartId());
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Erro na requisição (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export interface StoreBootstrapResponse {
  products: Product[];
  categories: CategoryInfo[];
  sizes: PizzaSize[];
  flavors: PizzaFlavor[];
  crusts: PizzaCrust[];
  extras: PizzaExtra[];
  settings: StoreSettings;
}

export interface AdminAuthStatus {
  configured: boolean;
  requiresSetup: boolean;
}

export const api = {
  // Storefront
  fetchStore: () => requestJson<StoreBootstrapResponse>('/api/store'),

  // Cart
  fetchCart: () => requestJson<{ items: CartItem[] }>('/api/cart'),
  addCartItem: (item: CartItem) =>
    requestJson<{ items: CartItem[] }>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  updateCartItemQuantity: (id: string, quantity: number) =>
    requestJson<{ items: CartItem[] }>(`/api/cart/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (id: string) =>
    requestJson<{ items: CartItem[] }>(`/api/cart/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  clearCart: () =>
    requestJson<{ items: CartItem[] }>('/api/cart', {
      method: 'DELETE',
    }),

  // Orders
  placeOrder: (payload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>) =>
    requestJson<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin auth
  getAdminAuthStatus: () => requestJson<AdminAuthStatus>('/api/admin/auth-status'),
  setupAdmin: (password: string) =>
    requestJson<{ token: string }>('/api/admin/setup', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  loginAdmin: (password: string) =>
    requestJson<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  logoutAdmin: (token: string) =>
    requestJson<{ ok: boolean }>('/api/admin/logout', { method: 'POST' }, token),

  // Admin protected CRUD
  fetchAdminOrders: (token: string) =>
    requestJson<{ orders: Order[] }>('/api/admin/orders', {}, token),
  updateOrderStatus: (token: string, orderId: string, status: OrderStatus) =>
    requestJson<{ order: Order }>(
      `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token
    ),

  saveCategory: (token: string, id: string, name: string) =>
    requestJson<{ category: CategoryInfo }>(
      id ? `/api/admin/categories/${encodeURIComponent(id)}` : '/api/admin/categories',
      { method: id ? 'PUT' : 'POST', body: JSON.stringify({ name }) }, token
    ),
  deleteCategory: (token: string, id: string) =>
    requestJson<{ ok: boolean }>(
      `/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }, token
    ),

  createProduct: (token: string, product: Omit<Product, 'id'>) =>
    requestJson<{ product: Product }>(
      '/api/admin/products',
      { method: 'POST', body: JSON.stringify(product) },
      token
    ),
  updateProduct: (token: string, id: string, product: Partial<Product>) =>
    requestJson<{ product: Product }>(
      `/api/admin/products/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(product) },
      token
    ),
  toggleProduct: (token: string, id: string) =>
    requestJson<{ product: Product }>(
      `/api/admin/products/${encodeURIComponent(id)}/toggle`,
      { method: 'PATCH' },
      token
    ),
  deleteProduct: (token: string, id: string) =>
    requestJson<{ ok: boolean }>(
      `/api/admin/products/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    ),

  createFlavor: (token: string, flavor: Omit<PizzaFlavor, 'id'>) =>
    requestJson<{ flavor: PizzaFlavor }>(
      '/api/admin/flavors',
      { method: 'POST', body: JSON.stringify(flavor) },
      token
    ),
  updateFlavor: (token: string, id: string, flavor: Partial<PizzaFlavor>) =>
    requestJson<{ flavor: PizzaFlavor }>(
      `/api/admin/flavors/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(flavor) },
      token
    ),
  deleteFlavor: (token: string, id: string) =>
    requestJson<{ ok: boolean }>(
      `/api/admin/flavors/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    ),

  createSize: (token: string, size: Omit<PizzaSize, 'id'>) =>
    requestJson<{ size: PizzaSize }>(
      '/api/admin/sizes',
      { method: 'POST', body: JSON.stringify(size) },
      token
    ),
  updateSize: (token: string, id: string, size: Partial<PizzaSize>) =>
    requestJson<{ size: PizzaSize }>(
      `/api/admin/sizes/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(size) },
      token
    ),
  deleteSize: (token: string, id: string) =>
    requestJson<{ ok: boolean }>(
      `/api/admin/sizes/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    ),

  createCrust: (token: string, crust: Omit<PizzaCrust, 'id'>) =>
    requestJson<{ crust: PizzaCrust }>(
      '/api/admin/crusts',
      { method: 'POST', body: JSON.stringify(crust) },
      token
    ),
  updateCrust: (token: string, id: string, crust: Partial<PizzaCrust>) =>
    requestJson<{ crust: PizzaCrust }>(
      `/api/admin/crusts/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(crust) },
      token
    ),
  deleteCrust: (token: string, id: string) =>
    requestJson<{ ok: boolean }>(
      `/api/admin/crusts/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    ),

  createExtra: (token: string, extra: Omit<PizzaExtra, 'id'>) =>
    requestJson<{ extra: PizzaExtra }>(
      '/api/admin/extras',
      { method: 'POST', body: JSON.stringify(extra) },
      token
    ),
  updateExtra: (token: string, id: string, extra: Partial<PizzaExtra>) =>
    requestJson<{ extra: PizzaExtra }>(
      `/api/admin/extras/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(extra) },
      token
    ),
  deleteExtra: (token: string, id: string) =>
    requestJson<{ ok: boolean }>(
      `/api/admin/extras/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
      token
    ),

  updateSettings: (token: string, newSettings: Partial<StoreSettings>) =>
    requestJson<{ settings: StoreSettings }>(
      '/api/admin/settings',
      { method: 'PUT', body: JSON.stringify(newSettings) },
      token
    ),

  resetDefaults: (token: string) =>
    requestJson<StoreBootstrapResponse>(
      '/api/admin/reset',
      { method: 'POST' },
      token
    ),
};
