import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, User, DoorClosed, Hotel, AlertTriangle } from 'lucide-react';
import { dietStyle } from '../components/MenuSection';

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('mn-MN', {
    timeZone: 'Asia/Ulaanbaatar',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// twelve_day session-үүд hiч л orders мөр үүсгэдэггүй тул OrdersBoard-д хэзээ ч
// харагдахгүй — тиймээс энэ тусдаа хуудас: зочны сонгосон ангиллын 12 хоногийн
// БҮХ хоолыг (12 өдрийн турш аажмаар хүлээн авах болно) зочны мэдэгдсэн
// харшилтай нь харьцуулж, зөрчилтэй бол шууд анхааруулна.
export function TwelveDayGuests() {
  const [sessions, setSessions] = useState([]);
  const [planItems, setPlanItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        fetch('/api/admin/sessions'),
        fetch('/api/admin/plan'),
      ]);
      const [s, p] = await Promise.all([sRes.json(), pRes.json()]);
      if (Array.isArray(s)) setSessions(s);
      if (Array.isArray(p)) setPlanItems(p);
      setError('');
    } catch {
      setError('Мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <h2 className="heading-md">12 хоногийн зочид</h2>
        <button
          onClick={fetchAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            background: 'var(--bg-muted)', border: '1px solid var(--border)',
            fontSize: '0.8rem', fontWeight: 700,
          }}
        >
          <RefreshCw size={14} /> Шинэчлэх
        </button>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        12 хоногийн планд бүртгүүлсэн зочид — захиалга (orders) үүсгэдэггүй тул эндээс л харагдана. Мэдэгдсэн харшилтай нь тухайн ангиллын 12 хоногийн цэсийн хоолуудтай харьцуулж шалгана.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Ачааллаж байна...</p>
      ) : sessions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Одоогоор 12 хоногийн зочин алга.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(session => {
            const allergyTags = session.allergy_tags || [];
            const hasAllergyInfo = allergyTags.length > 0 || Boolean(session.allergy_other);
            // Тухайн зочны сонгосон ангиллын 12 хоногийн БҮХ хоолыг шалгана
            // (12 өдрийн турш аажмаар бүгдийг нь хүлээн авах тул).
            const dietPlanItems = session.diet_type_id
              ? planItems.filter(p => p.diet_type_id === session.diet_type_id)
              : [];
            const conflicts = dietPlanItems
              .map(item => ({ item, hit: (item.allergens || []).filter(a => allergyTags.includes(a)) }))
              .filter(c => c.hit.length > 0);
            const dietCfg = session.diet_type_name ? dietStyle(session.diet_type_name) : null;

            return (
              <div key={session.id} className="card" style={{ padding: '16px 18px' }}>
                {conflicts.length > 0 ? (
                  <div style={{
                    background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b',
                    borderRadius: 8, padding: '10px 12px', marginBottom: 12,
                    fontSize: '0.8rem', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={15} /> ХАРШИЛТАЙ ЗӨРЧИЛДЛОО — АНХААРАХ!
                    </span>
                    {conflicts.map(({ item, hit }, idx) => (
                      <span key={idx} style={{ fontWeight: 600 }}>
                        Day {item.day_number} · "{item.name}" агуулна: {hit.join(', ')}
                      </span>
                    ))}
                  </div>
                ) : hasAllergyInfo && (
                  <div style={{
                    background: '#fffbeb', border: '1.5px solid #fde68a', color: '#92400e',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: '0.78rem', fontWeight: 600,
                  }}>
                    ⚠️ Зочны мэдэгдсэн харшил: {[...allergyTags, session.allergy_other].filter(Boolean).join(', ')}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>
                      <User size={14} color="var(--brand-green-light)" />
                      {session.guest_name || 'Guest'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {session.hotel_name && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Hotel size={13} /> {session.hotel_name}</span>
                      )}
                      {session.room_number && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><DoorClosed size={13} /> Өрөө {session.room_number}</span>
                      )}
                      <span style={{ fontSize: '0.72rem' }}>{formatDateTime(session.created_at)}</span>
                    </div>
                  </div>
                  {dietCfg && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 'var(--r-full)',
                      background: dietCfg.bg, color: dietCfg.color,
                      fontSize: '0.78rem', fontWeight: 800,
                    }}>
                      {dietCfg.emoji} {dietCfg.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
