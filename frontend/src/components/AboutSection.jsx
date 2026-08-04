import React from 'react';

export function AboutSection({ tr, onAboutClick }) {
  return (
    <section style={{ padding: '80px 0', background: 'var(--bg-cream)' }}>
      <div className="container">
        <div className="about-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 60,
          alignItems: 'center',
        }}>
          {/* LEFT — Image collage */}
          <div className="anim-fade-up" style={{ position: 'relative' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              borderRadius: 'var(--r-xl)',
              overflow: 'hidden',
            }}>
              {['🥩', '🍜', '🥗', '🍰'].map((emoji, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1/1',
                    background: ['#fff3e8', '#e8f5e9', '#e8f0fe', '#fce4ec'][i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '4rem',
                    borderRadius: 20,
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>

            {/* Floating circular decoration */}
            <div style={{
              position: 'absolute',
              top: -20, left: -20,
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand-green-light), var(--brand-green))',
              opacity: 0.15,
            }} />
          </div>

          {/* RIGHT — Copy */}
          <div className="anim-fade-up anim-delay-2">
            <h2 className="heading-lg" style={{ marginBottom: 20 }}>
              {tr.aboutTitle}
              <span style={{ color: 'var(--accent-orange)' }}>{tr.aboutTitleAccent}</span>
              {tr.aboutTitle2}
              <span style={{ color: 'var(--brand-green-light)' }}>{tr.aboutTitleAccent2}</span>
              {tr.aboutTitle3}
            </h2>

            <p style={{ color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 32 }}>
              {tr.aboutDesc}
            </p>

            <button className="btn-primary" style={{ padding: '13px 32px' }} onClick={onAboutClick}>
              {tr.aboutBtn}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
      `}</style>
    </section>
  );
}
