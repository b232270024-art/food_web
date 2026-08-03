import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { validateBody, updateOrderStatusSchema, adminLoginSchema, renameRestaurantSchema } from '../middleware/validation.js';
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

// Зургийн upload нь тусдаа /api/upload router-т байгаа (src/routes/upload.js).

// --- Буудал сонгох (Dashboard/Menu/Orders толгой хэсгийн dropdown) -------
adminRouter.get('/hotels', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, name FROM hotels WHERE is_deleted = false ORDER BY name`
  );
  res.json(rows);
}));

// --- Ресторан нэр солих (Settings) ----------------------------------------
adminRouter.patch('/restaurants/:id', validateBody(renameRestaurantSchema), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE restaurants SET name = $1 WHERE id = $2 RETURNING *',
    [req.body.name, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Ресторан олдсонгүй.' });
  res.json(rows[0]);
}));

// --- Dashboard-ийн үзүүлэлт (нийт хоол, захиалга, орлого, сүүлийн захиалгууд) ---
adminRouter.get('/:hotel_id/stats', asyncHandler(async (req, res) => {
  const { hotel_id } = req.params;
  const [menuCount, orderStats, recent] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS n FROM menu_items WHERE hotel_id = $1 AND is_deleted = false`,
      [hotel_id]
    ),
    pool.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE status = 'paid')::int AS paid,
              COALESCE(SUM(total_usd) FILTER (WHERE status = 'paid'), 0) AS revenue
       FROM orders WHERE hotel_id = $1`,
      [hotel_id]
    ),
    pool.query(
      `SELECT o.id, o.status, o.total_usd, o.created_at,
              s.guest_name, s.room_number, s.delivery_address
       FROM orders o
       JOIN sessions s ON s.id = o.session_id
       WHERE o.hotel_id = $1
       ORDER BY o.created_at DESC LIMIT 8`,
      [hotel_id]
    ),
  ]);

  res.json({
    menuItemCount: menuCount.rows[0].n,
    totalOrders: orderStats.rows[0].total,
    paidOrders: orderStats.rows[0].paid,
    totalRevenue: Number(orderStats.rows[0].revenue),
    recentOrders: recent.rows,
  });
}));

// --- Тухайн буудлын захиалгууд (бүх статус, item/ресторан/хүргэлтийн дэлгэрэнгүйтэй) ---
// ?status=paid гэх мэт filter дэмжинэ. Хамгийн сүүлийн 200-г буцаана.
adminRouter.get('/:hotel_id/orders', asyncHandler(async (req, res) => {
  const params = [req.params.hotel_id];
  let statusFilter = '';
  if (req.query.status) {
    params.push(req.query.status);
    statusFilter = ` AND o.status = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total_usd, o.created_at,
            s.guest_name, s.room_number, s.delivery_address, s.delivery_type,
            (SELECT json_agg(json_build_object(
               'menu_item_id', oi.menu_item_id,
               'quantity', oi.quantity,
               'name', mi.name,
               'restaurant_name', r.name
             ))
             FROM order_items oi
             JOIN menu_items mi ON mi.id = oi.menu_item_id
             JOIN restaurants r ON r.id = mi.restaurant_id
             WHERE oi.order_id = o.id) AS items,
            (SELECT p.status FROM payments p WHERE p.order_id = o.id ORDER BY p.paid_at DESC NULLS LAST LIMIT 1) AS payment_status,
            (SELECT p.paid_at FROM payments p WHERE p.order_id = o.id ORDER BY p.paid_at DESC NULLS LAST LIMIT 1) AS paid_at
     FROM orders o
     JOIN sessions s ON s.id = o.session_id
     WHERE o.hotel_id = $1 ${statusFilter}
     ORDER BY o.created_at DESC
     LIMIT 200`,
    params
  );
  res.json(rows);
}));

// Ажилтан захиалгын статус солих (жишээ нь "бэлэн боллоо", "буцаагдсан")
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
