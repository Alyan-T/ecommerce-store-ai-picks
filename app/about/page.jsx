"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore } from "@fortawesome/free-solid-svg-icons";

export default function AboutPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setContent(d.aboutUsContent || ""))
      .catch(() => setContent("Welcome to HyperStore, your curated fashion and lifestyle destination.\n\nWe believe in timeless elegance, superior quality, and unparalleled customer service. Our pieces are hand-selected to ensure you receive only the best."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-in-up">
      <div className="max-w-3xl mx-auto py-16 px-6">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full" style={{ background: "var(--cream-2)", border: "1px solid var(--border)" }}>
            <FontAwesomeIcon icon={faStore} className="text-2xl" style={{ color: "var(--charcoal)" }} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--accent-rose)", letterSpacing: "0.2em" }}>Our Story</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--charcoal)", lineHeight: 1.2 }}>
            About <span style={{ fontStyle: "italic", color: "var(--accent-rose)" }}>HyperStore</span>
          </h1>
          <div className="w-16 h-[1px] mx-auto" style={{ background: "var(--border)" }} />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="shimmer h-4 rounded"
                style={{ width: ["95%", "88%", "92%", "75%", "85%"][i] || "90%" }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6 text-sm leading-loose" style={{ color: "var(--charcoal-2)" }}>
            {content.split("\n\n").map((paragraph, i) => (
              <p key={i} className={paragraph.startsWith("#") ? "text-2xl font-bold font-serif mb-4 mt-8 text-charcoal" : ""}>
                {paragraph.startsWith("#") ? paragraph.replace(/^#+\s/, "") : paragraph}
              </p>
            ))}
          </div>
        )}

        <div className="mt-16 text-center border-t pt-12" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs uppercase tracking-widest mb-6" style={{ color: "var(--muted)" }}>Ready to explore?</p>
          <Link href="/shop" className="btn-primary py-3 px-8 text-xs inline-block">Shop the Collection</Link>
        </div>
      </div>
    </div>
  );
}
