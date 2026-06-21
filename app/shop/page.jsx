import { getProductsCached } from "@/lib/products-cache";
import ShopClient from "./ShopClient";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// Separate the async data fetching to prevent blocking the entire shell render
async function ShopContent({ searchParamsPromise }) {
  const searchParams = await searchParamsPromise;
  const category = searchParams.category ? String(searchParams.category) : "All";
  const search = searchParams.search ? String(searchParams.search) : "";

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyToken(token) : null;
  const includeDemo = user?.email === "demo.seller@hyperstore.com";

  // Server-side pre-fetch of the first 8 products (Leveraging Next.js Cache Tagging)
  const initialProducts = await getProductsCached({
    category,
    search,
    limit: 8,
    skip: 0,
    includeDemo,
  });

  return (
    <ShopClient
      initialProducts={initialProducts}
      initialCategory={category}
      initialSearch={search}
    />
  );
}

export default function ShopPage({ searchParams }) {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-4" style={{ letterSpacing: "0.15em" }}>
          Loading collection...
        </p>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-charcoal animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 rounded-full bg-charcoal animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 rounded-full bg-charcoal animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    }>
      <ShopContent searchParamsPromise={searchParams} />
    </Suspense>
  );
}
