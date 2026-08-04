import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { validateBody, createSessionSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const sessionsRouter = Router();

// Зочин нэр + захиалгын төрөл (order_type) + хүргэлтийн мэдээллээ (delivery_type,
// room_number+hotel_name эсвэл delivery_address) оруулж session үүсгэнэ.
// Нэг л QR/сайтыг олон өөр буудлын зочид ашигладаг тул delivery_type='hotel' үед
// буудлын байршлыг GPS-ээр баталгаажуулдаггүй — зочны бичсэн hotel_name-ийг
// шалгалтгүйгээр шууд хадгална. delivery_type='current_location' үед л
// location_verified true байна (map дээр бодитоор байршил сонгосон гэсэн үг).
sessionsRouter.post('/', validateBody(createSessionSchema), asyncHandler(async (req, res) => {
  const { hotel_id, guest_name, order_type, room_number, hotel_name, geo_lat, geo_lng } = req.body;
  const deliveryType = order_type === 'twelve_day' ? 'hotel' : req.body.delivery_type;
  const deliveryAddress = deliveryType === 'current_location' ? req.body.delivery_address : null;

  const hotelResult = await pool.query('SELECT id FROM hotels WHERE id = $1', [hotel_id]);
  if (hotelResult.rows.length === 0) {
    return res.status(404).json({ error: 'Буудал олдсонгүй.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO sessions
       (hotel_id, guest_name, order_type, delivery_type, room_number, hotel_name, delivery_address,
        delivery_lat, delivery_lng, location_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      hotel_id, guest_name, order_type, deliveryType,
      deliveryType === 'hotel' ? room_number : null,
      deliveryType === 'hotel' ? hotel_name : null,
      deliveryAddress,
      deliveryType === 'current_location' ? geo_lat ?? null : null,
      deliveryType === 'current_location' ? geo_lng ?? null : null,
      deliveryType === 'current_location',
    ]
  );

  const session = rows[0];
  const token = jwt.sign({ session_id: session.id, hotel_id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });

  // Токеныг localStorage-д биш, HttpOnly cookie-д хадгална — ингэснээр
  // хуудсан дээрх JS (XSS халдлага орсон ч гэсэн) токенд хүрч чадахгүй.
  res.cookie('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ session });
}));
