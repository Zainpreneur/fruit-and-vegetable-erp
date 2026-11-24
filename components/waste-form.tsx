'use client';

import { useActionState } from 'react';
import { recordWasteAction } from '@/app/actions';
import { Button } from '@/components/ui';

type Product = { id: number; name: string; emoji: string; unit: string };
type Batch = { id: number; code: string; product_id: number; qty_remaining: number };

export default function WasteForm({ products, batches }: { products: Product[]; batches: Batch[] }) {
  const [state, action, pending] = useActionState(recordWasteAction, null);
  const reasons = ['overripe', 'bruised', 'rotten', 'temp_damage', 'handling_damage', 'expired', 'quality_rejection', 'unknown'];
  const field = 'mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900';
  return (
    <form action={action} className="space-y-3">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
        Product
        <select name="productId" className={field}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
        Batch (optional)
        <select name="batchId" className={field} defaultValue="">
          <option value="">Not specified</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.code} · {b.qty_remaining} left</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
          Quantity
          <input name="qty" type="number" min="0.01" step="0.01" required className={field} />
        </label>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
          Reason
          <select name="reason" className={field}>
            {reasons.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
        Note
        <input name="note" maxLength={200} className={field} />
      </label>
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Record waste'}</Button>
      {state && <p className={`text-xs ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>}
    </form>
  );
}
