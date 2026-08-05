-- ============================================================
-- Railway Production DB Migration
-- Хуучин схемийг (hotels-тай) бүрэн устгаж шинэ схемд шилжинэ
-- ============================================================

-- 1. Хуучин table-уудыг бүгдийг устга (cascade)
DROP TABLE IF EXISTS twelve_day_plan_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS diet_types CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;

-- 2. Хуучин ENUM type-уудыг устга
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS session_order_type CASCADE;
DROP TYPE IF EXISTS session_delivery_type CASCADE;
DROP TYPE IF EXISTS meal_time CASCADE;

-- 3. pgcrypto extension (gen_random_uuid() хэрэгтэй)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 4. Шинэ ENUM type-ууд
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE session_status AS ENUM ('active', 'expired');
CREATE TYPE session_order_type AS ENUM ('twelve_day', 'one_time');
CREATE TYPE session_delivery_type AS ENUM ('hotel', 'current_location');
CREATE TYPE meal_time AS ENUM ('morning', 'lunch', 'evening');

-- 5. restaurants (hotels-аас тусдаа, diet_type-д холбогдоно)
CREATE TABLE restaurants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  diet_type_id  uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 6. diet_types
CREATE TABLE diet_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. restaurants <-> diet_types foreign key
ALTER TABLE restaurants ADD CONSTRAINT restaurants_diet_type_id_fkey
  FOREIGN KEY (diet_type_id) REFERENCES diet_types(id);

-- Нэг ангиллыг зөвхөн нэг ресторан эзэмшинэ
CREATE UNIQUE INDEX idx_restaurants_diet_type_unique
  ON restaurants(diet_type_id) WHERE diet_type_id IS NOT NULL;

-- 8. sessions
CREATE TABLE sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name         text NOT NULL,
  room_number        text,
  hotel_name         text,
  order_type         session_order_type NOT NULL,
  delivery_type      session_delivery_type,
  delivery_address   text,
  delivery_lat       double precision,
  delivery_lng       double precision,
  location_verified  boolean NOT NULL DEFAULT false,
  geo_lat            double precision,
  geo_lng            double precision,
  status             session_status NOT NULL DEFAULT 'active',
  diet_type_id       uuid REFERENCES diet_types(id),
  allergy_tags       text[] DEFAULT '{}',
  allergy_other      text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- 9. menu_items
CREATE TABLE menu_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  category      text,
  diet_type_id  uuid NOT NULL REFERENCES diet_types(id),
  price_usd     numeric(10,2) NOT NULL CHECK (price_usd >= 0),
  image_url     text,
  calories      integer,
  allergens     text[] DEFAULT '{}',
  prep_time_min integer DEFAULT 15,
  is_featured   boolean NOT NULL DEFAULT false,
  available     boolean NOT NULL DEFAULT true,
  is_deleted    boolean NOT NULL DEFAULT false,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  stock_limit   integer
);
CREATE INDEX idx_menu_items_diet       ON menu_items(diet_type_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);

-- 10. orders
CREATE TABLE orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sessions(id),
  status       order_status NOT NULL DEFAULT 'pending',
  total_usd    numeric(10,2) NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status  ON orders(status);
CREATE INDEX idx_orders_session ON orders(session_id);

-- 11. order_items
CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id     uuid NOT NULL REFERENCES menu_items(id),
  guest_name       text NOT NULL,
  quantity         integer NOT NULL CHECK (quantity > 0),
  unit_price_usd   numeric(10,2) NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 12. twelve_day_plan_items
CREATE TABLE twelve_day_plan_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number    integer NOT NULL CHECK (day_number BETWEEN 1 AND 12),
  meal_time     meal_time NOT NULL,
  menu_item_id  uuid NOT NULL REFERENCES menu_items(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day_number, meal_time, menu_item_id)
);
CREATE INDEX idx_plan_items_day ON twelve_day_plan_items(day_number);

-- 13. payments
CREATE TABLE payments (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id               uuid NOT NULL REFERENCES orders(id),
  gateway_provider       text NOT NULL,
  currency               text NOT NULL DEFAULT 'USD',
  amount_usd             numeric(10,2) NOT NULL,
  fx_rate_applied        numeric(12,6),
  amount_charged_local   numeric(14,2),
  transaction_id         text NOT NULL UNIQUE,
  status                 text NOT NULL DEFAULT 'pending',
  paid_at                timestamptz
);
CREATE INDEX idx_payments_order ON payments(order_id);

-- 14. Seed data: diet_types
INSERT INTO diet_types (id, name) VALUES
('d1111111-1111-1111-1111-111111111111', 'standard'),
('d2222222-2222-2222-2222-222222222222', 'vegetarian'),
('d3333333-3333-3333-3333-333333333333', 'vegan'),
('d4444444-4444-4444-4444-444444444444', 'halal'),
('d5555555-5555-5555-5555-555555555555', 'gluten_free')
ON CONFLICT (id) DO NOTHING;

-- 15. Seed data: restaurants
INSERT INTO restaurants (id, name) VALUES
('c1111111-1111-1111-1111-111111111111', 'Ресторан 1'),
('c2222222-2222-2222-2222-222222222222', 'Ресторан 2'),
('c3333333-3333-3333-3333-333333333333', 'Ресторан 3')
ON CONFLICT (id) DO NOTHING;

-- 16. Seed data: menu_items
INSERT INTO menu_items (id, name, description, category, diet_type_id, price_usd, image_url, calories, allergens, prep_time_min, is_featured, available, restaurant_id, stock_limit) VALUES
('a1111111-1111-1111-1111-111111111111',
 'Halal Ribeye Steak 300g',
 'Tender halal-certified ribeye grilled to perfection, served with seasonal vegetables and herb sauce.',
 'Main Course', 'd4444444-4444-4444-4444-444444444444', 28.00, NULL, 620, '{gluten}', 25, true, true, 'c1111111-1111-1111-1111-111111111111', NULL),

('a2222222-2222-2222-2222-222222222222',
 'Halal Chicken Tikka',
 'Juicy halal chicken marinated in yogurt and spices, grilled on skewers.',
 'Main Course', 'd4444444-4444-4444-4444-444444444444', 18.00, NULL, 430, '{}', 20, true, true, 'c1111111-1111-1111-1111-111111111111', 20),

('a3333333-3333-3333-3333-333333333333',
 'Caesar Salad',
 'Crisp romaine lettuce, parmesan, croutons and house Caesar dressing. Vegetarian-friendly.',
 'Salad & Appetizer', 'd2222222-2222-2222-2222-222222222222', 12.50, NULL, 280, '{gluten,dairy}', 10, false, true, 'c2222222-2222-2222-2222-222222222222', NULL),

('a4444444-4444-4444-4444-444444444444',
 'Garden Buddha Bowl',
 'Quinoa, roasted chickpeas, avocado, sweet potato and tahini drizzle.',
 'Main Course', 'd3333333-3333-3333-3333-333333333333', 16.00, NULL, 480, '{sesame}', 15, true, true, 'c2222222-2222-2222-2222-222222222222', NULL),

('a5555555-5555-5555-5555-555555555555',
 'Grilled Veggie Platter',
 'Seasonal grilled vegetables with hummus and warm pita bread.',
 'Appetizer', 'd2222222-2222-2222-2222-222222222222', 13.50, NULL, 320, '{gluten}', 12, false, true, 'c2222222-2222-2222-2222-222222222222', NULL),

('a6666666-6666-6666-6666-666666666666',
 'Vegan Mushroom Risotto',
 'Creamy arborio rice with wild mushrooms, truffle oil and fresh herbs. 100% plant-based.',
 'Main Course', 'd3333333-3333-3333-3333-333333333333', 17.50, NULL, 390, '{}', 20, true, true, 'c2222222-2222-2222-2222-222222222222', NULL),

('a7777777-7777-7777-7777-777777777777',
 'Grilled Salmon Fillet',
 'Atlantic salmon with lemon butter, capers and steamed vegetables. Naturally gluten-free.',
 'Main Course', 'd5555555-5555-5555-5555-555555555555', 24.00, NULL, 520, '{fish}', 18, true, true, 'c3333333-3333-3333-3333-333333333333', NULL),

('a8888888-8888-8888-8888-888888888888',
 'Fresh Fruit Smoothie Bowl',
 'Blended açaí, banana and mixed berries topped with granola and fresh fruits.',
 'Dessert & Drinks', 'd3333333-3333-3333-3333-333333333333', 9.00, NULL, 290, '{nuts}', 5, false, true, 'c3333333-3333-3333-3333-333333333333', NULL),

('a9999999-9999-9999-9999-999999999999',
 'New York Cheesecake',
 'Classic creamy cheesecake on a graham cracker crust with berry compote.',
 'Dessert & Drinks', 'd2222222-2222-2222-2222-222222222222', 8.50, NULL, 380, '{gluten,dairy,eggs}', 5, false, true, 'c3333333-3333-3333-3333-333333333333', NULL),

('b1111111-1111-1111-1111-111111111111',
 'Freshly Squeezed Orange Juice',
 'Chilled fresh orange juice. Vegan, gluten-free.',
 'Dessert & Drinks', 'd3333333-3333-3333-3333-333333333333', 6.00, NULL, 110, '{}', 3, false, true, 'c3333333-3333-3333-3333-333333333333', NULL)
ON CONFLICT (id) DO NOTHING;

-- Done!
SELECT 'Migration complete!' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
