import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export function SettingsPage({ hotelId }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu/${hotelId}/restaurants`);
      const data = await res.json();
      if (Array.isArray(data)) setRestaurants(data);
      setError('');
    } catch {
      setError('Рестораны мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { if (hotelId) fetchRestaurants(); }, [hotelId, fetchRestaurants]);

  const startEdit = (r) => { setEditingId(r.id); setDraftName(r.name); };
  const cancelEdit = () => { setEditingId(null); setDraftName(''); };

  const saveEdit = async (id) => {
    if (!draftName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draftName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Хадгалахад алдаа гарлаа.');
      setRestaurants(prev => prev.map(r => r.id === id ? data : r));
      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="heading-md" style={{ marginBottom: 20 }}>Тохиргоо</h2>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>
          Ресторанууд
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Menu болон Захиалгууд хуудсанд ашиглагдах 3 dining outlet-ийн нэрийг эндээс өөрчилнө.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ачааллаж байна...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {restaurants.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, background: 'var(--bg-muted)',
              }}>
                {editingId === r.id ? (
                  <>
                    <input
                      value={draftName}
                      onChange={e => setDraftName(e.target.value)}
                      autoFocus
                      style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.87rem' }}
                    />
                    <button onClick={() => saveEdit(r.id)} disabled={saving} title="Хадгалах"
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={15} />
                    </button>
                    <button onClick={cancelEdit} title="Цуцлах"
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dark)' }}>{r.name}</span>
                    <button onClick={() => startEdit(r)} title="Нэр солих"
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pencil size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
