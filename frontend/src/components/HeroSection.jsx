import React from 'react';
import { ArrowDown } from 'lucide-react';

export function HeroSection({ tr, onGetStarted }) {
  return (
    <section style={{
      background: 'var(--bg-cream)',
      padding: '60px 0 80px',
      overflow: 'hidden',
    }}>
      <div className="container">
        <div id="hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 48,
          alignItems: 'center',
          minHeight: 480,
        }}>
          {/* LEFT — Copy */}
          <div className="anim-fade-up">


            <h1 className="heading-xl" style={{ marginBottom: 20 }}>
              {tr.heroTitle1}
              <span style={{ color: 'var(--brand-green-light)' }}>{tr.heroTitleGreen}</span>
              {tr.heroTitle2}<br />
              <span style={{ color: 'var(--brand-green-light)' }}>{tr.heroTitle3}</span>
              {tr.heroTitle4}
              <span style={{ color: 'var(--accent-orange)' }}>{tr.heroTitleOrange}</span>
              {tr.heroTitle5}
            </h1>

            <div style={{
              width: 120, height: 4, borderRadius: 4,
              background: 'linear-gradient(90deg, var(--accent-yellow), transparent)',
              marginBottom: 24,
            }} />

            <p style={{ color: 'var(--text-body)', fontSize: '1rem', maxWidth: 420, lineHeight: 1.7, marginBottom: 36 }}>
              {tr.heroDesc}
            </p>

            <button
              id="hero-get-started"
              onClick={onGetStarted}
              className="btn-primary"
              style={{ fontSize: '1rem', padding: '14px 36px', borderRadius: 'var(--r-sm)' }}
            >
              {tr.heroBtn}
            </button>

            <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
                <ArrowDown size={14} />
              </div>
              <span>Scroll to explore</span>
            </div>
          </div>

          <div className="anim-fade-up anim-delay-2" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'relative',
              width: '100%', maxWidth: 460,
              aspectRatio: '1/1',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254,243,199,0.7) 0%, rgba(236,253,245,0.3) 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src="/images/hero_ring.png"
                alt="Gourmet Dishes"
                style={{ width: '90%', height: '90%', objectFit: 'contain', borderRadius: '50%' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.background = 'radial-gradient(circle, #f5f0e8 40%, #ecfdf5 100%)';
                  e.target.parentElement.innerHTML = '<div style="font-size:8rem;opacity:0.3">🍽</div>';
                }}
              />
              <div className="hero-badge" style={{
                position: 'absolute', top: '12%', right: '4%',
                background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                padding: '10px 16px', borderRadius: 16,
                boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 10,
                fontWeight: 700, fontSize: '0.82rem',
              }}>
                <span style={{ fontSize: '1.3rem' }}>🔥</span>
                <div>
                  <div style={{ color: 'var(--text-dark)' }}>Hot & Fresh</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 500 }}>Express Room Delivery</div>
                </div>
              </div>

              <div className="hero-badge" style={{
                position: 'absolute', bottom: '10%', left: '4%',
                background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                padding: '10px 16px', borderRadius: 16,
                boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 10,
                fontWeight: 700, fontSize: '0.82rem',
              }}>
                <span style={{ fontSize: '1.3rem' }}>⭐</span>
                <div>
                  <div style={{ color: 'var(--text-dark)' }}>5.0 Rating</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 500 }}>Executive Chefs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          #hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 480px) {
          .hero-badge { padding: 7px 11px !important; gap: 7px !important; }
          .hero-badge span:first-child { font-size: 1rem !important; }
          .hero-badge div div:first-child { font-size: 0.72rem !important; }
          .hero-badge div div:last-child { font-size: 0.62rem !important; }
        }
      `}</style>
    </section>
  );
}
