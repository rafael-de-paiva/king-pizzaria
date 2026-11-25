import 'dotenv/config';
import { categoriesRouter } from './server/categories.ts';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { categoryExists, initDatabase, getCategories, getProducts, insertProduct, updateProductById, deleteProductById } from './server/db.ts';
import {
  claimInitialAdminPassword,
  extractBearerToken,
  getAdminAuthStatus,
  issueAdminToken,
  requireAdmin,
  revokeAdminToken,
  verifyAdminPassword,
} from './server/auth.ts';
import type { Product } from './src/types/index.ts';
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

  app.get('/api/store', (_req, res) => {
    res.json({ categories: getCategories(), products: getProducts() });
  });

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

  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const body = req.body || {};
    const error = productInputError(body, true);
    if (error) return void res.status(400).json({ error });
    const product = insertProduct({
      id: crypto.randomUUID(), name: body.name.trim(), category: body.category,
      price: Math.round(Number(body.price) * 100) / 100,
      description: typeof body.description === 'string' ? body.description.trim() : '',
      available: body.available !== false,
    });
    res.status(201).json({ product });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const body = req.body || {};
    const error = productInputError(body, false);
    if (error) return void res.status(400).json({ error });
    const patch: Partial<Product> = {};
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.category !== undefined) patch.category = body.category;
    if (body.price !== undefined) patch.price = Math.round(Number(body.price) * 100) / 100;
    if (typeof body.description === 'string') patch.description = body.description.trim();
    if (typeof body.available === 'boolean') patch.available = body.available;
    const product = updateProductById(String(req.params.id), patch);
    if (!product) return void res.status(404).json({ error: 'Prato não encontrado.' });
    res.json({ product });
  });
  app.delete('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
    if (!deleteProductById(String(req.params.id))) {
      res.status(404).json({ error: 'Produto não encontrado.' });
      return;
    }
    res.json({ ok: true });
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
