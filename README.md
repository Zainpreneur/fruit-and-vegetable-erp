# GreenBasket (Next.js)

A Next.js App Router rebuild of [`Zainpreneur/fruit-and-vegetable-erp`](https://github.com/Zainpreneur/fruit-and-vegetable-erp). It keeps the original SQLite data model, FEFO batch allocation, cold-chain and receiving workflows, and adds a server-first dashboard UI.

## What changed

- **App Router UI** — every page is a Server Component by default; only the POS cart, forms and revenue chart are Client Components.
- **Server Actions** — checkout, product/customer/PO creation, receiving, markdown/quarantine/dispose, waste, temperature readings and settings. All inputs are validated with Zod and mutations call `revalidatePath`.
- **Legacy API preserved** — `app/api/[...path]/route.ts` adapts the original Node `req`/`res` router, so all 61 JSON endpoints keep working at `/api/*`.
- **Shared data layer** — `lib/data.ts` reads the same `node:sqlite` database used by the legacy modules, so UI and API never diverge.
- **Design** — tokens, menu utilities and shadow scale adapted from `Zainpreneur/nextjs-r7` (Next.js 16 + Tailwind 4 admin reference), recoloured to GreenBasket green.

## Run

Requires Node.js 22.5+ (uses built-in `node:sqlite`).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The database is seeded on first boot into `data/store.db`. Set `GB_DATA_DIR` or `GB_DB_PATH` to relocate it.

```bash
npm run typecheck
npm run lint
npm run build
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Executive dashboard, revenue trend, expiry and low-stock watchlists |
| `/pos` | Checkout with automatic FEFO batch allocation and grade pricing |
| `/products` | Catalogue with storage, shelf life and stock position |
| `/inventory` | Batch lot list with life-state filters |
| `/inventory/[id]` | Batch inspections, allocations and actions |
| `/purchasing` | Purchase orders and receiving workflow |
| `/cold-chain` | Zones, limits and temperature log |
| `/waste` | Loss events, reason analysis and logging |
| `/reports` | KPIs, channel/category mix, perishability and procurement actions |
| `/customers` | CRM, subscriptions and receivables |
| `/sales` | Order history with batch traceability and refunds |
| `/settings` | Store name and tax rate |
| `/api/*` | Original GreenBasket JSON API |

## Structure

```
app/                    App Router pages, loading/error/not-found, server actions
app/api/[...path]/      Legacy API bridge
components/             UI primitives, shell, client forms and charts
lib/data.ts             Server-only read queries
server/legacy/          Original db, domain, sale-core and route modules (unchanged logic)
reference/r7/           Tokens copied from nextjs-r7 for design traceability
data/                   SQLite database (generated)
```
