"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders, faXmark, faMagnifyingGlass, faChevronDown } from "@fortawesome/free-solid-svg-icons";

const CATEGORIES = ["All", "Electronics", "Clothing", "Home", "Books", "Sports", "Other"];
const SORT_OPTIONS = [
  { value: "newest",     label: "Newest Arrivals" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc",   label: "Name: A → Z" },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (searchInput) params.set("search", searchInput);
    setLoading(true);
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [category, searchInput]);

  const displayedProducts = useMemo(() => {
    let list = [...products];
    if (minPrice !== "") list = list.filter((p) => p.price >= Number(minPrice));
    if (maxPrice !== "") list = list.filter((p) => p.price <= Number(maxPrice));
    switch (sortBy) {
      case "price-asc":  list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "name-asc":   list.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return list;
  }, [products, sortBy, minPrice, maxPrice]);

  const hasFilters = category !== "All" || searchInput || minPrice || maxPrice || sortBy !== "newest";

  function clearAll() {
    setCategory("All");
    setSearchInput("");
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
  }

  return (
    <div className="fade-in-up">

      {/* ── Header ── */}
      <section className="mb-8 mt-4">
        <div className="flex flex-col items-center justify-center text-center py-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-rose)", letterSpacing: "0.2em" }}>
            The Full Collection
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>
            Shop
          </h1>
          <div className="w-12 h-[1px] mx-auto" style={{ background: "var(--border)" }} />
        </div>
      </section>

      {/* ── Category pills ── */}
      <section className="mb-10" id="products">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="flex-shrink-0 px-5 py-2 text-xs font-semibold uppercase tracking-widest transition-all"
              style={{
                borderRadius: "2rem",
                letterSpacing: "0.1em",
                background: category === cat ? "var(--charcoal)" : "#fff",
                color: category === cat ? "#fff" : "var(--charcoal-3)",
                border: `1px solid ${category === cat ? "var(--charcoal)" : "var(--border-strong)"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Toolbar: search + sort + filter ── */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted-2)", fontSize: "0.8rem" }}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-dark pl-10"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-dark"
            style={{ maxWidth: 220 }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all flex-shrink-0"
            style={{
              borderRadius: "2rem",
              border: "1px solid var(--border-strong)",
              background: filterOpen ? "var(--charcoal)" : "#fff",
              color: filterOpen ? "#fff" : "var(--charcoal)",
              letterSpacing: "0.1em",
            }}
          >
            <FontAwesomeIcon icon={faSliders} />
            Filter
          </button>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs px-4 py-2.5 transition-colors flex-shrink-0"
              style={{ color: "var(--muted)", borderRadius: "2rem", border: "1px solid var(--border)" }}
            >
              <FontAwesomeIcon icon={faXmark} />
              Clear
            </button>
          )}
        </div>

        {/* Price filter panel */}
        {filterOpen && (
          <div
            className="mt-4 p-5 fade-in-up"
            style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 0 }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--charcoal)", letterSpacing: "0.15em" }}
            >
              Price Range
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input-dark"
                style={{ maxWidth: 130 }}
                min="0"
              />
              <span style={{ color: "var(--muted-2)" }}>—</span>
              <input
                type="number"
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input-dark"
                style={{ maxWidth: 130 }}
                min="0"
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Results count ── */}
      {!loading && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)", letterSpacing: "0.12em" }}>
            {displayedProducts.length} {displayedProducts.length === 1 ? "Product" : "Products"}
            {category !== "All" && ` — ${category}`}
          </p>
          {hasFilters && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
              <span
                className="px-3 py-1"
                style={{ background: "var(--cream-3)", borderRadius: "2rem" }}
              >
                Filtered view
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Product grid ── */}
      {loading ? (
        <div>
          {/* Skeleton featured row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shimmer animate-pulse" style={{ aspectRatio: "4/5", background: "var(--cream-2)" }} />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="shimmer animate-pulse" style={{ aspectRatio: "4/5", background: "var(--cream-2)" }} />
            ))}
          </div>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div
          className="py-24 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--cream-2)" }}
        >
          <p
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}
          >
            No products found
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Try adjusting your filters or search term
          </p>
          <button
            onClick={clearAll}
            className="btn-primary"
            style={{ maxWidth: 200, margin: "0 auto" }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 mb-12">
          {displayedProducts.map((p, i) => (
            <div key={p._id} className="fade-in-up" style={{ animationDelay: `${(i % 8) * 0.05}s` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
