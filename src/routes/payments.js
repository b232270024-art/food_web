import { Router } from 'express';
import { pool } from '../db/pool.js';
import { validateBody, paymentInitiateSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const paymentsRouter = Router();

// Захиалгын үнийг доллараар авч, сонгосон gateway руу illгээх мөчид
// дуудагдана. Gateway-ийн бодит API дуудлагыг энд нэмнэ (2C2P/Airwallex/
// банкны gateway). Одоохондоо pending payment бичлэг үүсгэж, gateway руу
// шилжих checkout URL/session буцаах хэлбэрээр бэлдэв.
paymentsRouter.post('/initiate', validateBody(paymentInitiateSchema), asyncHandler(async (req, res) => {
  const { order_id, gateway_provider } = req.body;

  const order = await pool.query('SELECT * FROM orders WHERE id = $1', [order_id]);
  if (order.rows.length === 0) return res.status(404).json({ error: 'Захиалга олдсонгүй.' });

  // TODO: сонгосон gateway-ийн API дуудаж bodit checkout session үүсгэх
  const placeholderTransactionId = `pending_${order_id}_${Date.now()}`;

  const { rows } = await pool.query(
    `INSERT INTO payments (order_id, gateway_provider, currency, amount_usd, transaction_id, status)
     VALUES ($1, $2, 'USD', $3, $4, 'pending') RETURNING *`,
    [order_id, gateway_provider, order.rows[0].total_usd, placeholderTransactionId]
  );

  res.status(201).json(rows[0]);
}));

// Gateway-аас ирэх webhook. transaction_id-д UNIQUE constraint байгаа тул
// давхардсан webhook ирэхэд ON CONFLICT-оор алгасна (idempotency).
// payments.status болон orders.status хоёр хүснэгт зэрэг өөрчлөгддөг тул
// transaction дотор хийж, аль нэг нь бүтэлгүйтвэл хоёулаа rollback болно.
paymentsRouter.post('/webhook/:provider', async (req, res) => {
  const { transaction_id, status, amount_charged_local, fx_rate_applied } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE payments
       SET status = $1, amount_charged_local = $2, fx_rate_applied = $3,
           paid_at = CASE WHEN $1 = 'paid' THEN now() ELSE paid_at END
       WHERE transaction_id = $4
       RETURNING *`,
      [status, amount_charged_local ?? null, fx_rate_applied ?? null, transaction_id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Гүйлгээ олдсонгүй.' });
    }

    if (status === 'paid') {
      await client.query("UPDATE orders SET status = 'paid' WHERE id = $1", [
        result.rows[0].order_id,
      ]);
    }

    await client.query('COMMIT');
    res.json({ received: true });
  } catch (err) {
    await client.query('ROLLBACK');
    req.app.get('logger').error('Webhook алдаа', { error: err.message, transaction_id });
    res.status(500).json({ error: 'Webhook боловсруулахад алдаа гарлаа.' });
  } finally {
    client.release();
  }
});
