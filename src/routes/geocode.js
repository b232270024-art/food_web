import { Router } from 'express';
import https from 'https';
import { asyncHandler } from '../middleware/errorHandler.js';

export const geocodeRouter = Router();

// "Одоогийн байршил"-аар хүргүүлэх зочны координатыг уншигдах хаяг болгож
// хөрвүүлнэ. Nominatim (OpenStreetMap) руу зөвхөн backend талаас дуудна —
// тэдний ашиглалтын бодлого (тодорхой User-Agent шаардах, CORS дэмжихгүй)
// шалтгаанаар frontend-с шууд дуудахгүй.
geocodeRouter.get('/reverse', asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'lat, lng параметр буруу байна.' });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;

  const data = await new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'hotel-dining-backend/1.0 (reverse-geocode)' } }, (r) => {
      let body = '';
      r.on('data', (chunk) => { body += chunk; });
      r.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (err) { reject(err); }
      });
    }).on('error', reject);
  });

  if (!data || data.error) {
    return res.status(404).json({ error: 'Хаяг тодорхойлж чадсангүй.' });
  }

  res.json({ address: data.display_name, raw: data.address ?? null, lat, lng });
}));
