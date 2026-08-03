import { pool } from './pool.js';

// Оношилгооны зориулалттай — DB-д одоо ямар хүснэгт байгааг харуулна.
// Юу ч өөрчлөхгүй (зөвхөн унших). Ашиглах: node src/db/checkTables.js
async function check() {
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log('Хүснэгтүүд:', tables.rows.map(r => r.table_name));

  if (tables.rows.some(r => r.table_name === 'hotels')) {
    const hotels = await pool.query(`SELECT count(*)::int AS n FROM hotels`);
    console.log('hotels мөрийн тоо:', hotels.rows[0].n);
  }
  if (tables.rows.some(r => r.table_name === 'orders')) {
    const orders = await pool.query(`SELECT count(*)::int AS n FROM orders`);
    console.log('orders мөрийн тоо:', orders.rows[0].n);
  }
  if (tables.rows.some(r => r.table_name === 'restaurants')) {
    const restaurants = await pool.query(`SELECT id, hotel_id, name FROM restaurants ORDER BY name`);
    console.log('restaurants:', restaurants.rows);
  }
  if (tables.rows.some(r => r.table_name === 'menu_items')) {
    const menuItems = await pool.query(`SELECT count(*)::int AS n FROM menu_items`);
    console.log('menu_items мөрийн тоо (нийт):', menuItems.rows[0].n);
    const sample = await pool.query(`SELECT id, hotel_id, name, restaurant_id, available, is_deleted FROM menu_items LIMIT 3`);
    console.log('menu_items жишээ мөрүүд:', sample.rows);
  }

  await pool.end();
}

check().catch((err) => {
  console.error('Шалгахад алдаа:', err.message);
  process.exit(1);
});
