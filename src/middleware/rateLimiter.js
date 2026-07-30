import rateLimit from 'express-rate-limit';

// Ерөнхий API-д зориулсан зөөлөн хязгаар — IP тутамд минутанд 100 хүсэлт
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' },
});

// Session/захиалга үүсгэх зэрэг "бичих" endpoint-д илүү хатуу хязгаар —
// IP тутамд минутанд 20 хүсэлт (spam захиалга/session үүсгэлтээс сэргийлнэ)
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' },
});
