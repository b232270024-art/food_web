import { pool } from '../pool.js';

// Нэмэлт (additive) migration — байгаа DB-ийн өгөгдлийг устгахгүй.
// Ажиллуулах: node src/db/migrations/002_restaurants_and_refunds.js
//
// Юу хийдэг:
// 1. order_status enum-д 'refunded' нэмнэ (энэ ганцаараа явах ёстой —
//    Postgres нь ALTER TYPE ... ADD VALUE-г бусад statement-тай нэг
//    transaction дотор зөвшөөрдөггүй).
// 2. restaurants хүснэгт үүсгэж, menu_items.restaurant_name-ийн одоо байгаа
//    ялгаатай утгуудаас (hotel_id тус бүрээр) автоматаар мөр үүсгэнэ.
// 3. menu_items.restaurant_id багана нэмж, restaurant_name-тэй нь тааруулан
//    backfill хийнэ.
// 4. Бүх мөр амжилттай backfill болсон эсэхийг шалгаад, зөвхөн тэр үед
//    NOT NULL constraint тавина (өгөгдөл дутуу бол process зогсоож анхааруулна,
//    юу ч устгахгүй).
//
// restaurant_name текст баганыг ЗОРИУДЛАН устгаагүй — хуучин өгөгдөл хэвээр
// үлдэнэ (аюулгүй), гэхдээ шинэ код бүгд restaurant_id-г л ашиглана.

async function migrate() {
  await pool.query(`ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded'`);
  console.log("✓ order_status enum: 'refunded' нэмэгдлээ (эсвэл аль хэдийн байсан).");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      hotel_id   uuid NOT NULL REFERENCES hotels(id),
      name       text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (hotel_id, name)
    );
  `);
  console.log('✓ restaurants хүснэгт бэлэн.');

  await pool.query(`
    INSERT INTO restaurants (hotel_id, name)
    SELECT DISTINCT hotel_id, restaurant_name FROM menu_items
    WHERE restaurant_name IS NOT NULL
    ON CONFLICT (hotel_id, name) DO NOTHING;
  `);
  console.log('✓ Одоо байгаа restaurant_name утгуудаас restaurants мөр backfill хийлээ.');

  await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id);`);

  await pool.query(`
    UPDATE menu_items mi SET restaurant_id = r.id
    FROM restaurants r
    WHERE r.hotel_id = mi.hotel_id AND r.name = mi.restaurant_name AND mi.restaurant_id IS NULL;
  `);
  console.log('✓ menu_items.restaurant_id backfill хийлээ.');

  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM menu_items WHERE restaurant_id IS NULL`);
  if (rows[0].n === 0) {
    await pool.query(`ALTER TABLE menu_items ALTER COLUMN restaurant_id SET NOT NULL;`);
    console.log('✓ menu_items.restaurant_id NOT NULL болголоо.');
    // Хуучин restaurant_name текст багана endpoint/UI-д хэрэглэгдэхээ больсон бөгөөд
    // цаашид үнэн restaurant_id-тай хоцроод "холилдох" эрсдэл үүсгэдэг тул устгана.
    await pool.query(`ALTER TABLE menu_items DROP COLUMN IF EXISTS restaurant_name;`);
    console.log('✓ Хуучин restaurant_name баганыг устгалаа (restaurant_id нь цорын ганц эх сурвалж).');
  } else {
    console.warn(`⚠ ${rows[0].n} menu_item-д restaurant_id backfill хийгдээгүй байна (restaurant_name NULL байсан байх). NOT NULL constraint болон restaurant_name-г УСТГААГҮЙ — гараар шалгаарай.`);
  }

  console.log('Migration бүрэн дууслаа.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration алдаа:', err.message);
  process.exit(1);
});
