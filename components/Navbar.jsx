"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faChevronDown,
  faUser,
  faClipboardList,
  faHeart,
  faStore,
  faGear,
  faArrowRightFromBracket,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const ROLE_CONFIG = {
  admin:    { label: "Admin",    dashLink: "/admin",  dashLabel: "Dashboard", dashIcon: faGear },
  seller:   { label: "Seller",   dashLink: "/seller", dashLabel: "My Store",  dashIcon: faStore },
  customer: { label: "Customer", dashLink: null,       dashLabel: null,        dashIcon: null },
};

export default function Navbar() {
  const { count } = useCart();
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const close = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [dropdownOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  }

  const roleCfg = user?.role ? ROLE_CONFIG[user.role] : null;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-scrolled" : "bg-transparent border-b border-transparent"
      }`}
      style={{ background: scrolled ? undefined : "var(--cream)" }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-0 group"
          >
            <img src="/logo.png" alt="HyperStore" className="h-8 object-contain" />
          </Link>

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/shop" className="nav-link">Shop</Link>
            <Link href="/about" className="nav-link">About Us</Link>

            {roleCfg?.dashLink && (
              <Link href={roleCfg.dashLink} className="nav-link">
                {roleCfg.dashLabel}
              </Link>
            )}
          </div>

          {/* ── Desktop right actions ── */}
          <div className="hidden md:flex items-center gap-5">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 nav-link"
              title="Cart"
            >
              <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: "1rem" }} />
              {count > 0 && (
                <span
                  className="absolute -top-2 -right-3 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold pulse-glow"
                  style={{ background: "var(--accent-rose)" }}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" className="nav-link" title="Wishlist">
              <FontAwesomeIcon icon={faHeart} style={{ fontSize: "1rem" }} />
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                  className="nav-user-btn"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "var(--warm-brown)" }}
                  >
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: "var(--charcoal)", fontSize: "0.8rem", fontWeight: 500 }}>
                    {user.name?.split(" ")[0]}
                  </span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    style={{ color: "var(--muted)", fontSize: "0.6rem", transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>

                {dropdownOpen && (
                  <div className="dropdown-menu absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl overflow-hidden fade-in-up py-1.5">
                    <div className="px-3 py-2 border-b mb-1" style={{ borderColor: "var(--border)" }}>
                      <p className="text-xs font-semibold" style={{ color: "var(--charcoal)" }}>{user.name}</p>
                      <p className="text-[11px] capitalize" style={{ color: "var(--muted)" }}>{user.role}</p>
                    </div>
                    <div className="px-1.5 space-y-0.5">
                      <Link href="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <FontAwesomeIcon icon={faUser} className="w-3.5" style={{ color: "var(--muted)" }} />
                        My Account
                      </Link>
                      {user.role === "customer" && (
                        <>
                          <Link href="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <FontAwesomeIcon icon={faClipboardList} className="w-3.5" style={{ color: "var(--muted)" }} />
                            My Orders
                          </Link>
                          <Link href="/wishlist" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <FontAwesomeIcon icon={faHeart} className="w-3.5" style={{ color: "var(--muted)" }} />
                            Wishlist
                          </Link>
                        </>
                      )}
                      {user.role === "seller" && (
                        <Link href="/seller" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FontAwesomeIcon icon={faStore} className="w-3.5" style={{ color: "var(--muted)" }} />
                          My Store
                        </Link>
                      )}
                      {user.role === "admin" && (
                        <Link href="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FontAwesomeIcon icon={faGear} className="w-3.5" style={{ color: "var(--muted)" }} />
                          Admin Panel
                        </Link>
                      )}
                      <div className="my-1 mx-1" style={{ height: 1, background: "var(--border)" }} />
                      <button onClick={handleLogout} className="dropdown-item-danger">
                        <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost-sm">Login</Link>
                <Link href="/register" className="btn-brand-sm">Join</Link>
              </div>
            )}
          </div>

          {/* ── Mobile: cart + hamburger ── */}
          <div className="flex items-center gap-4 md:hidden">
            <Link href="/cart" className="relative nav-link">
              <FontAwesomeIcon icon={faCartShopping} style={{ fontSize: "1.1rem" }} />
              {count > 0 && (
                <span
                  className="absolute -top-2 -right-2.5 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold"
                  style={{ background: "var(--accent-rose)" }}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
            <button
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--charcoal-3)" }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} style={{ fontSize: "1.25rem" }} />
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div
            className="md:hidden rounded-xl mb-3 p-4 space-y-1 fade-in-up"
            style={{ background: "#fff", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(26,26,26,0.1)" }}
          >
            <Link href="/" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <FontAwesomeIcon icon={faStore} className="w-4" style={{ color: "var(--warm-brown)" }} />
              Home
            </Link>
            <Link href="/shop" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <FontAwesomeIcon icon={faStore} className="w-4" style={{ color: "var(--warm-brown)" }} />
              Shop
            </Link>
            <Link href="/about" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <FontAwesomeIcon icon={faUser} className="w-4" style={{ color: "var(--warm-brown)" }} />
              About Us
            </Link>
            <Link href="/wishlist" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <FontAwesomeIcon icon={faHeart} className="w-4" style={{ color: "var(--warm-brown)" }} />
              Wishlist
            </Link>
            {roleCfg?.dashLink && (
              <Link href={roleCfg.dashLink} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                <FontAwesomeIcon icon={roleCfg.dashIcon} className="w-4" style={{ color: "var(--warm-brown)" }} />
                {roleCfg.dashLabel}
              </Link>
            )}
            {user ? (
              <>
                <div className="flex items-center gap-3 py-3 border-t mt-2 pt-3" style={{ borderColor: "var(--border)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--warm-brown)" }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>{user.name}</p>
                    <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>{user.role}</p>
                  </div>
                </div>
                <Link href="/profile" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <FontAwesomeIcon icon={faUser} className="w-4" style={{ color: "var(--warm-brown)" }} />
                  My Account
                </Link>
                {user.role === "customer" && (
                  <>
                    <Link href="/orders" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                      <FontAwesomeIcon icon={faClipboardList} className="w-4" style={{ color: "var(--warm-brown)" }} />
                      My Orders
                    </Link>
                    <Link href="/wishlist" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                      <FontAwesomeIcon icon={faHeart} className="w-4" style={{ color: "var(--warm-brown)" }} />
                      Wishlist
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="mobile-nav-link w-full text-left"
                  style={{ color: "#b91c1c" }}
                >
                  <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 border-t pt-3 mt-2" style={{ borderColor: "var(--border)" }}>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center btn-ghost-sm">Login</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center btn-brand-sm">Join</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
