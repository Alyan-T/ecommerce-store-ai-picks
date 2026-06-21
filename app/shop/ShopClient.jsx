"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders, faXmark, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const CATEGORIES = ["All", "Electronics", "Clothing", "Home", "Books", "Sports", "Other"];
const SORT_OPTIONS = [
  { value: "newest",     label: "Newest Arrivals" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc",   label: "Name: A → Z" },
];

export default function ShopClient({ initialProducts, initialCategory = "All", initialSearch = "" }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState(initialCategory);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Infinite scroll pagination states
  const [hasMore, setHasMore] = useState(initialProducts.length >= 8);
  const observerRef = useRef(null);

  // Debounce search input changes to avoid spamming database
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch initial paginated batch when filters change
  const fetchFilteredProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("limit", "8");
      params.set("skip", "0");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      const freshProducts = data.products || [];
      
      setProducts(freshProducts);
      setHasMore(freshProducts.length >= 8);
    } catch (err) {
      console.error("Failed to fetch filtered products:", err);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, sortBy, minPrice, maxPrice]);

  // Trigger initial query reload on filter change (except on mount for initialProducts)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  // Load next batch of products for infinite scroll
  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("limit", "8");
      params.set("skip", String(products.length));

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      const nextBatch = data.products || [];

      if (nextBatch.length < 8) {
        setHasMore(false);
      }
      setProducts((prev) => [...prev, ...nextBatch]);
    } catch (err) {
      console.error("Failed to load more products:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [category, debouncedSearch, sortBy, minPrice, maxPrice, products.length, loadingMore, hasMore]);

  // Intersection Observer hook setup for scroll trigger
  const lastElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProducts();
        }
      }, { threshold: 0.8 });

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore, loadMoreProducts]
  );

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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
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
    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
    style={{ color: "var(--muted-2)", fontSize: "0.8rem" }}
  />

  <input
    type="text"
    placeholder="Search products..."
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
    className="input-dark search-input"
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
            {products.length} {products.length === 1 ? "Product" : "Products"}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shimmer animate-pulse" style={{ aspectRatio: "4/5", background: "var(--cream-2)" }} />
          ))}
        </div>
      ) : products.length === 0 ? (
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
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10 mb-12">
            {products.map((p, i) => (
              <div key={p._id} className="fade-in-up" style={{ animationDelay: `${(i % 8) * 0.05}s` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {/* Infinite Scroll Trigger Element */}
          {hasMore && (
            <div
              ref={lastElementRef}
              className="flex justify-center items-center py-10"
            >
              {loadingMore ? (
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-charcoal animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-charcoal animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-charcoal animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              ) : (
                <span className="text-xs uppercase tracking-widest text-[var(--muted)]" style={{ letterSpacing: "0.1em" }}>
                  Scroll to view more
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
