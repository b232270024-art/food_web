# Hotel dining backend

## Суулгах

```bash
npm install
cp .env.example .env
# .env дотор DATABASE_URL, JWT_SECRET-ээ өөрчил
```

## PostgreSQL бэлдэх

```bash
createdb hotel_dining
npm run migrate
```

## Ажиллуулах

```bash
npm run dev
```

Сервер эхэлмэгц: `http://localhost:4000/health` → `{ ok: true }`

## Гараар туршиж үзэх (curl жишээ)

```bash
# 1. Буудал нэмэх (одоохондоо шууд SQL-ээр эсвэл psql-ээр)
psql hotel_dining -c "INSERT INTO hotels (name, address, latitude, longitude, qr_token) \
  VALUES ('Blue Sky Hotel', 'Ulaanbaatar', 47.9184, 106.9177, 'test-qr-token-001') RETURNING id;"

# 2. QR resolve
curl http://localhost:4000/api/hotels/test-qr-token-001/resolve

# 3. Session үүсгэх (hotel_id-г дээрх response-ээс ав)
curl -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"hotel_id":"<HOTEL_ID>","guest_name":"Bold","room_number":"305","geo_lat":47.9184,"geo_lng":106.9177}'

# 4. Menu item нэмэх
curl -X POST http://localhost:4000/api/menu/<HOTEL_ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"Хуушуур","category":"Гол хоол","price_usd":4.5}'

# 5. Захиалга үүсгэх (token-г session response-ээс ав)
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"items":[{"menu_item_id":"<MENU_ITEM_ID>","quantity":2,"guest_name":"Bold"}]}'
```

## Дараагийн алхмууд (PROJECT_SPEC.md-тэй уялдуулан)

- [ ] Төлбөрийн gateway-ийн бодит API-г `src/routes/payments.js`-д холбох
      (2C2P / Airwallex / банкны gateway)
- [ ] `sessions.expires_at` дээр cron/scheduled job тавьж хугацаа дууссан
      session-г `expired` болгох
- [ ] Rate limiting нэмэх (express-rate-limit)
- [ ] Load testing (k6 / Artillery) — 2500 concurrent хэрэглэгч
- [ ] Admin authentication нэмэх (одоогоор admin route-д auth байхгүй,
      зөвхөн dev/test зориулалттай)
