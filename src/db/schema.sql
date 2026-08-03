-- Буудлын in-room dining захиалгын системийн DB схем

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS twelve_day_plan_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;

DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS diet_type CASCADE;
DROP TYPE IF EXISTS session_order_type CASCADE;
DROP TYPE IF EXISTS session_delivery_type CASCADE;
DROP TYPE IF EXISTS meal_time CASCADE;

CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'served', 'paid', 'cancelled', 'refunded');
CREATE TYPE session_status AS ENUM ('active', 'expired');
CREATE TYPE diet_type AS ENUM ('standard', 'vegetarian', 'vegan', 'halal', 'gluten_free');
CREATE TYPE session_order_type AS ENUM ('twelve_day', 'one_time');
CREATE TYPE session_delivery_type AS ENUM ('hotel', 'current_location');
CREATE TYPE meal_time AS ENUM ('morning', 'lunch', 'evening');

CREATE TABLE hotels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  address     text,
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  qr_token    text NOT NULL UNIQUE,
  is_deleted  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Нэг hotel дотор 2-3 өөр гал тогооны нэгж (dining outlet) ажилладаг тохиолдолд
-- зориулав — admin dashboard-ийн Menu/Orders хуудсуудын гол filter нь энэ.
CREATE TABLE restaurants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   uuid NOT NULL REFERENCES hotels(id),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, name)
);

CREATE TABLE sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id           uuid NOT NULL REFERENCES hotels(id),
  guest_name         text NOT NULL,
  room_number        text,
  order_type         session_order_type NOT NULL,
  delivery_type      session_delivery_type,
  delivery_address   text,
  delivery_lat       double precision,
  delivery_lng       double precision,
  location_verified  boolean NOT NULL DEFAULT false,
  geo_lat            double precision,
  geo_lng            double precision,
  status             session_status NOT NULL DEFAULT 'active',
  created_at         timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE INDEX idx_sessions_hotel ON sessions(hotel_id);

CREATE TABLE menu_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      uuid NOT NULL REFERENCES hotels(id),
  name          text NOT NULL,
  description   text,
  category      text,
  diet_type     diet_type NOT NULL DEFAULT 'standard',
  price_usd     numeric(10,2) NOT NULL CHECK (price_usd >= 0),
  image_url     text,
  calories      integer,
  allergens     text[] DEFAULT '{}',
  prep_time_min integer DEFAULT 15,
  is_featured   boolean NOT NULL DEFAULT false,
  available     boolean NOT NULL DEFAULT true,
  is_deleted    boolean NOT NULL DEFAULT false,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  stock_limit   integer -- Өдөр тутам 0-ээс дахин эхэлдэг лимит (NULL = хязгааргүй)
);
CREATE INDEX idx_menu_items_hotel ON menu_items(hotel_id);
CREATE INDEX idx_menu_items_diet  ON menu_items(diet_type);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);

CREATE TABLE orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES sessions(id),
  hotel_id     uuid NOT NULL REFERENCES hotels(id),
  status       order_status NOT NULL DEFAULT 'pending',
  total_usd    numeric(10,2) NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_hotel ON orders(hotel_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_session ON orders(session_id);

CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id     uuid NOT NULL REFERENCES menu_items(id),
  guest_name       text NOT NULL,
  quantity         integer NOT NULL CHECK (quantity > 0),
  unit_price_usd   numeric(10,2) NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Admin-ийн удирддаг "12 хоногийн цэс" — өдөр (1-12) тус бүрийн
-- өглөө/өдөр/оройн хоолонд ямар menu item(ууд) орохыг тодорхойлно.
CREATE TABLE twelve_day_plan_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      uuid NOT NULL REFERENCES hotels(id),
  day_number    integer NOT NULL CHECK (day_number BETWEEN 1 AND 12),
  meal_time     meal_time NOT NULL,
  menu_item_id  uuid NOT NULL REFERENCES menu_items(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, day_number, meal_time, menu_item_id)
);
CREATE INDEX idx_plan_items_hotel_day ON twelve_day_plan_items(hotel_id, day_number);

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

-- Initial Seed Data
INSERT INTO hotels (id, name, address, latitude, longitude, qr_token) VALUES
('11111111-1111-1111-1111-111111111111', 'Grand Shangri-La Hotel', 'Ulaanbaatar, Sukhbaatar District', 47.9184, 106.9177, 'test-qr-token-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO restaurants (id, hotel_id, name) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Ресторан 1'),
('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Ресторан 2'),
('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Ресторан 3')
ON CONFLICT (id) DO NOTHING;

INSERT INTO menu_items (id, hotel_id, name, description, category, diet_type, price_usd, image_url, calories, allergens, prep_time_min, is_featured, available, restaurant_id, stock_limit) VALUES
-- Halal dishes
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Halal Ribeye Steak 300g',
 'Tender halal-certified ribeye grilled to perfection, served with seasonal vegetables and herb sauce.',
 'Main Course', 'halal', 28.00, NULL, 620, '{gluten}', 25, true, true, 'c1111111-1111-1111-1111-111111111111', NULL),

('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
 'Halal Chicken Tikka',
 'Juicy halal chicken marinated in yogurt and spices, grilled on skewers.',
 'Main Course', 'halal', 18.00, NULL, 430, '{}', 20, true, true, 'c1111111-1111-1111-1111-111111111111', 20),

-- Vegetarian dishes
('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
 'Caesar Salad',
 'Crisp romaine lettuce, parmesan, croutons and house Caesar dressing. Vegetarian-friendly.',
 'Salad & Appetizer', 'vegetarian', 12.50, NULL, 280, '{gluten,dairy}', 10, false, true, 'c2222222-2222-2222-2222-222222222222', NULL),

('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
 'Garden Buddha Bowl',
 'Quinoa, roasted chickpeas, avocado, sweet potato and tahini drizzle.',
 'Main Course', 'vegan', 16.00, NULL, 480, '{sesame}', 15, true, true, 'c2222222-2222-2222-2222-222222222222', NULL),

('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
 'Grilled Veggie Platter',
 'Seasonal grilled vegetables with hummus and warm pita bread.',
 'Appetizer', 'vegetarian', 13.50, NULL, 320, '{gluten}', 12, false, true, 'c2222222-2222-2222-2222-222222222222', NULL),

-- Vegan dishes
('a6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
 'Vegan Mushroom Risotto',
 'Creamy arborio rice with wild mushrooms, truffle oil and fresh herbs. 100% plant-based.',
 'Main Course', 'vegan', 17.50, NULL, 390, '{}', 20, true, true, 'c2222222-2222-2222-2222-222222222222', NULL),

-- Gluten-free dishes
('a7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
 'Grilled Salmon Fillet',
 'Atlantic salmon with lemon butter, capers and steamed vegetables. Naturally gluten-free.',
 'Main Course', 'gluten_free', 24.00, NULL, 520, '{fish}', 18, true, true, 'c3333333-3333-3333-3333-333333333333', NULL),

('a8888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111',
 'Fresh Fruit Smoothie Bowl',
 'Blended açaí, banana and mixed berries topped with granola and fresh fruits.',
 'Dessert & Drinks', 'vegan', 9.00, NULL, 290, '{nuts}', 5, false, true, 'c3333333-3333-3333-3333-333333333333', NULL),

('a9999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111',
 'New York Cheesecake',
 'Classic creamy cheesecake on a graham cracker crust with berry compote.',
 'Dessert & Drinks', 'vegetarian', 8.50, NULL, 380, '{gluten,dairy,eggs}', 5, false, true, 'c3333333-3333-3333-3333-333333333333', NULL),

('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Freshly Squeezed Orange Juice',
 'Chilled fresh orange juice. Vegan, gluten-free.',
 'Dessert & Drinks', 'vegan', 6.00, NULL, 110, '{}', 3, false, true, 'c3333333-3333-3333-3333-333333333333', NULL)
ON CONFLICT (id) DO NOTHING;
