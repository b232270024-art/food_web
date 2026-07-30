import React from 'react';

export function Footer({ hotel, tr }) {
  return (
    <footer style={{
      background: 'var(--bg-green-dark)',
      color: 'rgba(255,255,255,0.85)',
      padding: '56px 0 28px',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 40,
          marginBottom: 40,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
              }}>
                🍽
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
                {hotel?.name || 'Grand Hotel'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, maxWidth: 280 }}>
              {hotel?.address || 'Luxury In-Room Dining Service'}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[tr.footerAbout, tr.footerMenu, tr.footerContact].map(link => (
                <li key={link}>
                  <a href="#" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'white'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
              <span>📞 +1 (555) 000-0000</span>
              <span>✉️ dining@grandhotel.com</span>
              <span>⏰ 24 / 7 Service</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} {hotel?.name || 'Grand Hotel'}. {tr.footerRights}
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['🌐', '📸', '🐦'].map((icon, i) => (
              <button key={i} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                color: 'white', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
