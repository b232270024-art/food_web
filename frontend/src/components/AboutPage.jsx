import React from 'react';

export function AboutPage({ tr, onBackToHome }) {
  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: 800, margin: '0 auto' }}>
      <button 
        onClick={onBackToHome} 
        style={{ 
          background: 'none', border: 'none', color: 'var(--brand-green)', 
          fontWeight: 700, cursor: 'pointer', marginBottom: 24, fontSize: '1rem' 
        }}
      >
        ← {tr.backToHomeBtn || 'Back to Home'}
      </button>

      <div className="card" style={{ padding: '30px', borderRadius: 'var(--r-xl)' }}>
        <img 
          src="/velofoods.jpeg" 
          alt="Restaurant" 
          style={{ 
            width: '100%', height: 300, objectFit: 'cover', 
            borderRadius: 'var(--r-md)', marginBottom: 24 
          }} 
        />
        
        <h1 className="heading-xl" style={{ marginBottom: 16 }}>Velofoods</h1>
        
        <p style={{ fontSize: '1.1rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 30 }}>
          Premium Japanese restaurant specializing in authentic Japanese cuisine with fresh ingredients and traditional recipes.
        </p>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>Categories</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ background: '#f3f4f6', padding: '6px 16px', borderRadius: 20, fontWeight: 600 }}>🥩 Standard</span>
            <span style={{ background: '#dcfce7', padding: '6px 16px', borderRadius: 20, fontWeight: 600 }}>🥬 Vegetarian</span>
            <span style={{ background: '#dcfce7', padding: '6px 16px', borderRadius: 20, fontWeight: 600 }}>🌱 Vegan</span>
            <span style={{ background: '#fef3c7', padding: '6px 16px', borderRadius: 20, fontWeight: 600 }}>☪ Halal</span>
          </div>
        </div>

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
          
          <button 
            className="btn-outline" 
            style={{ padding: '10px 24px', fontWeight: 700 }}
            onClick={() => window.open('/policies.html', '_blank')}
          >
            View Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
