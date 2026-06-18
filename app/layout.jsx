import "./globals.css";
import "@/lib/fontawesome";
import { CartProvider } from "@/components/CartContext";
import Navbar from "@/components/Navbar";
import ChatWidget from "@/components/ChatWidget";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faInstagram, faPinterest } from "@fortawesome/free-brands-svg-icons";
import { faTruck, faArrowRotateLeft, faLock } from "@fortawesome/free-solid-svg-icons";
export const metadata = {
  title: "HyperStore — Curated Fashion & Lifestyle",
  description: "Discover beautifully curated fashion and lifestyle products. AI-powered recommendations, trusted sellers, seamless checkout.",
  icons: {
    icon: [
      { url: '/logo.png', href: '/logo.png' }
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ background: "var(--cream)", color: "var(--charcoal)" }} className="min-h-screen flex flex-col">
        <CartProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-10 py-10">
            {children}
          </main>
          <ChatWidget />

          {/* ── Footer ── */}
          <footer style={{ borderTop: "1px solid var(--border)", marginTop: "auto" }}>
            {/* Trust strip */}
         {/* Trust strip */}
            <div style={{ background: "var(--cream-2)", borderBottom: "1px solid var(--border)" }}>
              <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: faTruck, title: "Free Shipping", desc: "On all orders, always" },
                  { icon: faArrowRotateLeft, title: "30-Day Returns", desc: "Hassle-free, no questions" }, 
                  { icon: faLock, title: "Secure Checkout", desc: "SSL encrypted & safe" },
                ].map((b) => (
                  <div key={b.title} className="flex items-center gap-4">
                    {/* CHANGED THIS LINE TO RENDER THE COMPONENT */}
                    <span style={{ fontSize: "1.4rem" }}>
                      <FontAwesomeIcon icon={b.icon} />
                    </span>
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "var(--charcoal)", letterSpacing: "0.12em" }}
                      >
                        {b.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                {/* Brand */}
                <div className="col-span-2 md:col-span-1">
                  <Link href="/" className="block mb-4">
                    <img src="/logo.png" alt="HyperStore" className="h-8 object-contain" />
                  </Link>
                  <p className="text-xs leading-relaxed max-w-xs" style={{ color: "var(--muted)" }}>
                    Curated fashion and lifestyle for the modern individual. Discover, shop, love.
                  </p>
                  {/* Social links */}
                  <div className="flex items-center gap-4 mt-5">
                    {[
                      { icon: faInstagram, label: "Instagram" },
                      { icon: faPinterest, label: "Pinterest" },
                      { icon: faTwitter, label: "Twitter" },
                    ].map(({ icon, label }) => (
                      <a
                        key={label}
                        href="#"
                        aria-label={label}
                        className="transition-colors hover:text-charcoal"
                        style={{ color: "var(--muted-2)", fontSize: "1rem" }}
                      >
                        <FontAwesomeIcon icon={icon} />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Shop */}
                <div>
                  <h4
                    className="text-[11px] font-semibold uppercase tracking-widest mb-5"
                    style={{ color: "var(--charcoal)", letterSpacing: "0.15em" }}
                  >
                    Shop
                  </h4>
                  <ul className="space-y-3">
                    {[
                      ["All Products", "/shop"],
                      ["Clothing", "/shop?category=Clothing"],
                      ["Electronics", "/shop?category=Electronics"],
                      ["Home & Living", "/shop?category=Home"],
                      ["Sports", "/shop?category=Sports"],
                    ].map(([label, href]) => (
                      <li key={label}>
                        <Link
                          href={href}
                          className="text-xs transition-colors hover:text-charcoal"
                          style={{ color: "var(--muted)" }}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Account */}
                <div>
                  <h4
                    className="text-[11px] font-semibold uppercase tracking-widest mb-5"
                    style={{ color: "var(--charcoal)", letterSpacing: "0.15em" }}
                  >
                    Account
                  </h4>
                  <ul className="space-y-3">
                    {[
                      ["Sign In", "/login"],
                      ["Create Account", "/register"],
                      ["My Orders", "/orders"],
                      ["Wishlist", "/wishlist"],
                      ["Profile", "/profile"],
                    ].map(([label, href]) => (
                      <li key={label}>
                        <Link
                          href={href}
                          className="text-xs transition-colors hover:text-charcoal"
                          style={{ color: "var(--muted)" }}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sell */}
                <div>
                  <h4
                    className="text-[11px] font-semibold uppercase tracking-widest mb-5"
                    style={{ color: "var(--charcoal)", letterSpacing: "0.15em" }}
                  >
                    Sell with Us
                  </h4>
                  <ul className="space-y-3">
                    {[
                      ["Become a Seller", "/register"],
                      ["Seller Dashboard", "/seller"],
                      ["Manage Products", "/seller"],
                      ["View Analytics", "/seller"],
                    ].map(([label, href]) => (
                      <li key={label}>
                        <Link
                          href={href}
                          className="text-xs transition-colors hover:text-charcoal"
                          style={{ color: "var(--muted)" }}
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div
                className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  © 2026 HyperStore. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="cursor-pointer transition-colors hover:text-charcoal">Privacy Policy</span>
                  <span className="cursor-pointer transition-colors hover:text-charcoal">Terms of Service</span>
                  <span className="cursor-pointer transition-colors hover:text-charcoal">Cookie Policy</span>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
