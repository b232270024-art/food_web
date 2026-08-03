import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, ArrowUp, Check } from 'lucide-react';

export function OrderTypeSelection({ tr, onBack, onContinue }) {
  const [selected, setSelected] = useState(null); // '12-day' | 'one-time'

  const canContinue = !!selected;

  const btnLabel = () => {
    if (!selected) return tr.orderTypeSelectBtn;
    if (selected === '12-day') return tr.orderTypeContinueSub;
    return tr.orderTypeContinueOne;
  };

  return (
    <div className="anim-fade-up" style={{
      minHeight: '100vh',
      background: 'var(--bg-cream)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Scrollable content */}
      <div style={{ flex: 1, padding: '24px', maxWidth: 560, width: '100%', margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem',
            color: 'var(--text-dark)', background: 'none', cursor: 'pointer',
            padding: '10px 0', marginBottom: 20,
          }}
        >
          <ChevronLeft size={24} strokeWidth={3} />
          {tr.back}
        </button>


        {/* Title */}
        <h1 style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800,
          fontSize: '2rem', color: 'var(--brand-green)',
          textAlign: 'center', marginBottom: 28, lineHeight: 1.2,
        }}>
          {tr.orderTypeTitle}
        </h1>

        {/* Description paragraphs */}
        <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 20, textAlign: 'center' }}>
          {tr.orderTypeP1}
        </p>
        <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 36, textAlign: 'center' }}>
          {tr.orderTypeP2}
        </p>

        {/* Yellow underline */}
        <div style={{
          width: 160, height: 3, borderRadius: 3,
          background: 'linear-gradient(90deg, var(--accent-yellow), transparent)',
          margin: '0 auto 32px',
        }} />

        {/* Click label */}
        <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 16 }}>
          {tr.orderTypeClick}
        </p>

        {/* Selection cards */}
        <div style={{
          border: '2px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {/* 12-day */}
          <div
            id="plan-12day"
            onClick={() => setSelected('12-day')}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '22px 20px',
              background: selected === '12-day' ? '#f9fafb' : 'white',
              borderBottom: '2px solid var(--border)',
              cursor: 'pointer',
              flex: 1,
              borderRight: '1px solid var(--border)',
            }}
          >
            <RadioDot active={selected === '12-day'} />
            <span style={{
              fontWeight: 700, textAlign: 'center', whiteSpace: 'pre-line',
              fontSize: '0.95rem', color: 'var(--text-dark)', lineHeight: 1.4,
            }}>
              {tr.orderType12}
            </span>
          </div>

          {/* One-time — side by side using flex row */}
          <div style={{ display: 'flex' }}>
            {/* Reuse the 12-day as left and one-time as right */}
          </div>
        </div>

        {/* Side-by-side layout */}
        <div style={{
          border: '2px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: 20,
        }}>
          {['12-day', 'one-time'].map((type, i) => (
            <div
              key={type}
              id={`plan-${type}`}
              onClick={() => setSelected(type)}
              style={{
                flex: 1,
                padding: '22px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: selected === type ? '#f9fafb' : 'white',
                borderRight: i === 0 ? '2px solid var(--border)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              }}
            >
              <RadioDot active={selected === type} />
              <span style={{
                fontWeight: 700, whiteSpace: 'pre-line',
                fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: 1.4,
              }}>
                {type === '12-day' ? tr.orderType12 : tr.orderTypeOne}
              </span>
            </div>
          ))}
        </div>

        {/* Info bubble */}
        {selected && (
          <div className="anim-fade-up" style={{ position: 'relative', marginBottom: 24 }}>
            {/* Pointer */}
            <div style={{
              position: 'absolute', top: -8,
              left: selected === '12-day' ? '25%' : '75%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 16, height: 16,
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--border)',
              borderLeft: '1px solid var(--border)',
            }} />
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '20px 24px',
              boxShadow: 'var(--shadow-sm)', position: 'relative', zIndex: 1,
            }}>
              {selected === '12-day' ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[tr.orderType12Check1, tr.orderType12Check2, tr.orderType12Check3, tr.orderType12Check4].map((txt, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                      <Check size={18} strokeWidth={3} /> {txt}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
                  <Check size={18} strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} /> {tr.orderTypeOneCheck}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar — dark green */}
      <div style={{
        background: 'var(--bg-green-dark)',
        padding: '28px 24px',
        position: 'sticky',
        bottom: 0,
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <button
            id="continue-order-btn"
            onClick={() => canContinue && onContinue(selected)}
            style={{
              width: '100%',
              background: canContinue ? 'var(--accent-yellow)' : 'rgba(245,158,11,0.45)',
              color: canContinue ? '#111' : '#555',
              padding: '17px 20px',
              borderRadius: 12, fontWeight: 800, fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, cursor: canContinue ? 'pointer' : 'not-allowed',
              marginBottom: 18, transition: 'all 0.2s',
            }}
          >
            <span>{btnLabel()}</span>
            {canContinue ? <ArrowRight size={20} /> : <ArrowUp size={20} />}
          </button>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.5 }}>
            {tr.orderTypeFooter}
          </p>
        </div>
      </div>
    </div>
  );
}

function RadioDot({ active }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: `2px solid ${active ? '#10b981' : '#d1d5db'}`,
      background: active ? '#10b981' : 'transparent',
      marginBottom: 8, transition: 'all 0.2s',
      flexShrink: 0,
    }} />
  );
}
