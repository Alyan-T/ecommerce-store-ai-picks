"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faArrowLeft, faCheck, faCreditCard, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { Lock } from "lucide-react";

const FIELDS = [
  { name: "fullName",   label: "Full Name",      placeholder: "John Doe",        type: "text", col: "full" },
  { name: "address",    label: "Street Address", placeholder: "123 Main St",     type: "text", col: "full" },
  { name: "city",       label: "City",           placeholder: "New York",        type: "text", col: "half" },
  { name: "postalCode", label: "Postal Code",    placeholder: "10001",           type: "text", col: "half" },
  { name: "country",    label: "Country",        placeholder: "United States",   type: "text", col: "full" },
];

export default function CheckoutPage() {
  const { items, total, clearCart, appliedCoupon } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", address: "", city: "", postalCode: "", country: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [cardDetails, setCardDetails] = useState({ number: "4242 4242 4242 4242", expiry: "12/28", cvv: "123" });
  const [stripeEmail, setStripeEmail] = useState("");
  const [jazzcashMobile, setJazzcashMobile] = useState("");

  const discount = appliedCoupon ? (total * appliedCoupon.discountPercent) / 100 : 0;
  const finalTotal = total - discount;

  // Check auth and prefill address
  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (!d.user) {
        router.replace("/login");
      } else if (d.user.address) {
        setForm({
          fullName: d.user.address.fullName || "",
          address: d.user.address.address || "",
          city: d.user.address.city || "",
          postalCode: d.user.address.postalCode || "",
          country: d.user.address.country || "",
        });
      }
    });
  }, [router]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let paymentDetails = {};
    if (paymentMethod === "Credit Card") {
      paymentDetails = cardDetails;
    } else if (paymentMethod === "Stripe") {
      paymentDetails = { email: stripeEmail };
    } else if (paymentMethod === "JazzCash") {
      paymentDetails = { mobile: jazzcashMobile };
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items, 
          shippingAddress: form,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          paymentMethod,
          paymentDetails
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setOrderId(data.order._id);
      setSuccess(true);
      clearCart();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center fade-in-up">
        <FontAwesomeIcon icon={faBoxOpen} className="text-4xl mb-4" style={{ color: "var(--muted)" }} />
        <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>Your cart is empty</h2>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Add items to your cart before checking out.</p>
        <Link href="/" className="btn-primary" style={{ display: "inline-flex", width: "auto" }}>
          Browse Products
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center fade-in-up">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: "var(--cream-2)", border: "1px solid var(--accent-sage)" }}>
          <FontAwesomeIcon icon={faCheck} className="text-3xl" style={{ color: "var(--accent-sage)" }} />
        </div>
        <h2 className="text-4xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>Order Confirmed</h2>
        <p className="text-sm mb-1" style={{ color: "var(--charcoal)" }}>Thank you for your purchase.</p>
        {orderId && <p className="text-xs mb-8" style={{ color: "var(--muted)" }}>Order #{orderId.slice(-8).toUpperCase()}</p>}
        <div className="flex gap-4">
          <Link href="/orders" className="btn-primary" style={{ display: "inline-flex", width: "auto" }}>
            View Orders
          </Link>
          <Link href="/" className="btn-ghost-sm" style={{ padding: "0.75rem 2rem" }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="transition-colors hover:text-charcoal" style={{ color: "var(--muted)" }}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>Checkout</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* Shipping form */}
        <div className="lg:col-span-3">
          <div className="p-8" style={{ background: "#fff", border: "1px solid var(--border)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--charcoal)" }}>
              Shipping Information
            </h2>

            {error && (
              <div className="text-xs text-red-500 mb-6 p-3" style={{ background: "var(--cream-2)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                {FIELDS.map((field) => (
                  <div key={field.name} className={field.col === "full" ? "col-span-2" : "col-span-1"}>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>{field.label}</label>
                    <input
                      name={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.name]}
                      onChange={handleChange}
                      required
                      className="input-dark w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Payment selector */}
              <div className="mt-8 p-6" style={{ background: "var(--cream-2)", border: "1px solid var(--border-strong)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "var(--charcoal)" }}>
                  <FontAwesomeIcon icon={faCreditCard} />
                  Select Payment Method
                </p>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  {["Credit Card", "Stripe", "JazzCash"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className="flex-1 py-2 text-[10px] uppercase tracking-widest font-semibold border transition-all text-center"
                      style={{
                        background: paymentMethod === method ? "var(--charcoal)" : "#fff",
                        color: paymentMethod === method ? "#fff" : "var(--charcoal)",
                        borderColor: paymentMethod === method ? "var(--charcoal)" : "var(--border)",
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Fields for Credit Card */}
                {paymentMethod === "Credit Card" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <input 
                        className="input-dark w-full" 
                        value={cardDetails.number} 
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })} 
                        placeholder="Card Number" 
                        required 
                      />
                    </div>
                    <input 
                      className="input-dark w-full" 
                      value={cardDetails.expiry} 
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })} 
                      placeholder="MM/YY" 
                      required 
                    />
                    <input 
                      className="input-dark w-full" 
                      value={cardDetails.cvv} 
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })} 
                      placeholder="CVV" 
                      required 
                    />
                    <p className="col-span-2 text-[10px]" style={{ color: "var(--muted)" }}>Demo Mode: Real cards are simulated safely.</p>
                  </div>
                )}

                {/* Fields for Stripe */}
                {paymentMethod === "Stripe" && (
                  <div className="space-y-4">
                    <input 
                      type="email" 
                      className="input-dark w-full" 
                      value={stripeEmail} 
                      onChange={(e) => setStripeEmail(e.target.value)} 
                      placeholder="Stripe Email Address" 
                      required 
                    />
                    <div className="p-3 bg-white border border-dashed rounded text-center text-xs animate-pulse" style={{ borderColor: "var(--border)" }}>
                      <span className="font-semibold text-emerald-600">Stripe Sandbox Active</span>
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>Stripe simulated sandbox mode.</p>
                  </div>
                )}

                {/* Fields for JazzCash */}
                {paymentMethod === "JazzCash" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <span className="px-3 py-2 bg-white border flex items-center justify-center text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--charcoal)" }}>PK (+92)</span>
                      <input 
                        type="tel" 
                        pattern="[0-9]{10}"
                        className="input-dark w-full" 
                        value={jazzcashMobile} 
                        onChange={(e) => setJazzcashMobile(e.target.value)} 
                        placeholder="3xxxxxxxxx" 
                        required 
                      />
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>Enter your 10-digit JazzCash mobile account number. You will receive an OTP trigger simulation on checkout.</p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                {loading ? "Processing..." : (
                  <>
                    <Lock size={12} strokeWidth={2} />
                    Place Order • ${finalTotal.toFixed(2)}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="p-8 sticky top-24" style={{ background: "var(--cream-2)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--charcoal)" }}>Order Summary</h2>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6 custom-scroll">
              {items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <div className="w-16 h-20 bg-white border border-border flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-sm font-semibold truncate" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>{item.name}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold mt-auto" style={{ color: "var(--charcoal)" }}>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between text-sm mb-3">
                <span style={{ color: "var(--muted)" }}>Subtotal</span>
                <span style={{ color: "var(--charcoal)" }}>${total.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm mb-3">
                  <span style={{ color: "var(--accent-rose)" }}>Discount ({appliedCoupon.code} - {appliedCoupon.discountPercent}%)</span>
                  <span style={{ color: "var(--accent-rose)", fontWeight: "500" }}>−${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-3">
                <span style={{ color: "var(--muted)" }}>Shipping</span>
                <span style={{ color: "var(--charcoal)" }}>Free</span>
              </div>
              <div className="flex justify-between text-sm mb-6">
                <span style={{ color: "var(--muted)" }}>Tax</span>
                <span style={{ color: "var(--muted)" }}>Included</span>
              </div>
              <div className="flex justify-between items-center pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--charcoal)" }}>Total</span>
                <span className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 justify-center text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              <FontAwesomeIcon icon={faShieldHalved} />
              Secure Encrypted Checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
