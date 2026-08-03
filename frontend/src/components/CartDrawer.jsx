import React from 'react';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';

export function CartDrawer({ isOpen, onClose, cart, onAddToCart, onRemoveFromCart, onClearCart, onPlaceOrder, isSubmitting, tr }) {
  const total = cart.reduce((s, i) => s + Number(i.price_usd) * i.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(17,24,39,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 300,
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        className={isOpen ? 'anim-slide-right' : ''}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 420,
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 400,
          display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: isOpen ? 'none' : 'transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={22} color="var(--brand-green)" />
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem' }}>
              {tr.cartTitle}
            </h2>
            {cart.length > 0 && (
              <span style={{
                background: 'var(--brand-green)', color: 'white',
                borderRadius: 'var(--r-full)', padding: '2px 10px',
                fontSize: '0.8rem', fontWeight: 800,
              }}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: '#fef2f2', color: '#ef4444',
                  fontSize: '0.8rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Trash2 size={14} /> {tr.cartClear}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--bg-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-body)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cart.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 16,
              color: 'var(--text-muted)',
            }}>
              <ShoppingBag size={56} strokeWidth={1} />
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{tr.cartEmpty}</p>
              <p style={{ fontSize: '0.875rem', textAlign: 'center' }}>{tr.cartEmptySub}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {cart.map(item => (
                <div
                  key={item.menu_item_id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px', borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)', background: 'var(--bg-cream)',
                  }}
                >
                  {/* Emoji */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 12,
                    background: 'var(--bg-muted)', fontSize: '1.6rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    🍽
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </p>
                    <p style={{ color: 'var(--brand-green)', fontWeight: 800, fontSize: '0.9rem', marginTop: 2 }}>
                      ${(Number(item.price_usd) * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => onRemoveFromCart(item.menu_item_id)}
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontWeight: 800, width: 22, textAlign: 'center' }}>{item.quantity}</span>
                    <button
                      onClick={() => onAddToCart(item)}
                      style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: 'var(--brand-green)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)',
          }}>
            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ color: 'var(--text-body)', fontWeight: 600 }}>{tr.cartSubtotal}</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-dark)' }}>
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              id="place-order-btn"
              onClick={onPlaceOrder}
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: isSubmitting
                  ? '#a7f3d0'
                  : 'linear-gradient(135deg, #3D7A5A, #1A3C34)',
                color: 'white',
                padding: '16px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isSubmitting ? 'none' : 'var(--shadow-glow)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? tr.cartPlacing : tr.menuContinueBtn}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
