import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { validateBody, createSessionSchema } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const sessionsRouter = Router();

// Зочин нэр + захиалгын төрөл (order_type) + хүргэлтийн мэдээллээ (delivery_type,
// room_number+hotel_name эсвэл delivery_address), 12-day үед сонгосон ангилал
// (diet_type_id), мэдэгдсэн харшил (allergy_tags/allergy_other) оруулж session
// үүсгэнэ. Нэг л сайтыг олон өөр буудлын зочид ашигладаг тул delivery_type='hotel'
// үед буудлын байршлыг GPS-ээр баталгаажуулдаггүй — зочны бичсэн hotel_name-ийг
// шалгалтгүйгээр шууд хадгална. delivery_type='current_location' үед л
// location_verified true байна (map дээр бодитоор байршил сонгосон гэсэн үг).
sessionsRouter.post('/', validateBody(createSessionSchema), asyncHandler(async (req, res) => {
  const { guest_name, order_type, room_number, hotel_name, geo_lat, geo_lng, diet_type_id, allergy_tags, allergy_other } = req.body;
  const deliveryType = order_type === 'twelve_day' ? 'hotel' : req.body.delivery_type;
  const deliveryAddress = deliveryType === 'current_location' ? req.body.delivery_address : null;

  // 12 хоногийн план дээр л ашиглагдана — one_time дээр үргэлж NULL.
  const sessionDietTypeId = order_type === 'twelve_day' ? (diet_type_id ?? null) : null;
  if (sessionDietTypeId) {
    const dt = await pool.query('SELECT id FROM diet_types WHERE id = $1', [sessionDietTypeId]);
    if (dt.rows.length === 0) return res.status(400).json({ error: 'Сонгосон ангилал олдсонгүй.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO sessions
       (guest_name, order_type, delivery_type, room_number, hotel_name, delivery_address,
        delivery_lat, delivery_lng, location_verified, diet_type_id, allergy_tags, allergy_other)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      guest_name, order_type, deliveryType,
      deliveryType === 'hotel' ? room_number : null,
      deliveryType === 'hotel' ? hotel_name : null,
      deliveryAddress,
      deliveryType === 'current_location' ? geo_lat ?? null : null,
      deliveryType === 'current_location' ? geo_lng ?? null : null,
      deliveryType === 'current_location',
      sessionDietTypeId,
      allergy_tags ?? [],
      allergy_other ?? null,
    ]
  );

  const session = rows[0];
  const token = jwt.sign({ session_id: session.id }, process.env.JWT_SECRET, {
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
