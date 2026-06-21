"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCircleExclamation, faUser, faStore, faCheck } from "@fortawesome/free-solid-svg-icons";

const ROLES = [
  { id: "customer", label: "Customer", desc: "Discover & Shop", icon: faUser },
  { id: "seller", label: "Seller", desc: "List & Sell", icon: faStore },
];

function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setError(err);
    }
  }, [searchParams]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      if (data.user.role === "seller") window.location.href = "/seller";
      else window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <div className="w-full max-w-lg fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>Create Account</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Join the curated shopping experience</p>
        </div>

        <div className="p-8 sm:p-10" style={{ background: "#fff", border: "1px solid var(--border)" }}>
          {error && (
            <div className="flex items-center gap-3 text-xs mb-6 p-4" style={{ background: "var(--cream-2)", borderLeft: "3px solid var(--accent-rose)", color: "var(--charcoal)" }}>
              <FontAwesomeIcon icon={faCircleExclamation} style={{ color: "var(--accent-rose)" }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--charcoal)" }}>I want to be a...</label>
              <div className="grid grid-cols-2 gap-4">
                {ROLES.map((role) => {
                  const selected = form.role === role.id;
                  return (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => setForm({ ...form, role: role.id })}
                      className="relative flex flex-col items-center gap-2 p-4 transition-all"
                      style={{
                        border: `1px solid ${selected ? "var(--charcoal)" : "var(--border-strong)"}`,
                        background: selected ? "var(--cream-2)" : "#fff",
                      }}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 text-xs" style={{ color: "var(--charcoal)" }}>
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                      )}
                      <FontAwesomeIcon icon={role.icon} className="text-lg mb-1" style={{ color: selected ? "var(--charcoal)" : "var(--muted)" }} />
                      <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--charcoal)" }}>{role.label}</span>
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{role.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Full Name</label>
              <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} required className="input-dark w-full" />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Email Address</label>
              <input name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required className="input-dark w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Password</label>
                <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} className="input-dark w-full" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--charcoal)" }}>Confirm Password</label>
                <input name="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required className="input-dark w-full" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
              {loading ? "Creating..." : (
                <>Create Account <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1" style={{ height: "1px", background: "var(--border)" }} />
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>or</span>
            <div className="flex-1" style={{ height: "1px", background: "var(--border)" }} />
          </div>

          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full px-6 py-3 border font-semibold text-xs uppercase tracking-widest transition-all duration-200 shadow-sm hover:opacity-90 active:scale-95 mb-6"
            style={{ borderColor: "var(--border)", background: "#fff", color: "var(--charcoal)" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.227C18.214 1.155 15.46 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-2.005H12.24z"
              />
            </svg>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Continue with Google</span>
          </a>

          <p className="text-center text-xs mt-8" style={{ color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold transition-colors" style={{ color: "var(--charcoal)", borderBottom: "1px solid var(--charcoal)" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="shimmer h-8 w-8 rounded-full animate-spin border-2 border-charcoal"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
