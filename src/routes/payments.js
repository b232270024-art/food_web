import { Router } from 'express';
import { pool } from '../db/pool.js';
import { validateBody, paymentInitiateSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  createHipayCheckout,
  getHipayCheckoutStatus,
  buildHipayPaymentFormUrl,
  convertUsdForHipay,
} from '../services/hipay.js';

export const paymentsRouter = Router();

// Захиалгын үнийг доллараар авч, сонгосон gateway руу илгээх мөчид
// дуудагдана. hipay бол бодит checkout API дуудна; бусад gateway
// (2C2P/Airwallex/банк) хараахан холбогдоогүй тул placeholder хэвээр.
paymentsRouter.post('/initiate', validateBody(paymentInitiateSchema), asyncHandler(async (req, res) => {
  const { order_id, gateway_provider } = req.body;

  const order = await pool.query('SELECT * FROM orders WHERE id = $1', [order_id]);
  if (order.rows.length === 0) return res.status(404).json({ error: 'Захиалга олдсонгүй.' });

  if (gateway_provider === 'hipay') {
    const { amount, currency, fxRate } = convertUsdForHipay(order.rows[0].total_usd);

    const checkout = await createHipayCheckout({
      amount,
      redirectUri: process.env.HIPAY_REDIRECT_URI,
      webhookUrl: process.env.HIPAY_WEBHOOK_URL,
    });

    if (!checkout.checkoutId) {
      return res.status(502).json({ error: 'Hipay checkout үүсгэж чадсангүй.', details: checkout.message || checkout.description });
    }

    const { rows } = await pool.query(
      `INSERT INTO payments (order_id, gateway_provider, currency, amount_usd, fx_rate_applied, transaction_id, status)
       VALUES ($1, 'hipay', $2, $3, $4, $5, 'pending') RETURNING *`,
      [order_id, currency, order.rows[0].total_usd, fxRate, checkout.checkoutId]
    );

    return res.status(201).json({
      ...rows[0],
      payment_form_url: buildHipayPaymentFormUrl(checkout.checkoutId),
    });
  }

  // TODO: бусад gateway (2c2p/airwallex/bank/qpay) холбогдох
  const placeholderTransactionId = `pending_${order_id}_${Date.now()}`;

  const { rows } = await pool.query(
    `INSERT INTO payments (order_id, gateway_provider, currency, amount_usd, transaction_id, status)
     VALUES ($1, $2, 'USD', $3, $4, 'pending') RETURNING *`,
    [order_id, gateway_provider, order.rows[0].total_usd, placeholderTransactionId]
  );

  res.status(201).json(rows[0]);
}));

// Hipay-ийн webhook/redirect хоёулаа signature-гүй тул зөвхөн checkoutId-г л
// найдвартай дамжуулдаг гэж үзэж, бодит статусыг ЭНД, Hipay-аас өөрөөс нь
// server-to-server дахин асууж баталгаажуулна. Хэн нэгэн webhook/redirect
// URL руу хуурамч хүсэлт илгээгээд захиалгыг "paid" болгож чадахгүй байхын
// цорын ганц баталгаа энэ функц.
async function settleHipayCheckout(checkoutId) {
  const hipayStatus = await getHipayCheckoutStatus(checkoutId);

  if (hipayStatus.status !== 'paid') return { settled: false, hipayStatus };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE payments
       SET status = 'paid', amount_charged_local = $1,
           paid_at = CASE WHEN status = 'paid' THEN paid_at ELSE now() END
       WHERE transaction_id = $2
       RETURNING *`,
      [hipayStatus.amount ?? null, checkoutId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return { settled: false, hipayStatus };
    }

    await client.query("UPDATE orders SET status = 'paid' WHERE id = $1", [result.rows[0].order_id]);
    await client.query('COMMIT');
    return { settled: true, hipayStatus, payment: result.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Hipay-ийн async webhook — GET хүсэлтээр checkoutId/paymentId ирдэг
// (HIPAY_WEBHOOK_URL). Найдвартай эх сурвалж болгож ашиглах ёстой сувг,
// гэхдээ дотор нь баталгаажуулалт (settleHipayCheckout) заавал дуудна.
paymentsRouter.get('/webhook/hipay', asyncHandler(async (req, res) => {
  const { checkoutId } = req.query;
  if (!checkoutId) return res.status(400).end();

  try {
    await settleHipayCheckout(checkoutId);
  } catch (err) {
    req.app.get('logger').error('Hipay webhook боловсруулахад алдаа', { error: err.message, checkoutId });
    return res.status(500).end();
  }

  res.status(200).end();
}));

// Hipay-ийн payment FORM-оос төлбөр хийж дууссаны дараа хэрэглэгчийн
// browser-ийг буцаадаг redirect_uri (HIPAY_REDIRECT_URI). Энэ бол зөвхөн
// UX-д зориулсан сувг — эцсийн эх сурвалж биш тул энд ч бас
// settleHipayCheckout-оор дахин баталгаажуулна (webhook-той давхацсан ч
// UPDATE идемпотент тул асуудалгүй).
paymentsRouter.post('/hipay/redirect', asyncHandler(async (req, res) => {
  const { checkoutId } = req.body;
  const frontendBase = process.env.FRONTEND_URL || '';

  if (!checkoutId) return res.redirect(`${frontendBase}/?payment=error`);

  const existing = await pool.query('SELECT order_id FROM payments WHERE transaction_id = $1', [checkoutId]);
  const orderId = existing.rows[0]?.order_id ?? null;

  let hipayStatus = { status: 'unknown' };
  try {
    ({ hipayStatus } = await settleHipayCheckout(checkoutId));
  } catch (err) {
    req.app.get('logger').error('Hipay redirect боловсруулахад алдаа', { error: err.message, checkoutId });
  }

  res.redirect(`${frontendBase}/?order_id=${orderId ?? ''}&payment=${hipayStatus.status}`);
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
