import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, MapPin, Loader2 } from 'lucide-react';
import { detectCurrentPosition, reverseGeocode } from '../lib/geocode';

const DEFAULT_CENTER = [47.9184, 106.9177]; // Ulaanbaatar

// Custom pin — avoids Leaflet's default marker image paths breaking under bundlers.
const pinIcon = L.divIcon({
  className: 'location-pin-icon',
  html: `<div style="
    width:38px;height:38px;border-radius:50% 50% 50% 0;
    background:#3D7A5A;transform:rotate(-45deg);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 10px rgba(0,0,0,0.35);border:2px solid white;
  "><div style="width:12px;height:12px;border-radius:50%;background:white"></div></div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 36],
});

export function LocationPicker({ geo, address, onLocationChange, tr }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [detecting, setDetecting] = useState(false);
  const [status, setStatus] = useState('');

  // ── Init map once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(mapElRef.current, {
      center: geo ? [geo.lat, geo.lng] : DEFAULT_CENTER,
      zoom: geo ? 16 : 12,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(geo ? [geo.lat, geo.lng] : DEFAULT_CENTER, {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', async () => {
      const { lat, lng } = marker.getLatLng();
      await resolveAndEmit(lat, lng);
    });

    map.on('click', async (e) => {
      marker.setLatLng(e.latlng);
      await resolveAndEmit(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !geo) return;
    markerRef.current.setLatLng([geo.lat, geo.lng]);
    mapRef.current.setView([geo.lat, geo.lng], 16, { animate: true });
  }, [geo]);

  const resolveAndEmit = async (lat, lng) => {
    setStatus(tr.locationResolving);
    try {
      const result = await reverseGeocode(lat, lng);
      onLocationChange({ lat, lng, address: result.address });
      setStatus(tr.locationConfirmed);
    } catch {
      onLocationChange({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      setStatus(tr.locationConfirmed);
    }
  };

  const handleDetect = async () => {
    setDetecting(true);
    setStatus(tr.locationDetecting);
    try {
      const { lat, lng } = await detectCurrentPosition();
      await resolveAndEmit(lat, lng);
    } catch {
      setStatus(tr.locationDetectFail);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="card" style={{ padding: '22px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={18} color="var(--brand-green)" />
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem' }}>
            {tr.locationPickerTitle}
          </h3>
        </div>
        <button
          id="detect-location-btn"
          type="button"
          onClick={handleDetect}
          disabled={detecting}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'var(--brand-green)', color: 'white',
            fontSize: '0.8rem', fontWeight: 700,
            opacity: detecting ? 0.7 : 1,
          }}
        >
          {detecting ? <Loader2 size={15} className="spin-icon" /> : <Crosshair size={15} />}
          {detecting ? tr.locationDetecting : tr.locationDetectBtn}
        </button>
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
        {tr.locationPickerHint}
      </p>

      <div
        ref={mapElRef}
        id="location-map"
        style={{
          width: '100%', height: 260, borderRadius: 'var(--r-md)',
          overflow: 'hidden', border: '1px solid var(--border)',
          marginBottom: 14,
        }}
      />

      {status && (
        <p style={{ fontSize: '0.78rem', color: 'var(--brand-green-btn)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={13} /> {status}
        </p>
      )}

      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-body)', marginBottom: 6 }}>
          {tr.guestAddressLabel}
        </label>
        <textarea
          id="location-address-input"
          value={address}
          onChange={e => onLocationChange({ lat: geo?.lat ?? null, lng: geo?.lng ?? null, address: e.target.value })}
          placeholder={tr.guestAddressPlaceholder}
          rows={2}
          style={{
            width: '100%', padding: '10px 14px',
            borderRadius: 10, border: '1.5px solid var(--border)',
            fontSize: '0.88rem', outline: 'none', resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>{tr.guestAddressEditHint}</p>
      </div>
    </div>
  );
}
