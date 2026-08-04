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
      </div>

      {/* Horizontal scroll container - Full width bleed */}
      <div 
        className="special-offers-scroll"
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 24,
          paddingBottom: 40, 
          paddingLeft: 'max(24px, calc(50vw - 580px))', // Aligns with container (max-width 1160)
          paddingRight: 'max(24px, calc(50vw - 580px))',
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
      </div>
      <style>{`
        .special-offers-scroll::-webkit-scrollbar { height: 0px; display: none; }
        .special-offers-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .special-card-wrap { cursor: pointer; }
        .special-card-img-wrap { overflow: hidden; border-radius: 20px; }
        .special-card-img-wrap img { transition: transform 0.4s ease; }
        .special-card-wrap:hover .special-card-img-wrap img { transform: scale(1.05); }
      `}</style>
    </section>
  );
}

function SpecialCardSkeleton() {
  return (
    <div style={{ minWidth: 280, flexShrink: 0, scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 20, background: 'var(--bg-muted)' }} />
      <div style={{ width: '70%', height: 24, borderRadius: 6, background: 'var(--bg-muted)' }} />
      <div style={{ width: '90%', height: 16, borderRadius: 4, background: 'var(--bg-muted)' }} />
    </div>
  );
}

function SpecialCard({ item, index, tr, onGetStarted }) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const emoji = CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.default;

  return (
    <div
      className="anim-fade-up special-card-wrap"
      onClick={onGetStarted}
      style={{
        minWidth: 280, width: 280, flexShrink: 0, scrollSnapAlign: 'start',
        animationDelay: `${index * 0.08}s`,
        display: 'flex', flexDirection: 'column', gap: 14,
        textAlign: 'left',
      }}
    >
      {/* Dish avatar */}
      <div className="special-card-img-wrap" style={{ width: '100%', aspectRatio: '1/1', position: 'relative' }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: color.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '5rem',
          }}>
            {emoji}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.2, marginBottom: 4 }}>
          {item.name}
        </h3>

        {item.description && (
          <p style={{
            fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.4, marginBottom: 8,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {item.description}
          </p>
        )}

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {item.calories ? `${item.calories} Cal` : '450 Cal'} | 32g Protein | 40g Carbs
        </div>
      </div>
    </div>
  );
}
