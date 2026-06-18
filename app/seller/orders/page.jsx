"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  paid:      { label: "Paid",      color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  shipped:   { label: "Shipped",   color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  delivered: { label: "Delivered", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/10 border-red-500/30" },
};

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "seller") {
          router.replace("/");
        } else {
          setUser(d.user);
        }
      });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/seller/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, [user]);

  const totalRevenue = orders.reduce((sum, o) => {
    if (o.status === "cancelled") return sum;
    const myItems = o.items.filter((item) => item.sellerName === user?.name);
    return sum + myItems.reduce((s, i) => s + i.price * i.quantity, 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/30">
            📋
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Sales Orders</h1>
            <p className="text-slate-400 text-sm">Orders containing your products</p>
          </div>
        </div>
        <a href="/seller" className="text-slate-400 hover:text-amber-400 text-sm transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          My Store
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Orders", value: orders.length, icon: "📦", color: "from-amber-500 to-orange-600" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: "💰", color: "from-emerald-500 to-green-600" },
          { label: "This Month", value: orders.filter((o) => new Date(o.createdAt).getMonth() === new Date().getMonth()).length, icon: "📅", color: "from-blue-500 to-indigo-600" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-slate-700/50 p-4">
            <div className={`text-xl w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow-lg`}>
              {s.icon}
            </div>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="glass rounded-2xl border border-slate-700/50 text-center py-20">
          <div className="text-6xl mb-4 float">📋</div>
          <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
          <p className="text-slate-400 text-sm">Orders for your products will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isOpen = expanded === order._id;
            const myItems = order.items.filter((item) => item.sellerName === user?.name);
            const myRevenue = myItems.reduce((s, item) => s + item.price * item.quantity, 0);

            return (
              <div
                key={order._id}
                className="glass rounded-2xl border border-slate-700/50 overflow-hidden hover:border-amber-500/30 transition-all fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : order._id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {order._id.slice(-2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        {" · "}{myItems.length} of your product{myItems.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-lg font-black text-amber-400">${myRevenue.toFixed(2)}</span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-700/50 px-5 pb-5 pt-4 space-y-4">
                    {/* My items in this order */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Your Products in This Order</p>
                      <div className="space-y-3">
                        {myItems.map((item, j) => (
                          <div key={j} className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700/50">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
                              <p className="text-xs text-slate-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-bold text-amber-400">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping info */}
                    {order.shippingAddress?.address && (
                      <div className="glass-light rounded-xl p-3 border border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 mb-1">Ship To</p>
                        <p className="text-sm text-slate-300">
                          {order.shippingAddress.fullName} · {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/30">
                      <span className="text-sm text-slate-400">Your Revenue</span>
                      <span className="text-xl font-black text-amber-400">${myRevenue.toFixed(2)}</span>
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
