"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faHeart, faCheck } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

export default function ProductCard({ product, featured = false }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleAdd(e) {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  async function handleWishlist(e) {
    e.preventDefault();
    setWishlistLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.added);
      } else if (res.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setWishlistLoading(false);
    }
  }

  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container — portrait 4:5 ratio like fashion sites */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/5", background: "var(--cream-2)" }}>
        <Link href={`/product/${product._id}`} className="block w-full h-full">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700"
              style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: "var(--muted-2)" }}>
              <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: "2rem" }} />
              <span className="text-xs" style={{ color: "var(--muted-2)" }}>No image</span>
            </div>
          )}
        </Link>

        {/* Featured ribbon */}
        {featured && (
          <div
            className="absolute top-3 left-0 text-white text-[10px] font-semibold px-3 py-1 tracking-widest uppercase"
            style={{ background: "var(--accent-rose)", letterSpacing: "0.1em" }}
          >
            Featured
          </div>
        )}

        {/* Out-of-stock overlay */}
        {product.stock === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(250,248,245,0.7)" }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest px-4 py-1.5"
              style={{ color: "var(--muted)", border: "1px solid var(--border-strong)", background: "#fff", letterSpacing: "0.15em" }}
            >
              Sold Out
            </span>
          </div>
        )}

        {/* Low stock badge */}
        {product.stock > 0 && product.stock <= 10 && (
          <div className="absolute top-3 right-3">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider"
              style={{ background: "#fff", color: "var(--accent-rose)", border: "1px solid var(--accent-rose)", letterSpacing: "0.1em" }}
            >
              Only {product.stock} left
            </span>
          </div>
        )}

        {/* Wishlist + Quick-add — revealed on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 flex transition-all duration-300"
          style={{
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            opacity: hovered ? 1 : 0,
          }}
        >
          {/* Add to cart — large bar */}
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-widest transition-colors"
            style={{
              background: added ? "var(--accent-sage)" : "var(--charcoal)",
              color: "#fff",
              letterSpacing: "0.1em",
              cursor: product.stock === 0 ? "not-allowed" : "pointer",
              opacity: product.stock === 0 ? 0.5 : 1,
            }}
          >
            <FontAwesomeIcon icon={added ? faCheck : faCartShopping} style={{ fontSize: "0.75rem" }} />
            {added ? "Added!" : "Add to Cart"}
          </button>

          {/* Wishlist icon */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className="flex items-center justify-center px-4 transition-colors"
            style={{
              background: wishlisted ? "var(--accent-rose)" : "#fff",
              color: wishlisted ? "#fff" : "var(--charcoal)",
              borderLeft: "1px solid var(--border)",
            }}
            title={wishlisted ? "Remove from wishlist" : "Save"}
          >
            <FontAwesomeIcon
              icon={wishlisted ? faHeart : faHeartRegular}
              style={{ fontSize: "0.875rem" }}
            />
          </button>
        </div>
      </div>

      {/* Card info */}
      <div className="pt-3 pb-1">
        {/* Category */}
        <p
          className="text-[10px] uppercase tracking-widest mb-1"
          style={{ color: "var(--muted)", letterSpacing: "0.15em" }}
        >
          {product.category}
        </p>

        {/* Name */}
        <Link
          href={`/product/${product._id}`}
          className="block text-sm font-medium leading-snug mb-2 transition-colors"
          style={{ color: "var(--charcoal)", fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {product.name}
        </Link>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span
            className="text-base font-semibold"
            style={{ color: "var(--charcoal)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            ${product.price.toFixed(2)}
          </span>

          {/* Mobile wishlist fallback */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            className="md:hidden p-1 transition-colors"
            style={{ color: wishlisted ? "var(--accent-rose)" : "var(--muted-2)" }}
            title={wishlisted ? "Saved" : "Save"}
          >
            <FontAwesomeIcon icon={wishlisted ? faHeart : faHeartRegular} style={{ fontSize: "0.875rem" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
