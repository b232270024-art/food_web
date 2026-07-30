import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

import { Header }              from './components/Header';
import { HeroSection }         from './components/HeroSection';
import { TodaySpecialOffers }  from './components/TodaySpecialOffers';
import { HowItWorks }          from './components/HowItWorks';
import { AboutSection }        from './components/AboutSection';
import { Footer }              from './components/Footer';
import { OrderTypeSelection }  from './components/OrderTypeSelection';
import { DeliveryTypeSelection } from './components/DeliveryTypeSelection';
import { GuestDetailsModal }   from './components/GuestDetailsModal';
import { MenuSection }         from './components/MenuSection';
import { CartDrawer }          from './components/CartDrawer';

import { LANGUAGES, useTranslation } from './i18n/translations';

// ── Flow steps ────────────────────────────────────────────────────────────────
// 'hero'          → landing page (Hero + Special Offers + How it works + About)
// 'order_type'    → Select an order type screen (12-day plan / one-time)
// 'plan_preview'  → (12-day) real menu preview + Confirm → guest details → confirmation
// 'menu'          → (one-time) full menu, cart, "Continue" once cart has items
// 'delivery_type' → (one-time) hotel room vs current location
// 'confirmation'  → order/plan confirmed (payment collected on delivery, no gateway yet)
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // ─── Core state ─────────────────────────────────────────────────────────────
  const [hotel,       setHotel]       = useState(null);
  const [session,     setSession]     = useState(null);
  const [menuItems,   setMenuItems]   = useState([]);
  const [cart,        setCart]        = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  // ─── UI/Flow state ───────────────────────────────────────────────────────────
  const [language,       setLanguage]       = useState('en');
  const [flowStep,       setFlowStep]       = useState('hero');
  const [orderType,      setOrderType]      = useState(null);   // 'twelve_day' | 'one_time'
  const [deliveryType,   setDeliveryType]   = useState(null);   // 'hotel' | 'current_location'
  const [guestDetailsOpen, setGuestDetailsOpen] = useState(false);
  const [cartOpen,       setCartOpen]       = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [toast,          setToast]          = useState('');

  const tr = useTranslation(language);

  // ─── Apply RTL for Arabic ────────────────────────────────────────────────────
  useEffect(() => {
    const dir = LANGUAGES.find(l => l.code === language)?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  // ─── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  // ─── Initial load: resolve hotel from QR token + restore language ─────────────
  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem('guest_language');
      if (savedLanguage) setLanguage(savedLanguage);
    } catch { /* ignore */ }

    const params = new URLSearchParams(window.location.search);
    const qrToken = params.get('qr') || 'test-qr-token-001';

    fetch(`/api/hotels/${qrToken}/resolve`)
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setHotel(data);
          return fetch(`/api/menu/${data.id}`).then(r => r.json());
        }
      })
      .then(items => {
        if (Array.isArray(items)) setMenuItems(items);
      })
      .catch(console.error);
  }, []);

  // ─── Persist language choice ──────────────────────────────────────────────────
  const handleSetLanguage = (code) => {
    setLanguage(code);
    localStorage.setItem('guest_language', code);
  };

  // ─── Cart operations ──────────────────────────────────────────────────────────
  const handleAddToCart = useCallback((item) => {
    setCart(prev => {
      const id = item.id || item.menu_item_id;
      const existing = prev.find(i => i.menu_item_id === id);
      if (existing) {
        return prev.map(i => i.menu_item_id === id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menu_item_id: id, name: item.name, price_usd: item.price_usd || item.price, quantity: 1 }];
    });
    showToast(`"${item.name}" added to cart`);
  }, [showToast]);

  const handleRemoveFromCart = useCallback((itemId) => {
    setCart(prev => {
      const ex = prev.find(i => i.menu_item_id === itemId);
      if (ex && ex.quantity > 1) return prev.map(i => i.menu_item_id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.menu_item_id !== itemId);
    });
  }, []);

  // ─── Socket.io: real-time order updates ───────────────────────────────────────
  useEffect(() => {
    if (!session?.id) return;
    const socket = io(window.location.origin);
    if (session.room_number) socket.emit('join:room', session.room_number);
    socket.on('order:updated', ({ orderId, status }) => {
      if (activeOrder?.id === orderId) {
        setActiveOrder(prev => ({ ...prev, status }));
        showToast(`Order status: ${status.toUpperCase()}`);
      }
    });
    return () => socket.disconnect();
  }, [session, activeOrder, showToast]);

  // ─── "Get Started" handler ────────────────────────────────────────────────────
  const handleGetStarted = () => {
    setFlowStep('order_type');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Order type selected: 12-day → plan preview, one-time → full menu ─────────
  // OrderTypeSelection emits its own internal values ('12-day' | 'one-time');
  // map them to the order_type vocabulary used by the rest of the app + API.
  const handleOrderTypeContinue = (selected) => {
    const type = selected === '12-day' ? 'twelve_day' : 'one_time';
    setOrderType(type);
    setFlowStep(type === 'twelve_day' ? 'plan_preview' : 'menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── 12-day plan: Confirm → ask guest details (room always, no delivery choice) ─
  const handleConfirmPlan = () => {
    setDeliveryType(null);
    setGuestDetailsOpen(true);
  };

  // ─── One-time: cart has items → ask delivery type ─────────────────────────────
  const handleContinueToDelivery = () => {
    setCartOpen(false);
    setFlowStep('delivery_type');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeliveryTypeContinue = (type) => {
    setDeliveryType(type);
    setGuestDetailsOpen(true);
  };

  // ─── Start a fresh order from the confirmation screen ─────────────────────────
  const handleBackToHome = () => {
    setOrderType(null);
    setDeliveryType(null);
    setSession(null);
    setActiveOrder(null);
    setCart([]);
    setFlowStep('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Guest details submit → create session, then (one-time) place the order ──
  const handleGuestDetailsSubmit = async ({ guest_name, room_number, delivery_address, geo_lat, geo_lng }) => {
    if (!hotel?.id) throw new Error('Hotel not found');

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        hotel_id: hotel.id,
        guest_name,
        order_type: orderType,
        delivery_type: orderType === 'one_time' ? deliveryType : null,
        room_number,
        delivery_address,
        geo_lat,
        geo_lng,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Check-in failed');

    const sess = data.session;
    setSession(sess);
    setGuestDetailsOpen(false);

    if (orderType === 'twelve_day') {
      setFlowStep('confirmation');
      showToast(`Welcome, ${guest_name}! 🎉`);
      return;
    }

    // One-time: submit the cart as the order right away.
    setSubmitting(true);
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cart.map(c => ({ menu_item_id: c.menu_item_id, quantity: c.quantity, guest_name })),
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order failed');
      setActiveOrder(orderData);
      setCart([]);
      setFlowStep('confirmation');
      showToast(tr.orderPlaced);
    } finally {
      setSubmitting(false);
    }
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="app-wrapper">
      <Header
        hotel={hotel}
        session={session}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        language={language}
        onSetLanguage={handleSetLanguage}
        showCart={flowStep === 'menu'}
        tr={tr}
      />

      <main style={{ flex: 1 }}>
        {toast && <div className="toast">{toast}</div>}

        {/* ── HERO FLOW ─────────────────────────────────────────────────────── */}
        {flowStep === 'hero' && (
          <>
            <HeroSection hotel={hotel} tr={tr} onGetStarted={handleGetStarted} />
            <TodaySpecialOffers menuItems={menuItems} tr={tr} onGetStarted={handleGetStarted} />
            <HowItWorks tr={tr} />
            <AboutSection tr={tr} />
          </>
        )}

        {/* ── ORDER TYPE SELECTION ──────────────────────────────────────────── */}
        {flowStep === 'order_type' && (
          <OrderTypeSelection
            tr={tr}
            onBack={() => setFlowStep('hero')}
            onContinue={handleOrderTypeContinue}
          />
        )}

        {/* ── 12-DAY PLAN PREVIEW ────────────────────────────────────────────── */}
        {flowStep === 'plan_preview' && (
          <div className="container" style={{ paddingTop: 8, paddingBottom: 60 }}>
            <MenuSection
              menuItems={menuItems}
              cart={cart}
              orderType={orderType}
              tr={tr}
              onConfirmPlan={handleConfirmPlan}
              onBack={() => setFlowStep('order_type')}
            />
          </div>
        )}

        {/* ── ONE-TIME: FULL MENU ─────────────────────────────────────────────── */}
        {flowStep === 'menu' && (
          <div className="container" style={{ paddingTop: 8, paddingBottom: 60 }}>
            <MenuSection
              menuItems={menuItems}
              cart={cart}
              orderType={orderType}
              tr={tr}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onContinueToDelivery={handleContinueToDelivery}
              onBack={() => setFlowStep('order_type')}
            />
          </div>
        )}

        {/* ── DELIVERY TYPE SELECTION (one-time only) ─────────────────────────── */}
        {flowStep === 'delivery_type' && (
          <DeliveryTypeSelection
            tr={tr}
            onBack={() => setFlowStep('menu')}
            onContinue={handleDeliveryTypeContinue}
          />
        )}

        {/* ── CONFIRMATION ─────────────────────────────────────────────────────── */}
        {flowStep === 'confirmation' && (
          <div className="container" style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
            <h1 className="heading-lg" style={{ marginBottom: 12 }}>{tr.orderConfirmedTitle}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{tr.orderConfirmedDesc}</p>
            {activeOrder && (
              <div className="card" style={{ padding: 24, textAlign: 'left', marginBottom: 24 }}>
                <p style={{ fontWeight: 700 }}>{tr.orderStatus}: <strong style={{ textTransform: 'uppercase' }}>{activeOrder.status}</strong></p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 6 }}>Total: ${Number(activeOrder.total_usd).toFixed(2)}</p>
              </div>
            )}
            <button className="btn-outline" onClick={handleBackToHome} style={{ margin: '0 auto' }}>
              {tr.backToHomeBtn}
            </button>
          </div>
        )}
      </main>

      {/* Footer — shown on hero only */}
      {flowStep === 'hero' && <Footer hotel={hotel} tr={tr} />}

      {/* Guest Details Modal */}
      <GuestDetailsModal
        isOpen={guestDetailsOpen}
        hotel={hotel}
        tr={tr}
        deliveryType={orderType === 'one_time' ? deliveryType : null}
        onSubmit={handleGuestDetailsSubmit}
        onClose={() => setGuestDetailsOpen(false)}
      />

      {/* Cart Drawer (one-time flow) */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={() => setCart([])}
        onPlaceOrder={handleContinueToDelivery}
        isSubmitting={submitting}
        tr={tr}
      />
    </div>
  );
}
