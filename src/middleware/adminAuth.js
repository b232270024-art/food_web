import jwt from 'jsonwebtoken';

// Админ dashboard-ын cookie session-ийг шалгана (guest requireSession-ээс тусдаа,
// role: 'admin' claim-тай JWT ашигладаг).
export function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) {
    return res.status(401).json({ error: 'Админ эрхээр нэвтрээгүй байна.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('not an admin token');
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Админ session хүчингүй эсвэл хугацаа дууссан.' });
  }
}
