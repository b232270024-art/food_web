import { pool } from '../pool.js';

// Нэмэлт (additive) migration — байгаа DB-ийн өгөгдлийг устгахгүй.
// Ажиллуулах: node src/db/migrations/003_meal_plan.js
//
// Admin-ийн удирддаг "12 хоногийн цэс" (өдөр тус бүрийн өглөө/өдөр/оройн
// хоол) хадгалах хүснэгт.

async function migrate() {
  await pool.query(`DO $$ BEGIN
    CREATE TYPE meal_time AS ENUM ('morning', 'lunch', 'evening');
  EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  console.log("✓ meal_time enum бэлэн.");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS twelve_day_plan_items (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      hotel_id      uuid NOT NULL REFERENCES hotels(id),
      day_number    integer NOT NULL CHECK (day_number BETWEEN 1 AND 12),
      meal_time     meal_time NOT NULL,
      menu_item_id  uuid NOT NULL REFERENCES menu_items(id),
      created_at    timestamptz NOT NULL DEFAULT now(),
      UNIQUE (hotel_id, day_number, meal_time, menu_item_id)
    );
  `);
  console.log('✓ twelve_day_plan_items хүснэгт бэлэн.');

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_plan_items_hotel_day ON twelve_day_plan_items(hotel_id, day_number);`);
  console.log('✓ Индекс бэлэн.');

  console.log('Migration бүрэн дууслаа.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration алдаа:', err.message);
  process.exit(1);
});
