import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAdmin } from './auth.ts';
import { getCategories, saveCategory, deleteCategory, CatalogError } from './db.ts';
import type { ErrorRequestHandler } from 'express';

export const categoriesRouter = Router();
categoriesRouter.use(requireAdmin);
categoriesRouter.get('/', (_req, res) => res.json({ categories: getCategories() }));

categoriesRouter.post('/', (req, res) => {
  const category = saveCategory(randomUUID(), req.body?.name, true);
  res.status(201).json({ category });
});

categoriesRouter.put('/:id', (req, res) => {
  const category = saveCategory(req.params.id, req.body?.name, false);
  res.json({ category });
});

categoriesRouter.delete('/:id', (req, res) => {
  deleteCategory(req.params.id);
  res.json({ ok: true });
});

const handleCategoryError: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof CatalogError) res.status(err.status).json({ error: err.message });
  else next(err);
};
categoriesRouter.use(handleCategoryError);
