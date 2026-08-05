import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireSession } from '../middleware/auth.js';
import { validateBody, createOrderSchema } from '../middleware/validation.js';

export const ordersRouter = Router();

// items: [{ menu_item_id, quantity, guest_name }]
ordersRouter.post('/', requireSession, validateBody(createOrderSchema), async (req, res) => {
  const { items } = req.body;
  const { session_id } = req.session;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const order = await client.query(
      `INSERT INTO orders (session_id, status, total_usd)
       VALUES ($1, 'pending', 0) RETURNING *`,
      [session_id]
    );
    const orderId = order.rows[0].id;

    let total = 0;
    for (const item of items) {
      // FOR UPDATE энэ menu_item мөрийг захиалга дуустал түгжинэ — зэрэгцээ
      // ирсэн захиалгууд ижил item дээр дараалан биелэх тул stock_limit
      // хэтэрч overselling болохоос сэргийлнэ.
      const menuItem = await client.query(
        'SELECT name, price_usd, stock_limit FROM menu_items WHERE id = $1 FOR UPDATE',
        [item.menu_item_id]
      );
      if (menuItem.rows.length === 0) {
        throw new Error(`Menu item олдсонгүй: ${item.menu_item_id}`);
      }

      const { name, price_usd, stock_limit } = menuItem.rows[0];

      if (stock_limit !== null) {
        // stock_limit нь өдөр бүр 0-ээс дахин эхэлдэг лимит — тул зогсоохгүйгээр
        // тухайн item-ийн "Ази/Улаанбаатарын өнөөдөр" аль хэдийн зарагдсан нийт
        // тоог тооцоод шинэ захиалгатай нийлбэрлэж лимиттэй харьцуулна.
        const soldToday = await client.query(
          `SELECT COALESCE(SUM(oi.quantity), 0)::int AS sold FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           WHERE oi.menu_item_id = $1
             AND o.status != 'cancelled'
             AND (o.created_at AT TIME ZONE 'Asia/Ulaanbaatar')::date = (now() AT TIME ZONE 'Asia/Ulaanbaatar')::date`,
          [item.menu_item_id]
        );
        const alreadySold = soldToday.rows[0].sold;
        if (alreadySold + item.quantity > stock_limit) {
          const remaining = Math.max(0, stock_limit - alreadySold);
          throw new Error(`"${name}" өнөөдрийн лимит хүрэлцэхгүй байна (үлдсэн: ${remaining}).`);
        }
      }

      const unitPrice = Number(price_usd);
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
    io.to('admin').emit('order:new', fullOrder.rows[0]);

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
