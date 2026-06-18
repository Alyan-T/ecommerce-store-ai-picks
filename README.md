# ShopAI — AI-Powered Ecommerce (Next.js + MongoDB + OpenAI Vector Search)

A full ecommerce starter with:
- Product catalog with search & category filters
- Auth (register/login/logout) using JWT cookies
- Cart (persisted in localStorage) and checkout that creates orders
- **AI shopping assistant chatbot** that uses Mistral AI embeddings + MongoDB
  Atlas Vector Search to find relevant products and reply conversationally

## 1. Install dependencies

```bash
npm install
```

If your existing project already has some of these files (e.g. `app/layout.jsx`,
`app/globals.css`, `tailwind.config.js`), merge the contents carefully instead
of overwriting — especially if you've customized them.

## 2. Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ecommerce-ai
MISTRAL_API_KEY=...
JWT_SECRET=<any long random string>
```

- **MONGODB_URI**: from your Atlas free-tier cluster → "Connect" → "Drivers".
  Make sure your current IP is allowed in Atlas Network Access.
- **MISTRAL_API_KEY**: from console.mistral.ai → API Keys. Mistral has a free
  tier with rate limits (the seed script adds a small delay between requests
  to stay within them).
- **JWT_SECRET**: any random string, e.g. generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 3. Seed sample products

This inserts ~20 sample products and generates an embedding for each one:

```bash
npm run seed
```

You should see each product logged as it's inserted. This calls the Mistral
embeddings API, so it will use a small amount of your Mistral free-tier quota
(the script pauses briefly between requests to avoid rate limits).

## 4. Create the Atlas Vector Search index

The chatbot uses MongoDB's `$vectorSearch` aggregation stage, which requires
a **vector search index** on the `embedding` field. This must be created in
the Atlas UI (or via the Atlas API/CLI) — it can't be created from your app code.

1. In Atlas, go to your cluster → **Atlas Search** tab → **Create Search Index**
2. Choose **Vector Search** → **JSON Editor**
3. Select your database (e.g. `ecommerce-ai`) and collection `products`
4. Name the index exactly `vector_index` (this matches `lib` code)
5. Use this index definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similarity": "cosine"
    }
  ]
}
```

6. Click **Create**. It takes a minute or two to build. Once status shows
   "Active", the chatbot's vector search will start returning results.

> If you skip this step, the chatbot still works — it'll just reply without
> product recommendations (the API gracefully falls back to an empty product list).

## 5. Run the app

```bash
npm run dev
```

Visit http://localhost:3000

- Browse products on the homepage, filter by category or search
- Register/login to place orders
- Click the chat bubble (bottom-right) and try things like:
  - "I need waterproof shoes for hiking"
  - "Show me something for working out at home"
  - "What books do you have?"

## How the AI chatbot works

1. User sends a message → `/api/chat`
2. The message is converted to a vector via Mistral's `mistral-embed` model
   (`lib/mistral.js` → `getEmbedding`)
3. `Product.aggregate([{ $vectorSearch: {...} }])` finds the 5 most semantically
   similar products in MongoDB (`app/api/chat/route.js`)
4. Those products are inserted into a system prompt for `mistral-small-latest`,
   which writes a natural-language reply and recommends specific items
5. The frontend (`components/ChatWidget.jsx`) displays the reply plus clickable
   product cards for any matches

## Project structure

```
app/
  api/
    auth/{register,login,logout}/route.js   - auth endpoints
    me/route.js                             - current user
    products/route.js, [id]/route.js        - product CRUD/listing
    orders/route.js                         - order creation/history
    chat/route.js                           - AI chatbot endpoint
  page.jsx                 - home/product listing
  product/[id]/page.jsx    - product detail
  cart/page.jsx            - cart
  checkout/page.jsx        - checkout/order placement
  login/page.jsx, register/page.jsx
  layout.jsx, globals.css
components/
  Navbar.jsx, ProductCard.jsx, ChatWidget.jsx, CartContext.jsx
lib/
  mongodb.js  - DB connection
  mistral.js  - Mistral client + embedding helper
  auth.js     - JWT helpers
models/
  Product.js, User.js, Order.js
scripts/
  seed.js     - seeds sample products with embeddings
```

## Next steps / ideas to extend

- Add an admin dashboard to create/edit products (the POST `/api/products`
  route already generates embeddings automatically for new products)
- Add real payments (Stripe Checkout)
- Add product reviews/ratings
- Stream the chatbot's response token-by-token for a snappier feel
- Add pagination to the product listing
