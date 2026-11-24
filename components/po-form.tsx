'use client';

import { useActionState, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createPurchaseOrderAction } from '@/app/actions';
import { Button } from '@/components/ui';

type Product = { id: number; name: string; unit: string; costCents: number; emoji: string };

export default function PoForm({ suppliers, products }: { suppliers: { id: number; name: string }[]; products: Product[] }) {
  const [state, action, pending] = useActionState(createPurchaseOrderAction, null);
  const [lines, setLines] = useState([{ productId: products[0]?.id ?? 0, qty: 1, unitCostCents: products[0]?.costCents ?? 0 }]);

  function update(index: number, patch: Partial<(typeof lines)[number]>) {
    setLines((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="items" value={JSON.stringify(lines)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
          Supplier
          <select name="supplierId" required className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
          Expected date
          <input name="expectedDate" type="date" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
        </label>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
          Notes
          <input name="notes" maxLength={300} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Line items</p>
          <button
            type="button"
            onClick={() => setLines((l) => [...l, { productId: products[0]?.id ?? 0, qty: 1, unitCostCents: 0 }])}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600"
          >
            <Plus size={14} /> Add line
          </button>
        </div>
        {lines.map((line, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-gray-200 p-3 sm:grid-cols-[2fr_1fr_1fr_auto] dark:border-gray-800">
            <select
              value={line.productId}
              onChange={(e) => {
                const p = products.find((x) => x.id === Number(e.target.value));
                update(i, { productId: Number(e.target.value), unitCostCents: p?.costCents ?? 0 });
              }}
              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {products.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name} ({p.unit})</option>)}
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={line.qty}
              onChange={(e) => update(i, { qty: Number(e.target.value) })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              aria-label="Quantity"
            />
            <input
              type="number"
              min="0"
              value={line.unitCostCents}
              onChange={(e) => update(i, { unitCostCents: Number(e.target.value) })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              aria-label="Unit cost in cents"
            />
            <button
              type="button"
              onClick={() => setLines((l) => l.filter((_, idx) => idx !== i))}
              disabled={lines.length === 1}
              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/40"
              aria-label="Remove line"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Create purchase order'}</Button>
        {state && <p className={`text-sm ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>}
      </div>
    </form>
  );
}
