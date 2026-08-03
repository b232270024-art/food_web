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
import { OrderReview }         from './components/OrderReview';
import { TermsModal }          from './components/TermsModal';

import { LANGUAGES, useTranslation } from './i18n/translations';

// ── Flow steps ────────────────────────────────────────────────────────────────
// 'hero'          → landing page (Hero + Special Offers + How it works + About)
// 'order_type'    → Select an order type screen (12-day plan / one-time)
// 'plan_preview'  → (12-day) real menu preview + Confirm → guest details → confirmation
// 'menu'          → (one-time) full menu, cart, "Continue" once cart has items
// 'delivery_type' → (one-time) hotel room vs current location
// 'confirmation'  → order/plan confirmed (payment collected on delivery, no gateway yet)
// ─────────────────────────────────────────────────────────────────────────────
const FLOW_STEPS = ['hero', 'order_type', 'plan_preview', 'menu', 'delivery_type', 'order_review', 'confirmation'];
const pathForStep = (step) => (step === 'hero' ? '/' : `/${step}`) + window.location.search;

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
  const [agreeTerms,     setAgreeTerms]     = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  // ─── Current-location delivery: captured inline on the review page (no popup) ─
  const [pendingGuestName, setPendingGuestName] = useState('');
  const [pendingAddress,   setPendingAddress]   = useState('');
  const [pendingGeo,       setPendingGeo]       = useState(null);

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

  // ─── Browser Back/Forward: keep flow steps in sync with history ──────────────
  // The app has no real routes (single-page state machine), so without this the
  // Back button leaves the site entirely instead of stepping back through the
  // checkout flow. goToStep() pushes a history entry per step change; popstate
  // (fired by Back/Forward) restores flowStep without pushing again.
  const goToStep = useCallback((step) => {
    window.history.pushState({ flowStep: step }, '', pathForStep(step));
    setFlowStep(step);
  }, []);

  useEffect(() => {
    // Support deep-linking / refresh on a step's URL (e.g. /menu) — the server
    // SPA fallback (src/index.js) already returns index.html for any unknown
    // path, so this just needs to pick up wherever the browser landed.
    const pathStep = window.location.pathname.replace(/^\//, '');
    const initial = FLOW_STEPS.includes(pathStep) ? pathStep : 'hero';
    window.history.replaceState({ flowStep: initial }, '', pathForStep(initial));
    setFlowStep(initial);

    const handlePopState = (e) => {
      setFlowStep(e.state?.flowStep || 'hero');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
    goToStep('order_type');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Order type selected: 12-day → plan preview, one-time → full menu ─────────
  // OrderTypeSelection emits its own internal values ('12-day' | 'one-time');
  // map them to the order_type vocabulary used by the rest of the app + API.
  const handleOrderTypeContinue = (selected) => {
    const type = selected === '12-day' ? 'twelve_day' : 'one_time';
    setOrderType(type);
    goToStep(type === 'twelve_day' ? 'plan_preview' : 'menu');
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
    goToStep('delivery_type');
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
    setAgreeTerms(false);
    setPendingGuestName('');
    setPendingAddress('');
    setPendingGeo(null);
    goToStep('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Guest details submit → create session, then (one-time) place the order ──
  // Exception: 'current_location' deliveries defer session creation until the guest
  // confirms their location with the map picker on the order review screen — no
  // separate popup is used to capture it.
  const handleGuestDetailsSubmit = async ({ guest_name, room_number, delivery_address, geo_lat, geo_lng }) => {
    if (!hotel?.id) throw new Error('Hotel not found');

    if (orderType === 'one_time' && deliveryType === 'current_location') {
      setPendingGuestName(guest_name);
      setGuestDetailsOpen(false);
      goToStep('order_review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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
      goToStep('confirmation');
      showToast(`Welcome, ${guest_name}! 🎉`);
      return;
    }

    // One-time: review the order (with refund notice + terms) before paying.
    goToStep('order_review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Order review: agree to terms → place the order ──────────────────────────
  // For 'current_location', the session is only created here (once the map-picked
  // address is available), then the order is placed against it right away.
  const handlePayNow = async () => {
    if (!agreeTerms) return;
    if (!session && (!pendingAddress.trim() || !pendingGeo)) return;

    setSubmitting(true);
    try {
      let activeSession = session;

      if (!activeSession) {
        const sessRes = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            hotel_id: hotel.id,
            guest_name: pendingGuestName,
            order_type: orderType,
            delivery_type: 'current_location',
            room_number: null,
            delivery_address: pendingAddress.trim(),
            geo_lat: pendingGeo?.lat ?? null,
            geo_lng: pendingGeo?.lng ?? null,
          }),
        });
        const sessData = await sessRes.json();
        if (!sessRes.ok) throw new Error(sessData.error || 'Check-in failed');
        activeSession = sessData.session;
        setSession(activeSession);
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cart.map(c => ({ menu_item_id: c.menu_item_id, quantity: c.quantity, guest_name: activeSession.guest_name })),
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Order failed');
      setActiveOrder(orderData);
      setCart([]);
      setAgreeTerms(false);
      goToStep('confirmation');
      showToast(tr.orderPlaced);
    } catch (err) {
      showToast(err.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + Number(i.price_usd) * i.quantity, 0);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="app-wrapper">
      <Header
        session={session}
        cartCount={cartCount}
        cartTotal={cartTotal}
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
            <HeroSection tr={tr} onGetStarted={handleGetStarted} />
            <TodaySpecialOffers menuItems={menuItems} tr={tr} onGetStarted={handleGetStarted} />
            <HowItWorks tr={tr} />
            <AboutSection tr={tr} />
          </>
        )}

        {/* ── ORDER TYPE SELECTION ──────────────────────────────────────────── */}
        {flowStep === 'order_type' && (
          <OrderTypeSelection
            tr={tr}
            onBack={() => goToStep('hero')}
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
              hotelId={hotel?.id}
              tr={tr}
              onConfirmPlan={handleConfirmPlan}
              onBack={() => goToStep('order_type')}
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
              onBack={() => goToStep('order_type')}
            />
          </div>
        )}

        {/* ── DELIVERY TYPE SELECTION (one-time only) ─────────────────────────── */}
        {flowStep === 'delivery_type' && (
          <DeliveryTypeSelection
            tr={tr}
            onBack={() => goToStep('menu')}
            onContinue={handleDeliveryTypeContinue}
          />
        )}

        {/* ── ORDER REVIEW (refund notice + agree to terms + pay) ─────────────── */}
        {flowStep === 'order_review' && (
          <div className="container">
            <OrderReview
              cart={cart}
              hotel={hotel}
              session={session}
              deliveryType={deliveryType}
              pendingGuestName={pendingGuestName}
              pendingAddress={pendingAddress}
              pendingGeo={pendingGeo}
              onLocationChange={({ lat, lng, address }) => {
                setPendingAddress(address);
                setPendingGeo(lat != null && lng != null ? { lat, lng } : null);
              }}
              agreeTerms={agreeTerms}
              onToggleAgree={setAgreeTerms}
              onOpenTerms={() => setTermsModalOpen(true)}
              onPay={handlePayNow}
              isSubmitting={submitting}
              onEditDetails={() => setGuestDetailsOpen(true)}
              onBack={() => goToStep('menu')}
              tr={tr}
            />
          </div>
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
      {flowStep === 'hero' && <Footer tr={tr} />}

      {/* Guest Details Modal */}
      <GuestDetailsModal
        isOpen={guestDetailsOpen}
        hotel={hotel}
        tr={tr}
        deliveryType={orderType === 'one_time' ? deliveryType : null}
        onSubmit={handleGuestDetailsSubmit}
        onClose={() => setGuestDetailsOpen(false)}
      />

      {/* Terms & Policies modal (opened from the order review step) */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        tr={tr}
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
