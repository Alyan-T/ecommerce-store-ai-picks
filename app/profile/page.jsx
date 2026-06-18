"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPenToSquare, faLock, faCheck, faCircleExclamation, faBoxOpen, faWallet } from "@fortawesome/free-solid-svg-icons";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: "", email: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [pwMessage, setPwMessage] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.replace("/login");
        } else {
          setUser(d.user);
          setForm({ name: d.user.name, email: d.user.email });
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }, [user]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully" });
        setUser(data.user);
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPwSaving(true);
    setPwMessage(null);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMessage({ type: "error", text: data.error || "Failed to change password" });
      } else {
        setPwMessage({ type: "success", text: "Password changed successfully" });
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      setPwMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm uppercase tracking-widest" style={{ color: "var(--muted)" }}>Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-12 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>My Account</h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>Manage Profile & Settings</p>
        </div>
        <Link href="/orders" className="text-xs uppercase tracking-widest transition-colors hover:text-charcoal" style={{ color: "var(--muted)", letterSpacing: "0.1em" }}>
          Order History →
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          {/* Avatar & summary */}
          <div className="p-8 text-center" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-semibold mb-4" style={{ background: "var(--charcoal)", color: "#fff", fontFamily: "'Playfair Display', serif" }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>{user?.name}</h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{user?.email}</p>
            <div className="mt-4 pt-4 flex flex-col items-center gap-2" style={{ borderTop: "1px solid var(--border-strong)" }}>
              <span className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1" style={{ border: "1px solid var(--border-strong)", color: "var(--charcoal)", background: "#fff" }}>
                {user?.role}
              </span>
              <span className="text-xs mt-2" style={{ color: "var(--muted)" }}>{orders.length} {orders.length === 1 ? "Order" : "Orders"}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/orders" className="p-6 text-center transition-all hover:-translate-y-1" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <FontAwesomeIcon icon={faBoxOpen} className="text-xl mb-3" style={{ color: "var(--muted)" }} />
              <div className="text-xl font-semibold" style={{ color: "var(--charcoal)" }}>{orders.length}</div>
              <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>Total Orders</div>
            </Link>
            <div className="p-6 text-center" style={{ background: "#fff", border: "1px solid var(--border)" }}>
              <FontAwesomeIcon icon={faWallet} className="text-xl mb-3" style={{ color: "var(--muted)" }} />
              <div className="text-xl font-semibold" style={{ color: "var(--charcoal)" }}>
                ${orders.reduce((s, o) => s + o.total, 0).toFixed(2)}
              </div>
              <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>Total Spent</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-12">
          {/* Edit Profile */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-3 pb-2" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)", borderBottom: "1px solid var(--border)" }}>
              <FontAwesomeIcon icon={faPenToSquare} className="text-sm" style={{ color: "var(--muted)" }} />
              Edit Profile
            </h3>

            {message && (
              <div className="flex items-center gap-3 text-xs mb-6 p-4" style={{ background: "var(--cream-2)", borderLeft: `3px solid ${message.type === "success" ? "var(--accent-sage)" : "var(--accent-rose)"}`, color: "var(--charcoal)" }}>
                <FontAwesomeIcon icon={message.type === "success" ? faCheck : faCircleExclamation} style={{ color: message.type === "success" ? "var(--accent-sage)" : "var(--accent-rose)" }} />
                {message.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--charcoal)" }}>Full Name</label>
                <input
                  className="input-dark w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--charcoal)" }}>Email Address</label>
                <input
                  className="input-dark w-full"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button type="submit" disabled={saving} className="btn-primary mt-2">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div>
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-3 pb-2" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)", borderBottom: "1px solid var(--border)" }}>
              <FontAwesomeIcon icon={faLock} className="text-sm" style={{ color: "var(--muted)" }} />
              Change Password
            </h3>

            {pwMessage && (
              <div className="flex items-center gap-3 text-xs mb-6 p-4" style={{ background: "var(--cream-2)", borderLeft: `3px solid ${pwMessage.type === "success" ? "var(--accent-sage)" : "var(--accent-rose)"}`, color: "var(--charcoal)" }}>
                <FontAwesomeIcon icon={pwMessage.type === "success" ? faCheck : faCircleExclamation} style={{ color: pwMessage.type === "success" ? "var(--accent-sage)" : "var(--accent-rose)" }} />
                {pwMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--charcoal)" }}>Current Password</label>
                <input
                  className="input-dark w-full"
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--charcoal)" }}>New Password</label>
                  <input
                    className="input-dark w-full"
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--charcoal)" }}>Confirm Password</label>
                  <input
                    className="input-dark w-full"
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={pwSaving} className="btn-primary mt-2">
                {pwSaving ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
