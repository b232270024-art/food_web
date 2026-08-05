import { pool } from '../pool.js';

// Нэмэлт (additive) migration — байгаа DB-ийн өгөгдлийг устгахгүй.
// 007_restaurant_diet_lock_and_allergies.js-ийн ДАРАА ажиллуулна.
// Ажиллуулах: node src/db/migrations/008_restaurant_daily_order_limit.js
//
// restaurants.daily_order_limit — тухайн ресторан өдөрт хэдэн ЗАХИАЛГА
// (menu item stock биш, "захиалгын тоо") авахыг хязгаарлана. NULL = хязгааргүй.
// Лимит хүрэхэд зочин шинэ захиалга өгөх үед алдаа буцна (orders.js).

async function migrate() {
  await pool.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS daily_order_limit integer DEFAULT 100;`);
  console.log('✓ restaurants.daily_order_limit багана нэмэгдлээ (анхны утга 100).');

  await pool.query(`UPDATE restaurants SET daily_order_limit = 100 WHERE daily_order_limit IS NULL;`);
  console.log('✓ Одоо байгаа ресторануудад daily_order_limit=100 тохирууллаа.');

  console.log('Migration бүрэн дууслаа.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration алдаа:', err.message);
  process.exit(1);
});
