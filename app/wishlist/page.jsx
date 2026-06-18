"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faArrowLeft, faTrashCan, faCheck } from "@fortawesome/free-solid-svg-icons";

export default function WishlistPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace("/login");
        else loadWishlist();
      });
  }, [router]);

  async function loadWishlist() {
    setLoading(true);
    const res = await fetch("/api/wishlist");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  async function handleRemove(productId) {
    setRemoving(productId);
    await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setProducts((prev) => prev.filter((p) => p._id !== productId));
    setRemoving(null);
  }

  function handleAddToCart(product) {
    addItem(product);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm uppercase tracking-widest" style={{ color: "var(--muted)" }}>Loading Wishlist...</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-12 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 className="text-4xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}>Wishlist</h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>{products.length} {products.length === 1 ? "Item" : "Items"}</p>
        </div>
        <Link href="/" className="text-xs uppercase tracking-widest transition-colors hover:text-charcoal" style={{ color: "var(--muted)", letterSpacing: "0.1em" }}>
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Continue Shopping
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 fade-in-up" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
          <FontAwesomeIcon icon={faHeart} className="text-4xl mb-6" style={{ color: "var(--muted)" }} />
          <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>Your wishlist is empty</h3>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Save products you love by tapping the heart icon.</p>
          <Link href="/" className="btn-primary" style={{ display: "inline-flex", width: "auto" }}>
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, i) => (
            <div
              key={product._id}
              className="flex flex-col group fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <Link href={`/product/${product._id}`} className="block relative aspect-[4/5] overflow-hidden mb-4" style={{ background: "var(--cream-2)" }}>
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--muted)" }}>No Image</div>
                )}
                
                {/* Overlay actions */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); handleRemove(product._id); }}
                    disabled={removing === product._id}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ background: "#fff", color: "var(--charcoal)" }}
                    title="Remove from wishlist"
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                  </button>
                </div>
              </Link>

              <div className="flex flex-col flex-1">
                <Link href={`/product/${product._id}`} className="font-semibold text-sm mb-1 truncate transition-colors hover:text-charcoal" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>
                  {product.name}
                </Link>
                
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-xs uppercase tracking-widest" style={{ color: "var(--muted)" }}>${product.price.toFixed(2)}</span>
                  
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={(product.stock ?? 0) === 0}
                    className="text-[10px] font-semibold uppercase tracking-widest transition-colors hover:text-charcoal"
                    style={{ color: addedId === product._id ? "var(--accent-sage)" : "var(--charcoal)", borderBottom: `1px solid ${addedId === product._id ? "var(--accent-sage)" : "var(--charcoal)"}` }}
                  >
                    {addedId === product._id ? <><FontAwesomeIcon icon={faCheck} className="mr-1" /> Added</> : ((product.stock ?? 0) > 0 ? "Add to Cart" : "Sold Out")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
