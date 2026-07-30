// Express-ийн сүүлчийн middleware — routes дотор баригдаагүй ямар ч алдаа
// эндэрэ ирнэ. Процессыг унагаахгүйгээр логдож, хэрэглэгчид ойлгомжтой,
// дотоод дэлгэрэнгүй мэдээлэл (stack trace гэх мэт) агуулаагүй хариу өгнө.
export function errorHandler(err, req, res, next) {
  const logger = req.app.get('logger');
  logger.error('Барьж амжаагүй алдаа', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (res.headersSent) return next(err);

  // PostgreSQL invalid input syntax (e.g. invalid UUID format)
  if (err.code === '22P02') {
    return res.status(400).json({
      error: 'Ирсэн ID эсвэл параметр буруу форматтай байна (UUID).',
    });
  }

  res.status(err.status || 500).json({
    error: 'Серверийн дотоод алдаа гарлаа. Дахин оролдоно уу.',
  });
}

// Express дотор async route handler-аас гарсан алдааг Promise reject
// хэлбэрээр автоматаар errorHandler руу дамжуулах туслах функц.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
