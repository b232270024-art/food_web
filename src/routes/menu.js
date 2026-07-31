import { Router } from 'express';
import { pool } from '../db/pool.js';
import { validateBody, createMenuItemSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAdmin } from '../middleware/adminAuth.js';

export const menuRouter = Router();

// GET /api/menu/:hotel_id — fetch menu items for a hotel
// Optional query params: ?diet_type=halal&category=Main+Course
// ?all=true includes items marked unavailable (used by the admin dashboard) —
// soft-deleted items are still excluded either way.
menuRouter.get('/:hotel_id', asyncHandler(async (req, res) => {
  const { hotel_id } = req.params;
  const { diet_type, category, all } = req.query;

  let query = `
    SELECT id, name, description, category, diet_type,
           price_usd, image_url, calories, allergens,
           prep_time_min, is_featured, available
    FROM menu_items
    WHERE hotel_id = $1
      AND is_deleted = false
  `;
  const params = [hotel_id];

  if (all !== 'true') {
    query += ` AND available = true`;
  }

  if (diet_type) {
    params.push(diet_type);
    query += ` AND diet_type = $${params.length}`;
  }

  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  query += ` ORDER BY is_featured DESC, category, name`;

  const { rows } = await pool.query(query, params);
  res.json(rows);
}));

// DELETE /api/menu/item/:id — soft delete
menuRouter.delete('/item/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE menu_items SET is_deleted = true, available = false WHERE id = $1 RETURNING id',
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Menu item not found.' });
  res.json({ deleted: true, id: rows[0].id });
}));

// POST /api/menu/:hotel_id — add a new menu item (admin)
menuRouter.post('/:hotel_id', requireAdmin, validateBody(createMenuItemSchema), asyncHandler(async (req, res) => {
  const { name, description, category, diet_type, price_usd, image_url, calories, allergens, prep_time_min, is_featured } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO menu_items
       (hotel_id, name, description, category, diet_type, price_usd, image_url, calories, allergens, prep_time_min, is_featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      req.params.hotel_id,
      name,
      description ?? null,
      category ?? null,
      diet_type ?? 'standard',
      price_usd,
      image_url ?? null,
      calories ?? null,
      allergens ?? [],
      prep_time_min ?? 15,
      is_featured ?? false,
    ]
  );
  res.status(201).json(rows[0]);
}));

// PATCH /api/menu/item/:id — update a menu item (image_url, price, availability, etc.)
menuRouter.patch('/item/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { name, description, category, diet_type, price_usd, image_url, calories, allergens, prep_time_min, is_featured, available } = req.body;
  const { rows } = await pool.query(
    `UPDATE menu_items SET
      name          = COALESCE($1, name),
      description   = COALESCE($2, description),
      category      = COALESCE($3, category),
      diet_type     = COALESCE($4::diet_type, diet_type),
      price_usd     = COALESCE($5, price_usd),
      image_url     = COALESCE($6, image_url),
      calories      = COALESCE($7, calories),
      allergens     = COALESCE($8, allergens),
      prep_time_min = COALESCE($9, prep_time_min),
      is_featured   = COALESCE($10, is_featured),
      available     = COALESCE($11, available)
    WHERE id = $12 AND is_deleted = false
    RETURNING *`,
    [name, description, category, diet_type, price_usd, image_url, calories, allergens, prep_time_min, is_featured, available, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Menu item not found.' });
  res.json(rows[0]);
}));
