import { z } from 'zod';

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const uuidSchema = (msg) => z.string().regex(uuidPattern, msg || 'Зөв UUID байх ёстой');

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstErrorMsg = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
        .join('; ');
      return res.status(400).json({
        error: `Ирсэн өгөгдөл буруу форматтай байна (${firstErrorMsg})`,
        details: fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

export const createSessionSchema = z
  .object({
    hotel_id: uuidSchema('hotel_id зөв UUID байх ёстой'),
    guest_name: z.string().trim().min(1, 'Нэр хоосон байж болохгүй').max(100),
    order_type: z.enum(['twelve_day', 'one_time'], { message: 'order_type нь twelve_day эсвэл one_time байх ёстой' }),
    delivery_type: z.enum(['hotel', 'current_location']).nullish(),
    room_number: z.string().trim().min(1).max(20).nullish(),
    delivery_address: z.string().trim().min(1).max(300).nullish(),
    geo_lat: z.number().min(-90).max(90).nullish(),
    geo_lng: z.number().min(-180).max(180).nullish(),
  })
  .superRefine((data, ctx) => {
    // 12 хоногийн план бол хүргэлт нь буудлын өрөө руу далд тогтмол
    const deliveryType = data.order_type === 'twelve_day' ? 'hotel' : data.delivery_type;

    if (data.order_type === 'one_time' && !data.delivery_type) {
      ctx.addIssue({ code: 'custom', path: ['delivery_type'], message: 'delivery_type шаардлагатай (one_time захиалгад)' });
      return;
    }

    if (deliveryType === 'hotel' && !data.room_number) {
      ctx.addIssue({ code: 'custom', path: ['room_number'], message: 'Өрөөний дугаар хоосон байж болохгүй' });
    }
    if (deliveryType === 'current_location' && !data.delivery_address) {
      ctx.addIssue({ code: 'custom', path: ['delivery_address'], message: 'Хүргэлтийн хаяг хоосон байж болохгүй' });
    }
  });

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().max(50).nullish(),
  price_usd: z.number().positive('Үнэ 0-ээс их байх ёстой'),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menu_item_id: uuidSchema('menu_item_id зөв UUID байх ёстой'),
        quantity: z.number().int().positive('Тоо ширхэг 0-ээс их бүхэл тоо байх ёстой'),
        guest_name: z.string().trim().min(1).max(100).nullish(),
      })
    )
    .min(1, 'Захиалгад дор хаяж нэг зүйл байх ёстой'),
});

export const updateOrderStatusSchema = z.object({
  status: z.string().transform(v => v.toLowerCase()).pipe(z.enum(['pending', 'preparing', 'served', 'paid', 'cancelled'])),
});

export const paymentInitiateSchema = z.object({
  order_id: uuidSchema('order_id зөв UUID байх ёстой'),
  gateway_provider: z.string().transform(v => v.toLowerCase()).pipe(z.enum(['2c2p', 'airwallex', 'bank', 'qpay'])),
});
