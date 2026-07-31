import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { hotelsRouter } from './routes/hotels.js';
import { sessionsRouter } from './routes/sessions.js';
import { menuRouter } from './routes/menu.js';
import { ordersRouter } from './routes/orders.js';
import { adminRouter } from './routes/admin.js';
import { paymentsRouter } from './routes/payments.js';
import { geocodeRouter } from './routes/geocode.js';

import { logger } from './services/logger.js';
import { startSessionCleanupJob } from './services/sessionCleanup.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, writeLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('logger', logger);
// Railway зэрэг reverse proxy-н цаана ажилладаг тул X-Forwarded-For-г итгэж,
// зөв client IP-г ашиглахын тулд шаардлагатай (rate limiter, secure cookie-д нөлөөлнө)
app.set('trust proxy', 1);

// cors тохиргоо — cookie ашиглаж байгаа тул credentials зөвшөөрөх шаардлагатай
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);

const frontendDistPath = path.join(__dirname, '../frontend/dist');
const publicPath = path.join(__dirname, '../public');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
} else {
  app.use(express.static(publicPath));
}

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
app.set('io', io);

// Admin dashboard клиент буудлын өрөө рүүгээ subscribe хийнэ
io.on('connection', (socket) => {
  socket.on('admin:join', (hotel_id) => {
    socket.join(`hotel:${hotel_id}`);
  });
  socket.on('join:room', (roomNumber) => {
    socket.join(`room:${roomNumber}`);
  });
});

app.use('/api/hotels', hotelsRouter);
// Session болон захиалга үүсгэх зэрэг "бичих" endpoint-д илүү хатуу rate limit
app.use('/api/sessions', writeLimiter, sessionsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', writeLimiter, ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', writeLimiter, paymentsRouter);
app.use('/api/geocode', geocodeRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

// SPA fallback for React frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return next();
  }
  if (fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

// Global error handler — routes дотор баригдаагүй ямар ч алдаа эндэрэ ирнэ.
// Заавал сүүлд бичигдэх ёстой (бусад бүх middleware/route-ийн дараа).
app.use(errorHandler);

startSessionCleanupJob(logger);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`Backend ажиллаж байна: http://localhost:${PORT}`);
});
