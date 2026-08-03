import { Router } from 'express';
import { pool } from '../db/pool.js';
import { validateBody, createMenuItemSchema, updateMenuItemSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAdmin } from '../middleware/adminAuth.js';

export const menuRouter = Router();

// GET /api/menu/:hotel_id — fetch menu items for a hotel
// Optional query params: ?diet_type=halal&category=Main+Course&restaurant_id=...
// ?all=true includes items marked unavailable (used by the admin dashboard) —
// soft-deleted items are still excluded either way. In admin (?all=true) mode we
// also attach sold_today — Ази/Улаанбаатарын өнөөдрийн (00:00-оос хойших)
// зарагдсан тоо — stock_limit-тэй хамт "X/Y өнөөдөр" харуулахад ашиглана.
menuRouter.get('/:hotel_id', asyncHandler(async (req, res) => {
  const { hotel_id } = req.params;
  const { diet_type, category, restaurant_id, all } = req.query;

  const soldTodayExpr = all === 'true'
    ? `, COALESCE((
         SELECT SUM(oi.quantity) FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.menu_item_id = mi.id
           AND o.status != 'cancelled'
           AND (o.created_at AT TIME ZONE 'Asia/Ulaanbaatar')::date = (now() AT TIME ZONE 'Asia/Ulaanbaatar')::date
       ), 0) AS sold_today`
    : '';

  let query = `
    SELECT mi.id, mi.name, mi.description, mi.category, mi.diet_type,
           mi.price_usd, mi.image_url, mi.calories, mi.allergens,
           mi.prep_time_min, mi.is_featured, mi.available,
           mi.restaurant_id, mi.stock_limit, r.name AS restaurant_name
           ${soldTodayExpr}
    FROM menu_items mi
    JOIN restaurants r ON r.id = mi.restaurant_id
    WHERE mi.hotel_id = $1
      AND mi.is_deleted = false
  `;
  const params = [hotel_id];

  if (all !== 'true') {
    query += ` AND mi.available = true`;
  }

  if (diet_type) {
    params.push(diet_type);
    query += ` AND mi.diet_type = $${params.length}`;
  }

  if (category) {
    params.push(category);
    query += ` AND mi.category = $${params.length}`;
  }

  if (restaurant_id) {
    params.push(restaurant_id);
    query += ` AND mi.restaurant_id = $${params.length}`;
  }

  query += ` ORDER BY mi.is_featured DESC, mi.category, mi.name`;

  const { rows } = await pool.query(query, params);
  res.json(rows);
}));

// GET /api/menu/:hotel_id/restaurants — тухайн буудлын dining outlet-уудын жагсаалт
// (Menu/Orders admin dropdown-уудад ашиглана).
menuRouter.get('/:hotel_id/restaurants', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name FROM restaurants WHERE hotel_id = $1 ORDER BY name`,
    [req.params.hotel_id]
  );
  res.json(rows);
}));

// GET /api/menu/:hotel_id/plan — тухайн буудлын "12 хоногийн цэс" (admin-ийн
// тохируулсан өдөр тус бүрийн өглөө/өдөр/оройн хоол). Auth шаардахгүй —
// зочин нэвтрээгүй байхдаа ч (12-day план сонгохоосоо өмнө) урьдчилан харах
// ёстой тул public. Admin-ийн ижил query-той (src/routes/admin.js), гэхдээ
// энд requireAdmin байхгүй тул тусдаа бичигдсэн.
menuRouter.get('/:hotel_id/plan', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT pi.id, pi.day_number, pi.meal_time, pi.menu_item_id,
            mi.name, mi.price_usd, mi.image_url, r.name AS restaurant_name
     FROM twelve_day_plan_items pi
     JOIN menu_items mi ON mi.id = pi.menu_item_id
     JOIN restaurants r ON r.id = mi.restaurant_id
     WHERE pi.hotel_id = $1
     ORDER BY pi.day_number, pi.meal_time`,
    [req.params.hotel_id]
  );
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
  const { name, description, category, diet_type, price_usd, image_url, calories, allergens, prep_time_min, is_featured, restaurant_id, stock_limit } = req.body;

  const restaurant = await pool.query(
    'SELECT id FROM restaurants WHERE id = $1 AND hotel_id = $2',
    [restaurant_id, req.params.hotel_id]
  );
  if (restaurant.rows.length === 0) {
    return res.status(400).json({ error: 'Сонгосон ресторан энэ буудалд харьяалагдахгүй байна.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO menu_items
       (hotel_id, name, description, category, diet_type, price_usd, image_url, calories, allergens, prep_time_min, is_featured, restaurant_id, stock_limit)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
      restaurant_id,
      stock_limit ?? null,
    ]
  );
  res.status(201).json(rows[0]);
}));

// PATCH /api/menu/item/:id — update a menu item (image_url, price, availability, etc.)
menuRouter.patch('/item/:id', requireAdmin, validateBody(updateMenuItemSchema), asyncHandler(async (req, res) => {
  const { name, description, category, diet_type, price_usd, image_url, calories, allergens, prep_time_min, is_featured, available, restaurant_id, stock_limit } = req.body;

  if (restaurant_id) {
    const current = await pool.query('SELECT hotel_id FROM menu_items WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Menu item not found.' });
    const restaurant = await pool.query(
      'SELECT id FROM restaurants WHERE id = $1 AND hotel_id = $2',
      [restaurant_id, current.rows[0].hotel_id]
    );
    if (restaurant.rows.length === 0) {
      return res.status(400).json({ error: 'Сонгосон ресторан энэ буудалд харьяалагдахгүй байна.' });
    }
  }

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
      available     = COALESCE($11, available),
      restaurant_id = COALESCE($12, restaurant_id),
      stock_limit   = CASE WHEN $13::boolean THEN $14 ELSE stock_limit END
    WHERE id = $15 AND is_deleted = false
    RETURNING *`,
    [
      name, description, category, diet_type, price_usd, image_url, calories,
      allergens, prep_time_min, is_featured, available, restaurant_id,
      Object.prototype.hasOwnProperty.call(req.body, 'stock_limit'), stock_limit,
      req.params.id,
    ]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Menu item not found.' });
  res.json(rows[0]);
}));
