import { pool } from '../pool.js';

// Нэмэлт (additive) migration — байгаа DB-ийн өгөгдлийг устгахгүй.
// Ажиллуулах: node src/db/migrations/005_hotel_name.js
//
// Систем нэг л (ганц) QR/сайтаар бүх буудлын зочдод нээлттэй болсон тул
// цаашид тодорхой нэг буудлыг QR-аар шийдэж GPS-ээр баталгаажуулах шаардлагагүй
// болсон. Үүний оронд hotel-delivery үед зочин өөрийн буудлын нэрийг чөлөөтэй
// бичнэ (баталгаажуулалтгүй) — үүнийг хадгалах sessions.hotel_name багана нэмнэ.

async function migrate() {
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS hotel_name text;`);
  console.log('✓ sessions.hotel_name багана нэмэгдлээ.');
  console.log('Migration бүрэн дууслаа.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration алдаа:', err.message);
  process.exit(1);
});
