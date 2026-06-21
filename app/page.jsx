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
      <section className="relative min-h-[75vh] flex flex-col justify-center items-center text-center px-container-padding-mobile overflow-hidden bg-[var(--cream-2)] mb-16 mt-2 rounded-none">
        <div className="absolute inset-0 z-0 opacity-40">
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLtANPId4AC-A8ron3Bqf1bsQWbhNPURcEYhwkBZWAeBKVAHDmfeiYm9ECUio-2gg8kMidz47f8_JpVHn6YWfBi-5lpGsWiyxRgdwiP3-oaG_U3t01kZWF4bcPj6Zz2CtOEFmVjcLseChpWD6JTUQIgAQpdlS2HsjipdZzWbT-pdBPmVF_xn5wtPlAmkKzyuwMurLUttXCCkFouUynKWSk4jSKE2G70t_VLv0Knh_W4q97ofHrFZsRqF56o')" }}
          ></div>
          <div className="absolute inset-0 hero-gradient"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--warm-brown)]" style={{ letterSpacing: "0.2em" }}>
            New Collection — 2026
          </p>
          <h1 
            className="text-5xl sm:text-7xl font-bold leading-tight text-[var(--charcoal-3)]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Discover <br /> <span className="italic font-normal text-[var(--accent-rose)]">Timeless</span> Elegance
          </h1>
          <p className="text-sm sm:text-base text-[var(--charcoal-2)] max-w-md mx-auto leading-relaxed">
            Curated fashion and lifestyle essentials. Quality pieces crafted for the discerning modern individual.
          </p>
          <div className="pt-6">
            <Link 
              href="/shop" 
              className="inline-flex items-center gap-2 bg-[var(--charcoal-3)] text-[var(--cream-2)] px-8 py-4 text-xs font-semibold tracking-widest hover:opacity-90 active:scale-95 transition-all"
              style={{ letterSpacing: "0.12em" }}
            >
              SHOP THE COLLECTION <span className="text-xs">→</span>
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--warm-brown)", letterSpacing: "0.2em" }}>
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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnZBFFLtiM6_1iF7c_guELFVB-Gv2ogmO7s5E-G4vLX0cyclXvNVz3WTq94UA2tkISNs3hRgiPRdF5tfDCkWhWvQUn-ZcxYEhDfImyU2EMBg_L0takLNt2crJeTq7KeKqE3RGcGYNFzJ8kInTUozbUKUEVrC1XpEvTTrEsWjMFAdsEE56reI9iQMZz52O54g5zk8Fxt6ZydlI5IahHRKhvbvET_gBgq9C2wAV8n956pPbKtRyyLig14QzNncQXCaOIrIr8LQh9fLc" 
              alt="Lifestyle" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </div>
        </div>
      </section>
    </div>
  );
}
