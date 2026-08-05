import { pool } from '../pool.js';

// ⚠️ ЭВДРЭЛТЭЙ (destructive) migration — бусад migration-уудаас ялгаатай нь
// нэмэлт биш, устгалт хийнэ: hotels хүснэгт болон hotel_id багануудыг
// бүрмөсөн хасна. Систем зөвхөн 1 л hotel-тэй ажиллаж байсан бөгөөд цаашид
// олон hotel дэмжихгүй тул энэ scoping давхаргыг бүхэлд нь хасаж байна.
//
// Ажиллуулахын өмнө: DB-г нөөцлөх (backup) эсвэл шаардлагатай бол дахин
// үүсгэж болохыг баталгаажуулаарай — энэ migration буцаах боломжгүй.
// Ажиллуулах: node src/db/migrations/006_remove_hotels.js
// Дараа нь: node src/db/migrations/007_restaurant_diet_lock_and_allergies.js

async function migrate() {
  await pool.query(`ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_hotel_id_name_key;`);
  await pool.query(`ALTER TABLE restaurants DROP COLUMN IF EXISTS hotel_id;`);
  await pool.query(`ALTER TABLE restaurants ADD CONSTRAINT restaurants_name_key UNIQUE (name);`);
  console.log('✓ restaurants.hotel_id хасагдаж, name дээр UNIQUE болголоо.');

  await pool.query(`DROP INDEX IF EXISTS idx_menu_items_hotel;`);
  await pool.query(`ALTER TABLE menu_items DROP COLUMN IF EXISTS hotel_id;`);
  console.log('✓ menu_items.hotel_id хасагдлаа.');

  await pool.query(`DROP INDEX IF EXISTS idx_sessions_hotel;`);
  await pool.query(`ALTER TABLE sessions DROP COLUMN IF EXISTS hotel_id;`);
  console.log('✓ sessions.hotel_id хасагдлаа.');

  await pool.query(`DROP INDEX IF EXISTS idx_orders_hotel;`);
  await pool.query(`ALTER TABLE orders DROP COLUMN IF EXISTS hotel_id;`);
  console.log('✓ orders.hotel_id хасагдлаа.');

  await pool.query(`ALTER TABLE twelve_day_plan_items DROP CONSTRAINT IF EXISTS twelve_day_plan_items_hotel_id_day_number_meal_time_menu_i_key;`);
  await pool.query(`DROP INDEX IF EXISTS idx_plan_items_hotel_day;`);
  await pool.query(`ALTER TABLE twelve_day_plan_items DROP COLUMN IF EXISTS hotel_id;`);
  await pool.query(`ALTER TABLE twelve_day_plan_items ADD CONSTRAINT twelve_day_plan_items_day_meal_item_key UNIQUE (day_number, meal_time, menu_item_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_plan_items_day ON twelve_day_plan_items(day_number);`);
  console.log('✓ twelve_day_plan_items.hotel_id хасагдаж, UNIQUE/INDEX шинэчлэгдлээ.');

  await pool.query(`DROP TABLE IF EXISTS hotels;`);
  console.log('✓ hotels хүснэгт устгагдлаа.');

  console.log('Migration бүрэн дууслаа.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration алдаа:', err.message);
  process.exit(1);
});
