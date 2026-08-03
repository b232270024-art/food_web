import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, X, Search, Check } from 'lucide-react';
import { ItemForm, emptyItemForm } from './MenuManager';

const MEAL_TIMES = [
  { key: 'morning', label: 'Өглөө' },
  { key: 'lunch', label: 'Өдөр' },
  { key: 'evening', label: 'Орой' },
];

function ExistingItemPicker({ menuItems, onPick }) {
  const [search, setSearch] = useState('');
  const filtered = menuItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Хоол хайх..."
          autoFocus
          style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.85rem' }}
        />
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.length === 0 && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '8px 0' }}>Олдсонгүй.</p>}
        {filtered.map(item => (
          <button
            key={item.id}
            onClick={() => onPick(item.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              padding: '8px 10px', borderRadius: 8, background: 'var(--bg-muted)', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>{item.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{item.restaurant_name} · ${Number(item.price_usd).toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AddItemModal({ restaurants, menuItems, onPickExisting, onCreateNew, saving, onClose }) {
  const [mode, setMode] = useState('existing');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="card anim-scale-in" style={{ padding: 22, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem' }}>Хоол нэмэх</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setMode('existing')}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
              background: mode === 'existing' ? 'var(--brand-green)' : 'var(--bg-muted)',
              color: mode === 'existing' ? '#fff' : 'var(--text-body)',
            }}
          >
            Жагсаалтаас сонгох
          </button>
          <button
            onClick={() => setMode('new')}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
              background: mode === 'new' ? 'var(--brand-green)' : 'var(--bg-muted)',
              color: mode === 'new' ? '#fff' : 'var(--text-body)',
            }}
          >
            Шинэ хоол нэмэх
          </button>
        </div>

        {mode === 'existing' ? (
          <ExistingItemPicker menuItems={menuItems} onPick={onPickExisting} />
        ) : (
          <ItemForm
            initial={emptyItemForm(restaurants)}
            restaurants={restaurants}
            onCancel={onClose}
            onSave={onCreateNew}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

export function PlanManager({ hotelId }) {
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [planItems, setPlanItems] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [addingSlot, setAddingSlot] = useState(null); // meal_time key or null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [rRes, mRes, pRes] = await Promise.all([
        fetch(`/api/menu/${hotelId}/restaurants`),
        fetch(`/api/menu/${hotelId}?all=true`),
        fetch(`/api/admin/${hotelId}/plan`),
      ]);
      const [r, m, p] = await Promise.all([rRes.json(), mRes.json(), pRes.json()]);
      if (Array.isArray(r)) setRestaurants(r);
      if (Array.isArray(m)) setMenuItems(m);
      if (Array.isArray(p)) setPlanItems(p);
      setError('');
    } catch {
      setError('Мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { if (hotelId) fetchAll(); }, [hotelId, fetchAll]);

  const dayItemsByMeal = useMemo(() => {
    const map = { morning: [], lunch: [], evening: [] };
    planItems.filter(p => p.day_number === selectedDay).forEach(p => map[p.meal_time]?.push(p));
    return map;
  }, [planItems, selectedDay]);

  const assign = async (menuItemId) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/plan-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel_id: hotelId, day_number: selectedDay, meal_time: addingSlot, menu_item_id: menuItemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Нэмэхэд алдаа гарлаа.');
      setAddingSlot(null);
      fetchAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const createAndAssign = async (payload) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/menu/${hotelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const item = await res.json();
      if (!res.ok) throw new Error(item.error || 'Хоол нэмэхэд алдаа гарлаа.');
      await assign(item.id);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  // Хоол нэмэх/хасах бүр аль хэдийн шууд серверт хадгалагддаг (assign/removeItem) —
  // энэ товч зөвхөн admin-д "хадгалагдсан" гэдгийг тодорхой харуулах баталгаажуулалт.
  const handleSaveConfirm = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const removeItem = async (planItemId) => {
    setPlanItems(prev => prev.filter(p => p.id !== planItemId));
    try {
      const res = await fetch(`/api/admin/plan-items/${planItemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setError('Хасахад алдаа гарлаа.');
      fetchAll();
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Ачааллаж байна...</p>;

  return (
    <div>
      <h2 className="heading-md" style={{ marginBottom: 6 }}>12 хоногийн цэс</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
        Өдөр тус бүрийн өглөө/өдөр/оройн хоолыг эндээс тохируулна.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Day selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            style={{
              width: 42, height: 42, borderRadius: 10, fontWeight: 800, fontSize: '0.88rem',
              background: selectedDay === day ? 'var(--brand-green)' : 'var(--bg-muted)',
              color: selectedDay === day ? '#fff' : 'var(--text-body)',
            }}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Meal sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {MEAL_TIMES.map(({ key, label }) => (
          <div key={key} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{label}</h3>
              <button
                onClick={() => setAddingSlot(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'var(--bg-muted)', fontWeight: 700, fontSize: '0.78rem' }}
              >
                <Plus size={14} /> Хоол нэмэх
              </button>
            </div>

            {dayItemsByMeal[key].length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Хоол сонгогдоогүй.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dayItemsByMeal[key].map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px 6px 10px', borderRadius: 10, background: 'var(--bg-muted)',
                  }}>
                    {p.image_url && <img src={p.image_url} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />}
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.restaurant_name} · ${Number(p.price_usd).toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => removeItem(p.id)}
                      title="Хасах"
                      style={{ width: 22, height: 22, borderRadius: 6, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSaveConfirm}
        className="btn-primary"
        style={{ marginTop: 24, padding: '12px 28px', fontSize: '0.9rem' }}
      >
        <Check size={16} /> Хадгалах
      </button>

      {savedToast && (
        <div className="toast anim-fade-up">
          ✓ {selectedDay}-р өдрийн цэс хадгалагдлаа
        </div>
      )}

      {addingSlot && (
        <AddItemModal
          restaurants={restaurants}
          menuItems={menuItems}
          saving={saving}
          onPickExisting={assign}
          onCreateNew={createAndAssign}
          onClose={() => setAddingSlot(null)}
        />
      )}
    </div>
  );
}
