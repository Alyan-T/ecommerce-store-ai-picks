"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBagShopping, faMinus, faPlus, faXmark, faCheck, faTag } from "@fortawesome/free-solid-svg-icons";
import { Truck, RotateCcw, Lock } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart, appliedCoupon, setAppliedCoupon } = useCart();

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const discount = appliedCoupon ? (total * appliedCoupon.discountPercent) / 100 : 0;
  const discountedTotal = total - discount;

  async function handleApplyPromo(e) {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    setAppliedCoupon(null);
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(promoCode.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Invalid code.");
        return;
      }
      setAppliedCoupon({ code: data.code, discountPercent: data.discountPercent });
    } catch {
      setPromoError("Try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  function removePromo() {
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoError("");
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center fade-in-up">
        <div className="text-4xl mb-6" style={{ color: "var(--muted)" }}>
          <FontAwesomeIcon icon={faBagShopping} />
        </div>
        <h2 className="text-3xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>Your Cart is Empty</h2>
        <p className="mb-8 max-w-sm mx-auto" style={{ color: "var(--muted)" }}>Discover new arrivals and timeless classics to add to your collection.</p>
        <Link href="/" className="btn-primary" style={{ display: "inline-flex", width: "auto" }}>
          Explore the Collection
        </Link>
      </div>
    );
  }

  const checkoutHref = appliedCoupon
    ? `/checkout?coupon=${encodeURIComponent(appliedCoupon.code)}&discount=${appliedCoupon.discountPercent}`
    : "/checkout";

  return (
    <div className="fade-in-up max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>Your Cart</h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>{items.length} {items.length === 1 ? "Item" : "Items"}</p>
        </div>
        <Link href="/" className="text-xs uppercase tracking-widest transition-colors hover:text-charcoal" style={{ color: "var(--muted)", letterSpacing: "0.1em" }}>
          Continue Shopping →
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item, i) => (
            <div
              key={item._id}
              className="flex gap-6 pb-6 fade-in-up"
              style={{ borderBottom: "1px solid var(--border)", animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-24 h-32 flex-shrink-0" style={{ background: "var(--cream-2)" }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl"><FontAwesomeIcon icon={faBagShopping} style={{ color: "var(--muted-2)" }} /></div>
                )}
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-semibold truncate" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>{item.name}</h3>
                    <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>${item.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeItem(item._id)} className="p-1 transition-colors hover:text-charcoal" style={{ color: "var(--muted)" }} title="Remove">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <div className="flex items-center" style={{ border: "1px solid var(--border-strong)", width: "fit-content" }}>
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="px-3 py-1.5 transition-colors hover:bg-cream-2 text-xs" style={{ color: "var(--charcoal)" }}>
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold" style={{ color: "var(--charcoal)" }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="px-3 py-1.5 transition-colors hover:bg-cream-2 text-xs" style={{ color: "var(--charcoal)" }}>
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                  <p className="text-base font-semibold" style={{ color: "var(--charcoal)" }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="p-8 sticky top-24" style={{ background: "var(--cream-2)" }}>
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--charcoal)", letterSpacing: "0.15em" }}>Order Summary</h3>

            {/* Promo code */}
            <div className="mb-8">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3" style={{ border: "1px solid var(--accent-sage)", background: "#fff" }}>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCheck} style={{ color: "var(--accent-sage)" }} />
                    <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent-sage)" }}>{appliedCoupon.discountPercent}% Off</span>
                  </div>
                  <button onClick={removePromo} className="text-[10px] uppercase tracking-widest transition-colors hover:text-charcoal" style={{ color: "var(--muted)" }}>Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex flex-col gap-2">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                      className="input-dark rounded-none border-r-0"
                      style={{ fontSize: "0.8rem", padding: "0.6rem 1rem", borderRadius: "2rem 0 0 2rem" }}
                    />
                    <button
                      type="submit"
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-5 text-xs font-semibold uppercase tracking-widest transition-all"
                      style={{ background: "var(--charcoal)", color: "#fff", borderRadius: "0 2rem 2rem 0", opacity: promoLoading || !promoCode.trim() ? 0.5 : 1 }}
                    >
                      {promoLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {promoError && <p className="text-[10px] text-red-500 uppercase tracking-widest mt-1">{promoError}</p>}
                </form>
              )}
            </div>

            <div className="space-y-4 mb-6 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--charcoal-3)" }}>Subtotal</span>
                <span className={appliedCoupon ? "line-through" : ""} style={{ color: appliedCoupon ? "var(--muted)" : "var(--charcoal)", fontWeight: appliedCoupon ? "normal" : "500" }}>
                  ${total.toFixed(2)}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--accent-sage)" }}>Discount ({appliedCoupon.discountPercent}%)</span>
                  <span style={{ color: "var(--accent-sage)", fontWeight: "500" }}>−${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--charcoal-3)" }}>Shipping</span>
                <span style={{ color: "var(--charcoal)", fontWeight: "500" }}>Free</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="text-base font-semibold" style={{ color: "var(--charcoal)" }}>Total</span>
              <span className="text-2xl font-semibold" style={{ color: "var(--charcoal)", fontFamily: "'Playfair Display', serif" }}>${discountedTotal.toFixed(2)}</span>
            </div>

            <Link href={checkoutHref} className="btn-primary flex items-center justify-center gap-2">
              <Lock size={14} strokeWidth={2} />
              Checkout Securely
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {[
              { icon: Truck, text: "Free express shipping" },
              { icon: RotateCcw, text: "30-day hassle-free returns" }
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-3 text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  <Icon size={14} strokeWidth={1.5} />
                  {f.text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
