import React from 'react';

// Category-based emoji avatars to represent dishes visually
const CATEGORY_EMOJI = {
  'Гол хоол': '🥩',
  'Main Course': '🥩',
  'Зууш & Салат': '🥗',
  'Appetizer & Salad': '🥗',
  'Уух зүйлс': '🍹',
  'Beverages': '🍹',
  'Дессерт': '🍰',
  'Dessert': '🍰',
  default: '🍽',
};

const CARD_COLORS = [
  { bg: '#fff3e8', ring: '#f97316' },
  { bg: '#e8f5e9', ring: '#4caf80' },
  { bg: '#fff8e1', ring: '#fbc02d' },
  { bg: '#fce4ec', ring: '#e91e63' },
];

export function TodaySpecialOffers({ menuItems, tr, onGetStarted }) {
  let featured = menuItems.filter(item => item.is_featured);
  if (featured.length === 0) featured = menuItems; // Fallback to normal items if none are featured
  featured = featured.slice(0, 10);

  return (
    <section id="today-special-offers" style={{ padding: '80px 0', background: 'var(--bg-cream)' }}>
      <div className="container">
        {/* Section Header */}
        <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 className="heading-lg">
            {tr.specialTitle}
            <span style={{ color: 'var(--accent-orange)' }}>{tr.specialTitleAccent}</span>
            {tr.specialTitle2}
          </h2>
          <p style={{ color: 'var(--text-body)', marginTop: 12, maxWidth: 600, margin: '12px auto 0' }}>
            {tr.specialDesc}
          </p>
        </div>

        {/* Horizontal scroll container */}
        <div 
          className="special-offers-scroll"
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: 24,
            paddingBottom: 24, // for scrollbar
            paddingLeft: 4, paddingRight: 4, // for box shadow clipping
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {featured.length === 0
            ? Array.from({ length: 4 }).map((_, i) => <SpecialCardSkeleton key={i} />)
            : featured.map((item, i) => (
              <SpecialCard
                key={item.id}
                item={item}
                index={i}
                tr={tr}
                onGetStarted={onGetStarted}
              />
            ))
          }
        </div>
        <style>{`
          .special-offers-scroll::-webkit-scrollbar { height: 8px; }
          .special-offers-scroll::-webkit-scrollbar-track { background: var(--bg-muted); border-radius: 4px; }
          .special-offers-scroll::-webkit-scrollbar-thumb { background: var(--brand-green); border-radius: 4px; }
        `}</style>
      </div>
    </section>
  );
}

function SpecialCardSkeleton() {
  return (
    <div className="card anim-fade-in" style={{ minWidth: 260, flexShrink: 0, scrollSnapAlign: 'start', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-muted)' }} />
      <div style={{ width: '70%', height: 16, borderRadius: 4, background: 'var(--bg-muted)' }} />
      <div style={{ width: '100%', height: 34, borderRadius: 8, background: 'var(--bg-muted)' }} />
    </div>
  );
}

function SpecialCard({ item, index, tr, onGetStarted }) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const emoji = CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.default;

  return (
    <div
      className="anim-fade-up card"
      style={{
        minWidth: 260, flexShrink: 0, scrollSnapAlign: 'start',
        animationDelay: `${index * 0.08}s`,
        padding: '24px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: 14,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Dish avatar */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          style={{
            width: 120, height: 120, borderRadius: '50%', objectFit: 'cover',
            border: `3px solid ${color.ring}`, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        />
      ) : (
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: color.bg,
          border: `3px solid ${color.ring}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3.2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          {emoji}
        </div>
      )}

      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.3 }}>
        {item.name}
      </h3>

      {item.description && (
        <p style={{
          fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {item.description}
        </p>
      )}

      {/* Price */}
      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-green)' }}>
        ${Number(item.price_usd ?? item.price ?? 0).toFixed(2)}
      </div>

      {/* CTA */}
      <button
        className="btn-primary"
        onClick={onGetStarted}
        style={{ padding: '9px 22px', fontSize: '0.85rem', borderRadius: 'var(--r-sm)', width: '100%' }}
      >
        {tr.specialBtn}
      </button>
    </div>
  );
}
