import React, { useEffect, useState } from 'react';
import { UtensilsCrossed, ClipboardList, CheckCircle2, DollarSign } from 'lucide-react';

const STATUS_LABEL = {
  pending: 'Хүлээгдэж буй',
  paid: 'Төлөгдсөн',
  cancelled: 'Цуцлагдсан',
  refunded: 'Буцаагдсан',
};

const STATUS_COLOR = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  paid: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
  refunded: { bg: '#fee2e2', text: '#991b1b' },
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: accent + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('mn-MN', {
    timeZone: 'Asia/Ulaanbaatar',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

export function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Мэдээлэл татахад алдаа гарлаа.');
        setStats(data);
        setError('');
      })
      .catch((err) => setError(err.message || 'Мэдээлэл татахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Ачааллаж байна...</p>;
  if (error) return <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem' }}>{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h2 className="heading-md" style={{ marginBottom: 20 }}>Ерөнхий тойм</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon={UtensilsCrossed} label="Нийт хоол" value={stats.menuItemCount} accent="#3D7A5A" />
        <StatCard icon={ClipboardList} label="Нийт захиалга" value={stats.totalOrders} accent="#3b82f6" />
        <StatCard icon={CheckCircle2} label="Амжилттай захиалга" value={stats.paidOrders} accent="#22c55e" />
        <StatCard icon={DollarSign} label="Нийт орлого" value={`$${stats.totalRevenue.toFixed(2)}`} accent="#F97316" />
      </div>

      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.95rem', marginBottom: 12 }}>
        Сүүлийн захиалгууд
      </h3>

      {stats.recentOrders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Захиалга байхгүй байна.</p>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>Огноо, цаг</th>
                <th style={{ padding: '10px 14px' }}>Зочин</th>
                <th style={{ padding: '10px 14px' }}>Хүргэлт</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Дүн</th>
                <th style={{ padding: '10px 14px' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map(o => {
                const colors = STATUS_COLOR[o.status] || STATUS_COLOR.pending;
                return (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{formatDateTime(o.created_at)}</td>
                    <td style={{ padding: '10px 14px' }}>{o.guest_name || 'Guest'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                      {o.room_number
                        ? `${o.hotel_name ? `${o.hotel_name}, ` : ''}Өрөө ${o.room_number}`
                        : (o.delivery_address || '—')}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>${Number(o.total_usd).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '3px 9px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                        background: colors.bg, color: colors.text,
                      }}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
