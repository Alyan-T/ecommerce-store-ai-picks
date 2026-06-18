"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBoxOpen, faCreditCard, faTruck, faCheck, faXmark, 
  faArrowLeft, faChevronDown, faRotateRight, faCircleCheck, faCircleXmark, faBoxArchive
} from "@fortawesome/free-solid-svg-icons";

const STEPS = [
  { key: "pending",   label: "Placed" },
  { key: "paid",      label: "Paid" },
  { key: "shipped",   label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "var(--charcoal)",     bg: "var(--cream-2)", icon: faBoxOpen },
  paid:      { label: "Paid",      color: "var(--charcoal)",         bg: "var(--cream-2)", icon: faCreditCard },
  shipped:   { label: "Shipped",   color: "var(--charcoal)",   bg: "var(--cream-2)", icon: faTruck },
  delivered: { label: "Delivered", color: "var(--accent-sage)", bg: "var(--cream-2)", icon: faCircleCheck },
  cancelled: { label: "Cancelled", color: "var(--accent-rose)",            bg: "var(--cream-2)", icon: faCircleXmark },
};

const STATUS_TABS = ["All", "Pending", "Paid", "Shipped", "Delivered", "Cancelled"];

function TrackingStepper({ status }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 p-4 mt-4" style={{ background: "var(--cream-2)", borderLeft: "3px solid var(--accent-rose)" }}>
        <FontAwesomeIcon icon={faXmark} style={{ color: "var(--accent-rose)" }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent-rose)" }}>This order was cancelled</span>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="mt-6 mb-4">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          const last = i === STEPS.length - 1;
          
          return (
            <div key={step.key} className={`flex items-center ${!last ? "flex-1" : ""}`}>
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all"
                  style={{ 
                    background: done ? "var(--charcoal)" : "var(--cream-2)", 
                    color: done ? "#fff" : "var(--muted)",
                    border: active ? "2px solid var(--charcoal)" : "none"
                  }}
                >
                  {done ? <FontAwesomeIcon icon={faCheck} /> : <span>{i + 1}</span>}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: done ? "var(--charcoal)" : "var(--muted)" }}>
                  {step.label}
                </span>
              </div>
              {!last && (
                <div 
                  className="flex-1 h-px mx-4 mb-5 transition-all" 
                  style={{ background: done ? "var(--charcoal)" : "var(--border)" }} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [reorderedId, setReorderedId] = useState(null);
  const [reorderToast, setReorderToast] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace("/login");
        else setUser(d.user);
      });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return orders;
    return orders.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
  }, [orders, statusFilter]);

  function handleReorder(order) {
    setReorderedId(order._id);
    order.items.forEach((item) => addItem({ _id: item.product, name: item.name, price: item.price, image: item.image }, item.quantity));
    setReorderToast(true);
    setTimeout(() => { setReorderToast(false); setReorderedId(null); }, 2500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm uppercase tracking-widest" style={{ color: "var(--muted)" }}>Loading Orders...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up max-w-4xl mx-auto">
      {/* Reorder toast */}
      {reorderToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 shadow-lg flex items-center gap-3 fade-in-up" style={{ background: "#fff", border: "1px solid var(--accent-sage)" }}>
          <FontAwesomeIcon icon={faCheck} style={{ color: "var(--accent-sage)" }} />
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--accent-sage)" }}>Items added to cart</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between mb-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>My Orders</h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>{orders.length} {orders.length === 1 ? "Order" : "Orders"}</p>
        </div>
        <Link href="/" className="text-xs uppercase tracking-widest transition-colors hover:text-charcoal" style={{ color: "var(--muted)", letterSpacing: "0.1em" }}>
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Continue Shopping
        </Link>
      </div>

      {/* Status filter tabs */}
      {orders.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4 mb-6 custom-scroll">
          {STATUS_TABS.map((tab) => {
            const count = tab === "All" ? orders.length : orders.filter((o) => o.status.toLowerCase() === tab.toLowerCase()).length;
            const active = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className="flex items-center gap-2 pb-2 text-xs uppercase tracking-widest font-semibold whitespace-nowrap transition-all"
                style={{ 
                  color: active ? "var(--charcoal)" : "var(--muted)",
                  borderBottom: `2px solid ${active ? "var(--charcoal)" : "transparent"}`
                }}
              >
                {tab}
                {count > 0 && <span className="text-[10px]" style={{ color: "var(--muted)" }}>({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 fade-in-up" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
          <FontAwesomeIcon icon={faBoxArchive} className="text-4xl mb-4" style={{ color: "var(--muted)" }} />
          <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>No orders yet</h3>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Start shopping to see your orders here.</p>
          <Link href="/" className="btn-primary" style={{ display: "inline-flex", width: "auto" }}>
            Browse Products
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12" style={{ border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No {statusFilter.toLowerCase()} orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isOpen = expanded === order._id;
            return (
              <div
                key={order._id}
                className="transition-all fade-in-up"
                style={{ border: "1px solid var(--border)", background: "#fff", animationDelay: `${i * 0.05}s` }}
              >
                {/* Order header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : order._id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-6 text-left gap-4"
                  style={{ background: isOpen ? "var(--cream-2)" : "#fff" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center text-xl" style={{ background: "var(--cream)", border: "1px solid var(--border)" }}>
                      <FontAwesomeIcon icon={cfg.icon} style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        {" • "}{order.items.length} {order.items.length === 1 ? "Item" : "Items"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 self-start sm:self-auto">
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1" style={{ border: `1px solid ${cfg.color}`, color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                    <span className="text-lg font-semibold" style={{ color: "var(--charcoal)" }}>${order.total.toFixed(2)}</span>
                    <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: "var(--muted)" }} />
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-6 pb-6 pt-4 space-y-8" style={{ borderTop: "1px solid var(--border)" }}>
                    {/* Tracking stepper */}
                    <TrackingStepper status={order.status} />

                    {/* Items */}
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--charcoal)" }}>Items</h4>
                      <div className="space-y-4">
                        {order.items.map((item, j) => (
                          <div key={j} className="flex items-center gap-4">
                            <div className="w-16 h-20 flex-shrink-0" style={{ background: "var(--cream-2)" }}>
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                              <p className="text-sm font-semibold truncate" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>{item.name}</p>
                              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping address */}
                    {order.shippingAddress?.address && (
                      <div className="p-4" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--charcoal)" }}>Shipping Address</p>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                          {order.shippingAddress.fullName}<br />
                          {order.shippingAddress.address}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
                          {order.shippingAddress.country}
                        </p>
                      </div>
                    )}

                    {/* Total + reorder */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 gap-4" style={{ borderTop: "1px solid var(--border)" }}>
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Total Paid</span>
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <span className="text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>${order.total.toFixed(2)}</span>
                        <button
                          onClick={() => handleReorder(order)}
                          disabled={reorderedId === order._id}
                          className="btn-primary"
                          style={{ padding: "0.5rem 1.5rem", fontSize: "0.75rem", width: "auto" }}
                        >
                          {reorderedId === order._id ? (
                            <><FontAwesomeIcon icon={faCheck} className="mr-2" /> Added</>
                          ) : (
                            <><FontAwesomeIcon icon={faRotateRight} className="mr-2" /> Reorder</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
