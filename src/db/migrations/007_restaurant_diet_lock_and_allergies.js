import { pool } from '../pool.js';

// Нэмэлт (additive) migration — байгаа DB-ийн өгөгдлийг устгахгүй.
// 006_remove_hotels.js-ийн ДАРАА ажиллуулна.
// Ажиллуулах: node src/db/migrations/007_restaurant_diet_lock_and_allergies.js
//
// 1) restaurants.diet_type_id — ресторан ↔ ангилал 1:1 болгоно (NULL =
//    одоохондоо оноогоогүй, admin Тохиргоо хуудаснаас гараар оноох ёстой —
//    одоо байгаа холимог demo өгөгдлийг таамаглаж force-reassign хийхгүй).
// 2) sessions.diet_type_id / allergy_tags / allergy_other — зочны 12
//    хоногийн сонгосон ангилал болон мэдэгдсэн харшлыг session дээр хадгална.

async function migrate() {
  await pool.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS diet_type_id uuid REFERENCES diet_types(id);`);
  console.log('✓ restaurants.diet_type_id багана нэмэгдлээ.');

  // Нэг ангиллыг зөвхөн НЭГ ресторан эзэмшинэ (hotel_id байхгүй болсон тул
  // одоо глобаль; NULL-үүд хоорондоо мөргөлдөхгүй — partial unique index).
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_diet_type_unique
      ON restaurants(diet_type_id) WHERE diet_type_id IS NOT NULL;
  `);
  console.log('✓ restaurants(diet_type_id) UNIQUE index бэлэн.');

  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS diet_type_id uuid REFERENCES diet_types(id);`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS allergy_tags text[] DEFAULT '{}';`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS allergy_other text;`);
  console.log('✓ sessions.diet_type_id / allergy_tags / allergy_other багануудыг нэмэгдлээ.');

  console.log('Migration бүрэн дууслаа.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration алдаа:', err.message);
  process.exit(1);
});
