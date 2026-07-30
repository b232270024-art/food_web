import { Router } from 'express';
import { pool } from '../db/pool.js';
import { validateBody, updateOrderStatusSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const adminRouter = Router();

// Тухайн буудлын идэвхтэй захиалгуудыг room_number-тэй нь буцаана
adminRouter.get('/:hotel_id/orders/live', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total_usd, o.created_at, s.room_number, s.guest_name
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
