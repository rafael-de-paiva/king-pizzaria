import Database from 'better-sqlite3';
import path from 'node:path';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../src/data/initialData.ts';
import type { CategoryInfo, Product } from '../src/types/index.ts';
const dbPath = process.env.DATABASE_PATH?.trim()
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH.trim())
  : path.resolve(process.cwd(), 'king_pizzaria.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.transaction(() => {
    const existing = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='categories'").get();
    createSchema();
    if (!existing) seedCatalog();
  }).immediate();
}

function createSchema(): void {
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

}

function seedCatalog(): void {
  const insertCat = db.prepare(`
    INSERT INTO categories (id, name, icon, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  INITIAL_CATEGORIES.forEach((c, idx) => {
    insertCat.run(c.id, c.name, c.icon, c.description, idx);
  });
  INITIAL_PRODUCTS.forEach(insertProduct);
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


function readProducts(where = '', ...params: string[]): Product[] {
  const rows = db.prepare('SELECT id, name, description, price, category, available FROM products ' + where + ' ORDER BY rowid').all(...params) as Array<Omit<Product, 'available'> & {available: number}>;
  return rows.map(row => ({ ...row, available: Boolean(row.available) }));
}

export function getProducts(): Product[] {
  return readProducts();
}

export function insertProduct(product: Product): Product {
  // Os campos com valores padrão permitem usar o banco do cardápio original.
  db.prepare(`INSERT INTO products
    (id, name, description, category, price, available, ingredients, image, created_at)
    VALUES (?, ?, ?, ?, ?, ?, '[]', '', ?)`).run(product.id, product.name, product.description,
      product.category, product.price, Number(product.available), new Date().toISOString());
  return product;
}

export function updateProductById(id: string, patch: Partial<Product>): Product | undefined {
  return db.transaction(() => {
    const [current] = readProducts('WHERE id = ?', id);
    if (!current) return;
    const product = { ...current, ...patch };
    db.prepare('UPDATE products SET name=?, description=?, category=?, price=?, available=? WHERE id=?')
      .run(product.name, product.description, product.category, product.price, Number(product.available), id);
    return product;
  }).immediate();
}
export function deleteProductById(id: string): boolean {
  const res = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return res.changes > 0;
}

