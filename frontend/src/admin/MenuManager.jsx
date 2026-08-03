import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, EyeOff, Eye } from 'lucide-react';

const DIET_OPTIONS = [
  { value: 'standard', label: 'Стандарт' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'gluten_free', label: 'Gluten Free' },
];

const EMPTY_FORM = {
  name: '', category: '', diet_type: 'standard',
  price_usd: '', description: '', prep_time_min: '', is_featured: false,
  restaurant_name: 'Ресторан 1', stock_limit: '', image_url: '',
};

function ItemForm({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price_usd) return;
    onSave({
      name: form.name.trim(),
      category: form.category.trim() || null,
      diet_type: form.diet_type,
      price_usd: Number(form.price_usd),
      description: form.description.trim() || null,
      prep_time_min: form.prep_time_min ? Number(form.prep_time_min) : null,
      is_featured: !!form.is_featured,
      restaurant_name: form.restaurant_name,
      stock_limit: form.stock_limit === '' ? null : Number(form.stock_limit),
      image_url: form.image_url || null,
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm(f => ({ ...f, image_url: data.url }));
      }
    } catch (err) {
      alert('Зураг оруулахад алдаа гарлаа');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 16, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
      <input placeholder="Нэр *" value={form.name} onChange={set('name')} required
        style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.88rem', gridColumn: 'span 1' }} />
      <input placeholder="Ангилал (жишээ: Гол хоол)" value={form.category} onChange={set('category')}
        style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.88rem' }} />
      <input placeholder="Үнэ (USD) *" type="number" step="0.01" min="0" value={form.price_usd} onChange={set('price_usd')} required
        style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.88rem' }} />
      <select value={form.diet_type} onChange={set('diet_type')}
        style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.88rem' }}>
        {DIET_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>
      
      <select value={form.restaurant_name} onChange={set('restaurant_name')}
        style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.88rem' }}>
        <option value="Ресторан 1">Ресторан 1</option>
        <option value="Ресторан 2">Ресторан 2</option>
        <option value="Ресторан 3">Ресторан 3</option>
      </select>

      <input placeholder="Лимит (хоосон = хязгааргүй)" type="number" min="0" value={form.stock_limit} onChange={set('stock_limit')}
        style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.88rem' }} />

      <input placeholder="Бэлтгэх хугацаа (мин)" type="number" min="0" value={form.prep_time_min} onChange={set('prep_time_min')}
        style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.88rem' }} />
        
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
        Зураг: <input type="file" accept="image/*" onChange={handleImageUpload} style={{ flex: 1 }} />
        {form.image_url && <img src={form.image_url} alt="preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-body)' }}>
        <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} /> Онцлох
      </label>
      <textarea placeholder="Тайлбар" value={form.description} onChange={set('description')} rows={2}
        style={{ gridColumn: '1 / -1', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical' }} />
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.85rem' }}>
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
        <button type="button" onClick={onCancel} style={{
          padding: '9px 20px', borderRadius: 8, background: 'var(--bg-muted)',
          fontWeight: 700, fontSize: '0.85rem',
        }}>
          Цуцлах
        </button>
      </div>
    </form>
  );
}

function ItemRow({ item, onEdit, onDelete, onToggleAvailable }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderBottom: '1px solid var(--border)',
      opacity: item.available ? 1 : 0.55,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{item.name}</span>
          {item.is_featured && <span style={{ fontSize: '0.7rem' }}>⭐</span>}
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {item.category || '—'} · {item.diet_type} · {item.restaurant_name} {item.stock_limit !== null && `(Лимит: ${item.stock_limit})`}
        </div>
      </div>
      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--brand-green)', minWidth: 64, textAlign: 'right' }}>
        ${Number(item.price_usd).toFixed(2)}
      </span>
      <button onClick={() => onToggleAvailable(item)} title={item.available ? 'Нуух' : 'Харуулах'}
        style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.available ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <button onClick={() => onEdit(item)} title="Засах"
        style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Pencil size={14} />
      </button>
      <button onClick={() => onDelete(item)} title="Устгах"
        style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function MenuManager({ hotelId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu/${hotelId}?all=true`);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch {
      setError('Цэсний мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => { if (hotelId) fetchItems(); }, [hotelId, fetchItems]);

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/menu/${hotelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setAdding(false);
      fetchItems();
    } catch {
      setError('Хоол нэмэхэд алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/menu/item/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setEditingItem(null);
      fetchItems();
    } catch {
      setError('Шинэчлэхэд алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailable = async (item) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
    try {
      await fetch(`/api/menu/item/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available }),
      });
    } catch {
      setError('Шинэчлэхэд алдаа гарлаа.');
      fetchItems();
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.name}"-г устгах уу?`)) return;
    setItems(prev => prev.filter(i => i.id !== item.id));
    try {
      await fetch(`/api/menu/item/${item.id}`, { method: 'DELETE' });
    } catch {
      setError('Устгахад алдаа гарлаа.');
      fetchItems();
    }
  };

  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Бусад';
    (acc[cat] = acc[cat] || []).push(item);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="heading-md">Цэсний удирдлага</h2>
        {!adding && !editingItem && (
          <button onClick={() => setAdding(true)} className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.85rem' }}>
            <Plus size={16} /> Хоол нэмэх
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {adding && (
        <ItemForm onCancel={() => setAdding(false)} onSave={handleCreate} saving={saving} />
      )}

      {editingItem && (
        <ItemForm
          initial={{
            name: editingItem.name,
            category: editingItem.category || '',
            diet_type: editingItem.diet_type || 'standard',
            price_usd: editingItem.price_usd,
            description: editingItem.description || '',
            prep_time_min: editingItem.prep_time_min || '',
            is_featured: editingItem.is_featured || false,
            restaurant_name: editingItem.restaurant_name || 'Ресторан 1',
            stock_limit: editingItem.stock_limit !== null ? editingItem.stock_limit : '',
            image_url: editingItem.image_url || '',
          }}
          onCancel={() => setEditingItem(null)}
          onSave={handleUpdate}
          saving={saving}
        />
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Ачааллаж байна...</p>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Одоогоор хоол алга.</p>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="card" style={{ marginBottom: 18, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-muted)', fontWeight: 800, fontSize: '0.85rem' }}>
              {cat} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({catItems.length})</span>
            </div>
            {catItems.map(item => (
              <ItemRow key={item.id} item={item} onEdit={setEditingItem} onDelete={handleDelete} onToggleAvailable={handleToggleAvailable} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
