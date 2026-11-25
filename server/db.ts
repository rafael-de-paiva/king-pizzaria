import Database from 'better-sqlite3';
import path from 'node:path';
import {
  INITIAL_CATEGORIES,
  INITIAL_CRUSTS,
  INITIAL_EXTRAS,
  INITIAL_FLAVORS,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_SIZES,
} from '../src/data/initialData.ts';
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
} from '../src/types/index.ts';

const dbPath = process.env.DATABASE_PATH?.trim()
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH.trim())
  : path.resolve(process.cwd(), 'king_pizzaria.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      badge TEXT,
      is_pizza INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS category_name_unique ON categories(trim(name) COLLATE NOCASE);

    CREATE TRIGGER IF NOT EXISTS category_in_use BEFORE DELETE ON categories
    WHEN EXISTS (SELECT 1 FROM products WHERE category = OLD.id)
    BEGIN SELECT RAISE(ABORT, 'Categoria com pratos cadastrados.'); END;

    CREATE TABLE IF NOT EXISTS pizza_sizes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slices INTEGER NOT NULL,
      max_flavors INTEGER NOT NULL,
      base_price_multiplier REAL NOT NULL,
      description TEXT NOT NULL,
      default_price REAL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pizza_flavors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      price_grande REAL NOT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS pizza_crusts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      available INTEGER NOT NULL DEFAULT 1,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS pizza_extras (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      available INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number INTEGER NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      delivery_type TEXT NOT NULL,
      address_json TEXT,
      payment_method TEXT NOT NULL,
      cash_change_for REAL,
      items_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id TEXT,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      customization_json TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items (cart_id);

    CREATE TABLE IF NOT EXISTS admin_credentials (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT NOT NULL,
      claimed_at TEXT NOT NULL
    );
  `);

  // Triggers also enforce the relationship on databases created by older versions.
  for (const operation of ['INSERT', 'UPDATE OF category, price, name']) {
    const event = operation.startsWith('UPDATE') ? 'update' : 'insert';
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS validate_product_${event} BEFORE ${operation} ON products
      BEGIN
        SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.category)
          THEN RAISE(ABORT, 'Categoria inexistente.') END;
        SELECT CASE WHEN NEW.price <= 0 OR trim(NEW.name) = ''
          THEN RAISE(ABORT, 'Nome e preço positivo são obrigatórios.') END;
      END;
    `);
  }

  seedIfEmpty();
}

function seedCatalogAndSettings(): void {
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, icon, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  INITIAL_CATEGORIES.forEach((c, idx) => {
    insertCat.run(c.id, c.name, c.icon, c.description, idx);
  });

  const insertProd = db.prepare(`
    INSERT INTO products (id, name, description, ingredients, price, category, image, available, is_featured, badge, is_pizza, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  INITIAL_PRODUCTS.forEach((p) => {
    insertProd.run(
      p.id,
      p.name,
      p.description,
      JSON.stringify(p.ingredients || []),
      p.price,
      p.category,
      p.image,
      p.available ? 1 : 0,
      p.isFeatured ? 1 : 0,
      p.badge || null,
      p.isPizza ? 1 : 0,
      now
    );
  });

  const insertSize = db.prepare(`
    INSERT INTO pizza_sizes (id, name, slices, max_flavors, base_price_multiplier, description, default_price, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  INITIAL_SIZES.forEach((s, idx) => {
    insertSize.run(
      s.id,
      s.name,
      s.slices,
      s.maxFlavors,
      s.basePriceMultiplier,
      s.description,
      s.defaultPrice ?? null,
      idx
    );
  });

  const insertFlavor = db.prepare(`
    INSERT INTO pizza_flavors (id, name, category, description, ingredients, price_grande, available, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  INITIAL_FLAVORS.forEach((f) => {
    insertFlavor.run(
      f.id,
      f.name,
      f.category,
      f.description,
      JSON.stringify(f.ingredients || []),
      f.priceGrande,
      f.available ? 1 : 0,
      f.image || null
    );
  });

  const insertCrust = db.prepare(`
    INSERT INTO pizza_crusts (id, name, price, available, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  INITIAL_CRUSTS.forEach((c) => {
    insertCrust.run(c.id, c.name, c.price, c.available ? 1 : 0, c.description || null);
  });

  const insertExtra = db.prepare(`
    INSERT INTO pizza_extras (id, name, price, available)
    VALUES (?, ?, ?, ?)
  `);
  INITIAL_EXTRAS.forEach((e) => {
    insertExtra.run(e.id, e.name, e.price, e.available ? 1 : 0);
  });

  const { adminPassword: _ignored, ...safeSettings } = INITIAL_SETTINGS;
  db.prepare(`
    INSERT INTO store_settings (id, data, updated_at)
    VALUES (1, ?, ?)
  `).run(JSON.stringify(safeSettings), now);
}

function seedIfEmpty(): void {
  const countRow = db.prepare('SELECT COUNT(*) as total FROM products').get() as { total: number };
  const settingsRow = db.prepare('SELECT COUNT(*) as total FROM store_settings').get() as { total: number };

  if (countRow.total === 0 && settingsRow.total === 0) {
    const runSeed = db.transaction(() => {
      seedCatalogAndSettings();
    });
    runSeed();
  }
}

export function resetCatalogToDefaults(): void {
  const runReset = db.transaction(() => {
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM pizza_sizes').run();
    db.prepare('DELETE FROM pizza_flavors').run();
    db.prepare('DELETE FROM pizza_crusts').run();
    db.prepare('DELETE FROM pizza_extras').run();
    db.prepare('DELETE FROM store_settings').run();
    seedCatalogAndSettings();
  });
  runReset();
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getCategories(): CategoryInfo[] {
  const rows = db.prepare('SELECT id, name, icon, description FROM categories ORDER BY sort_order ASC').all() as CategoryInfo[];
  return rows;
}

export class CatalogError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function categoryExists(id: unknown): boolean {
  return typeof id === 'string' && Boolean(db.prepare('SELECT 1 FROM categories WHERE id = ?').get(id));
}

export function saveCategory(id: string, input: unknown, creating: boolean): CategoryInfo {
  const name = typeof input === 'string' ? input.trim().normalize('NFC') : '';
  if (!name) throw new CatalogError(400, 'Informe o nome da categoria.');
  return db.transaction(() => {
    if (!creating && !categoryExists(id)) throw new CatalogError(404, 'Categoria não encontrada.');
    const duplicate = getCategories().some(c =>
      c.id !== id && c.name.trim().normalize('NFC').toLowerCase() === name.toLowerCase()
    );
    if (duplicate) throw new CatalogError(409, 'Já existe uma categoria com esse nome.');
    if (creating) {
      db.prepare(`
        INSERT INTO categories (id, name, icon, description, sort_order)
        SELECT ?, ?, '🍽️', '', COALESCE(MAX(sort_order), -1) + 1 FROM categories
      `).run(id, name);
    } else {
      db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
    }
    return db.prepare('SELECT id, name, icon, description FROM categories WHERE id = ?').get(id) as CategoryInfo;
  }).immediate();
}

export function deleteCategory(id: string): void {
  db.transaction(() => {
    if (db.prepare('SELECT 1 FROM products WHERE category = ? LIMIT 1').get(id)) {
      throw new CatalogError(409, 'Remova ou transfira os pratos antes de excluir esta categoria.');
    }
    if (!db.prepare('DELETE FROM categories WHERE id = ?').run(id).changes) {
      throw new CatalogError(404, 'Categoria não encontrada.');
    }
  }).immediate();
}

export function getProducts(): Product[] {
  const rows = db.prepare('SELECT * FROM products ORDER BY rowid ASC').all() as Array<{
    id: string;
    name: string;
    description: string;
    ingredients: string;
    price: number;
    category: Product['category'];
    image: string;
    available: number;
    is_featured: number;
    badge: string | null;
    is_pizza: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    ingredients: parseJson<string[]>(r.ingredients, []),
    price: Number(r.price),
    category: r.category,
    image: r.image,
    available: Boolean(r.available),
    isFeatured: Boolean(r.is_featured),
    badge: r.badge || undefined,
    isPizza: Boolean(r.is_pizza),
  }));
}

export function getProductById(id: string): Product | null {
  const r = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as {
    id: string;
    name: string;
    description: string;
    ingredients: string;
    price: number;
    category: Product['category'];
    image: string;
    available: number;
    is_featured: number;
    badge: string | null;
    is_pizza: number;
  } | undefined;

  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    ingredients: parseJson<string[]>(r.ingredients, []),
    price: Number(r.price),
    category: r.category,
    image: r.image,
    available: Boolean(r.available),
    isFeatured: Boolean(r.is_featured),
    badge: r.badge || undefined,
    isPizza: Boolean(r.is_pizza),
  };
}

export function insertProduct(product: Product): Product {
  db.prepare(`
    INSERT INTO products (id, name, description, ingredients, price, category, image, available, is_featured, badge, is_pizza, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.id,
    product.name,
    product.description,
    JSON.stringify(product.ingredients || []),
    product.price,
    product.category,
    product.image,
    product.available ? 1 : 0,
    product.isFeatured ? 1 : 0,
    product.badge || null,
    product.isPizza ? 1 : 0,
    new Date().toISOString()
  );
  return product;
}

export function updateProductById(id: string, patch: Partial<Product>): Product | null {
  const existing = getProductById(id);
  if (!existing) return null;

  const updated: Product = {
    ...existing,
    ...patch,
    id: existing.id,
  };

  db.prepare(`
    UPDATE products
    SET name = ?, description = ?, ingredients = ?, price = ?, category = ?, image = ?, available = ?, is_featured = ?, badge = ?, is_pizza = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.description,
    JSON.stringify(updated.ingredients || []),
    updated.price,
    updated.category,
    updated.image,
    updated.available ? 1 : 0,
    updated.isFeatured ? 1 : 0,
    updated.badge || null,
    updated.isPizza ? 1 : 0,
    id
  );

  return updated;
}

export function deleteProductById(id: string): boolean {
  const res = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return res.changes > 0;
}

export function getSizes(): PizzaSize[] {
  const rows = db.prepare('SELECT * FROM pizza_sizes ORDER BY sort_order ASC').all() as Array<{
    id: string;
    name: string;
    slices: number;
    max_flavors: number;
    base_price_multiplier: number;
    description: string;
    default_price: number | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slices: Number(r.slices),
    maxFlavors: Number(r.max_flavors),
    basePriceMultiplier: Number(r.base_price_multiplier),
    description: r.description,
    defaultPrice: r.default_price !== null ? Number(r.default_price) : undefined,
  }));
}

export function insertSize(size: PizzaSize): PizzaSize {
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM pizza_sizes').get() as { m: number };
  db.prepare(`
    INSERT INTO pizza_sizes (id, name, slices, max_flavors, base_price_multiplier, description, default_price, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    size.id,
    size.name,
    size.slices,
    size.maxFlavors,
    size.basePriceMultiplier,
    size.description,
    size.defaultPrice ?? null,
    maxOrder.m + 1
  );
  return size;
}

export function updateSizeById(id: string, patch: Partial<PizzaSize>): PizzaSize | null {
  const all = getSizes();
  const existing = all.find((s) => s.id === id);
  if (!existing) return null;

  const updated: PizzaSize = { ...existing, ...patch, id: existing.id };
  db.prepare(`
    UPDATE pizza_sizes
    SET name = ?, slices = ?, max_flavors = ?, base_price_multiplier = ?, description = ?, default_price = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.slices,
    updated.maxFlavors,
    updated.basePriceMultiplier,
    updated.description,
    updated.defaultPrice ?? null,
    id
  );
  return updated;
}

export function deleteSizeById(id: string): boolean {
  const res = db.prepare('DELETE FROM pizza_sizes WHERE id = ?').run(id);
  return res.changes > 0;
}

export function getFlavors(): PizzaFlavor[] {
  const rows = db.prepare('SELECT * FROM pizza_flavors ORDER BY rowid ASC').all() as Array<{
    id: string;
    name: string;
    category: PizzaFlavor['category'];
    description: string;
    ingredients: string;
    price_grande: number;
    available: number;
    image: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description,
    ingredients: parseJson<string[]>(r.ingredients, []),
    priceGrande: Number(r.price_grande),
    available: Boolean(r.available),
    image: r.image || undefined,
  }));
}

export function insertFlavor(flavor: PizzaFlavor): PizzaFlavor {
  db.prepare(`
    INSERT INTO pizza_flavors (id, name, category, description, ingredients, price_grande, available, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    flavor.id,
    flavor.name,
    flavor.category,
    flavor.description,
    JSON.stringify(flavor.ingredients || []),
    flavor.priceGrande,
    flavor.available ? 1 : 0,
    flavor.image || null
  );
  return flavor;
}

export function updateFlavorById(id: string, patch: Partial<PizzaFlavor>): PizzaFlavor | null {
  const all = getFlavors();
  const existing = all.find((f) => f.id === id);
  if (!existing) return null;

  const updated: PizzaFlavor = { ...existing, ...patch, id: existing.id };
  db.prepare(`
    UPDATE pizza_flavors
    SET name = ?, category = ?, description = ?, ingredients = ?, price_grande = ?, available = ?, image = ?
    WHERE id = ?
  `).run(
    updated.name,
    updated.category,
    updated.description,
    JSON.stringify(updated.ingredients || []),
    updated.priceGrande,
    updated.available ? 1 : 0,
    updated.image || null,
    id
  );
  return updated;
}

export function deleteFlavorById(id: string): boolean {
  const res = db.prepare('DELETE FROM pizza_flavors WHERE id = ?').run(id);
  return res.changes > 0;
}

export function getCrusts(): PizzaCrust[] {
  const rows = db.prepare('SELECT * FROM pizza_crusts ORDER BY rowid ASC').all() as Array<{
    id: string;
    name: string;
    price: number;
    available: number;
    description: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    available: Boolean(r.available),
    description: r.description || undefined,
  }));
}

export function insertCrust(crust: PizzaCrust): PizzaCrust {
  db.prepare(`
    INSERT INTO pizza_crusts (id, name, price, available, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(crust.id, crust.name, crust.price, crust.available ? 1 : 0, crust.description || null);
  return crust;
}

export function updateCrustById(id: string, patch: Partial<PizzaCrust>): PizzaCrust | null {
  const all = getCrusts();
  const existing = all.find((c) => c.id === id);
  if (!existing) return null;

  const updated: PizzaCrust = { ...existing, ...patch, id: existing.id };
  db.prepare(`
    UPDATE pizza_crusts
    SET name = ?, price = ?, available = ?, description = ?
    WHERE id = ?
  `).run(updated.name, updated.price, updated.available ? 1 : 0, updated.description || null, id);
  return updated;
}

export function deleteCrustById(id: string): boolean {
  const res = db.prepare('DELETE FROM pizza_crusts WHERE id = ?').run(id);
  return res.changes > 0;
}

export function getExtras(): PizzaExtra[] {
  const rows = db.prepare('SELECT * FROM pizza_extras ORDER BY rowid ASC').all() as Array<{
    id: string;
    name: string;
    price: number;
    available: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: Number(r.price),
    available: Boolean(r.available),
  }));
}

export function insertExtra(extra: PizzaExtra): PizzaExtra {
  db.prepare(`
    INSERT INTO pizza_extras (id, name, price, available)
    VALUES (?, ?, ?, ?)
  `).run(extra.id, extra.name, extra.price, extra.available ? 1 : 0);
  return extra;
}

export function updateExtraById(id: string, patch: Partial<PizzaExtra>): PizzaExtra | null {
  const all = getExtras();
  const existing = all.find((e) => e.id === id);
  if (!existing) return null;

  const updated: PizzaExtra = { ...existing, ...patch, id: existing.id };
  db.prepare(`
    UPDATE pizza_extras
    SET name = ?, price = ?, available = ?
    WHERE id = ?
  `).run(updated.name, updated.price, updated.available ? 1 : 0, id);
  return updated;
}

export function deleteExtraById(id: string): boolean {
  const res = db.prepare('DELETE FROM pizza_extras WHERE id = ?').run(id);
  return res.changes > 0;
}

export function getSettings(): StoreSettings {
  const row = db.prepare('SELECT data FROM store_settings WHERE id = 1').get() as { data: string } | undefined;
  const fallback: StoreSettings = { ...INITIAL_SETTINGS };
  delete fallback.adminPassword;
  if (!row) return fallback;
  const parsed = parseJson<StoreSettings>(row.data, fallback);
  delete parsed.adminPassword;
  return parsed;
}

export function updateSettingsData(patch: Partial<StoreSettings>): StoreSettings {
  const current = getSettings();
  const next: StoreSettings = {
    ...current,
    ...patch,
    openingHours: {
      ...current.openingHours,
      ...(patch.openingHours || {}),
    },
  };
  delete next.adminPassword;

  db.prepare(`
    UPDATE store_settings
    SET data = ?, updated_at = ?
    WHERE id = 1
  `).run(JSON.stringify(next), new Date().toISOString());

  return next;
}

export function getCartItems(cartId: string): CartItem[] {
  const rows = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? ORDER BY rowid DESC').all(cartId) as Array<{
    id: string;
    product_id: string | null;
    name: string;
    image: string;
    unit_price: number;
    quantity: number;
    total_price: number;
    customization_json: string | null;
    notes: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id || undefined,
    name: r.name,
    image: r.image,
    unitPrice: Number(r.unit_price),
    quantity: Number(r.quantity),
    totalPrice: Number(r.total_price),
    customization: r.customization_json ? parseJson(r.customization_json, undefined) : undefined,
    notes: r.notes || undefined,
  }));
}

export function addOrMergeCartItem(cartId: string, item: CartItem): CartItem[] {
  if (item.productId && !item.customization) {
    const existingRows = db.prepare(`
      SELECT id, quantity, unit_price, notes
      FROM cart_items
      WHERE cart_id = ? AND product_id = ? AND customization_json IS NULL
    `).all(cartId, item.productId) as Array<{
      id: string;
      quantity: number;
      unit_price: number;
      notes: string | null;
    }>;

    const match = existingRows.find((r) => (r.notes || '') === (item.notes || ''));
    if (match) {
      const nextQty = match.quantity + item.quantity;
      const nextTotal = Math.round(item.unitPrice * nextQty * 100) / 100;
      db.prepare('UPDATE cart_items SET quantity = ?, unit_price = ?, total_price = ? WHERE id = ? AND cart_id = ?')
        .run(nextQty, item.unitPrice, nextTotal, match.id, cartId);
      return getCartItems(cartId);
    }
  }

  db.prepare(`
    INSERT INTO cart_items (id, cart_id, product_id, name, image, unit_price, quantity, total_price, customization_json, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    item.id,
    cartId,
    item.productId || null,
    item.name,
    item.image,
    item.unitPrice,
    item.quantity,
    item.totalPrice,
    item.customization ? JSON.stringify(item.customization) : null,
    item.notes || null,
    new Date().toISOString()
  );

  return getCartItems(cartId);
}

export function updateCartItemQuantityInDb(cartId: string, itemId: string, quantity: number): CartItem[] {
  if (quantity <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(itemId, cartId);
    return getCartItems(cartId);
  }

  const row = db.prepare('SELECT unit_price FROM cart_items WHERE id = ? AND cart_id = ?').get(itemId, cartId) as { unit_price: number } | undefined;
  if (row) {
    const nextTotal = Math.round(Number(row.unit_price) * quantity * 100) / 100;
    db.prepare('UPDATE cart_items SET quantity = ?, total_price = ? WHERE id = ? AND cart_id = ?')
      .run(quantity, nextTotal, itemId, cartId);
  }

  return getCartItems(cartId);
}

export function removeCartItemFromDb(cartId: string, itemId: string): CartItem[] {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(itemId, cartId);
  return getCartItems(cartId);
}

export function clearCartInDb(cartId: string): void {
  db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cartId);
}

export function getOrders(): Order[] {
  const rows = db.prepare('SELECT * FROM orders ORDER BY order_number DESC').all() as Array<{
    id: string;
    order_number: number;
    customer_name: string;
    customer_phone: string;
    delivery_type: Order['deliveryType'];
    address_json: string | null;
    payment_method: Order['paymentMethod'];
    cash_change_for: number | null;
    items_json: string;
    subtotal: number;
    delivery_fee: number;
    total: number;
    status: OrderStatus;
    notes: string | null;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    orderNumber: Number(r.order_number),
    customer: {
      name: r.customer_name,
      phone: r.customer_phone,
    },
    deliveryType: r.delivery_type,
    address: r.address_json ? parseJson(r.address_json, undefined) : undefined,
    paymentMethod: r.payment_method,
    cashChangeFor: r.cash_change_for !== null ? Number(r.cash_change_for) : undefined,
    items: parseJson<CartItem[]>(r.items_json, []),
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    total: Number(r.total),
    status: r.status,
    notes: r.notes || undefined,
    createdAt: r.created_at,
  }));
}

export function createOrderInDb(payload: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>): Order {
  const createTx = db.transaction(() => {
    const row = db.prepare('SELECT COALESCE(MAX(order_number), 100) as maxNum FROM orders').get() as { maxNum: number };
    const orderNumber = Number(row.maxNum) + 1;
    const id = `ped_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    const status: OrderStatus = 'recebido';

    db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_phone, delivery_type,
        address_json, payment_method, cash_change_for, items_json,
        subtotal, delivery_fee, total, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      orderNumber,
      payload.customer.name,
      payload.customer.phone,
      payload.deliveryType,
      payload.address ? JSON.stringify(payload.address) : null,
      payload.paymentMethod,
      payload.cashChangeFor ?? null,
      JSON.stringify(payload.items),
      payload.subtotal,
      payload.deliveryFee,
      payload.total,
      status,
      payload.notes || null,
      createdAt
    );

    const newOrder: Order = {
      ...payload,
      id,
      orderNumber,
      status,
      createdAt,
    };

    return newOrder;
  });

  return createTx();
}

export function updateOrderStatusInDb(id: string, status: OrderStatus): Order | null {
  const res = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  if (res.changes === 0) return null;
  const all = getOrders();
  return all.find((o) => o.id === id) || null;
}
