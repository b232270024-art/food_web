import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const hotelsRouter = Router();

// QR токеноос буудлын нэр, байршлыг буцаана (зочны эхний дэлгэц үүнийг дуудна)
hotelsRouter.get('/:qr_token/resolve', asyncHandler(async (req, res) => {
  const { qr_token } = req.params;
  const { rows } = await pool.query(
    `SELECT id, name, address, latitude, longitude FROM hotels
     WHERE qr_token = $1 AND is_deleted = false`,
    [qr_token]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'QR буруу эсвэл хугацаа дууссан байна.' });
  }
  res.json(rows[0]);
}));
