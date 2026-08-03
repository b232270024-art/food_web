import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { validateBody, updateOrderStatusSchema, adminLoginSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

export const adminRouter = Router();

const ADMIN_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 12 * 60 * 60 * 1000,
};

// /dashboard-ын нэвтрэх хэсгээс дуудагдана
adminRouter.post('/login', loginLimiter, validateBody(adminLoginSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const hash = process.env.ADMIN_PASSWORD_HASH || '';

  const validUsername = Boolean(process.env.ADMIN_USERNAME) && username === process.env.ADMIN_USERNAME;
  const validPassword = hash ? await bcrypt.compare(password, hash) : false;

  if (!validUsername || !validPassword) {
    return res.status(401).json({ error: 'Нэвтрэх нэр эсвэл нууц үг буруу байна.' });
  }

  const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.cookie('admin_token', token, ADMIN_COOKIE_OPTS);
  res.json({ ok: true, username });
}));

adminRouter.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

// Dashboard ачаалагдахад одоогийн cookie хүчинтэй эсэхийг шалгахад ашиглана
adminRouter.get('/me', (req, res) => {
  const token = req.cookies?.admin_token;
  if (!token) return res.status(401).json({ authenticated: false });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('not an admin token');
    res.json({ authenticated: true, username: payload.username });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

// Доорх бүх route админ session шаардана
adminRouter.use(requireAdmin);

// Dashboard дээрх буудал сонгох dropdown-д зориулав
adminRouter.get('/hotels', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name FROM hotels WHERE is_deleted = false ORDER BY name`
  );
  res.json(rows);
}));

// Тухайн буудлын идэвхтэй захиалгуудыг room_number, items болон төлбөртэй хамт буцаана
adminRouter.get('/:hotel_id/orders/live', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total_usd, o.created_at, s.room_number, s.guest_name,
            (SELECT json_agg(json_build_object(
               'menu_item_id', oi.menu_item_id,
               'quantity', oi.quantity,
               'name', mi.name,
               'restaurant_name', mi.restaurant_name
            )) FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = o.id) as items,
            (SELECT status FROM payments p WHERE p.order_id = o.id LIMIT 1) as payment_status,
            (SELECT paid_at FROM payments p WHERE p.order_id = o.id LIMIT 1) as paid_at
     FROM orders o
     JOIN sessions s ON s.id = o.session_id
     WHERE o.hotel_id = $1 AND o.status != 'cancelled'
     ORDER BY o.created_at DESC`,
    [req.params.hotel_id]
  );
  res.json(rows);
}));

// Ажилтан захиалгын статус солих (жишээ нь "бэлэн боллоо")
adminRouter.patch('/orders/:id/status', validateBody(updateOrderStatusSchema), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { rows } = await pool.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Захиалга олдсонгүй.' });

  const io = req.app.get('io');
  io.to(`hotel:${rows[0].hotel_id}`).emit('order:updated', rows[0]);

  res.json(rows[0]);
}));
