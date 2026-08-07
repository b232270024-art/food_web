import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getOrderHistory } from '../lib/orderHistory';

const STATUS_TR_KEY = {
  pending: 'statusLabelPending',
  paid: 'statusLabelPaid',
  cancelled: 'statusLabelCancelled',
  refunded: 'statusLabelRefunded',
};

const STATUS_COLOR = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  paid: { bg: '#dcfce7', text: '#166534' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
  refunded: { bg: '#fee2e2', text: '#991b1b' },
};

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

function StatusPill({ status, tr }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return (
    <span style={{
      background: c.bg, color: c.text, fontWeight: 700, fontSize: '0.75rem',
      padding: '3px 10px', borderRadius: 'var(--r-full)', whiteSpace: 'nowrap',
    }}>
      {tr[STATUS_TR_KEY[status]] || status}
    </span>
  );
}

export function OrderHistoryPage({ tr, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const ids = getOrderHistory();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const results = await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`/api/orders/${id}`, { credentials: 'include' });
          if (res.status === 401) return { __expired: true };
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      }));
      if (cancelled) return;

      const valid = results.filter(r => r && !r.__expired);
      valid.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOrders(valid);
      setSessionExpired(valid.length === 0 && results.some(r => r?.__expired));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="anim-fade-up" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 0 100px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--text-dark)', background: 'none', cursor: 'pointer',
          padding: '10px 0', marginBottom: 20,
        }}
      >
        <ChevronLeft size={24} strokeWidth={3} />
        {tr.back}
      </button>

      <h2 className="heading-lg" style={{ marginBottom: 24 }}>{tr.orderHistoryTitle}</h2>

      {loading && (
        <p style={{ color: 'var(--text-muted)' }}>{tr.orderHistoryLoading}</p>
      )}

      {!loading && sessionExpired && (
        <p style={{ color: 'var(--text-muted)' }}>{tr.orderHistorySessionExpiredHint}</p>
      )}

      {!loading && !sessionExpired && orders.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>{tr.orderHistoryEmptyHint}</p>
      )}

      {orders.map(order => (
        <div key={order.id} className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {fmtDate(order.created_at)}
            </span>
            <StatusPill status={order.status} tr={tr} />
          </div>

          <div style={{ fontSize: '0.88rem', color: 'var(--text-body)', marginBottom: 10, lineHeight: 1.6 }}>
            {(order.items || []).map(i => `${i.quantity}× ${i.name}`).join(', ')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--brand-green)' }}>
              ${Number(order.total_usd).toFixed(2)}
            </span>
            {order.paid_at && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {tr.orderHistoryPaidOn} {fmtDate(order.paid_at)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
