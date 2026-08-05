import React, { useEffect, useState } from 'react';
import { ChevronLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { dietStyle } from './MenuSection';

// 12 хоногийн планд зочин аль ресторантай (diet type) ажиллахаа сонгоно.
// Зөвхөн diet_type_id оноогдсон ресторанууд харагдана.
export function DietTypeSelection({ tr, onBack, onContinue }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // restaurant id

  useEffect(() => {
    fetch('/api/menu/restaurants')
      .then(r => r.json())
      .then(data => setRestaurants(Array.isArray(data) ? data.filter(r => r.diet_type_id) : []))
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  // Ресторан байхгүй бол шууд дамжина (diet_type_id = null)
  useEffect(() => {
    if (!loading && restaurants.length === 0) onContinue(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, restaurants]);

  if (loading || restaurants.length === 0) return null;

  const canContinue = !!selected;
  const selectedRestaurant = restaurants.find(r => r.id === selected);

  return (
    <div className="anim-fade-up" style={{
      minHeight: '100vh',
      background: 'var(--bg-cream)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, padding: '24px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
        {/* Back */}
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

        {/* Title */}
        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: 'var(--brand-green)',
          textAlign: 'center', marginBottom: 10, lineHeight: 1.2,
        }}>
          {tr.dietTypeSelectTitle || 'Хоолны газраа сонгоно уу'}
        </h1>
        <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 28, textAlign: 'center' }}>
          {tr.dietTypeSelectDesc || 'Тус бүрийн хоолны онцлогоороо ялгарсан ресторануудаас сонгоно уу'}
        </p>

        <div style={{
          width: 160, height: 3, borderRadius: 3,
          background: 'linear-gradient(90deg, var(--accent-yellow), transparent)',
          margin: '0 auto 32px',
        }} />

        {/* Restaurant cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {restaurants.map(r => {
            const cfg = dietStyle(r.diet_type_name);
            const active = selected === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  borderRadius: 'var(--r-lg)',
                  border: `2.5px solid ${active ? cfg.color : 'var(--border)'}`,
                  background: active ? cfg.bg : 'var(--bg-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  boxShadow: active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
              >
                {/* Diet icon */}
                <span style={{
                  fontSize: '2.4rem',
                  flexShrink: 0,
                  width: 56, height: 56,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: active ? `${cfg.color}22` : 'var(--bg-muted)',
                }}>
                  {cfg.emoji}
                </span>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  {/* Restaurant name */}
                  <div style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: active ? cfg.color : 'var(--text-dark)',
                    marginBottom: 4,
                  }}>
                    {r.name}
                  </div>
                  {/* Diet type badge */}
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 12px',
                    borderRadius: 999,
                    background: cfg.color + '22',
                    color: cfg.color,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>

                {/* Selected check */}
                {active && (
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: cfg.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '0.85rem', flexShrink: 0,
                  }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected info */}
        {selectedRestaurant && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: dietStyle(selectedRestaurant.diet_type_name).bg,
            border: `1px solid ${dietStyle(selectedRestaurant.diet_type_name).color}44`,
            fontSize: '0.85rem', color: 'var(--text-body)',
            marginBottom: 12,
          }}>
            <strong>{selectedRestaurant.name}</strong>-ийн 12 хоногийн цэсийг харахаар бэлэн байна.
          </div>
        )}
      </div>

      {/* Continue button */}
      <div style={{
        background: 'var(--bg-green-dark)',
        padding: '28px 24px',
        position: 'sticky',
        bottom: 0,
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <button
            id="continue-diet-btn"
            onClick={() => {
              if (!canContinue) return;
              // diet_type_id-г дамжуулна
              onContinue(selectedRestaurant.diet_type_id);
            }}
            style={{
              width: '100%',
              background: canContinue ? 'var(--accent-yellow)' : 'rgba(245,158,11,0.45)',
              color: canContinue ? '#111' : '#555',
              padding: '17px 20px',
              borderRadius: 12, fontWeight: 800, fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, cursor: canContinue ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            <span>{tr.dietTypeSelectBtn || 'Цэсийг харах'}</span>
            {canContinue ? <ArrowRight size={20} /> : <ArrowUp size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
