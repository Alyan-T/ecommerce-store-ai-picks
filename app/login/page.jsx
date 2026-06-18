"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCircleExclamation, faUser, faStore, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      const role = data.user?.role;
      if (role === "admin") router.push("/admin");
      else if (role === "seller") router.push("/seller");
      else router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>Sign In</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Welcome back to your account</p>
        </div>

        <div className="p-8 sm:p-10" style={{ background: "#fff", border: "1px solid var(--border)" }}>
          {error && (
            <div className="flex items-center gap-3 text-xs mb-6 p-4" style={{ background: "var(--cream-2)", borderLeft: "3px solid var(--accent-rose)", color: "var(--charcoal)" }}>
              <FontAwesomeIcon icon={faCircleExclamation} style={{ color: "var(--accent-rose)" }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Email Address</label>
              <input name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required className="input-dark w-full" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--charcoal)" }}>Password</label>
              </div>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required className="input-dark w-full" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              {loading ? "Signing in..." : (
                <>Sign In <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1" style={{ height: "1px", background: "var(--border)" }} />
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>Platform Roles</span>
            <div className="flex-1" style={{ height: "1px", background: "var(--border)" }} />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center mb-8">
            {[
              { icon: faUser, label: "Customer", desc: "Shop" },
              { icon: faStore, label: "Seller", desc: "Sell" },
              { icon: faShieldHalved, label: "Admin", desc: "Manage" },
            ].map((r) => (
              <div key={r.label} className="p-3" style={{ background: "var(--cream-2)", border: "1px solid transparent" }}>
                <FontAwesomeIcon icon={r.icon} className="mb-2 text-lg" style={{ color: "var(--muted)" }} />
                <div className="font-semibold text-[10px] uppercase tracking-widest" style={{ color: "var(--charcoal)" }}>{r.label}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold transition-colors" style={{ color: "var(--charcoal)", borderBottom: "1px solid var(--charcoal)" }}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
