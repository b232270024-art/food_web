import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, User, DoorClosed, Hotel, AlertTriangle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { dietStyle } from '../components/MenuSection';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('mn-MN', {
    timeZone: 'Asia/Ulaanbaatar',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// Нэг зочны дэлгэрэнгүй мөр (expandable)
function GuestRow({ session, planItems, restaurantByDiet }) {
  const [expanded, setExpanded] = useState(false);
  const allergyTags = session.allergy_tags || [];
  const hasAllergyInfo = allergyTags.length > 0 || Boolean(session.allergy_other);

  // Тухайн зочны diet_type-тэй тохирох 12 өдрийн хоолыг шалгана
  const dietPlanItems = session.diet_type_id
    ? planItems.filter(p => p.diet_type_id === session.diet_type_id)
    : [];

  const conflicts = dietPlanItems
    .map(item => ({ item, hit: (item.allergens || []).filter(a => allergyTags.includes(a)) }))
    .filter(c => c.hit.length > 0);

  const dietCfg = session.diet_type_name ? dietStyle(session.diet_type_name) : null;
  const restaurant = session.diet_type_id ? restaurantByDiet[session.diet_type_id] : null;

  const deliveryInfo = session.room_number
    ? `${session.hotel_name ? session.hotel_name + ' · ' : ''}Өрөө ${session.room_number}`
    : '—';

  return (
    <>
      <tr
        onClick={() => setExpanded(p => !p)}
        style={{
          cursor: 'pointer',
          background: expanded ? 'var(--bg-muted)' : undefined,
          transition: 'background 0.15s',
        }}
      >
        {/* Огноо */}
        <td style={{ padding: '11px 12px', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={12} />
            {fmtDate(session.created_at)}
          </div>
        </td>

        {/* Зочин */}
        <td style={{ padding: '11px 12px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <User size={13} color="var(--brand-green-light)" />
            {session.guest_name || '—'}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {deliveryInfo}
          </div>
        </td>

        {/* Ресторан */}
        <td style={{ padding: '11px 12px', fontSize: '0.82rem', color: 'var(--text-body)' }}>
          {restaurant ? (
            <span style={{ fontWeight: 700 }}>{restaurant.name}</span>
          ) : '—'}
        </td>

        {/* Diet type badge */}
        <td style={{ padding: '11px 12px' }}>
          {dietCfg ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999,
              background: dietCfg.bg, color: dietCfg.color,
              fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              {dietCfg.emoji} {dietCfg.label}
            </span>
          ) : '—'}
        </td>

        {/* Харшил */}
        <td style={{ padding: '11px 12px', fontSize: '0.78rem' }}>
          {conflicts.length > 0 ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999,
              background: '#fef2f2', color: '#991b1b',
              fontSize: '0.73rem', fontWeight: 700,
            }}>
              <AlertTriangle size={12} /> {conflicts.length} зөрчил
            </span>
          ) : hasAllergyInfo ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999,
              background: '#fffbeb', color: '#92400e',
              fontSize: '0.73rem', fontWeight: 700,
            }}>
              ⚠️ Мэдэгдсэн
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
          )}
        </td>

        {/* 12 өдрийн хоол тоо */}
        <td style={{ padding: '11px 12px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-green)' }}>
          {dietPlanItems.length}
        </td>

        {/* Expand */}
        <td style={{ padding: '11px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>

      {/* Дэлгэрэнгүй мөр */}
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: '0 12px 16px', background: 'var(--bg-muted)', borderBottom: '1.5px solid var(--border)' }}>

            {/* Харшлын зөрчилтэй анхааруулга */}
            {conflicts.length > 0 && (
              <div style={{
                background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b',
                borderRadius: 8, padding: '10px 12px', marginBottom: 10,
                fontSize: '0.78rem', fontWeight: 700,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <AlertTriangle size={14} /> ХАРШИЛТАЙ ЗӨРЧИЛДЛОО — АНХААРАХ!
                </div>
                {conflicts.map(({ item, hit }, idx) => (
                  <div key={idx} style={{ fontWeight: 600, marginBottom: 2 }}>
                    Day {item.day_number} · "{item.name}" агуулна: <strong>{hit.join(', ')}</strong>
                  </div>
                ))}
              </div>
            )}

            {hasAllergyInfo && conflicts.length === 0 && (
              <div style={{
                background: '#fffbeb', border: '1.5px solid #fde68a', color: '#92400e',
                borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: '0.75rem', fontWeight: 600,
              }}>
                ⚠️ Зочны мэдэгдсэн харшил: {[...allergyTags, session.allergy_other].filter(Boolean).join(', ')}
              </div>
            )}

            {/* 12 өдрийн хоолнуудын жагсаалт */}
            {dietPlanItems.length > 0 ? (
              <>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: 10, marginBottom: 6 }}>
                  12 өдрийн цэс ({dietPlanItems.length} хоол):
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card)' }}>
                      <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Өдөр</th>
                      <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Цаг</th>
                      <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Хоол</th>
                      <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)' }}>Харшил</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dietPlanItems
                      .sort((a, b) => a.day_number - b.day_number || a.meal_time.localeCompare(b.meal_time))
                      .map((item, idx) => {
                        const hit = (item.allergens || []).filter(a => allergyTags.includes(a));
                        return (
                          <tr
                            key={idx}
                            style={{
                              borderTop: '1px solid var(--border)',
                              background: hit.length > 0 ? '#fef2f2' : undefined,
                            }}
                          >
                            <td style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--brand-green)' }}>
                              {item.day_number}-р өдөр
                            </td>
                            <td style={{ padding: '5px 10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {{ morning: '🌅 Өглөө', lunch: '☀️ Өдөр', evening: '🌙 Орой' }[item.meal_time] || item.meal_time}
                            </td>
                            <td style={{ padding: '5px 10px', color: 'var(--text-body)' }}>{item.name}</td>
                            <td style={{ padding: '5px 10px', color: hit.length > 0 ? '#991b1b' : 'var(--text-muted)', fontWeight: hit.length > 0 ? 700 : 400 }}>
                              {hit.length > 0 ? `⚠️ ${hit.join(', ')}` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10 }}>
                Тухайн ангиллын 12 өдрийн цэс тохируулагдаагүй байна.
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function TwelveDayGuests() {
  const [sessions, setSessions] = useState([]);
  const [planItems, setPlanItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRestaurant, setFilterRestaurant] = useState('all'); // restaurant id
  const [sortDir, setSortDir] = useState('desc');

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, pRes, rRes] = await Promise.all([
        fetch('/api/admin/sessions', { credentials: 'include' }),
        fetch('/api/admin/plan', { credentials: 'include' }),
        fetch('/api/menu/restaurants', { credentials: 'include' }),
      ]);
      const [s, p, r] = await Promise.all([sRes.json(), pRes.json(), rRes.json()]);
      if (Array.isArray(s)) setSessions(s);
      if (Array.isArray(p)) setPlanItems(p);
      if (Array.isArray(r)) setRestaurants(r.filter(x => x.diet_type_id));
      setError('');
    } catch {
      setError('Мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // diet_type_id → restaurant map
  const restaurantByDiet = Object.fromEntries(restaurants.map(r => [r.diet_type_id, r]));

  // Filter
  const filtered = sessions.filter(s => {
    if (filterRestaurant === 'all') return true;
    // filterRestaurant is a restaurant id
    const rest = restaurants.find(r => r.id === filterRestaurant);
    return rest && s.diet_type_id === rest.diet_type_id;
  }).sort((a, b) => {
    const aT = new Date(a.created_at).getTime();
    const bT = new Date(b.created_at).getTime();
    return sortDir === 'desc' ? bT - aT : aT - bT;
  });

  // Stats per restaurant
  const statsByRestaurant = restaurants.map(r => {
    const count = sessions.filter(s => s.diet_type_id === r.diet_type_id).length;
    const withConflicts = sessions.filter(s => {
      if (s.diet_type_id !== r.diet_type_id) return false;
      const allergyTags = s.allergy_tags || [];
      if (allergyTags.length === 0) return false;
      const dietItems = planItems.filter(p => p.diet_type_id === s.diet_type_id);
      return dietItems.some(item => (item.allergens || []).some(a => allergyTags.includes(a)));
    }).length;
    return { ...r, count, withConflicts };
  });

  const totalConflicts = filtered.filter(s => {
    const allergyTags = s.allergy_tags || [];
    if (allergyTags.length === 0) return false;
    const dietItems = planItems.filter(p => p.diet_type_id === s.diet_type_id);
    return dietItems.some(item => (item.allergens || []).some(a => allergyTags.includes(a)));
  }).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <h2 className="heading-md">12 хоногийн зочид</h2>
        <button
          onClick={fetchAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--bg-muted)', border: '1px solid var(--border)',
            fontSize: '0.8rem', fontWeight: 700,
          }}
        >
          <RefreshCw size={14} /> Шинэчлэх
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        12 хоногийн планд бүртгүүлсэн зочид — харшилтай зөрчлийг автоматаар илрүүлнэ.
      </p>

      {/* ── Ресторан тус бүрийн статистик cards ── */}
      {!loading && restaurants.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
          {/* Нийт card */}
          <div
            className="card"
            onClick={() => setFilterRestaurant('all')}
            style={{
              padding: '14px 16px', cursor: 'pointer',
              border: filterRestaurant === 'all' ? '2px solid var(--brand-green)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-dark)' }}>
              {sessions.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Нийт зочин</div>
            {totalConflicts > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700, marginTop: 4 }}>
                ⚠️ {totalConflicts} харшлын зөрчил
              </div>
            )}
          </div>

          {/* Ресторан тус бүрийн card */}
          {statsByRestaurant.map(r => {
            const cfg = dietStyle(r.diet_type_name);
            const active = filterRestaurant === r.id;
            return (
              <div
                key={r.id}
                className="card"
                onClick={() => setFilterRestaurant(active ? 'all' : r.id)}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  border: `2px solid ${active ? cfg.color : 'transparent'}`,
                  background: active ? cfg.bg : 'var(--bg-card)',
                  transition: 'all 0.2s',
                }}
              >
                {/* Ресторан нэр + diet badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>{cfg.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: active ? cfg.color : 'var(--text-dark)' }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: cfg.color, fontWeight: 600 }}>
                      {cfg.label}
                    </div>
                  </div>
                </div>

                {/* Зочдын тоо */}
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: active ? cfg.color : 'var(--text-dark)', lineHeight: 1 }}>
                  {r.count}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>зочин</div>

                {/* Харшлын зөрчил */}
                {r.withConflicts > 0 && (
                  <div style={{
                    marginTop: 8, padding: '4px 8px', borderRadius: 6,
                    background: '#fef2f2', color: '#991b1b',
                    fontSize: '0.7rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <AlertTriangle size={11} /> {r.withConflicts} зөрчил
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filter + Sort bar ── */}
      {!loading && sessions.length > 0 && (
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          marginBottom: 14, padding: '10px 14px',
          background: 'var(--bg-muted)', borderRadius: 10, border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Шүүлтүүр:</span>

          {/* Ресторан filter */}
          <select
            value={filterRestaurant}
            onChange={e => setFilterRestaurant(e.target.value)}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)',
              fontSize: '0.8rem', fontWeight: 700, background: 'var(--bg-card)', cursor: 'pointer',
            }}
          >
            <option value="all">Бүх ресторан</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* Огноо sort */}
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            style={{
              padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)',
              fontSize: '0.78rem', fontWeight: 700, background: 'var(--bg-card)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            Огноо {sortDir === 'desc' ? '↓ Шинэ эхэнд' : '↑ Хуучин эхэнд'}
          </button>

          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {filtered.length} зочин
          </span>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Ачааллаж байна...</p>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)',
          border: '1.5px dashed var(--border)', borderRadius: 12, fontSize: '0.9rem',
        }}>
          {sessions.length === 0 ? 'Одоогоор 12 хоногийн зочин алга.' : 'Сонгосон рестораны зочин байхгүй.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)', borderBottom: '2px solid var(--border)' }}>
                {[
                  'Огноо', 'Зочин / Хүргэлт', 'Ресторан', 'Ангилал',
                  'Харшил', '12 өдрийн хоол', '',
                ].map((label, i) => (
                  <th key={i} style={{
                    padding: '10px 12px', textAlign: 'left',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 800,
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(session => (
                <GuestRow
                  key={session.id}
                  session={session}
                  planItems={planItems}
                  restaurantByDiet={restaurantByDiet}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
