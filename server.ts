import 'dotenv/config';
import { categoriesRouter } from './server/categories.ts';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import {
  addOrMergeCartItem,
  categoryExists,
  clearCartInDb,
  createOrderInDb,
  deleteCrustById,
  deleteExtraById,
  deleteFlavorById,
  deleteProductById,
  deleteSizeById,
  getCartItems,
  getCategories,
  getCrusts,
  getExtras,
  getFlavors,
  getOrders,
  getProductById,
  getProducts,
  getSettings,
  getSizes,
  initDatabase,
  insertCrust,
  insertExtra,
  insertFlavor,
  insertProduct,
  insertSize,
  removeCartItemFromDb,
  resetCatalogToDefaults,
  updateCartItemQuantityInDb,
  updateCrustById,
  updateExtraById,
  updateFlavorById,
  updateOrderStatusInDb,
  updateProductById,
  updateSettingsData,
  updateSizeById,
} from './server/db.ts';
import {
  claimInitialAdminPassword,
  extractBearerToken,
  getAdminAuthStatus,
  issueAdminToken,
  requireAdmin,
  revokeAdminToken,
  verifyAdminPassword,
} from './server/auth.ts';
import { calculateCartTotals, calculatePizzaPrice } from './src/utils/pricing.ts';
import type {
  CartItem,
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  PizzaCrust,
  PizzaExtra,
  PizzaFlavor,
  PizzaSize,
  Product,
  ProductCategory,
  StoreSettings,
} from './src/types/index.ts';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';
const VALID_FLAVOR_CATEGORIES = new Set(['tradicional', 'especial', 'premium', 'doce']);
const VALID_DELIVERY_TYPES = new Set<DeliveryType>(['delivery', 'pickup']);
const VALID_PAYMENT_METHODS = new Set<PaymentMethod>(['pix', 'cash', 'credit', 'debit']);
const VALID_ORDER_STATUSES = new Set<OrderStatus>(['recebido', 'preparando', 'saiu_entrega', 'finalizado', 'cancelado']);

function isSafeImageUrl(url: unknown): string {
  if (typeof url !== 'string') return DEFAULT_IMAGE;
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_IMAGE;
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    return DEFAULT_IMAGE;
  }
  return DEFAULT_IMAGE;
}

function getValidatedCartId(req: Request): string | null {
  const raw = req.headers['x-cart-id'];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function resolveAuthoritativeItem(rawItem: Partial<CartItem>): CartItem | null {
  const qty = Number(rawItem.quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
    return null;
  }

  const settings = getSettings();

  if (rawItem.customization && rawItem.customization.size && Array.isArray(rawItem.customization.flavors)) {
    const allSizes = getSizes();
    const allFlavors = getFlavors();
    const allCrusts = getCrusts();
    const allExtras = getExtras();

    const size = allSizes.find((s) => s.id === rawItem.customization?.size?.id);
    if (!size) return null;

    const flavors: PizzaFlavor[] = [];
    for (const f of rawItem.customization.flavors) {
      const found = allFlavors.find((item) => item.id === f.id && item.available);
      if (!found) return null;
      flavors.push(found);
    }
    if (flavors.length === 0 || flavors.length > size.maxFlavors) return null;

    let crust: PizzaCrust | undefined;
    if (rawItem.customization.crust?.id) {
      crust = allCrusts.find((c) => c.id === rawItem.customization?.crust?.id && c.available);
    }

    const extras: PizzaExtra[] = [];
    if (Array.isArray(rawItem.customization.extras)) {
      for (const e of rawItem.customization.extras) {
        const found = allExtras.find((item) => item.id === e.id && item.available);
        if (found) extras.push(found);
      }
    }

    const unitPrice = calculatePizzaPrice(size, flavors, settings.halfHalfRule, crust, extras);
    const totalPrice = Math.round(unitPrice * qty * 100) / 100;
    const isHalfAndHalf = flavors.length > 1;
    const name = isHalfAndHalf
      ? `Pizza ${size.name}: ${flavors.map((f) => `1/${flavors.length} ${f.name}`).join(' + ')}`
      : `Pizza ${flavors[0].name} (${size.name})`;

    return {
      id: typeof rawItem.id === 'string' && rawItem.id.trim() ? rawItem.id.trim() : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      image: isSafeImageUrl(flavors[0].image || rawItem.image),
      unitPrice,
      quantity: qty,
      totalPrice,
      customization: {
        size,
        flavors,
        isHalfAndHalf,
        crust,
        extras,
        notes: typeof rawItem.customization.notes === 'string' ? rawItem.customization.notes.trim().slice(0, 300) || undefined : undefined,
      },
    };
  }

  if (typeof rawItem.productId === 'string' && rawItem.productId.trim()) {
    const product = getProductById(rawItem.productId.trim());
    if (!product || !product.available) return null;
    const unitPrice = Math.round(product.price * 100) / 100;
    const totalPrice = Math.round(unitPrice * qty * 100) / 100;

    return {
      id: typeof rawItem.id === 'string' && rawItem.id.trim() ? rawItem.id.trim() : `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      name: product.name,
      image: isSafeImageUrl(product.image),
      unitPrice,
      quantity: qty,
      totalPrice,
      notes: typeof rawItem.notes === 'string' ? rawItem.notes.trim().slice(0, 300) || undefined : undefined,
    };
  }

  return null;
}

function productInputError(body: Partial<Product>, creating: boolean): string | undefined {
  if ((creating || body.name !== undefined) && (typeof body.name !== 'string' || !body.name.trim())) {
    return 'Informe o nome do produto.';
  }
  if ((creating || body.category !== undefined) && !categoryExists(body.category)) {
    return 'Selecione uma categoria cadastrada.';
  }
  if (creating || body.price !== undefined) {
    const raw: unknown = body.price;
    const cents = typeof raw === 'number' || typeof raw === 'string' ? Math.round(Number(raw) * 100) : NaN;
    if (!Number.isSafeInteger(cents) || cents <= 0) {
      return 'O preço do produto deve ser maior que zero, em reais e centavos.';
    }
  }
}

async function startServer(): Promise<void> {
  initDatabase();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', database: 'sqlite' });
  });

  app.get('/api/store', (_req: Request, res: Response) => {
    res.json({
      products: getProducts(),
      categories: getCategories(),
      sizes: getSizes(),
      flavors: getFlavors(),
      crusts: getCrusts(),
      extras: getExtras(),
      settings: getSettings(),
    });
  });

  // Cart endpoints
  app.get('/api/cart', (req: Request, res: Response) => {
    const cartId = getValidatedCartId(req);
    if (!cartId) {
      res.status(400).json({ error: 'Identificador de carrinho inválido.' });
      return;
    }
    res.json({ items: getCartItems(cartId) });
  });

  app.post('/api/cart/items', (req: Request, res: Response) => {
    const cartId = getValidatedCartId(req);
    if (!cartId) {
      res.status(400).json({ error: 'Identificador de carrinho inválido.' });
      return;
    }
    const item = resolveAuthoritativeItem(req.body || {});
    if (!item) {
      res.status(400).json({ error: 'Dados do item inválidos ou produto indisponível.' });
      return;
    }
    const items = addOrMergeCartItem(cartId, item);
    res.status(201).json({ items });
  });

  app.patch('/api/cart/items/:id', (req: Request, res: Response) => {
    const cartId = getValidatedCartId(req);
    if (!cartId) {
      res.status(400).json({ error: 'Identificador de carrinho inválido.' });
      return;
    }
    const quantity = Number(req.body?.quantity);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 50) {
      res.status(400).json({ error: 'Quantidade inválida.' });
      return;
    }
    const items = updateCartItemQuantityInDb(cartId, String(req.params.id), quantity);
    res.json({ items });
  });

  app.delete('/api/cart/items/:id', (req: Request, res: Response) => {
    const cartId = getValidatedCartId(req);
    if (!cartId) {
      res.status(400).json({ error: 'Identificador de carrinho inválido.' });
      return;
    }
    const items = removeCartItemFromDb(cartId, String(req.params.id));
    res.json({ items });
  });

  app.delete('/api/cart', (req: Request, res: Response) => {
    const cartId = getValidatedCartId(req);
    if (!cartId) {
      res.status(400).json({ error: 'Identificador de carrinho inválido.' });
      return;
    }
    clearCartInDb(cartId);
    res.json({ items: [] });
  });

  // Public order submission
  app.post('/api/orders', (req: Request, res: Response) => {
    const body = req.body || {};
    const customerName = typeof body.customer?.name === 'string' ? body.customer.name.trim() : '';
    const customerPhone = typeof body.customer?.phone === 'string' ? body.customer.phone.trim() : '';
    const deliveryType = body.deliveryType as DeliveryType;
    const paymentMethod = body.paymentMethod as PaymentMethod;

    if (!customerName || customerName.length > 120) {
      res.status(400).json({ error: 'Informe um nome válido.' });
      return;
    }
    if (!customerPhone || customerPhone.length > 40) {
      res.status(400).json({ error: 'Informe um telefone/WhatsApp válido.' });
      return;
    }
    if (!VALID_DELIVERY_TYPES.has(deliveryType)) {
      res.status(400).json({ error: 'Modalidade de entrega inválida.' });
      return;
    }
    if (!VALID_PAYMENT_METHODS.has(paymentMethod)) {
      res.status(400).json({ error: 'Forma de pagamento inválida.' });
      return;
    }

    let address;
    if (deliveryType === 'delivery') {
      const street = typeof body.address?.street === 'string' ? body.address.street.trim() : '';
      const number = typeof body.address?.number === 'string' ? body.address.number.trim() : '';
      const neighborhood = typeof body.address?.neighborhood === 'string' ? body.address.neighborhood.trim() : '';
      const cep = typeof body.address?.cep === 'string' ? body.address.cep.trim() : '';
      const complement = typeof body.address?.complement === 'string' ? body.address.complement.trim() : undefined;
      const reference = typeof body.address?.reference === 'string' ? body.address.reference.trim() : undefined;

      if (!street || !number || !neighborhood) {
        res.status(400).json({ error: 'Endereço completo (rua, número e bairro) é obrigatório para entrega.' });
        return;
      }

      address = { cep, street, number, neighborhood, complement, reference };
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'O pedido precisa conter ao menos um item.' });
      return;
    }

    const validatedItems: CartItem[] = [];
    for (const rawItem of body.items) {
      const resolved = resolveAuthoritativeItem(rawItem);
      if (!resolved) {
        res.status(400).json({ error: 'Um ou mais itens do pedido são inválidos ou estão indisponíveis.' });
        return;
      }
      validatedItems.push(resolved);
    }

    const settings = getSettings();
    const { subtotal, deliveryFee, total } = calculateCartTotals(
      validatedItems,
      deliveryType,
      settings.deliveryFee
    );

    let cashChangeFor: number | undefined;
    if (paymentMethod === 'cash' && body.cashChangeFor !== undefined && body.cashChangeFor !== null) {
      const val = Number(body.cashChangeFor);
      if (!Number.isFinite(val) || val <= total) {
        res.status(400).json({ error: 'O valor do troco deve ser maior que o total do pedido.' });
        return;
      }
      cashChangeFor = Math.round(val * 100) / 100;
    }

    const order = createOrderInDb({
      customer: { name: customerName, phone: customerPhone },
      deliveryType,
      address,
      paymentMethod,
      cashChangeFor,
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 4000) : undefined,
    });

    const cartId = getValidatedCartId(req);
    if (cartId) {
      clearCartInDb(cartId);
    }

    res.status(201).json({ order });
  });

  // Admin auth routes
  app.get('/api/admin/auth-status', (_req: Request, res: Response) => {
    res.json(getAdminAuthStatus());
  });

  app.post('/api/admin/setup', (req: Request, res: Response) => {
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (password.length < 4 || password.length > 128) {
      res.status(400).json({ error: 'A senha inicial deve ter entre 4 e 128 caracteres.' });
      return;
    }
    const claimed = claimInitialAdminPassword(password);
    if (!claimed) {
      res.status(409).json({ error: 'A senha de administrador já foi configurada.' });
      return;
    }
    const token = issueAdminToken();
    res.status(201).json({ token });
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const status = getAdminAuthStatus();
    if (status.requiresSetup) {
      res.status(409).json({ error: 'Configure a senha de administrador antes de acessar.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || !verifyAdminPassword(password)) {
      res.status(401).json({ error: 'Senha incorreta.' });
      return;
    }
    const token = issueAdminToken();
    res.json({ token });
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const token = extractBearerToken(req);
    if (token) {
      revokeAdminToken(token);
    }
    res.json({ ok: true });
  });

  app.use('/api/admin/categories', categoriesRouter);

  // Protected Admin routes
  app.get('/api/admin/orders', requireAdmin, (_req: Request, res: Response) => {
    res.json({ orders: getOrders() });
  });

  app.patch('/api/admin/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
    const status = req.body?.status as OrderStatus;
    if (!VALID_ORDER_STATUSES.has(status)) {
      res.status(400).json({ error: 'Status de pedido inválido.' });
      return;
    }
    const updated = updateOrderStatusInDb(String(req.params.id), status);
    if (!updated) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }
    res.json({ order: updated });
  });

  app.post('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const price = Number(body.price);
    const category = body.category as ProductCategory;

    const error = productInputError(body, true);
    if (error) {
      res.status(400).json({ error });
      return;
    }

    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((s: unknown) => String(s).trim()).filter(Boolean)
      : typeof body.ingredients === 'string'
      ? body.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      description: typeof body.description === 'string' ? body.description.trim() : '',
      ingredients,
      price: Math.round(price * 100) / 100,
      category,
      image: isSafeImageUrl(body.image),
      available: body.available !== undefined ? Boolean(body.available) : true,
      isFeatured: Boolean(body.isFeatured),
      badge: typeof body.badge === 'string' && body.badge.trim() ? body.badge.trim() : undefined,
      isPizza: body.isPizza !== undefined ? Boolean(body.isPizza) : category.startsWith('pizzas-'),
    };

    res.status(201).json({ product: insertProduct(newProduct) });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const error = productInputError(body, false);
    if (error) {
      res.status(400).json({ error });
      return;
    }
    const patch: Partial<Product> = {};
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if (typeof body.description === 'string') patch.description = body.description.trim();
    if (body.price !== undefined) patch.price = Math.round(Number(body.price) * 100) / 100;
    if (body.category !== undefined) patch.category = body.category;
    if (body.ingredients !== undefined) {
      patch.ingredients = Array.isArray(body.ingredients)
        ? body.ingredients.map((s: unknown) => String(s).trim()).filter(Boolean)
        : typeof body.ingredients === 'string'
        ? body.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
    }
    if (body.image !== undefined) patch.image = isSafeImageUrl(body.image);
    if (body.available !== undefined) patch.available = Boolean(body.available);
    if (body.isFeatured !== undefined) patch.isFeatured = Boolean(body.isFeatured);
    if (body.badge !== undefined) patch.badge = typeof body.badge === 'string' && body.badge.trim() ? body.badge.trim() : undefined;
    if (body.isPizza !== undefined) patch.isPizza = Boolean(body.isPizza);

    const updated = updateProductById(String(req.params.id), patch);
    if (!updated) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    res.json({ product: updated });
  });

  app.patch('/api/admin/products/:id/toggle', requireAdmin, (req: Request, res: Response) => {
    const existing = getProductById(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    const updated = updateProductById(existing.id, { available: !existing.available });
    res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
    if (!deleteProductById(String(req.params.id))) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/flavors', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const priceGrande = Number(body.priceGrande);
    const category = typeof body.category === 'string' ? body.category : 'tradicional';
    if (!name || !Number.isFinite(priceGrande) || priceGrande < 0 || !VALID_FLAVOR_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Dados inválidos para sabor.' });
      return;
    }

    const ingredients = Array.isArray(body.ingredients)
      ? body.ingredients.map((s: unknown) => String(s).trim()).filter(Boolean)
      : typeof body.ingredients === 'string'
      ? body.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const flavor: PizzaFlavor = {
      id: `flv_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name,
      category: category as PizzaFlavor['category'],
      description: typeof body.description === 'string' ? body.description.trim() : '',
      ingredients,
      priceGrande: Math.round(priceGrande * 100) / 100,
      available: body.available !== undefined ? Boolean(body.available) : true,
      image: isSafeImageUrl(body.image),
    };

    res.status(201).json({ flavor: insertFlavor(flavor) });
  });

  app.put('/api/admin/flavors/:id', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const patch: Partial<PizzaFlavor> = {};
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if (typeof body.description === 'string') patch.description = body.description.trim();
    if (body.priceGrande !== undefined) {
      const priceGrande = Number(body.priceGrande);
      if (!Number.isFinite(priceGrande) || priceGrande < 0) {
        res.status(400).json({ error: 'Preço inválido.' });
        return;
      }
      patch.priceGrande = Math.round(priceGrande * 100) / 100;
    }
    if (body.category !== undefined) {
      if (!VALID_FLAVOR_CATEGORIES.has(body.category)) {
        res.status(400).json({ error: 'Categoria de sabor inválida.' });
        return;
      }
      patch.category = body.category;
    }
    if (body.ingredients !== undefined) {
      patch.ingredients = Array.isArray(body.ingredients)
        ? body.ingredients.map((s: unknown) => String(s).trim()).filter(Boolean)
        : typeof body.ingredients === 'string'
        ? body.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
    }
    if (body.available !== undefined) patch.available = Boolean(body.available);
    if (body.image !== undefined) patch.image = isSafeImageUrl(body.image);

    const updated = updateFlavorById(String(req.params.id), patch);
    if (!updated) {
      res.status(404).json({ error: 'Sabor não encontrado.' });
      return;
    }
    res.json({ flavor: updated });
  });

  app.delete('/api/admin/flavors/:id', requireAdmin, (req: Request, res: Response) => {
    if (!deleteFlavorById(String(req.params.id))) {
      res.status(404).json({ error: 'Sabor não encontrado.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/sizes', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slices = Number(body.slices);
    const maxFlavors = Number(body.maxFlavors);
    const basePriceMultiplier = Number(body.basePriceMultiplier);
    if (!name || !Number.isFinite(slices) || !Number.isFinite(maxFlavors) || !Number.isFinite(basePriceMultiplier)) {
      res.status(400).json({ error: 'Dados inválidos para tamanho.' });
      return;
    }
    const size: PizzaSize = {
      id: `size_${Date.now()}`,
      name,
      slices,
      maxFlavors,
      basePriceMultiplier,
      description: typeof body.description === 'string' ? body.description.trim() : '',
      defaultPrice: body.defaultPrice !== undefined ? Number(body.defaultPrice) : undefined,
    };
    res.status(201).json({ size: insertSize(size) });
  });

  app.put('/api/admin/sizes/:id', requireAdmin, (req: Request, res: Response) => {
    const updated = updateSizeById(String(req.params.id), req.body || {});
    if (!updated) {
      res.status(404).json({ error: 'Tamanho não encontrado.' });
      return;
    }
    res.json({ size: updated });
  });

  app.delete('/api/admin/sizes/:id', requireAdmin, (req: Request, res: Response) => {
    if (!deleteSizeById(String(req.params.id))) {
      res.status(404).json({ error: 'Tamanho não encontrado.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/crusts', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const price = Number(body.price);
    if (!name || !Number.isFinite(price) || price < 0) {
      res.status(400).json({ error: 'Dados inválidos para borda.' });
      return;
    }
    const crust: PizzaCrust = {
      id: `crust_${Date.now()}`,
      name,
      price: Math.round(price * 100) / 100,
      available: body.available !== undefined ? Boolean(body.available) : true,
      description: typeof body.description === 'string' ? body.description.trim() : undefined,
    };
    res.status(201).json({ crust: insertCrust(crust) });
  });

  app.put('/api/admin/crusts/:id', requireAdmin, (req: Request, res: Response) => {
    const updated = updateCrustById(String(req.params.id), req.body || {});
    if (!updated) {
      res.status(404).json({ error: 'Borda não encontrada.' });
      return;
    }
    res.json({ crust: updated });
  });

  app.delete('/api/admin/crusts/:id', requireAdmin, (req: Request, res: Response) => {
    if (!deleteCrustById(String(req.params.id))) {
      res.status(404).json({ error: 'Borda não encontrada.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/extras', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const price = Number(body.price);
    if (!name || !Number.isFinite(price) || price < 0) {
      res.status(400).json({ error: 'Dados inválidos para adicional.' });
      return;
    }
    const extra: PizzaExtra = {
      id: `ext_${Date.now()}`,
      name,
      price: Math.round(price * 100) / 100,
      available: body.available !== undefined ? Boolean(body.available) : true,
    };
    res.status(201).json({ extra: insertExtra(extra) });
  });

  app.put('/api/admin/extras/:id', requireAdmin, (req: Request, res: Response) => {
    const updated = updateExtraById(String(req.params.id), req.body || {});
    if (!updated) {
      res.status(404).json({ error: 'Adicional não encontrado.' });
      return;
    }
    res.json({ extra: updated });
  });

  app.delete('/api/admin/extras/:id', requireAdmin, (req: Request, res: Response) => {
    if (!deleteExtraById(String(req.params.id))) {
      res.status(404).json({ error: 'Adicional não encontrado.' });
      return;
    }
    res.json({ ok: true });
  });

  app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
    const body = (req.body || {}) as Partial<StoreSettings>;
    if (body.deliveryFee !== undefined) {
      const fee = Number(body.deliveryFee);
      if (!Number.isFinite(fee) || fee < 0) {
        res.status(400).json({ error: 'Taxa de entrega inválida.' });
        return;
      }
      body.deliveryFee = Math.round(fee * 100) / 100;
    }
    const updated = updateSettingsData(body);
    res.json({ settings: updated });
  });

  app.post('/api/admin/reset', requireAdmin, (_req: Request, res: Response) => {
    resetCatalogToDefaults();
    res.json({
      products: getProducts(),
      categories: getCategories(),
      sizes: getSizes(),
      flavors: getFlavors(),
      crusts: getCrusts(),
      extras: getExtras(),
      settings: getSettings(),
    });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found. Run npm run build first.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, process.env.IP || '0.0.0.0', () => {
    console.log(`King Pizzaria server listening on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
