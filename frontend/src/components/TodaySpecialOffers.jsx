import React from 'react';
import { Utensils } from 'lucide-react';

const CARD_COLORS = [
  { bg: '#fff3e8', ring: '#f97316' },
  { bg: '#e8f5e9', ring: '#4caf80' },
  { bg: '#fff8e1', ring: '#fbc02d' },
  { bg: '#fce4ec', ring: '#e91e63' },
];

export function TodaySpecialOffers({ menuItems, tr, onGetStarted }) {
  const scrollRef = React.useRef(null);

  const featured = menuItems.filter(item => item.is_featured).slice(0, 10);

  const setWidth = featured.length * (280 + 24); // width of one set of cards (card + gap)

  React.useEffect(() => {
    // On mount, position the scroll in the middle set to allow scrolling left or right
    if (scrollRef.current && setWidth > 0) {
      scrollRef.current.scrollLeft = setWidth;
    }
  }, [setWidth]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    // Infinite loop trick: jump to the identical position in the next/prev set
    // when getting too close to the edges.
    if (el.scrollLeft < setWidth * 0.2) {
      el.scrollLeft += setWidth;
    } else if (el.scrollLeft > setWidth * 1.8) {
      el.scrollLeft -= setWidth;
    }
  };

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

      {/* Infinite Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="special-offers-scroll"
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 24,
          paddingBottom: 40,
          paddingLeft: 'max(24px, calc(50vw - 580px))',
          paddingRight: 'max(24px, calc(50vw - 580px))',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
        }}
      >
        {/* We render 3 sets. Middle set is the starting point. */}
        {[...featured, ...featured, ...featured].length === 0
          ? Array.from({ length: 12 }).map((_, i) => <SpecialCardSkeleton key={`skel-${i}`} />)
          : [...featured, ...featured, ...featured].map((item, i) => (
            <SpecialCard key={`set-${i}-${item.id}`} item={item} index={i % featured.length} tr={tr} onGetStarted={onGetStarted} />
          ))
        }
      </div>
      <style>{`
        .special-offers-scroll::-webkit-scrollbar { height: 0px; display: none; }
        .special-offers-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .special-card-wrap { cursor: pointer; }
        .special-card-img-wrap { overflow: hidden; }
        .special-card-img-wrap img { transition: transform 0.4s ease; }
        .special-card-wrap:hover .special-card-img-wrap img { transform: scale(1.05); }
        .special-card-overlay {
          transform: translateY(100%);
          opacity: 0;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .special-card-wrap:hover .special-card-overlay,
        .special-card-wrap:focus-within .special-card-overlay {
          transform: translateY(0);
          opacity: 1;
        }
      `}</style>
    </section>
  );
}

function SpecialCardSkeleton() {
  return (
    <div style={{ minWidth: 280, width: 280, flexShrink: 0, scrollSnapAlign: 'start', aspectRatio: '1/1', borderRadius: 20, background: 'var(--bg-muted)' }} />
  );
}

function SpecialCard({ item, index, tr, onGetStarted }) {
  const color = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      className="anim-fade-up special-card-wrap"
      onClick={onGetStarted}
      tabIndex={0}
      style={{
        minWidth: 280, width: 280, flexShrink: 0, scrollSnapAlign: 'start',
        animationDelay: `${index * 0.08}s`,
        position: 'relative',
        aspectRatio: '1/1',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Dish photo */}
      <div className="special-card-img-wrap" style={{ position: 'absolute', inset: 0 }}>
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
          }}>
            <Utensils size={56} color="var(--text-muted)" />
          </div>
        )}
      </div>

      {/* Hover overlay: name, description, CTA */}
      <div className="special-card-overlay" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '48px 18px 18px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.82) 65%)',
        textAlign: 'left',
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
          {item.name}
        </h3>

        {item.description && (
          <p style={{
            fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, marginBottom: 12,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {item.description}
          </p>
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={onGetStarted}
          style={{ width: '100%', padding: '10px', fontSize: '0.85rem', borderRadius: 'var(--r-sm)' }}
        >
          {tr.specialBtn}
        </button>
      </div>
    </div>
  );
}
