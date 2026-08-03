import React, { useState } from 'react';
import { MapPin, User, DoorClosed, AlertCircle, Hotel, X } from 'lucide-react';

// deliveryType: 'hotel' | 'current_location' | null (null => implicit hotel, used by the
// 12-day plan flow where delivery is always to the guest's room).
// For 'current_location', this modal only collects the guest's name — the actual
// location is captured with a map picker on the order review screen (no second popup).
export function GuestDetailsModal({ isOpen, hotel, tr, deliveryType, onSubmit, onClose }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [geo, setGeo] = useState(null);
  const [geoStatus, setGeoStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isCurrentLocation = deliveryType === 'current_location';

  // Hotel-flow (or implicit hotel for the 12-day plan): optional presence verification only.
  const handleVerifyLocation = () => {
    if (!navigator.geolocation) { setGeoStatus(tr.checkinGeoUnsupported); return; }
    setGeoStatus(tr.checkinGeoDetecting);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus(tr.checkinGeoSuccess);
      },
      () => setGeoStatus(tr.checkinGeoFail)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError(tr.checkinError); return; }
    if (!isCurrentLocation && !room.trim()) { setError(tr.checkinError); return; }

    setError('');
    setLoading(true);
    try {
      await onSubmit({
        guest_name: name.trim(),
        room_number: isCurrentLocation ? null : room.trim(),
        delivery_address: null,
        geo_lat: geo?.lat ?? null,
        geo_lng: geo?.lng ?? null,
      });
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(17,24,39,0.65)',
      backdropFilter: 'blur(10px)',
      zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div className="anim-fade-up" style={{
        background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
        maxWidth: 440, width: '100%',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
      }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-muted)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-body)',
            }}
          >
            <X size={16} />
          </button>
        )}

        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #3D7A5A, #1A3C34)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '1.6rem',
        }}>
          🏨
        </div>

        <h2 style={{
          textAlign: 'center', fontFamily: 'Outfit, sans-serif',
          fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-dark)',
          marginBottom: 6,
        }}>
          {tr.checkinTitle}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 28 }}>
          {hotel?.name || 'Grand Hotel'} — {tr.checkinSubtitle}
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', color: '#991b1b',
            padding: '10px 14px', borderRadius: 12,
            fontSize: '0.85rem', marginBottom: 18,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
              {tr.checkinNameLabel}
            </label>
            <div style={{ position: 'relative' }}>
              <User size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                id="checkin-name"
                type="text"
                placeholder={tr.checkinNamePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 14px 12px 42px',
                  borderRadius: 12, border: '1.5px solid var(--border)',
                  fontSize: '0.95rem', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--brand-green-light)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {isCurrentLocation ? (
            <div style={{
              background: 'var(--bg-muted)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              marginBottom: 28,
            }}>
              <MapPin size={20} color="var(--brand-green-light)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
                {tr.guestLocationNextStepHint}
              </p>
            </div>
          ) : (
            <>
              {/* Hotel confirmation card */}
              {hotel?.name && (
                <div style={{
                  background: 'var(--bg-muted)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 16,
                }}>
                  <Hotel size={20} color="var(--brand-green-light)" />
                  <div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>{tr.guestHotelConfirmTitle}</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>{hotel.name}</p>
                    {hotel.address && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hotel.address}</p>}
                  </div>
                </div>
              )}

              {/* Room */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
                  {tr.checkinRoomLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <DoorClosed size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    id="checkin-room"
                    type="text"
                    placeholder={tr.checkinRoomPlaceholder}
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '12px 14px 12px 42px',
                      borderRadius: 12, border: '1.5px solid var(--border)',
                      fontSize: '0.95rem', outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--brand-green-light)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              {/* Optional geolocation verify */}
              <div style={{
                background: 'var(--bg-muted)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 28,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MapPin size={20} color="var(--brand-green-light)" />
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {tr.checkinGeoTitle}
                    </p>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      {geoStatus || tr.checkinGeoDesc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyLocation}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)',
                  }}
                >
                  {tr.checkinGeoBtn}
                </button>
              </div>
            </>
          )}

          <button
            id="checkin-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading
                ? '#a7f3d0'
                : 'linear-gradient(135deg, #3D7A5A, #1A3C34)',
              color: 'white',
              padding: '15px', borderRadius: 14,
              fontWeight: 800, fontSize: '1rem',
              boxShadow: loading ? 'none' : 'var(--shadow-glow)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? tr.checkinLoading : tr.checkinSubmit}
          </button>
        </form>
      </div>
    </div>
  );
}
