"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch only featured products for the home page
    fetch("/api/products?featured=true")
      .then((r) => r.json())
      .then((d) => setFeaturedProducts(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in-up">
      {/* ── Hero ── */}
      <section className="mb-16 mt-2">
        <div
          className="relative overflow-hidden rounded-none"
          style={{ background: "var(--cream-2)", minHeight: "450px" }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, var(--warm-tan), transparent 70%)" }}
          />
          <div
            className="absolute bottom-0 left-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, var(--accent-rose), transparent 70%)" }}
          />

          <div className="relative z-10 flex flex-col items-center justify-center px-6 sm:px-16 py-24 text-center max-w-3xl mx-auto h-full">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ color: "var(--accent-rose)", letterSpacing: "0.2em" }}
            >
              New Collection — 2026
            </p>
            <h1
              className="text-5xl sm:text-7xl font-bold leading-tight mb-8"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "var(--charcoal)",
              }}
            >
              Discover <br />
              <em style={{ fontStyle: "italic", color: "var(--accent-rose)" }}>Timeless</em> Elegance
            </h1>
            <p className="text-sm sm:text-base mb-10 max-w-lg leading-relaxed mx-auto" style={{ color: "var(--muted)" }}>
              Curated fashion and lifestyle essentials. Quality pieces crafted for the discerning modern individual.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-widest px-8 py-4 transition-all"
              style={{
                background: "var(--charcoal)",
                color: "#fff",
                letterSpacing: "0.12em",
                borderRadius: "2rem",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--charcoal-2)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--charcoal)"; e.currentTarget.style.transform = "none"; }}
            >
              Shop the Collection
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="mb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>
              Handpicked for you
            </p>
            <h2
              className="text-3xl sm:text-4xl font-semibold"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "var(--charcoal)",
              }}
            >
              Featured Arrivals
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest font-semibold pb-1 transition-colors hover:text-charcoal inline-flex items-center gap-2"
            style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
          >
            View All Products <span>→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shimmer animate-pulse" style={{ aspectRatio: "4/5", background: "var(--cream-2)" }} />
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="py-20 text-center" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-serif text-charcoal mb-2">Check back soon</p>
            <p className="text-sm text-muted mb-6">We are currently updating our featured collection.</p>
            <Link href="/shop" className="btn-primary py-2 px-6">Browse Shop</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-10">
            {featuredProducts.map((p, i) => (
              <div key={p._id} className="fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProductCard product={p} featured={true} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Editorial Banner ── */}
      <section className="mb-20">
        <div className="flex flex-col md:flex-row items-stretch" style={{ background: "var(--cream-3)", minHeight: "400px" }}>
          <div className="flex-1 p-10 md:p-16 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--accent-rose)", letterSpacing: "0.2em" }}>
              Our Philosophy
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>
              Elevating the everyday.
            </h2>
            <p className="text-sm leading-loose mb-8 max-w-md" style={{ color: "var(--charcoal-2)" }}>
              We believe that true luxury lies in simplicity and quality. Every item in our store is carefully selected to bring enduring style and functionality into your life.
            </p>
            <div>
              <Link href="/about" className="btn-primary py-3 px-8 text-xs inline-block">Read Our Story</Link>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] relative bg-gray-200">
            <img 
              src="/lifestyle.png" 
              alt="Lifestyle" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </div>
        </div>
      </section>
    </div>
  );
}
