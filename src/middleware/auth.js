import jwt from 'jsonwebtoken';

// Зочны session токеныг HttpOnly cookie-оос уншиж шалгаад req.session-д
// оруулна. Header-ээр илгээх хуучин арга ч нөөц болгон дэмжигдэнэ (жишээ нь
// Postman-аар гар аргаар тест хийхэд хэрэгтэй).
export function requireSession(req, res, next) {
  const cookieToken = req.cookies?.session_token;
  const headerToken = (req.headers.authorization || '').replace('Bearer ', '');
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'Session токен байхгүй байна.' });
  }
  try {
    req.session = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Session хүчингүй эсвэл хугацаа дууссан.' });
  }
}
