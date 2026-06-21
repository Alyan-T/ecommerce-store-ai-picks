"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faBox, faUsers, faReceipt, faChartLine, faPenToSquare, faTrash, faExclamationTriangle, faSave, faTimes, faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";

const CATEGORIES = ["Electronics", "Clothing", "Home", "Books", "Sports", "Other"];
const EMPTY_FORM = { name: "", description: "", price: "", category: "Electronics", image: "", stock: "100" };

const ORDER_STATUS_COLORS = {
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  paid: "text-blue-600 bg-blue-50 border-blue-200",
  shipped: "text-purple-600 bg-purple-50 border-purple-200",
  delivered: "text-green-600 bg-green-50 border-green-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Products
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userDeleteConfirm, setUserDeleteConfirm] = useState(null);
  const [roleChanging, setRoleChanging] = useState(null);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Inventory
  const [editingStock, setEditingStock] = useState(null);
  const [stockInput, setStockInput] = useState("");
  const [stockSaving, setStockSaving] = useState(null);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Settings
  const [settings, setSettings] = useState({ aboutUsContent: "" });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== "admin") router.replace("/");
        else setUser(d.user);
      })
      .finally(() => setAuthLoading(false));
  }, [router]);

  const fetchProducts = useCallback(() => {
    setProdLoading(true);
    fetch("/api/products", { cache: "no-store" }).then((r) => r.json()).then((d) => setProducts(d.products || [])).finally(() => setProdLoading(false));
  }, []);

  const fetchUsers = useCallback(() => {
    setUsersLoading(true);
    fetch("/api/admin/users", { cache: "no-store" }).then((r) => r.json()).then((d) => setUsers(d.users || [])).finally(() => setUsersLoading(false));
  }, []);

  const fetchOrders = useCallback(() => {
    setOrdersLoading(true);
    fetch("/api/admin/orders", { cache: "no-store" }).then((r) => r.json()).then((d) => setOrders(d.orders || [])).finally(() => setOrdersLoading(false));
  }, []);

  const fetchAnalytics = useCallback(() => {
    setAnalyticsLoading(true);
    fetch("/api/admin/analytics", { cache: "no-store" }).then((r) => r.json()).then((d) => setAnalytics(d)).finally(() => setAnalyticsLoading(false));
  }, []);

  const fetchSettings = useCallback(() => {
    setSettingsLoading(true);
    fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).then((d) => setSettings(d)).finally(() => setSettingsLoading(false));
  }, []);

  useEffect(() => {
    if (user) { fetchProducts(); fetchUsers(); fetchOrders(); }
  }, [user, fetchProducts, fetchUsers, fetchOrders]);

  useEffect(() => {
    if (user && activeTab === "overview" && !analytics) fetchAnalytics();
    if (user && activeTab === "settings" && !settings.aboutUsContent) fetchSettings();
  }, [activeTab, user]);

  function openAddForm() { setEditingProduct(null); setForm(EMPTY_FORM); setFormError(""); setShowForm(true); }
  function openEditForm(p) {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description, price: String(p.price), category: p.category, image: p.image || "", stock: String(p.stock ?? 100) });
    setFormError(""); setShowForm(true);
  }
  
  async function handleFormSubmit(e) {
    e.preventDefault(); setFormLoading(true); setFormError("");
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Failed"); return; }
      setShowForm(false); fetchProducts();
    } catch { setFormError("Something went wrong."); }
    finally { setFormLoading(false); }
  }

  async function handleDeleteProduct(id) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete product");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleFeatured(p) {
    const newFeatured = !p.featured;
    setProducts((prev) => prev.map((item) => item._id === p._id ? { ...item, featured: newFeatured } : item));
    const res = await fetch(`/api/products/${p._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: newFeatured }),
    });
    if (!res.ok) {
      fetchProducts();
    }
  }

  async function handleDeleteUser(id) {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUserDeleteConfirm(null); fetchUsers();
  }

  async function handleRoleChange(userId, newRole) {
    setRoleChanging(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
      if (res.ok) fetchUsers();
    } finally { setRoleChanging(null); }
  }

  async function handleStatusChange(orderId, status) {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status }) });
      if (res.ok) fetchOrders();
    } finally { setUpdatingStatus(null); }
  }

  async function saveStock(productId) {
    setStockSaving(productId);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock: parseInt(stockInput) }) });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, stock: parseInt(stockInput) } : p));
        setEditingStock(null);
      }
    } finally { setStockSaving(null); }
  }

  async function handleSettingsSave(e) {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) alert("Settings saved!");
    } finally { setSettingsSaving(false); }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm uppercase tracking-widest" style={{ color: "var(--muted)" }}>Verifying Access...</p>
      </div>
    );
  }
  if (!user) return null;

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const lowStockProducts = products.filter((p) => (p.stock ?? 0) < 5);
  
  const tabs = [
    { id: "overview",   label: "Overview", icon: faChartLine },
    { id: "products",   label: "Products", icon: faBox },
    { id: "users",      label: "Users", icon: faUsers },
    { id: "orders",     label: "Orders", icon: faReceipt },
    { id: "settings",   label: "Settings", icon: faGear },
  ];

  return (
    <div className="fade-in-up max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center text-xl rounded-full" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
            <FontAwesomeIcon icon={faGear} style={{ color: "var(--charcoal)" }} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Admin Dashboard</h1>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>Platform Management</p>
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

      {/* ─── OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Products", value: products.length, icon: faBox },
              { label: "Total Users",    value: users.length,    icon: faUsers },
              { label: "Total Orders",   value: orders.length,   icon: faReceipt },
              { label: "Revenue",        value: `$${totalRevenue.toFixed(0)}`, icon: faChartLine },
            ].map((s) => (
              <div key={s.label} className="p-6 text-center border" style={{ background: "#fff", borderColor: "var(--border)" }}>
                <FontAwesomeIcon icon={s.icon} className="text-xl mb-3" style={{ color: "var(--muted)" }} />
                <div className="text-2xl font-semibold" style={{ color: "var(--charcoal)" }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {lowStockProducts.length > 0 && (
            <div className="border p-6 bg-red-50 border-red-200">
              <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faExclamationTriangle} /> Low Stock Alert</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockProducts.slice(0, 6).map((p) => (
                  <div key={p._id} className="flex items-center gap-3 bg-white border border-red-100 rounded px-4 py-3 shadow-sm">
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <FontAwesomeIcon icon={faBox} style={{ color: "var(--muted)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                      <p className="text-[10px] text-red-500 font-bold mt-1">Stock: {p.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PRODUCTS ─── */}
      {activeTab === "products" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: "var(--muted)" }}>{products.length} {products.length === 1 ? "product" : "products"}</p>
            <button onClick={openAddForm} className="btn-primary py-2 px-4 text-xs">Add Product</button>
          </div>
          {prodLoading ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading products...</p>
          ) : (
            <div className="overflow-x-auto border" style={{ borderColor: "var(--border)", background: "#fff" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-widest" style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--cream-2)" }}>
                    <th className="px-6 py-4 font-semibold text-center">Featured</th>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Stock</th>
                    <th className="px-6 py-4 font-semibold">Seller</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {products.map((p) => {
                    const stock = p.stock ?? 0;
                    const isEditing = editingStock === p._id;
                    return (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleFeatured(p)} className="p-1 transition-colors text-lg" style={{ color: p.featured ? "var(--warm-tan)" : "var(--muted-2)" }} title="Toggle Featured">
                            <FontAwesomeIcon icon={p.featured ? faStarSolid : faStarRegular} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center">
                              {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <FontAwesomeIcon icon={faBox} style={{ color: "var(--muted)" }} />}
                            </div>
                            <span className="font-semibold" style={{ color: "var(--charcoal)" }}>{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold">${Number(p.price).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input type="number" min="0" value={stockInput} onChange={(e) => setStockInput(e.target.value)} className="input-dark w-16 text-xs py-1" />
                              <button onClick={() => saveStock(p._id)} className="text-green-600"><FontAwesomeIcon icon={faSave} /></button>
                              <button onClick={() => setEditingStock(null)} className="text-gray-400"><FontAwesomeIcon icon={faTimes} /></button>
                            </div>
                          ) : (
                            <button onClick={() => { setEditingStock(p._id); setStockInput(String(stock)); }} className="flex items-center gap-2 hover:text-charcoal transition-colors group">
                              <span className={`font-bold ${stock === 0 ? "text-red-500" : stock < 5 ? "text-red-500" : stock <= 20 ? "text-amber-500" : "text-green-600"}`}>{stock}</span>
                              <FontAwesomeIcon icon={faPenToSquare} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--muted)" }} />
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs" style={{ color: "var(--muted)" }}>{p.sellerName || "HyperStore"}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEditForm(p)} className="text-gray-400 hover:text-charcoal p-2"><FontAwesomeIcon icon={faPenToSquare} /></button>
                          <button onClick={() => setDeleteConfirm(p._id)} className="text-gray-400 hover:text-red-500 p-2"><FontAwesomeIcon icon={faTrash} /></button>
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

      {/* ─── USERS ─── */}
      {activeTab === "users" && (
        <div>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>{users.length} registered users</p>
          <div className="overflow-x-auto border" style={{ borderColor: "var(--border)", background: "#fff" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-widest" style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--cream-2)" }}>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold" style={{ color: "var(--charcoal)" }}>{u.name}</td>
                    <td className="px-6 py-4" style={{ color: "var(--muted)" }}>{u.email}</td>
                    <td className="px-6 py-4">
                      {u.role === "admin" ? (
                        <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-gray-100 border font-semibold">Admin</span>
                      ) : (
                        <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)} disabled={roleChanging === u._id} className="text-[10px] uppercase tracking-widest px-2 py-1 bg-gray-100 border font-semibold outline-none cursor-pointer">
                          <option value="customer">Customer</option>
                          <option value="seller">Seller</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== "admin" && (
                        <button onClick={() => handleDeleteUser(u._id)} className="text-gray-400 hover:text-red-500 p-2"><FontAwesomeIcon icon={faTrash} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ORDERS ─── */}
      {activeTab === "orders" && (
        <div>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>{orders.length} total orders</p>
          <div className="space-y-4">
            {orders.map((order) => {
              const isOpen = expandedOrder === order._id;
              const statusColor = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending;
              return (
                <div key={order._id} className="border transition-all" style={{ borderColor: "var(--border)", background: "#fff" }}>
                  <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedOrder(isOpen ? null : order._id)}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{order.user?.name || "Unknown"} · {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <select
                        value={order.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingStatus === order._id}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer outline-none ${statusColor}`}
                      >
                        {["pending","paid","shipped","delivered","cancelled"].map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <span className="font-bold" style={{ color: "var(--charcoal)" }}>${order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── SETTINGS ─── */}
      {activeTab === "settings" && (
        <div className="border p-8" style={{ background: "#fff", borderColor: "var(--border)" }}>
          <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Store Settings</h2>
          {settingsLoading ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Loading settings...</p>
          ) : (
            <form onSubmit={handleSettingsSave} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--charcoal)" }}>About Us Content (Markdown Supported)</label>
                <textarea
                  className="input-dark w-full resize-y font-mono text-sm leading-relaxed p-4"
                  rows={15}
                  value={settings.aboutUsContent || ""}
                  onChange={(e) => setSettings({ ...settings, aboutUsContent: e.target.value })}
                  placeholder="Write your about us text here..."
                  required
                />
              </div>
              <button type="submit" disabled={settingsSaving} className="btn-primary py-3 px-8 text-xs">
                {settingsSaving ? "Saving..." : "Save Settings"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ─── MODALS ─── */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center p-4 pt-20">
          <div className="w-full max-w-lg p-8 mb-8" style={{ background: "#fff", border: "1px solid var(--border)" }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>{editingProduct ? "Edit Product" : "Add Product"}</h2>
            {formError && <div className="text-red-500 text-xs mb-4 p-3 bg-red-50 border border-red-200"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />{formError}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Name</label>
                <input className="input-dark w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)", color: "var(--charcoal)" }}>Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 py-3 text-xs">{formLoading ? "Saving..." : "Save Product"}</button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm p-8 text-center" style={{ background: "#fff", border: "1px solid var(--border)" }}>
            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Delete Product?</h3>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>This action cannot be undone. The product will be permanently removed from the store.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: "var(--border)", color: "var(--charcoal)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-3 text-xs uppercase tracking-widest font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
