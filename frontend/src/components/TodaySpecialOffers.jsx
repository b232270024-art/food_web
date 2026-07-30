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

// Fake nutrition info for visual appeal (no nutrition in DB)
const NUTRITION = [
  { cal: 590, protein: 33, carbs: 48 },
  { cal: 320, protein: 18, carbs: 22 },
  { cal: 440, protein: 24, carbs: 35 },
  { cal: 680, protein: 41, carbs: 52 },
];

export function TodaySpecialOffers({ menuItems, tr, onGetStarted }) {
  const featured = menuItems.slice(0, 4);

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

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 28,
        }}>
          {featured.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <SpecialCard
                  key={i}
                  name={['Kebab', 'Chicken Tikka', 'Desi Chaswein', 'Chicken Chargha'][i]}
                  category="Main Course"
                  index={i}
                  tr={tr}
                  onGetStarted={onGetStarted}
                />
              ))
            : featured.map((item, i) => (
                <SpecialCard
                  key={item.id}
                  name={item.name}
                  category={item.category}
                  index={i}
                  tr={tr}
                  onGetStarted={onGetStarted}
                />
              ))
          }
        </div>
      </div>
    </section>
  );
}

function SpecialCard({ name, category, index, tr, onGetStarted }) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const nutrition = NUTRITION[index % NUTRITION.length];
  const emoji = CATEGORY_EMOJI[category] || CATEGORY_EMOJI.default;

  return (
    <div
      className="anim-fade-up card"
      style={{
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
      <div style={{
        width: 120, height: 120, borderRadius: '50%',
        background: color.bg,
        border: `3px solid ${color.ring}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3.2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}>
        {emoji}
      </div>

      {/* Name */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.3 }}>
        {name}
      </h3>

      {/* Description placeholder */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Lorem ipsum is Simply Dummy Text Of The Printing And Typesetting Industry
      </p>

      {/* Nutrition strip */}
      <div style={{
        display: 'flex', gap: 12,
        fontSize: '0.75rem', color: 'var(--text-body)', fontWeight: 600,
      }}>
        <span style={{ color: '#ef4444' }}>{nutrition.cal} {tr.specialCal}</span>
        <span>|</span>
        <span>{nutrition.protein}g {tr.specialProtein}</span>
        <span>|</span>
        <span>{nutrition.carbs}g {tr.specialCarbs}</span>
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
