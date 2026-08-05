import React, { useEffect, useState } from 'react';
import { ChevronLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { dietStyle } from './MenuSection';

// 12 хоногийн планыг ресторан/ангиллаар нь тусгаарласны дараа зочин эхлээд
// аль ангиллын (Halal/Vegan/...) төлөвлөгөөг үзэхээ сонгоно. Зөвхөн
// diet_type_id оноогдсон ресторанууд харагдана — оноогоогүй бол (буудал шинээр
// тохируулагдаж дуусаагүй) сонголт харуулах зүйлгүй тул автоматаар алгасна.
export function DietTypeSelection({ tr, onBack, onContinue }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // diet_type_id

  useEffect(() => {
    fetch('/api/menu/restaurants')
      .then(r => r.json())
      .then(data => setRestaurants(Array.isArray(data) ? data.filter(r => r.diet_type_id) : []))
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && restaurants.length === 0) onContinue(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, restaurants]);

  if (loading || restaurants.length === 0) return null;

  const canContinue = !!selected;

  return (
    <div className="anim-fade-up" style={{
      minHeight: '100vh',
      background: 'var(--bg-cream)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ flex: 1, padding: '24px', maxWidth: 640, width: '100%', margin: '0 auto' }}>
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

        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: 'var(--brand-green)',
          textAlign: 'center', marginBottom: 12, lineHeight: 1.2,
        }}>
          {tr.dietTypeSelectTitle}
        </h1>

        <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 28, textAlign: 'center' }}>
          {tr.dietTypeSelectDesc}
        </p>

        <div style={{
          width: 160, height: 3, borderRadius: 3,
          background: 'linear-gradient(90deg, var(--accent-yellow), transparent)',
          margin: '0 auto 32px',
        }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 28 }}>
          {restaurants.map(r => {
            const cfg = dietStyle(r.diet_type_name);
            const active = selected === r.diet_type_id;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r.diet_type_id)}
                style={{
                  minWidth: 160, flex: '1 1 160px', maxWidth: 220,
                  padding: '24px 18px', borderRadius: 'var(--r-lg)',
                  border: `2px solid ${active ? cfg.color : 'var(--border)'}`,
                  background: active ? cfg.bg : 'var(--bg-card)',
                  color: active ? cfg.color : 'var(--text-body)',
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  boxShadow: active ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '2rem' }}>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-green-dark)',
        padding: '28px 24px',
        position: 'sticky',
        bottom: 0,
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <button
            id="continue-diet-btn"
            onClick={() => canContinue && onContinue(selected)}
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
            <span>{tr.dietTypeSelectBtn}</span>
            {canContinue ? <ArrowRight size={20} /> : <ArrowUp size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
