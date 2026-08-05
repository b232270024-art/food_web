import React from 'react';

export function AboutPage({ tr, onBackToHome }) {
  return (
    <div className="container" style={{ padding: '20px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <button
        onClick={onBackToHome}
        style={{
          background: 'none', border: 'none', color: 'var(--brand-green)',
          fontWeight: 700, cursor: 'pointer', marginBottom: 24, fontSize: '1rem'
        }}
      >
        {tr.backToHomeBtn || 'Back to Home'}
      </button>

      <div className="card" style={{ padding: '20px', borderRadius: 'var(--r-md)' }}>
        <img
          src="/besbarmak.png"
          alt="Restaurant"
          style={{
            width: '100%', height: 300, objectFit: 'cover',
            borderRadius: 'var(--r-md)', marginBottom: 24
          }}
        />

        <h1 className="heading-m" style={{ marginBottom: 10 }}>Besbarmak khazakh restaurant</h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 10 }}>
          A restaurant offering authentic Kazakh cuisine in a comfortable and welcoming atmosphere. Known for its quality food and friendly service, it provides guests with a memorable dining experience.
        </p>

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>Official Certifications</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20, color: 'var(--text-dark)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600 }}>
              <span style={{ color: 'var(--brand-green)' }}>✓</span> Halal Certificate
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <span style={{ color: 'var(--brand-green)' }}>✓</span> Food Safety Certificate
            </li>
          </ul>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 12, marginBottom: 20 }}>

          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              className="btn-outline"
              style={{ flex: 1, fontWeight: 700 }}
              onClick={() => alert('Restaurant phone number copied!')}
            >
              99402756
            </button>
            <button
              className="btn-outline"
              style={{ flex: 1, fontWeight: 700 }}
              onClick={() => window.open('https://www.facebook.com/BesbarmakKazakhRestaurant/', '_blank')}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Facebook: @BesbarmakKazakhRestaurant
            </button>
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: '30px', borderRadius: 'var(--r-md)' }}>
        <img
          src="/besbarmak.png"
          alt="Restaurant"
          style={{
            width: '100%', height: 300, objectFit: 'cover',
            borderRadius: 'var(--r-md)', marginBottom: 24
          }}
        />

        <h1 className="heading-m" style={{ marginBottom: 10 }}>Besbarmak khazakh restaurant</h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 10 }}>
          A restaurant offering authentic Kazakh cuisine in a comfortable and welcoming atmosphere. Known for its quality food and friendly service, it provides guests with a memorable dining experience.
        </p>

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>Official Certifications</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20, color: 'var(--text-dark)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600 }}>
              <span style={{ color: 'var(--brand-green)' }}>✓</span> Halal Certificate
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <span style={{ color: 'var(--brand-green)' }}>✓</span> Food Safety Certificate
            </li>
          </ul>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 12, marginBottom: 20 }}>

          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              className="btn-outline"
              style={{ flex: 1, fontWeight: 700 }}
              onClick={() => alert('Restaurant phone number copied!')}
            >
              99402756
            </button>
            <button
              className="btn-outline"
              style={{ flex: 1, fontWeight: 700 }}
              onClick={() => window.open('https://www.facebook.com/BesbarmakKazakhRestaurant/', '_blank')}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Facebook: @BesbarmakKazakhRestaurant
            </button>
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: '30px', borderRadius: 'var(--r-md)' }}>
        <img
          src="/besbarmak.png"
          alt="Restaurant"
          style={{
            width: '100%', height: 300, objectFit: 'cover',
            borderRadius: 'var(--r-md)', marginBottom: 24
          }}
        />

        <h1 className="heading-m" style={{ marginBottom: 10 }}>Besbarmak khazakh restaurant</h1>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 10 }}>
          A restaurant offering authentic Kazakh cuisine in a comfortable and welcoming atmosphere. Known for its quality food and friendly service, it provides guests with a memorable dining experience.
        </p>

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>Official Certifications</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20, color: 'var(--text-dark)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600 }}>
              <span style={{ color: 'var(--brand-green)' }}>✓</span> Halal Certificate
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <span style={{ color: 'var(--brand-green)' }}>✓</span> Food Safety Certificate
            </li>
          </ul>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 12, marginBottom: 20 }}>

          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              className="btn-outline"
              style={{ flex: 1, fontWeight: 700 }}
              onClick={() => alert('Restaurant phone number copied!')}
            >
              99402756
            </button>
            <button
              className="btn-outline"
              style={{ flex: 1, fontWeight: 700 }}
              onClick={() => window.open('https://www.facebook.com/BesbarmakKazakhRestaurant/', '_blank')}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Facebook: @BesbarmakKazakhRestaurant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
