"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faBox, faReceipt, faChartLine, faTicket, faPenToSquare, faTrash, faPlus, faExclamationTriangle, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";

const CATEGORIES = ["Electronics", "Clothing", "Home", "Books", "Sports", "Other"];
const EMPTY_FORM = { name: "", description: "", price: "", category: "Electronics", image: "", stock: "100" };

const ORDER_STATUS_COLORS = {
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  paid: "text-blue-600 bg-blue-50 border-blue-200",
  shipped: "text-purple-600 bg-purple-50 border-purple-200",
  delivered: "text-green-600 bg-green-50 border-green-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
};

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");

  // Products
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Inline stock edit
  const [editingStock, setEditingStock] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const [stockSaving, setStockSaving] = useState(null);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Coupons
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", discountPercent: "", maxUses: "", expiresAt: "" });
  const [couponFormLoading, setCouponFormLoading] = useState(false);
  const [couponFormError, setCouponFormError] = useState("");
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [togglingCoupon, setTogglingCoupon] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace("/login");
        else if (d.user.role === "admin") router.replace("/admin");
        else if (d.user.role !== "seller") router.replace("/");
        else setUser(d.user);
      })
      .finally(() => setAuthLoading(false));
  }, [router]);

  const fetchMyProducts = useCallback(() => {
    if (!user) return;
    setProdLoading(true);
    fetch(`/api/products?seller=${user.id}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setProdLoading(false));
  }, [user]);

  const fetchOrders = useCallback(() => {
    if (!user) return;
    setOrdersLoading(true);
    fetch("/api/seller/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const fetchAnalytics = useCallback(() => {
    if (!user) return;
    setAnalyticsLoading(true);
    fetch("/api/seller/analytics")
      .then((r) => r.json())
      .then((d) => setAnalytics(d))
      .finally(() => setAnalyticsLoading(false));
  }, [user]);

  const fetchCoupons = useCallback(() => {
    if (!user) return;
    setCouponsLoading(true);
    fetch("/api/seller/coupons")
      .then((r) => r.json())
      .then((d) => setCoupons(d.coupons || []))
      .finally(() => setCouponsLoading(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyProducts();
      fetchOrders();
    }
  }, [user, fetchMyProducts, fetchOrders]);

  useEffect(() => {
    if (user && activeTab === "analytics" && !analytics) fetchAnalytics();
    if (user && activeTab === "coupons" && coupons.length === 0) fetchCoupons();
  }, [activeTab, user]);

  function openAddForm() { setEditingProduct(null); setForm(EMPTY_FORM); setFormError(""); setShowForm(true); }
  function openEditForm(product) {
    setEditingProduct(product);
    setForm({ name: product.name, description: product.description, price: String(product.price), category: product.category, image: product.image || "", stock: String(product.stock ?? 100) });
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed to save product"); return; }
      setShowForm(false);
      fetchMyProducts();
    } catch { setFormError("Something went wrong."); }
    finally { setFormLoading(false); }
  }

  async function handleDeleteProduct(id) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchMyProducts();
  }

  async function generateAIDescription() {
    if (!form.name.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/seller/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, category: form.category }),
      });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, description: data.description }));
      } else {
        alert(data.error || "Failed to generate description");
      }
    } catch {
      alert("Failed to generate description.");
    } finally {
      setAiGenerating(false);
    }
  }

  async function saveStock(productId) {
    setStockSaving(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: parseInt(stockInput) }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, stock: parseInt(stockInput) } : p));
        setEditingStock(null);
      }
    } finally { setStockSaving(null); }
  }

  async function handleStatusUpdate(orderId, status) {
    setStatusUpdating(orderId);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) fetchOrders();
    } finally { setStatusUpdating(null); }
  }

  async function handleCreateCoupon(e) {
    e.preventDefault();
    setCouponFormLoading(true);
    setCouponFormError("");
    try {
      const res = await fetch("/api/seller/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponForm),
      });
      const data = await res.json();
      if (!res.ok) { setCouponFormError(data.error || "Failed"); return; }
      setCouponForm({ code: "", discountPercent: "", maxUses: "", expiresAt: "" });
      fetchCoupons();
    } finally { setCouponFormLoading(false); }
  }

  async function handleDeleteCoupon(id) {
    setDeletingCoupon(id);
    await fetch(`/api/seller/coupons?id=${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((c) => c._id !== id));
    setDeletingCoupon(null);
  }

  async function handleToggleCoupon(id, active) {
    setTogglingCoupon(id);
    const res = await fetch("/api/seller/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    if (res.ok) fetchCoupons();
    setTogglingCoupon(null);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm uppercase tracking-widest" style={{ color: "var(--muted)" }}>Verifying Access...</p>
      </div>
    );
  }
  if (!user) return null;

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStockProducts = products.filter((p) => (p.stock ?? 0) < 5);

  const tabs = [
    { id: "products",  label: "Products", icon: faBox },
    { id: "orders",    label: "Orders", icon: faReceipt },
    { id: "analytics", label: "Analytics", icon: faChartLine },
    { id: "coupons",   label: "Coupons", icon: faTicket },
  ];

  return (
    <div className="fade-in-up max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center text-xl rounded-full" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
            <FontAwesomeIcon icon={faStore} style={{ color: "var(--charcoal)" }} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Seller Dashboard</h1>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>Welcome back, {user.name}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="pb-3 text-xs uppercase tracking-widest transition-all font-semibold flex items-center gap-2"
            style={{ 
              color: activeTab === tab.id ? "var(--charcoal)" : "var(--muted)",
              borderBottom: activeTab === tab.id ? "2px solid var(--charcoal)" : "2px solid transparent"
            }}
          >
            <FontAwesomeIcon icon={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── PRODUCTS TAB ─── */}
      {activeTab === "products" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {products.length} {products.length === 1 ? "product" : "products"}
              {lowStockProducts.length > 0 && <span className="text-red-500 ml-2 font-semibold">· {lowStockProducts.length} low stock</span>}
            </p>
            <button onClick={openAddForm} className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} />
              Add Product
            </button>
          </div>

          {prodLoading ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading products...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-16" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
              <FontAwesomeIcon icon={faBox} className="text-3xl mb-4" style={{ color: "var(--muted)" }} />
              <h3 className="font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>No products yet</h3>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Start by adding your first product to your store.</p>
              <button onClick={openAddForm} className="btn-primary py-2 px-6">Add Product</button>
            </div>
          ) : (
            <div className="overflow-x-auto border" style={{ borderColor: "var(--border)", background: "#fff" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-widest" style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--cream-2)" }}>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Stock</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {products.map((p) => {
                    const stock = p.stock ?? 0;
                    const isEditing = editingStock === p._id;
                    return (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                              {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <FontAwesomeIcon icon={faBox} style={{ color: "var(--muted)" }} />}
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                              <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--muted)" }}>{p.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-gray-100 border rounded" style={{ borderColor: "var(--border)", color: "var(--charcoal)" }}>{p.category}</span></td>
                        <td className="px-6 py-4 font-semibold">${Number(p.price).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input type="number" min="0" value={stockInput} onChange={(e) => setStockInput(e.target.value)} className="input-dark w-16 text-xs py-1" />
                              <button onClick={() => saveStock(p._id)} className="text-green-600 hover:text-green-700"><FontAwesomeIcon icon={faSave} /></button>
                              <button onClick={() => setEditingStock(null)} className="text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faTimes} /></button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingStock(p._id); setStockInput(String(stock)); }} className="flex items-center gap-2 hover:text-charcoal transition-colors group">
                              <span className={`font-bold ${stock === 0 ? "text-red-500" : stock < 5 ? "text-red-500" : stock <= 20 ? "text-amber-500" : "text-green-600"}`}>{stock}</span>
                              <FontAwesomeIcon icon={faPenToSquare} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--muted)" }} />
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEditForm(p)} className="text-gray-400 hover:text-charcoal transition-colors p-2" title="Edit">
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                          <button onClick={() => setDeleteConfirm(p._id)} className="text-gray-400 hover:text-red-500 transition-colors p-2" title="Delete">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── ORDERS TAB ─── */}
      {activeTab === "orders" && (
        <div>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>{orders.length} orders containing your products</p>
          {ordersLoading ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-16" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
              <FontAwesomeIcon icon={faReceipt} className="text-3xl mb-4" style={{ color: "var(--muted)" }} />
              <p className="font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isOpen = expandedOrder === order._id;
                const statusColor = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending;
                return (
                  <div key={order._id} className="border transition-all" style={{ borderColor: "var(--border)", background: "#fff" }}>
                    <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedOrder(isOpen ? null : order._id)}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>Order #{order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <select
                          value={order.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          disabled={statusUpdating === order._id}
                          className={`text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer outline-none ${statusColor}`}
                        >
                          {["pending","paid","shipped","delivered","cancelled"].map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <span className="font-bold" style={{ color: "var(--charcoal)" }}>${order.total?.toFixed(2)}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="p-6 border-t bg-gray-50 space-y-4" style={{ borderColor: "var(--border)" }}>
                        {order.items?.map((item, j) => (
                          <div key={j} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <FontAwesomeIcon icon={faBox} style={{ color: "var(--muted)" }} />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>{item.name}</p>
                              <p className="text-xs" style={{ color: "var(--muted)" }}>Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-bold" style={{ color: "var(--charcoal)" }}>${(item.price * item.quantity)?.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── ANALYTICS TAB ─── */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {analyticsLoading ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading analytics...</p>
          ) : !analytics ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>No analytics data available.</p>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "My Revenue", value: `$${analytics.totalRevenue?.toFixed(2) || "0.00"}`, icon: faChartLine },
                  { label: "Average Order Value", value: `$${analytics.avgOrderValue?.toFixed(2) || "0.00"}`, icon: faStore },
                  { label: "Total Orders", value: (analytics.statusCounts?.pending || 0) + (analytics.statusCounts?.paid || 0) + (analytics.statusCounts?.shipped || 0) + (analytics.statusCounts?.delivered || 0) + (analytics.statusCounts?.cancelled || 0), icon: faReceipt },
                ].map((card) => (
                  <div key={card.label} className="p-6 text-center border" style={{ background: "#fff", borderColor: "var(--border)" }}>
                    <FontAwesomeIcon icon={card.icon} className="text-xl mb-3" style={{ color: "var(--muted)" }} />
                    <div className="text-2xl font-semibold" style={{ color: "var(--charcoal)" }}>{card.value}</div>
                    <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>{card.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Top Products */}
                <div className="border p-6" style={{ background: "#fff", borderColor: "var(--border)" }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Top Selling Products</h3>
                  {(!analytics.topProducts || analytics.topProducts.length === 0) ? (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>No product sales recorded yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topProducts.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                          <div className="w-10 h-10 bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <FontAwesomeIcon icon={faBox} style={{ color: "var(--muted)" }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>{p.qty} items sold</p>
                          </div>
                          <span className="font-semibold text-sm" style={{ color: "var(--charcoal)" }}>${p.revenue?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status counts */}
                <div className="border p-6" style={{ background: "#fff", borderColor: "var(--border)" }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Order Status Distribution</h3>
                  <div className="space-y-4">
                    {Object.entries(analytics.statusCounts || {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm py-1">
                        <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--charcoal)" }}>{status}</span>
                        <span className="font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full border" style={{ borderColor: "var(--border)", color: "var(--charcoal)", background: "var(--cream-2)" }}>
                          {count} {count === 1 ? "order" : "orders"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Revenue List */}
              <div className="border p-6 mt-8" style={{ background: "#fff", borderColor: "var(--border)" }}>
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Monthly Revenue</h3>
                {(!analytics.revenueByMonth || analytics.revenueByMonth.length === 0) ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>No monthly analytics data found.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                    {analytics.revenueByMonth.map((month, idx) => (
                      <div key={idx} className="p-4 text-center border" style={{ background: "var(--cream-2)", borderColor: "var(--border)" }}>
                        <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>{month.label}</div>
                        <div className="text-lg font-bold mt-2" style={{ color: "var(--charcoal)" }}>${month.revenue?.toFixed(0)}</div>
                        <div className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>{month.orderCount} orders</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── COUPONS TAB ─── */}
      {activeTab === "coupons" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Coupon Form */}
          <div className="border p-6 h-fit" style={{ background: "#fff", borderColor: "var(--border)" }}>
            <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Create Coupon</h3>
            {couponFormError && <div className="text-red-500 text-xs mb-4 p-3 bg-red-50 border border-red-200"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />{couponFormError}</div>}
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Coupon Code</label>
                <input 
                  className="input-dark w-full uppercase" 
                  placeholder="SUMMER10" 
                  value={couponForm.code} 
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Discount Percentage (%)</label>
                <input 
                  className="input-dark w-full" 
                  type="number" 
                  min="1" 
                  max="100" 
                  placeholder="10" 
                  value={couponForm.discountPercent} 
                  onChange={(e) => setCouponForm({ ...couponForm, discountPercent: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Max Uses (Optional)</label>
                <input 
                  className="input-dark w-full" 
                  type="number" 
                  min="1" 
                  placeholder="e.g. 50" 
                  value={couponForm.maxUses} 
                  onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Expiry Date (Optional)</label>
                <input 
                  className="input-dark w-full" 
                  type="date" 
                  value={couponForm.expiresAt} 
                  onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} 
                />
              </div>
              <button type="submit" disabled={couponFormLoading} className="btn-primary w-full py-3 text-xs mt-4">
                {couponFormLoading ? "Creating..." : "Create Coupon"}
              </button>
            </form>
          </div>

          {/* Coupon List */}
          <div className="lg:col-span-2 border p-6" style={{ background: "#fff", borderColor: "var(--border)" }}>
            <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>My Coupons</h3>
            {couponsLoading ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Loading coupons...</p>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
                <FontAwesomeIcon icon={faTicket} className="text-3xl mb-4" style={{ color: "var(--muted)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>No coupons created yet</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Use the form on the left to create discount codes for your customers.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-widest" style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--cream-2)" }}>
                      <th className="px-4 py-3 font-semibold">Code</th>
                      <th className="px-4 py-3 font-semibold">Discount</th>
                      <th className="px-4 py-3 font-semibold">Usage</th>
                      <th className="px-4 py-3 font-semibold">Expiry</th>
                      <th className="px-4 py-3 font-semibold text-center">Active</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {coupons.map((c) => (
                      <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold" style={{ color: "var(--charcoal)" }}>{c.code}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: "var(--accent-sage)" }}>{c.discountPercent}% OFF</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                          {c.usedCount || 0} / {c.maxUses || "∞"}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => handleToggleCoupon(c._id, !c.active)}
                            disabled={togglingCoupon === c._id}
                            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-widest border transition-colors ${c.active ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"}`}
                          >
                            {c.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteCoupon(c._id)}
                            disabled={deletingCoupon === c._id}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg p-8" style={{ background: "#fff", border: "1px solid var(--border)" }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>{editingProduct ? "Edit Product" : "Add Product"}</h2>
            {formError && <div className="text-red-500 text-xs mb-4 p-3 bg-red-50 border border-red-200"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />{formError}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Name</label>
                <input className="input-dark w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--charcoal)" }}>Description</label>
                  <button
                    type="button"
                    onClick={generateAIDescription}
                    disabled={aiGenerating || !form.name.trim()}
                    className="text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1 hover:text-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: "var(--muted)" }}
                  >
                    {aiGenerating ? "Generating..." : "✨ Auto-Write Description"}
                  </button>
                </div>
                <textarea className="input-dark w-full resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Price ($)</label>
                  <input className="input-dark w-full" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Stock</label>
                  <input className="input-dark w-full" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Category</label>
                <select 
                  className="input-dark w-full" 
                  value={form.category} 
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Image URL (Optional)</label>
                <input className="input-dark w-full" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/image.jpg" />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--charcoal)" }}>Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 py-3 text-xs">{formLoading ? "Saving..." : "Save Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
