import cron from 'node-cron';
import { pool } from '../db/pool.js';

// Өдөрт ~144 удаа (10 минут тутам) хугацаа дууссан session-уудыг шалгаж
// 'active' -> 'expired' болгоно. SQL Scheduled Query-ийн оронд Node процесс
// дотор энгийн cron ашигласан нь нэмэлт extension (pg_cron) суулгах
// шаардлагагүй тул анхны шатанд хялбар.
export function startSessionCleanupJob(logger) {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const { rowCount } = await pool.query(
        `UPDATE sessions SET status = 'expired'
         WHERE status = 'active' AND expires_at < now()`
      );
      if (rowCount > 0) {
        logger.info(`Session cleanup: ${rowCount} session expired болголоо.`);
      }
    } catch (err) {
      logger.error('Session cleanup алдаа', { error: err.message });
    }
  });
}
