import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireSession } from '../middleware/auth.js';
import { validateBody, createOrderSchema } from '../middleware/validation.js';

export const ordersRouter = Router();

// items: [{ menu_item_id, quantity, guest_name }]
ordersRouter.post('/', requireSession, validateBody(createOrderSchema), async (req, res) => {
  const { items } = req.body;
  const { session_id, hotel_id } = req.session;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      `INSERT INTO orders (session_id, hotel_id, status, total_usd)
       VALUES ($1, $2, 'pending', 0) RETURNING *`,
      [session_id, hotel_id]
    );
    const orderId = order.rows[0].id;

    let total = 0;
    for (const item of items) {
      const menuItem = await client.query(
        'SELECT price_usd FROM menu_items WHERE id = $1 AND hotel_id = $2 FOR UPDATE',
        [item.menu_item_id, hotel_id]
      );
      if (menuItem.rows.length === 0) {
        throw new Error(`Menu item олдсонгүй: ${item.menu_item_id}`);
      }
      const unitPrice = Number(menuItem.rows[0].price_usd);
      total += unitPrice * item.quantity;

      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, guest_name, quantity, unit_price_usd)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.menu_item_id, item.guest_name || 'Guest', item.quantity, unitPrice]
      );
    }

    await client.query('UPDATE orders SET total_usd = $1 WHERE id = $2', [total, orderId]);
    await client.query('COMMIT');

    const fullOrder = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);

    // Admin дашбоард руу realtime мэдэгдэл
    const io = req.app.get('io');
    io.to(`hotel:${hotel_id}`).emit('order:new', fullOrder.rows[0]);

    res.status(201).json(fullOrder.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    req.app.get('logger').error('Захиалга үүсгэхэд алдаа гарлаа', { error: err.message });
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

ordersRouter.get('/:id', requireSession, async (req, res) => {
  const order = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (order.rows.length === 0) return res.status(404).json({ error: 'Захиалга олдсонгүй.' });

  const items = await pool.query(
    `SELECT oi.*, mi.name FROM order_items oi
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id = $1`,
    [req.params.id]
  );
  res.json({ ...order.rows[0], items: items.rows });
});
