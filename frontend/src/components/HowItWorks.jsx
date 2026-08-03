import React from 'react';

const STEPS = [
  {
    emoji: '🛒',
    bg: '#e8f5e9',
    num: 1,
  },
  {
    emoji: '🛵',
    bg: '#fff3e8',
    num: 2,
  },
  {
    emoji: '🍽',
    bg: '#e8f0fe',
    num: 3,
  },
];

export function HowItWorks({ tr }) {
  return (
    <section style={{ padding: '80px 0', background: 'var(--bg-cream)' }}>
      <div className="container">
        {/* Section Title */}
        <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 className="heading-lg">
            {tr.howTitle}
            <span style={{ color: 'var(--accent-orange)' }}>{tr.howTitleAccent}</span>
            {tr.howTitle2}
            <span style={{ color: 'var(--brand-green-light)' }}>{tr.howTitleAccent2}</span>
            {tr.howTitle3}
          </h2>
        </div>

        {/* Steps grid */}
        <div id="how-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 32,
        }}>
          {STEPS.map((step, i) => {
            const titles = [tr.step1Title, tr.step2Title, tr.step3Title];
            const descs = [tr.step1Desc, tr.step2Desc, tr.step3Desc];
            return (
              <div
                key={i}
                className="anim-fade-up"
                style={{ animationDelay: `${i * 0.1}s`, textAlign: 'center' }}
              >
                {/* Icon circle */}
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: step.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '3rem',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  {step.emoji}
                </div>

                {/* Step title */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 10 }}>
                  {titles[i]}
                </h3>

                {/* Description */}
                {descs[i] && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 16px' }}>
                    {descs[i]}
                  </p>
                )}

                {/* Step number badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--brand-green)',
                  color: 'white', fontWeight: 800, fontSize: '0.9rem',
                }}>
                  {step.num}
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsive */}
        <style>{`
          @media (max-width: 600px) {
            #how-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </section>
  );
}
