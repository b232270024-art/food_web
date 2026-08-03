import React, { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { RefreshCw, Clock, DoorClosed, User } from 'lucide-react';

const STATUS_FLOW = ['pending', 'preparing', 'served', 'paid'];

const STATUS_LABEL = {
  pending: 'Хүлээгдэж буй',
  preparing: 'Бэлтгэж буй',
  served: 'Хүргэгдсэн',
  paid: 'Төлбөр төлөгдсөн',
  cancelled: 'Цуцлагдсан',
};

const STATUS_COLOR = {
  pending: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  preparing: { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  served: { bg: '#e0e7ff', text: '#3730a3', dot: '#6366f1' },
  paid: { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'дөнгөж сая';
  if (mins < 60) return `${mins} мин өмнө`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} цаг өмнө`;
}

function OrderCard({ order, onChangeStatus, updating, selectedRestaurant }) {
  const colors = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
  
  // Filter items by restaurant if one is selected
  const items = order.items || [];
  const displayItems = selectedRestaurant === 'All' 
    ? items 
    : items.filter(i => i.restaurant_name === selectedRestaurant);

  if (selectedRestaurant !== 'All' && displayItems.length === 0) return null;

  return (
    <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>
            <User size={14} color="var(--brand-green-light)" />
            {order.guest_name || 'Guest'}
          </div>
          {order.room_number && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              <DoorClosed size={13} /> Өрөө {order.room_number}
            </div>
          )}
        </div>
        <span style={{
          fontWeight: 900, fontSize: '1rem', color: 'var(--brand-green)',
        }}>
          ${Number(order.total_usd).toFixed(2)}
        </span>
      </div>

      <div style={{ background: 'var(--bg-muted)', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-dark)' }}>Захиалсан зүйлс:</div>
        {displayItems.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-body)', marginBottom: 2 }}>
            <span>{item.quantity}x {item.name}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.restaurant_name}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Clock size={12} /> {timeAgo(order.created_at)}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: order.payment_status === 'paid' ? 'var(--brand-green)' : 'var(--text-muted)' }}>
          {order.payment_status === 'paid' ? 'Төлөгдсөн' : 'Төлөөгүй'} 
          {order.paid_at && ` (${new Date(order.paid_at).toLocaleTimeString()})`}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <select
          value={order.status}
          disabled={updating}
          onChange={e => onChangeStatus(order.id, e.target.value)}
          style={{
            padding: '5px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
            background: colors.bg, color: colors.text, border: `1px solid ${colors.dot}55`,
            opacity: updating ? 0.6 : 1,
          }}
        >
          {[...STATUS_FLOW, 'cancelled'].map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Column({ status, orders, onChangeStatus, updatingId, selectedRestaurant }) {
  const colors = STATUS_COLOR[status];
  
  // Count how many orders actually have items for the selected restaurant
  const visibleCount = orders.filter(o => {
    if (selectedRestaurant === 'All') return true;
    const items = o.items || [];
    return items.some(i => i.restaurant_name === selectedRestaurant);
  }).length;
  return (
    <div style={{ flex: '1 1 240px', minWidth: 240 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12, padding: '8px 4px',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot }} />
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.95rem' }}>
          {STATUS_LABEL[status]}
        </h3>
        <span style={{
          marginLeft: 'auto', background: 'var(--bg-muted)', color: 'var(--text-muted)',
          fontSize: '0.72rem', fontWeight: 800, padding: '2px 9px', borderRadius: 999,
        }}>
          {visibleCount}
        </span>
      </div>
      {visibleCount === 0 ? (
        <div style={{
          padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)',
          fontSize: '0.8rem', border: '1.5px dashed var(--border)', borderRadius: 'var(--r-md)',
        }}>
          Захиалга байхгүй
        </div>
      ) : (
        orders.map(o => (
          <OrderCard key={o.id} order={o} onChangeStatus={onChangeStatus} updating={updatingId === o.id} selectedRestaurant={selectedRestaurant} />
        ))
      )}
    </div>
  );
}

export function OrdersBoard({ hotelId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('All');
  const socketRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/${hotelId}/orders/live`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
      setError('');
    } catch {
      setError('Захиалгын мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if (!hotelId) return;
    fetchOrders();

    const socket = io(window.location.origin);
    socket.emit('admin:join', hotelId);
    socket.on('order:new', fetchOrders);
    socket.on('order:updated', fetchOrders);
    socketRef.current = socket;

    // Reliability fallback in case the socket connection drops silently.
    const poll = setInterval(fetchOrders, 20000);

    return () => {
      socket.disconnect();
      clearInterval(poll);
    };
  }, [hotelId, fetchOrders]);

  const handleChangeStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Статус шинэчлэхэд алдаа гарлаа.');
      fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleOrders = showCancelled ? orders : orders.filter(o => o.status !== 'cancelled');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 className="heading-md">Идэвхтэй захиалгууд</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-body)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} />
            Цуцлагдсаныг харуулах
          </label>
          <select 
            value={selectedRestaurant} 
            onChange={e => setSelectedRestaurant(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
              fontSize: '0.8rem', fontWeight: 700, background: 'var(--bg-muted)'
            }}
          >
            <option value="All">Бүх ресторан</option>
            <option value="Ресторан 1">Ресторан 1</option>
            <option value="Ресторан 2">Ресторан 2</option>
            <option value="Ресторан 3">Ресторан 3</option>
          </select>
          <button
            onClick={fetchOrders}
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
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Ачааллаж байна...</p>
      ) : (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {(showCancelled ? [...STATUS_FLOW, 'cancelled'] : STATUS_FLOW).map(status => (
            <Column
              key={status}
              status={status}
              orders={visibleOrders.filter(o => o.status === status)}
              onChangeStatus={handleChangeStatus}
              updatingId={updatingId}
              selectedRestaurant={selectedRestaurant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
