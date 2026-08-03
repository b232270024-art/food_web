import { pool } from '../pool.js';

// Нэмэлт (additive) migration — байгаа DB-ийн өгөгдлийг устгахгүй.
// Ажиллуулах: node src/db/migrations/004_diet_types.js
//
// diet_type баганыг (хатуу Postgres ENUM, admin-аас нэмэх/устгах боломжгүй)
// бодит diet_types хүснэгт рүү шилжүүлнэ (restaurant_name → restaurant_id-
// той хийсэн 002-той яг адил аюулгүй хэв маяг).

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS diet_types (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name       text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('✓ diet_types хүснэгт бэлэн.');

  await pool.query(`
    INSERT INTO diet_types (name)
    SELECT DISTINCT diet_type::text FROM menu_items
    ON CONFLICT (name) DO NOTHING;
  `);
  // Одоо байгаа menu_items-с гадна анхны 5 стандарт утгыг ч (хэрэв огт
  // ашиглагдаагүй ч гэсэн) баталгаажуулж нэмнэ — шинэ хоол нэмэхэд сонголт
  // хомсдохгүй байх үүднээс.
  await pool.query(`
    INSERT INTO diet_types (name) VALUES
      ('standard'), ('vegetarian'), ('vegan'), ('halal'), ('gluten_free')
    ON CONFLICT (name) DO NOTHING;
  `);
  console.log('✓ Одоо байгаа diet_type enum утгуудаас diet_types backfill хийлээ.');

  await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS diet_type_id uuid REFERENCES diet_types(id);`);
  await pool.query(`
    UPDATE menu_items mi SET diet_type_id = dt.id
    FROM diet_types dt
    WHERE dt.name = mi.diet_type::text AND mi.diet_type_id IS NULL;
  `);
  console.log('✓ menu_items.diet_type_id backfill хийлээ.');

  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM menu_items WHERE diet_type_id IS NULL`);
  if (rows[0].n === 0) {
    await pool.query(`ALTER TABLE menu_items ALTER COLUMN diet_type_id SET NOT NULL;`);
    await pool.query(`ALTER TABLE menu_items DROP COLUMN IF EXISTS diet_type;`);
    await pool.query(`DROP TYPE IF EXISTS diet_type;`);
    console.log('✓ diet_type_id NOT NULL болгож, хуучин diet_type баганa/enum type-г устгалаа.');
  } else {
    console.warn(`⚠ ${rows[0].n} menu_item-д diet_type_id backfill хийгдээгүй. NOT NULL/DROP хийгээгүй — гараар шалгаарай.`);
  }

  console.log('Migration бүрэн дууслаа.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration алдаа:', err.message);
  process.exit(1);
});
