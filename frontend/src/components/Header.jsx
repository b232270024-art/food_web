import React from 'react';
import { ShoppingBag, Globe } from 'lucide-react';
import { LANGUAGES } from '../i18n/translations';

const EMOJI_MAP = { '🇺🇸': true, '🇦🇪': true, '🇮🇳': true };

export function Header({ hotel, session, cartCount, cartTotal, onOpenCart, language, onSetLanguage, showCart, tr }) {
  const [langOpen, setLangOpen] = React.useState(false);
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #3D7A5A, #1A3C34)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.2rem', fontWeight: 900,
              boxShadow: 'var(--shadow-glow)',
            }}>

            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem',
                color: 'var(--text-dark)', lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {hotel?.name || 'Grand Hotel'}
              </div>
              <div style={{
                fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#4CAF80', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hotel?.address || 'In-Room Dining'}</span>
              </div>
            </div>
          </div>

          {/* Nav Links (desktop) — hidden on mobile via .nav-links in index.css */}
          <nav className="nav-links">
            {[tr.navSpecialOffers, tr.navMenu, tr.navPopular].map((label) => (
              <span key={label} className="nav-link">{label}</span>
            ))}
          </nav>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
            {/* Session chip */}
            {session && (
              <div style={{
                background: '#ecfdf5', border: '1px solid #a7f3d0',
                padding: '5px 14px', borderRadius: 'var(--r-full)',
                display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
                color: '#047857', fontWeight: 600, fontSize: '0.85rem',
              }}>
                <span>👤</span>
                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.guest_name}</span>
                {session.room_number && (
                  <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: 8, fontSize: '0.75rem' }}>
                    {tr.room} {session.room_number}
                  </span>
                )}
              </div>
            )}

            {/* Language Switcher */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setLangOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 'var(--r-sm)',
                  background: 'var(--bg-muted)', border: '1px solid var(--border)',
                  fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{currentLang.flag}</span>
                <span>{currentLang.label}</span>
                <Globe size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              {langOpen && (
                <div className="anim-fade-in" style={{
                  position: 'absolute', top: 'calc(100% + 8px)',
                  right: 0, minWidth: 160,
                  background: 'var(--bg-white)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden', zIndex: 200,
                }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { onSetLanguage(lang.code); setLangOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 14px',
                        background: lang.code === language ? 'var(--bg-muted)' : 'transparent',
                        fontWeight: lang.code === language ? 700 : 500,
                        fontSize: '0.875rem', color: 'var(--text-dark)',
                        borderBottom: '1px solid var(--border)',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                      <span>{lang.name}</span>
                      {lang.code === language && <span style={{ marginLeft: 'auto', color: 'var(--brand-green-light)' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Button — only on menu step */}
            {showCart && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {cartCount > 0 && (
                  <span
                    key={cartTotal}
                    className="anim-bump"
                    style={{
                      fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '0.9rem',
                      color: 'var(--brand-green)', background: 'var(--bg-muted)',
                      padding: '6px 12px', borderRadius: 'var(--r-full)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ${Number(cartTotal || 0).toFixed(2)}
                  </span>
                )}
                <button
                  id="cart-btn"
                  onClick={onOpenCart}
                  style={{
                    position: 'relative', width: 44, height: 44,
                    borderRadius: 'var(--r-sm)', background: 'var(--bg-white)',
                    border: '1px solid var(--border)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-dark)', boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0,
                  }}
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span
                      key={`badge-${cartCount}`}
                      className="anim-bump"
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        background: '#ef4444', color: 'white', borderRadius: '50%',
                        width: 20, height: 20, fontSize: '0.7rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close lang dropdown on outside click */}
      {langOpen && (
        <div
          onClick={() => setLangOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
        />
      )}
    </header>
  );
}
