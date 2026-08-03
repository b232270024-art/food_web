import React from 'react';
import { X, FileText } from 'lucide-react';

export function TermsModal({ isOpen, onClose, tr }) {
  if (!isOpen) return null;

  return (
    <div
      className="anim-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(17,24,39,0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="anim-scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
          width: '100%', maxWidth: 760, height: '85vh',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="var(--brand-green)" />
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.05rem' }}>
              {tr.termsModalTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--bg-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-body)', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <iframe
          src="/policies.html#terms-of-service"
          title={tr.termsModalTitle}
          style={{ flex: 1, border: 'none', width: '100%' }}
        />
      </div>
    </div>
  );
}
