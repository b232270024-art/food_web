import cron from 'node-cron';
import { pool } from '../db/pool.js';

// 10 минут тутам: 2 цагийн турш ажилтан хараахан хүлээж аваагүй ('pending')
// захиалгыг автоматаар цуцална. Зөвхөн 'pending' статустай захиалгыг л
// хамарна — 'preparing'/'served' болсон (ажилтан аль хэдийн хүлээж авсан)
// захиалга хэзээ ч автоматаар цуцлагдахгүй.
export function startOrderAutoCancelJob(logger, io) {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const { rows } = await pool.query(
        `UPDATE orders SET status = 'cancelled'
         WHERE status = 'pending' AND created_at < now() - interval '2 hours'
         RETURNING id, hotel_id`
      );
      if (rows.length > 0) {
        logger.info(`Auto-cancel: ${rows.length} захиалга 2 цагийн дотор төлбөр төлөгдөөгүй тул цуцлагдлаа.`);
        for (const order of rows) {
          io.to(`hotel:${order.hotel_id}`).emit('order:updated', order);
        }
      }
    } catch (err) {
      logger.error('Auto-cancel cron алдаа', { error: err.message });
    }
  });
}
