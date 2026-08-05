# Буудлын in-room dining захиалгын систем — Техникийн тодорхойлолт

## 1. Ерөнхий тойм

QR код ашиглан буудлын өрөөнд байгаа зочид хоол захиалдаг систем. Зочин QR
скан хийхэд буудлын нэр/байршил харагдаж, байршлаа баталгаажуулж, нэр болон
өрөөний дугаараа оруулж нэвтэрнэ. Menu нь USD-ээр харагдана. Захиалга бүр
real-time админ дашбоард дээр харагдана (аль өрөө, хэн, юу захиалсан).

- Хэрэглэгчийн тоо: ойролцоогоор 2500
- Буудлын тоо: 30 гаруй
- Хөгжүүлэлт: ганц хүн, 1 долоо хоногийн хугацаанд backend + DB + төлбөрийн
  систем (frontend дараа шат)

## 2. Үндсэн урсгал

1. Зочин буудлын QR скан хийнэ → буудлын нэр/байршил харагдана
2. Location зөвшөөрөл асууна (navigator.geolocation), координатыг буудлын
   бүртгэлтэй lat/lng-тэй Haversine томьёогоор харьцуулж ~200м дотор бол
   `location_verified = true`
3. Зочин нэр + өрөөний дугаараа оруулна → session үүснэ
4. Menu харагдана (USD үнэтэй), захиалга өгнө
5. Захиалга admin дашбоард дээр WebSocket-аар шууд харагдана
6. Зочин төлбөрөө хийнэ (доллараар, Visa/UnionPay/WeChat Pay)
7. Gateway webhook ирж, `orders.status = paid` болно

**Аюулгүй байдлын тэмдэглэл:** Geolocation баталгаажуулалт бол зөөлөн
signal, GPS spoofing боломжтой тул хатуу хамгаалалт биш. Гол хамгаалалт нь
буудал бүрийн өвөрмөц, урт random/signed QR токен (таамаглах боломжгүй).

## 3. Techstack санал

| Давхарга | Сонголт |
|---|---|
| Backend | Node.js (Express/Fastify) эсвэл Python (FastAPI) |
| Database | PostgreSQL |
| Realtime | Socket.io / native WebSocket (admin дашбоард) |
| Session | Redis эсвэл JWT-based cookie |
| Hosting | DigitalOcean / Render / Railway (Linux) |
| Dev орчин | Linux (WSL2 хэрэггүй — шууд Linux байгаа) |

## 4. Өгөгдлийн сангийн схем (ERD)

```
HOTELS ||--o{ SESSIONS : hosts
SESSIONS ||--o{ ORDERS : places
ORDERS ||--o{ ORDER_ITEMS : contains
MENU_ITEMS ||--o{ ORDER_ITEMS : referenced_by
ORDERS ||--o| PAYMENTS : paid_by
HOTELS ||--o{ MENU_ITEMS : offers

HOTELS
  id                uuid PK
  name              string
  address           string
  latitude          float
  longitude         float
  qr_token          string   -- urt random/signed, taamaglah bolomjgui

SESSIONS
  id                 uuid PK
  hotel_id           uuid FK
  guest_name         string
  room_number        string   -- chuluut text, buudal buriin durlagalt ondoo
  location_verified  bool
  geo_lat            float
  geo_lng            float
  created_at         timestamp
  status             string   -- active / expired

MENU_ITEMS
  id           uuid PK
  hotel_id     uuid FK
  name         string
  category     string
  price_usd    decimal
  available    bool

ORDERS
  id           uuid PK
  session_id   uuid FK
  hotel_id     uuid FK
  status       enum   -- pending, paid, cancelled
  total_usd    decimal
  created_at   timestamp

ORDER_ITEMS
  id               uuid PK
  order_id         uuid FK
  menu_item_id     uuid FK
  guest_name       string   -- ter ordertei room dotor hen zahialsniig ялгах
  quantity         int
  unit_price_usd   decimal

PAYMENTS
  id                     uuid PK
  order_id               uuid FK
  gateway_provider       string   -- 2c2p / airwallex / bank / qpay гэх мэт
  currency               string
  amount_usd             decimal
  fx_rate_applied        decimal
  amount_charged_local   decimal
  transaction_id         string   -- UNIQUE constraint, webhook давхардлаас сэргийлнэ
  status                 string
  paid_at                timestamp
```

### Индекс, constraint-ийн зөвлөмж
- `orders.hotel_id`, `orders.status`, `order_items.order_id` дээр индекс
- `payments.transaction_id` дээр UNIQUE constraint (webhook idempotency)
- `orders.status` — ENUM ашиглах, чөлөөт string биш
- `sessions.created_at` дээр TTL/expiry логик (24 цагийн дараа `expired`)

## 5. Төлбөрийн систем

**Гол шаардлага:** гадаадын зочид Visa/UnionPay/WeChat Pay-аар доллараар
төлбөр хийж, мөнгө нь манай данс руу орох ёстой.

Санал болгож буй эрэмбэ:
1. **2C2P** — Ази чиглэсэн PSP, hospitality-д familiar (Cloudbeds гэх мэт
   PMS-тэй интеграцтай), Visa/Mastercard/UnionPay/WeChat Pay/Alipay нэг API
   дор, USD-аар settlement хийх боломжтой. Монгол компанийг мерчант болгож
   авах эсэхийг эхлээд шалгах.
2. **Airwallex** — олон валютын данс, USD цуглуулах боломжтой, гэхдээ зөвхөн
   тодорхой жагсаалттай орны компанийг онлайн бүртгэдэг тул Монгол
   жагсаалтад байгаа эсэхийг шалгах шаардлагатай (байхгүй бол Гонг Конг/
   Сингапур компани нээх хувилбар).
3. **Монголын банкны e-commerce gateway (Голомт/Хаан)** — Visa/UnionPay-г
   MNT-ээр авдаг (WeChat Pay дэмждэггүй), нөөц/эхний шатны сонголт.

**Чухал:** ямар ч gateway сонгосон ч `payments` хүснэгтэд
`gateway_provider`, `currency`, `amount_usd`, `fx_rate_applied`-г тусад нь
хадгалж, олон gateway-г сольж ашиглах боломжтой abstraction layer байгуулах.

## 6. 2500 хэрэглэгчид анхаарах зүйлс

- **Concurrency:** захиалга үүсэх мөчид DB transaction/row-level lock ашиглаж
  race condition-оос сэргийлэх
- **Webhook idempotency:** `transaction_id` дээр unique constraint
- **QR аюулгүй байдал:** QR токен урт, таамаглах боломжгүй, session-той
  холбогдсон байх
- **Load testing:** k6 эсвэл Artillery ашиглаж 2500 concurrent хэрэглэгчийг
  симуляц хийх
- **Backup горим:** gateway унавал гар аргаар захиалга авах нөөц процесс

## 7. API endpoint-ийн эхний жагсаалт (backend эхлэх цэг)

```
POST   /api/hotels/:qr_token/resolve      -- QR-аас буудлын мэдээлэл авах
POST   /api/sessions                      -- session үүсгэх (нэр, өрөө, geo)
GET    /api/hotels/:hotel_id/menu         -- menu татах
POST   /api/orders                        -- захиалга үүсгэх
GET    /api/orders/:id                    -- захиалгын дэлгэрэнгүй
POST   /api/payments/initiate             -- төлбөр эхлүүлэх (gateway руу)
POST   /api/payments/webhook/:provider    -- gateway webhook хүлээн авах
GET    /api/admin/orders/live             -- WebSocket, admin дашбоард
PATCH  /api/admin/orders/:id/status       -- ажилтан статус солих
```

## 8. 7 хоногийн төлөвлөгөө

1. **1-р өдөр:** DB схем, backend skeleton, QR token generation
2. **2-р өдөр:** Session API (geo verify, room number), menu CRUD
3. **3-р өдөр:** Order/order_items API, WebSocket admin realtime
4. **4-5-р өдөр:** Төлбөрийн интеграц (sandbox эхлээд), webhook handler
5. **6-р өдөр:** Load testing, аюулгүй байдлын шалгалт (QR spoof, session
   hijack)
6. **7-р өдөр:** Production key/гэрээ дутуу бол sandbox дээр demo бэлэн
   болгож, frontend-ийг зэрэгцүүлж эхлэх
