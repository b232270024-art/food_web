import pg from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

let isPgConnected = false;
let realPool = null;

if (process.env.DATABASE_URL) {
  realPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 2000,
  });
}

// In-Memory Database Store as fallback if PostgreSQL is not configured or offline.
// ⚠️ Зөвхөн DATABASE_URL тохируулаагүй/холбогдоогүй үед л ашиглагдана — бодит
// route-уудын SQL-тэй бүрэн синк биш (жишээ нь hotels-той холбоотой хэсгүүд
// hotels table устсаны дараа хэзээ ч дуудагдахгүй тул хассан). Хөгжүүлэлтэд
// үргэлж бодит Postgres (.env-ийн DATABASE_URL) ашиглахыг зөвлөнө.
const inMemoryDb = {
  sessions: [],
  menu_items: [
    { id: uuidv4(), name: 'Стейк (Ribeye Steak 300g)', category: 'Гол хоол', price_usd: 28.00, available: true },
    { id: uuidv4(), name: 'Цезарь Салат (Caesar Salad)', category: 'Зууш & Салат', price_usd: 12.50, available: true },
    { id: uuidv4(), name: 'Клуб Сендвич (Club Sandwich)', category: 'Зууш & Салат', price_usd: 14.00, available: true },
    { id: uuidv4(), name: 'Бургер ба Фри (Cheeseburger & Fries)', category: 'Гол хоол', price_usd: 16.50, available: true },
    { id: uuidv4(), name: 'Улаан дарс (Red Wine - Pinot Noir)', category: 'Уух зүйлс', price_usd: 10.00, available: true },
    { id: uuidv4(), name: 'Шинэхэн Жимсний Шүүс (Fresh Juice)', category: 'Уух зүйлс', price_usd: 6.00, available: true },
    { id: uuidv4(), name: 'Чизкейк (New York Cheesecake)', category: 'Дессерт', price_usd: 8.50, available: true }
  ],
  orders: [],
  order_items: [],
  payments: []
};

// Check PostgreSQL connection
if (realPool) {
  realPool.query('SELECT 1').then(() => {
    isPgConnected = true;
    console.log('✅ PostgreSQL өгөгдлийн сантай амжилттай холбогдлоо.');
  }).catch(() => {
    console.log('⚠️ PostgreSQL холболт амжилтгүй болсон тул санах ойн (In-Memory) туршилтын сан руу шилжлээ.');
  });
}

async function handleInMemoryQuery(text, params = []) {
  const sql = text.trim().replace(/\s+/g, ' ');

  // 3. INSERT INTO sessions
  if (sql.startsWith('INSERT INTO sessions')) {
    const newSession = {
      id: uuidv4(),
      hotel_id: params[0],
      guest_name: params[1],
      room_number: params[2],
      location_verified: Boolean(params[3]),
      geo_lat: params[4] || null,
      geo_lng: params[5] || null,
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString()
    };
    inMemoryDb.sessions.push(newSession);
    return { rows: [newSession] };
  }

  // 4. SELECT menu_items
  if (sql.includes('FROM menu_items WHERE hotel_id = $1')) {
    const items = inMemoryDb.menu_items.filter(m => m.hotel_id === params[0] || true);
    return { rows: items };
  }

  // 5. INSERT INTO menu_items
  if (sql.startsWith('INSERT INTO menu_items')) {
    const newItem = {
      id: uuidv4(),
      hotel_id: params[0],
      name: params[1],
      category: params[2],
      price_usd: params[3],
      available: true
    };
    inMemoryDb.menu_items.push(newItem);
    return { rows: [newItem] };
  }

  // 6. SELECT price_usd FROM menu_items
  if (sql.includes('FROM menu_items WHERE id = $1')) {
    const item = inMemoryDb.menu_items.find(m => m.id === params[0]);
    return { rows: item ? [item] : [] };
  }

  // 7. INSERT INTO orders
  if (sql.startsWith('INSERT INTO orders')) {
    const newOrder = {
      id: uuidv4(),
      session_id: params[0],
      hotel_id: params[1],
      status: 'pending',
      total_usd: 0,
      created_at: new Date().toISOString()
    };
    inMemoryDb.orders.push(newOrder);
    return { rows: [newOrder] };
  }

  // 8. INSERT INTO order_items
  if (sql.startsWith('INSERT INTO order_items')) {
    const newOrderItem = {
      id: uuidv4(),
      order_id: params[0],
      menu_item_id: params[1],
      guest_name: params[2],
      quantity: params[3],
      unit_price_usd: params[4]
    };
    inMemoryDb.order_items.push(newOrderItem);
    return { rows: [newOrderItem] };
  }

  // 9. UPDATE orders SET total_usd = $1 WHERE id = $2
  if (sql.startsWith('UPDATE orders SET total_usd = $1')) {
    const order = inMemoryDb.orders.find(o => o.id === params[1]);
    if (order) order.total_usd = params[0];
    return { rows: order ? [order] : [] };
  }

  // 10. UPDATE orders SET status = $1 WHERE id = $2
  if (sql.startsWith('UPDATE orders SET status = $1')) {
    const order = inMemoryDb.orders.find(o => o.id === params[1]);
    if (order) order.status = params[0];
    return { rows: order ? [order] : [] };
  }

  // 11. SELECT * FROM orders WHERE id = $1
  if (sql.includes('FROM orders WHERE id = $1')) {
    const order = inMemoryDb.orders.find(o => o.id === params[0]);
    return { rows: order ? [order] : [] };
  }

  // 12. SELECT orders live
  if (sql.includes('FROM orders o')) {
    const rows = inMemoryDb.orders
      .filter(o => o.status !== 'cancelled')
      .map(o => {
        const sess = inMemoryDb.sessions.find(s => s.id === o.session_id) || {};
        return {
          id: o.id,
          status: o.status,
          total_usd: o.total_usd,
          created_at: o.created_at,
          room_number: sess.room_number || '305',
          guest_name: sess.guest_name || 'Guest'
        };
      });
    return { rows };
  }

  // 13. INSERT INTO payments
  if (sql.startsWith('INSERT INTO payments')) {
    const newPay = {
      id: uuidv4(),
      order_id: params[0],
      gateway_provider: params[1],
      currency: 'USD',
      amount_usd: params[2],
      transaction_id: params[3],
      status: 'pending'
    };
    inMemoryDb.payments.push(newPay);
    return { rows: [newPay] };
  }

  // 14. UPDATE payments
  if (sql.startsWith('UPDATE payments')) {
    const pay = inMemoryDb.payments.find(p => p.transaction_id === params[3]);
    if (pay) pay.status = params[0];
    return { rows: pay ? [pay] : [] };
  }

  return { rows: [] };
}

export const pool = {
  query: async (text, params) => {
    if (realPool) {
      try {
        const res = await realPool.query(text, params);
        if (!isPgConnected) {
          isPgConnected = true;
          console.log('✅ PostgreSQL өгөгдлийн сантай амжилттай холбогдлоо.');
        }
        return res;
      } catch (err) {
        // If connection failed, fallback to in-memory DB
        if (!isPgConnected || err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000') {
          if (isPgConnected) {
            console.log('⚠️ PostgreSQL холболт тасарсан тул санах ойн сан руу шилжлээ.');
            isPgConnected = false;
          }
          return handleInMemoryQuery(text, params);
        }
        // Query error while connected - throw it
        throw err;
      }
    }
    return handleInMemoryQuery(text, params);
  },
  connect: async () => {
    if (isPgConnected && realPool) {
      try {
        const client = await realPool.connect();
        return client;
      } catch (err) {
        // Fallback mock client
      }
    }

    return {
      query: async (text, params) => handleInMemoryQuery(text, params),
      release: () => {}
    };
  },
  end: async () => {
    if (realPool) await realPool.end();
  }
};
