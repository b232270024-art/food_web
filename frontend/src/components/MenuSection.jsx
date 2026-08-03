import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Minus, ArrowRight, ChevronLeft } from 'lucide-react';

const MEAL_TIME_LABEL = { morning: 'Өглөө', lunch: 'Өдөр', evening: 'Орой' };

// Admin-ийн PlanManager-с тохируулсан бодит өдөр тус бүрийн хуваарийг
// татаж, өдрөөр сонгож харуулна. Захиалга биш тул readonly (сагслах товчгүй).
function DayPlanPreview({ planItems, tr }) {
  const [selectedDay, setSelectedDay] = useState(1);

  const daysWithItems = [...new Set(planItems.map(p => p.day_number))].sort((a, b) => a - b);
  const activeDay = daysWithItems.includes(selectedDay) ? selectedDay : daysWithItems[0];
  const byMeal = { morning: [], lunch: [], evening: [] };
  planItems.filter(p => p.day_number === activeDay).forEach(p => byMeal[p.meal_time]?.push(p));

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: 16 }}>
        {tr.menuPlanScheduleTitle}
      </h3>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {daysWithItems.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            style={{
              width: 40, height: 40, borderRadius: 10, fontWeight: 800, fontSize: '0.85rem',
              background: activeDay === day ? 'var(--brand-green)' : 'var(--bg-muted)',
              color: activeDay === day ? '#fff' : 'var(--text-body)',
            }}
          >
            {day}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {Object.entries(MEAL_TIME_LABEL).map(([key, label]) => (
          <div key={key} className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: 10 }}>{label}</div>
            {byMeal[key].length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>—</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {byMeal[key].map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.image_url
                      ? <img src={item.image_url} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-muted)', flexShrink: 0 }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.restaurant_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BackButton({ label, onBack }) {
  return (
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
      {label}
    </button>
  );
}

// Танигдсан ангиллын нэрсэд зориулсан стиль (emoji/өнгө) — admin шинээр
// нэмсэн/сольсон ангилалд DIET_CONFIG.standard-ийн стандарт стиль fallback
// болно (нэрийг нь rename хийсэн ч харагдац эвдрэхгүй).
const DIET_CONFIG = {
  halal:        { label: 'Halal',        emoji: '☪️',  color: '#065f46', bg: '#d1fae5' },
  vegetarian:   { label: 'Vegetarian',   emoji: '🌿',  color: '#166534', bg: '#dcfce7' },
  vegan:        { label: 'Vegan',        emoji: '🌱',  color: '#14532d', bg: '#f0fdf4' },
  gluten_free:  { label: 'Gluten Free',  emoji: '🌾✕', color: '#78350f', bg: '#fef3c7' },
  standard:     { label: 'Standard',     emoji: '🍽',  color: '#374151', bg: '#f3f4f6' },
};

function dietStyle(name) {
  const key = (name || '').toLowerCase().trim().replace(/\s+/g, '_');
  return DIET_CONFIG[key] || { ...DIET_CONFIG.standard, label: name || DIET_CONFIG.standard.label };
}

const CATEGORY_EMOJI = {
  'Main Course': '🥩', 'Salad & Appetizer': '🥗', 'Appetizer': '🥗',
  'Dessert & Drinks': '🍰', 'Beverages': '🍹', default: '🍽',
};

const CARD_BG = ['#fff3e8', '#e8f5e9', '#fff8e1', '#fce4ec', '#e8f0fe', '#f0fdf4'];

function ItemCard({ item, idx, qty, onAddToCart, onRemoveFromCart, readOnly }) {
  const diet = dietStyle(item.diet_type_name);
  const emoji = CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.default;
  const bg = CARD_BG[idx % CARD_BG.length];
  const featured = item.is_featured;

  return (
    <div
      className="card anim-fade-up"
      style={{
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: featured ? '2px solid var(--brand-green-light)' : '1px solid var(--border-card)',
        animationDelay: `${Math.min(idx, 10) * 0.04}s`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {featured && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'var(--accent-yellow)', color: '#111',
          fontSize: '0.7rem', fontWeight: 800,
          padding: '3px 10px', borderRadius: 'var(--r-full)',
          zIndex: 1,
        }}>
          ⭐ Featured
        </div>
      )}

      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '4rem', position: 'relative', overflow: 'hidden',
      }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<span style="font-size:3.5rem">${emoji}</span>`;
            }}
          />
        ) : (
          <span>{emoji}</span>
        )}
      </div>

      <div style={{ padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 'var(--r-full)',
            background: diet.bg, color: diet.color,
            fontSize: '0.72rem', fontWeight: 800, border: `1px solid ${diet.color}22`,
          }}>
            {diet.label}
          </span>
          {item.category && (
            <span style={{
              padding: '3px 10px', borderRadius: 'var(--r-full)',
              background: 'var(--bg-muted)', color: 'var(--text-muted)',
              fontSize: '0.72rem', fontWeight: 600,
            }}>
              {item.category}
            </span>
          )}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6, lineHeight: 1.35 }}>
          {item.name}
        </h3>

        {item.description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 12 }}>
            {item.description}
          </p>
        )}

{item.stock_limit === 0 && (
          <div style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: 14, fontWeight: 700 }}>
            Sold Out
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--brand-green)' }}>
            ${Number(item.price_usd).toFixed(2)}
          </span>

          {readOnly ? null : item.stock_limit === 0 ? (
            <span style={{
              background: '#f3f4f6', color: '#9ca3af',
              padding: '9px 20px', borderRadius: 10,
              fontWeight: 700, fontSize: '0.875rem',
            }}>
              Дууссан
            </span>
          ) : qty > 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-muted)', borderRadius: 10, padding: '4px',
            }}>
              <button
                onClick={() => onRemoveFromCart(item.id)}
                style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Minus size={14} />
              </button>
              <span style={{ fontWeight: 800, minWidth: 22, textAlign: 'center', fontSize: '0.9rem' }}>{qty}</span>
              <button
                onClick={() => onAddToCart(item)}
                disabled={item.stock_limit !== null && qty >= item.stock_limit}
                style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: item.stock_limit !== null && qty >= item.stock_limit ? '#ccc' : 'var(--brand-green)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              style={{
                background: 'var(--brand-green)', color: 'white',
                padding: '9px 20px', borderRadius: 10,
                fontWeight: 700, fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus size={15} /> Add To Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CardGrid({ items, getQty, onAddToCart, onRemoveFromCart, readOnly }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 24,
    }}>
      {items.map((item, idx) => (
        <ItemCard
          key={item.id}
          item={item}
          idx={idx}
          qty={getQty(item.id)}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

export function MenuSection({ menuItems, cart, orderType, hotelId, tr, onAddToCart, onRemoveFromCart, onConfirmPlan, onContinueToDelivery, onBack }) {
  const [search,      setSearch]      = useState('');
  const [dietFilter,  setDietFilter]  = useState('all');
  const [catFilter,   setCatFilter]   = useState('All');
  const [planItems,   setPlanItems]   = useState(null); // admin-ийн тохируулсан 12 хоногийн хуваарь (12-day preview-д ашиглана)

  useEffect(() => {
    if (!hotelId || orderType !== 'twelve_day') return;
    fetch(`/api/menu/${hotelId}/plan`)
      .then(r => r.json())
      .then(data => setPlanItems(Array.isArray(data) ? data : []))
      .catch(() => setPlanItems([]));
  }, [hotelId, orderType]);

  const categories = useMemo(() => {
    const cats = [...new Set(menuItems.map(i => i.category).filter(Boolean))];
    return ['All', ...cats];
  }, [menuItems]);

  // Тухайн буудлын menu-д бодитоор ашиглагдаж буй ангиллуудаас л filter pill
  // үүсгэнэ (dietFilter одоо fixed key биш, diet_type_id (uuid) хадгална).
  const dietFilters = useMemo(() => {
    const map = new Map();
    menuItems.forEach(i => { if (i.diet_type_id && !map.has(i.diet_type_id)) map.set(i.diet_type_id, i.diet_type_name); });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [menuItems]);

  const filtered = useMemo(() =>
    menuItems.filter(item => {
      const matchDiet   = dietFilter === 'all' || item.diet_type_id === dietFilter;
      const matchCat    = catFilter === 'All'  || item.category === catFilter;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchDiet && matchCat && matchSearch;
    }),
    [menuItems, dietFilter, catFilter, search]
  );

  const isFiltering = search.trim() !== '' || dietFilter !== 'all' || catFilter !== 'All';

  const getQty = (id) => cart.find(c => c.menu_item_id === id)?.quantity ?? 0;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + Number(i.price_usd) * i.quantity, 0);

  // ── 12-Day Plan Preview ────────────────────────────────────────────────────────
  if (orderType === 'twelve_day') {
    return (
      <div className="anim-fade-up" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 0 100px' }}>
        <BackButton label={tr.back} onBack={onBack} />
        <h2 className="heading-lg" style={{ marginBottom: 8 }}>{tr.menuPlanTitle}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>{tr.menuPlanSubtitle}</p>
        <div className="card" style={{ padding: 32, marginBottom: 32 }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {tr.menuPlanItems.map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--brand-green)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                }}>✓</div>
                <span style={{ color: 'var(--text-body)', fontSize: '0.95rem', lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {planItems && planItems.length > 0 ? (
          <DayPlanPreview planItems={planItems} tr={tr} />
        ) : menuItems.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: 16 }}>
              {tr.menuPlanPreviewTitle}
            </h3>
            <CardGrid items={menuItems} getQty={getQty} readOnly />
          </div>
        )}

        <button
          id="confirm-plan-btn"
          className="btn-primary"
          onClick={onConfirmPlan}
          style={{ width: '100%', padding: 16, justifyContent: 'center', borderRadius: 14 }}
        >
          {tr.menuPlanConfirm}
        </button>
      </div>
    );
  }

  // ── One-time: Full Menu View ───────────────────────────────────────────────────
  const featuredItems = menuItems.filter(i => i.is_featured);
  const sectionedCategories = categories.filter(c => c !== 'All');

  return (
    <div className="anim-fade-up" style={{ padding: `40px 0 ${cartCount > 0 ? 110 : 40}px` }}>
      <BackButton label={tr.back} onBack={onBack} />

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 28 }}>
        <div>
          <h2 className="heading-lg">
            {tr.menuTitle}
            <span style={{ color: 'var(--brand-green-light)' }}>{tr.menuTitleAccent}</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>{tr.menuDesc}</p>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
          <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            id="menu-search"
            type="text"
            placeholder={tr.menuSearch}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 42px',
              borderRadius: 'var(--r-full)',
              border: '1.5px solid var(--border)',
              background: 'var(--bg-card)', fontSize: '0.875rem', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Diet type filter pills — тухайн буудлын menu-д бодитоор байгаа ангиллуудаас */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => setDietFilter('all')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 'var(--r-full)',
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            border: `2px solid ${dietFilter === 'all' ? DIET_CONFIG.standard.color : 'var(--border)'}`,
            background: dietFilter === 'all' ? DIET_CONFIG.standard.bg : 'var(--bg-card)',
            color: dietFilter === 'all' ? DIET_CONFIG.standard.color : 'var(--text-body)',
            transition: 'all 0.2s',
          }}
        >
          <span>🍽</span> {tr.menuAllCat}
        </button>
        {dietFilters.map(f => {
          const active = dietFilter === f.id;
          const cfg = dietStyle(f.name);
          return (
            <button
              key={f.id}
              onClick={() => setDietFilter(f.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 'var(--r-full)',
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                border: `2px solid ${active ? cfg.color : 'var(--border)'}`,
                background: active ? cfg.bg : 'var(--bg-card)',
                color: active ? cfg.color : 'var(--text-body)',
                transition: 'all 0.2s',
              }}
            >
              <span>{cfg.emoji}</span> {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 28 }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`pill ${catFilter === cat ? 'active' : ''}`}
            onClick={() => setCatFilter(cat)}
          >
            {cat === 'All' ? tr.menuAllCat : cat}
          </button>
        ))}
      </div>

      {isFiltering ? (
        // ── Flat filtered grid ──────────────────────────────────────────────────
        filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: 'var(--bg-card)', borderRadius: 'var(--r-xl)', color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{tr.menuEmpty}</p>
            <p style={{ fontSize: '0.875rem' }}>{tr.menuEmptySub}</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              {filtered.length} dish{filtered.length !== 1 ? 'es' : ''} found
            </p>
            <CardGrid items={filtered} getQty={getQty} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} />
          </>
        )
      ) : (
        // ── Sectioned view (Special Offers + per-category banners) ─────────────
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {featuredItems.length > 0 && (
            <section>
              <h3 style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-dark)', marginBottom: 18 }}>
                ⭐ {tr.menuSpecialOffers}
              </h3>
              <CardGrid items={featuredItems} getQty={getQty} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} />
            </section>
          )}

          {sectionedCategories.map((cat, i) => {
            const items = menuItems.filter(item => item.category === cat);
            if (items.length === 0) return null;
            const banded = i % 2 === 1;
            return (
              <section
                key={cat}
                style={banded ? {
                  background: 'var(--brand-green)',
                  borderRadius: 'var(--r-xl)',
                  padding: '32px 28px',
                } : undefined}
              >
                <h3 style={{
                  fontWeight: 800, fontSize: '1.3rem', marginBottom: 18,
                  color: banded ? 'white' : 'var(--text-dark)',
                }}>
                  {cat}
                </h3>
                <CardGrid items={items} getQty={getQty} onAddToCart={onAddToCart} onRemoveFromCart={onRemoveFromCart} />
              </section>
            );
          })}
        </div>
      )}

      {/* Floating "Continue" bar once the cart has items — rendered via portal straight to
          <body> so it stays pinned to the viewport (an ancestor's CSS transform/animation
          would otherwise turn `position: fixed` into `position: absolute` relative to it). */}
      {cartCount > 0 && createPortal(
        <div
          style={{
            position: 'fixed', left: 20, right: 20, bottom: 20,
            maxWidth: 1160, margin: '0 auto', zIndex: 150,
          }}
        >
          <div className="anim-slide-up" style={{
            background: 'var(--bg-green-dark)', padding: '16px 24px',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.78rem' }}>
                {cartCount} item{cartCount !== 1 ? 's' : ''} in cart
              </span>
              <span key={cartTotal} className="anim-bump" style={{ color: 'white', fontWeight: 900, fontSize: '1.15rem' }}>
                ${cartTotal.toFixed(2)}
              </span>
            </div>
            <button
              id="menu-continue-btn"
              onClick={onContinueToDelivery}
              style={{
                background: 'var(--accent-yellow)', color: '#111',
                padding: '12px 24px', borderRadius: 12,
                fontWeight: 800, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {tr.menuContinueBtn} <ArrowRight size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
