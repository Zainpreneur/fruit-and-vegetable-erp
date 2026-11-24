'use client';

import { useActionState, useMemo, useState } from 'react';
import { Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { checkoutAction } from '@/app/actions';
import { Badge, Button, Card, CardHeader } from '@/components/ui';
import { money, qty } from '@/lib/utils';

type Product = {
  id: number;
  name: string;
  emoji: string;
  sku: string;
  unit: string;
  priceCents: number;
  wholesalePriceCents: number;
  stockQty: number;
  category: string | null;
};
type Customer = { id: number; name: string; segment: string };
type CartLine = { product: Product; qty: number };

export default function PosClient({
  products,
  customers,
  taxRate,
}: {
  products: Product[];
  customers: Customer[];
  taxRate: number;
}) {
  const [state, formAction, pending] = useActionState(checkoutAction, null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [channel, setChannel] = useState<'retail' | 'wholesale' | 'b2b' | 'online'>('retail');
  const [customerId, setCustomerId] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'invoice'>('cash');

  const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category || 'Other'))], [products]);
  const filtered = products.filter(
    (p) =>
      (category === 'All' || (p.category || 'Other') === category) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const unitPrice = (p: Product) =>
    channel === 'retail' || channel === 'online'
      ? p.priceCents
      : p.wholesalePriceCents > 0
        ? p.wholesalePriceCents
        : Math.round(p.priceCents * 0.8);

  const subtotal = cart.reduce((sum, line) => sum + unitPrice(line.product) * line.qty, 0);
  const discount = Math.round((subtotal * discountPct) / 100);
  const tax = Math.round(((subtotal - discount) * taxRate) / 100);
  const total = subtotal - discount + tax;

  function add(product: Product) {
    if (product.stockQty <= 0) return;
    setCart((current) => {
      const existing = current.find((l) => l.product.id === product.id);
      if (existing) {
        return current.map((l) =>
          l.product.id === product.id ? { ...l, qty: Math.min(l.qty + 1, product.stockQty) } : l,
        );
      }
      return [...current, { product, qty: 1 }];
    });
  }

  function changeQty(id: number, delta: number) {
    setCart((current) =>
      current
        .map((l) =>
          l.product.id === id
            ? { ...l, qty: Math.min(Math.max(l.qty + delta, 0), l.product.stockQty) }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  function resetAfterSuccess() {
    if (state?.ok) setCart([]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="overflow-hidden">
        <CardHeader title="Product catalogue" description="Click a product to add it to the cart" />
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row dark:border-gray-800">
          <label className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900"
            />
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid max-h-[620px] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => add(p)}
              disabled={p.stockQty <= 0}
              className="rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-brand-400 hover:shadow-theme-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{p.emoji || '🥬'}</span>
                {p.stockQty <= 0 && <Badge tone="red">Out</Badge>}
              </div>
              <p className="mt-2 truncate text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
              <p className="text-xs text-gray-400">{p.sku}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                  {money(unitPrice(p))}
                </span>
                <span className="text-xs text-gray-500">{qty(p.stockQty, p.unit)}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader title="Current sale" description={`${cart.length} line(s) · FEFO batches picked at checkout`} />
        <form action={formAction} onSubmit={resetAfterSuccess} className="space-y-4 p-5">
          <input type="hidden" name="items" value={JSON.stringify(cart.map((l) => ({ productId: l.product.id, qty: l.qty })))} />

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-gray-500">
              Channel
              <select
                name="channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as typeof channel)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="b2b">B2B</option>
                <option value="online">Online</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-500">
              Payment
              <select
                name="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile</option>
                <option value="invoice">Invoice</option>
              </select>
            </label>
          </div>

          {channel !== 'retail' && (
            <label className="block text-xs font-medium text-gray-500">
              Customer (required)
              <select
                name="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.segment}
                  </option>
                ))}
              </select>
            </label>
          )}
          {channel === 'retail' && customerId && <input type="hidden" name="customerId" value={customerId} />}

          <div className="space-y-2">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400 dark:border-gray-700">
                <ShoppingCart className="mx-auto mb-2" size={22} />
                Cart is empty
              </div>
            ) : (
              cart.map((line) => (
                <div key={line.product.id} className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800/50">
                  <span className="text-lg">{line.product.emoji || '🥬'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-100">{line.product.name}</p>
                    <p className="text-[11px] text-gray-400">{money(unitPrice(line.product))} / {line.product.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => changeQty(line.product.id, -1)} className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Decrease quantity">
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">{line.qty}</span>
                    <button type="button" onClick={() => changeQty(line.product.id, 1)} className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Increase quantity">
                      <Plus size={13} />
                    </button>
                    <button type="button" onClick={() => setCart((c) => c.filter((l) => l.product.id !== line.product.id))} className="rounded-md p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Remove line">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <label className="block text-xs font-medium text-gray-500">
            Discount %
            <input
              type="number"
              name="discountPct"
              min={0}
              max={100}
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </label>
          <label className="block text-xs font-medium text-gray-500">
            Note (optional)
            <input name="note" maxLength={500} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
          </label>

          <div className="space-y-1 border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Discount</span><span>-{money(discount)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Tax ({taxRate}%)</span><span>{money(tax)}</span></div>
            <div className="flex justify-between pt-2 text-lg font-semibold text-gray-900 dark:text-white">
              <span>Total</span><span>{money(total)}</span>
            </div>
          </div>

          {state && !state.ok && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{state.message}</p>}
          {state?.ok && <p className="rounded-lg bg-brand-50 p-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">{state.message} — cart cleared.</p>}

          <Button type="submit" disabled={pending || cart.length === 0} className="w-full">
            {pending ? 'Processing…' : `Complete sale · ${money(total)}`}
          </Button>
        </form>
      </Card>
    </div>
  );
}
