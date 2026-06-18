"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faHeart, faCheck, faBoxOpen, faImage, faMinus, faPlus, faRotateLeft, faUser } from "@fortawesome/free-solid-svg-icons";
import { Truck, RotateCcw, Lock } from "lucide-react";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

function AiReviewsSummary({ productId, reviewCount }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (reviewCount < 3) return;
    setLoading(true);
    setError("");
    fetch(`/api/products/${productId}/reviews-summary`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSummary(d.summary);
        } else {
          setError(d.message || "Failed to load summary.");
        }
      })
      .catch(() => setError("Failed to fetch reviews summary."))
      .finally(() => setLoading(false));
  }, [productId, reviewCount]);

  if (reviewCount < 3) {
    return (
      <div className="p-6 mb-8 text-center border border-dashed" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          ✨ AI Feedback Summary requires at least 3 reviews to compile.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 mb-8 border animate-pulse" style={{ borderColor: "var(--border)", background: "var(--cream-2)" }}>
        <div className="h-4 bg-gray-200 w-1/4 mb-4" />
        <div className="h-3 bg-gray-200 w-full mb-2" />
        <div className="h-3 bg-gray-200 w-5/6" />
      </div>
    );
  }

  if (error) return null;
  if (!summary) return null;

  return (
    <div className="p-8 mb-8 border" style={{ borderColor: "var(--border)", background: "var(--cream-2)" }}>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded text-white bg-charcoal" style={{ background: "var(--charcoal)" }}>AI Summary</span>
        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--muted)" }}>✨ Customer Sentiment Analysis</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-6">
        {/* Pros */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "var(--accent-sage)" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--accent-sage)" }} />
            Key Pros
          </h4>
          <ul className="space-y-2 list-none p-0 m-0">
            {summary.pros?.map((pro, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--charcoal-3)" }}>
                <span>•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "var(--accent-rose)" }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--accent-rose)" }} />
            Key Cons
          </h4>
          <ul className="space-y-2 list-none p-0 m-0">
            {summary.cons?.map((con, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--charcoal-3)" }}>
                <span>•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Verdict */}
      <div className="pt-6 border-t" style={{ borderColor: "var(--border)" }}>
        <h4 className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>Overall Verdict</h4>
        <p className="text-sm italic font-serif leading-relaxed" style={{ color: "var(--charcoal)" }}>
          "{summary.verdict}"
        </p>
      </div>
    </div>
  );
}

function StarPicker({ value, onChange, size = "lg" }) {
  const [hovered, setHovered] = useState(0);
  const s = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <svg className={s} viewBox="0 0 24 24" fill={(hovered || value) >= n ? "var(--warm-brown)" : "none"} stroke="var(--warm-brown)" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }) {
  const s = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={s} viewBox="0 0 24 24"
          fill={rating >= n ? "var(--warm-brown)" : "none"}
          stroke="var(--warm-brown)" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { addItem } = useCart();

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data.product))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/reviews?productId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setAvgRating(d.avgRating || 0);
        setReviewCount(d.count || 0);
      })
      .finally(() => setReviewsLoading(false));
    fetch("/api/me").then((r) => r.json()).then((d) => setLoggedIn(!!d.user));
  }, [id]);

  useEffect(() => {
    if (!product?.category) return;
    fetch(`/api/products?category=${encodeURIComponent(product.category)}`)
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d.products || []).filter((p) => p._id !== id).slice(0, 4);
        setRelatedProducts(filtered);
      });
  }, [product, id]);

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  async function handleWishlist() {
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
        router.push("/login");
      }
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!newRating) { setReviewError("Please select a star rating."); return; }
    if (!newComment.trim()) { setReviewError("Please write a comment."); return; }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, rating: newRating, comment: newComment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit review.");
        return;
      }
      setReviews((prev) => [data.review, ...prev]);
      const newCount = reviewCount + 1;
      const newAvg = (avgRating * reviewCount + newRating) / newCount;
      setReviewCount(newCount);
      setAvgRating(Math.round(newAvg * 10) / 10);
      setNewRating(0);
      setNewComment("");
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-[4/5] bg-cream-2 shimmer" />
        <div className="space-y-6 py-6">
          <div className="h-4 bg-cream-3 w-1/4" />
          <div className="h-10 bg-cream-3 w-3/4" />
          <div className="h-8 bg-cream-3 w-1/3" />
          <div className="h-24 bg-cream-3" />
          <div className="h-12 bg-cream-3" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-4" style={{ color: "var(--muted)" }}>
          <FontAwesomeIcon icon={faBoxOpen} />
        </div>
        <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Product Not Found</h2>
        <button onClick={() => router.push("/")} className="text-xs uppercase tracking-widest mt-4" style={{ color: "var(--charcoal)", textDecoration: "underline" }}>
          Return to Shop
        </button>
      </div>
    );
  }

  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div className="fade-in-up">
      {/* ── Breadcrumbs ── */}
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest mb-8" style={{ color: "var(--muted)" }}>
        <Link href="/" className="hover:text-charcoal transition-colors">Shop</Link>
        <span>/</span>
        <Link href={`/?category=${product.category}`} className="hover:text-charcoal transition-colors">{product.category}</Link>
        <span>/</span>
        <span style={{ color: "var(--charcoal)" }} className="truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mb-20">
        {/* ── Image ── */}
        <div className="relative" style={{ aspectRatio: "4/5", background: "var(--cream-2)" }}>
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ color: "var(--muted-2)" }}>
              <FontAwesomeIcon icon={faImage} className="text-4xl" />
              <span className="text-sm font-medium">No image available</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span
              className="text-[10px] font-semibold px-3 py-1 uppercase tracking-widest"
              style={{
                background: "#fff",
                color: product.stock > 0 ? "var(--accent-sage)" : "var(--accent-rose)",
                border: `1px solid ${product.stock > 0 ? "var(--accent-sage)" : "var(--accent-rose)"}`,
              }}
            >
              {product.stock > 0 ? "In Stock" : "Sold Out"}
            </span>
            {isLowStock && (
              <span
                className="text-[10px] font-semibold px-3 py-1 uppercase tracking-widest animate-pulse"
                style={{ background: "#fff", color: "var(--warm-brown)", border: "1px solid var(--warm-brown)" }}
              >
                Only {product.stock} Left
              </span>
            )}
          </div>
        </div>

        {/* ── Details ── */}
        <div className="flex flex-col py-4">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--muted)", letterSpacing: "0.15em" }}>
            {product.category}
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}
          >
            {product.name}
          </h1>

          {/* Reviews Summary */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <StarDisplay rating={avgRating} size="sm" />
              <span className="text-xs font-semibold" style={{ color: "var(--charcoal)" }}>{avgRating}</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>({reviewCount} reviews)</span>
            </div>
          )}

          <p className="text-2xl font-semibold mb-6" style={{ color: "var(--charcoal)" }}>
            ${product.price.toFixed(2)}
          </p>

          <p className="text-sm leading-relaxed mb-8 max-w-lg" style={{ color: "var(--charcoal-3)" }}>
            {product.description}
          </p>

          <div className="divider mb-8" />

          {/* ── Add to Cart Area ── */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            {/* Quantity */}
            <div
              className="flex items-center justify-between w-full sm:w-32 px-4 py-3"
              style={{ border: "1px solid var(--border-strong)", background: "#fff" }}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ color: "var(--muted)" }}
                className="hover:text-charcoal transition-colors"
              >
                <FontAwesomeIcon icon={faMinus} className="text-xs" />
              </button>
              <span className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                style={{ color: "var(--muted)" }}
                className="hover:text-charcoal transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="flex-1 w-full py-3.5 text-xs font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              style={{
                background: added ? "var(--accent-sage)" : "var(--charcoal)",
                color: "#fff",
                letterSpacing: "0.1em",
                cursor: product.stock === 0 ? "not-allowed" : "pointer",
                opacity: product.stock === 0 ? 0.5 : 1,
              }}
            >
              <FontAwesomeIcon icon={added ? faCheck : faCartShopping} />
              {added ? "Added to Cart" : product.stock === 0 ? "Sold Out" : "Add to Cart"}
            </button>

            {/* Wishlist */}
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className="w-full sm:w-auto px-5 py-3.5 flex items-center justify-center transition-colors"
              style={{
                border: "1px solid var(--border-strong)",
                background: wishlisted ? "var(--accent-rose)" : "#fff",
                color: wishlisted ? "#fff" : "var(--charcoal)",
              }}
            >
              <FontAwesomeIcon icon={wishlisted ? faHeart : faHeartRegular} />
            </button>
          </div>

          {/* ── Trust strip ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Truck, label: "Free Delivery" },
              { icon: RotateCcw, label: "30-Day Returns" },
              { icon: Lock, label: "Secure Payment" },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.label} className="flex items-center gap-3 p-3" style={{ background: "var(--cream-2)" }}>
                  <Icon size={16} strokeWidth={1.5} style={{ color: "var(--charcoal)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--charcoal)" }}>
                    {feat.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-3xl font-semibold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}
            >
              Related Pieces
            </h2>
            <div style={{ height: 1, flex: 1, background: "var(--border)", marginLeft: "2rem" }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-10">
            {relatedProducts.map((p) => (
              <div key={p._id} className="group">
                <Link href={`/product/${p._id}`} className="block relative mb-3 overflow-hidden" style={{ aspectRatio: "4/5", background: "var(--cream-2)" }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FontAwesomeIcon icon={faBoxOpen} style={{ color: "var(--muted-2)", fontSize: "2rem" }} /></div>
                  )}
                </Link>
                <Link href={`/product/${p._id}`} className="block text-sm font-medium mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--charcoal)" }}>
                  {p.name}
                </Link>
                <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>${p.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reviews Section ── */}
      <div className="mb-10 pt-10" style={{ borderTop: "1px solid var(--border)" }}>
        <h2
          className="text-3xl font-semibold mb-8 text-center"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)" }}
        >
          Customer Reviews
        </h2>

        <AiReviewsSummary productId={id} reviewCount={reviews.length} />

        <div className="grid lg:grid-cols-3 gap-12 mt-8">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {reviewsLoading ? (
              <div className="shimmer h-24 bg-cream-2" />
            ) : reviews.length === 0 ? (
              <div className="text-center py-10" style={{ background: "var(--cream-2)" }}>
                <p className="text-sm" style={{ color: "var(--muted)" }}>No reviews yet. Be the first to share your thoughts.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "var(--warm-brown)" }}
                    >
                      {review.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--charcoal)" }}>
                        {review.user?.name || "Anonymous"}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <StarDisplay rating={review.rating} />
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--charcoal-3)" }}>
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Review Form */}
          <div>
            <div className="p-6 sm:p-8" style={{ background: "var(--cream-2)" }}>
              <h3 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "var(--charcoal)" }}>
                Write a Review
              </h3>
              {!loggedIn ? (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faUser} className="text-2xl mb-3" style={{ color: "var(--muted)" }} />
                  <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Sign in to leave a review</p>
                  <Link href="/login" className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.7rem" }}>
                    Sign In
                  </Link>
                </div>
              ) : reviewSuccess ? (
                <div className="text-center py-4">
                  <div className="mb-3"><FontAwesomeIcon icon={faCheck} className="text-2xl" style={{ color: "var(--accent-sage)" }} /></div>
                  <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>Thank you!</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Your feedback has been submitted.</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                      Rating
                    </label>
                    <StarPicker value={newRating} onChange={setNewRating} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
                      Review
                    </label>
                    <textarea
                      className="input-dark resize-none w-full"
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience..."
                      maxLength={1000}
                    />
                  </div>
                  {reviewError && (
                    <p className="text-xs text-red-500">{reviewError}</p>
                  )}
                  <button type="submit" disabled={reviewSubmitting} className="btn-primary w-full">
                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
