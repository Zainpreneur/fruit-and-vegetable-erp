'use client';

import { useActionState, useState } from 'react';
import { receivePurchaseOrderAction } from '@/app/actions';
import { Button } from '@/components/ui';

type Item = {
  id: number;
  productName: string;
  emoji: string;
  unit: string;
  qty: number;
  qty_received: number;
  qty_accepted: number;
  qty_rejected: number;
};

export default function ReceiveForm({ poId, items }: { poId: number; items: Item[] }) {
  const [state, action, pending] = useActionState(receivePurchaseOrderAction, null);
  const [lines, setLines] = useState(
    items.map((i) => ({
      itemId: i.id,
      acceptedQty: Math.max(i.qty - i.qty_received, 0),
      rejectedQty: 0,
      grade: 'A',
    })),
  );

  function update(index: number, patch: Partial<(typeof lines)[number]>) {
    setLines((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="poId" value={poId} />
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
        Inspector
        <input name="inspector" defaultValue="Receiving Bay 1" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
      </label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="grid gap-2 rounded-xl border border-gray-200 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr] dark:border-gray-800">
            <div className="flex items-center gap-2 text-sm">
              <span>{item.emoji}</span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{item.productName}</span>
              <span className="text-xs text-gray-400">ordered {item.qty} · received {item.qty_received}</span>
            </div>
            <input type="number" min="0" step="0.01" value={lines[i].acceptedQty} onChange={(e) => update(i, { acceptedQty: Number(e.target.value) })} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" aria-label="Accepted quantity" />
            <input type="number" min="0" step="0.01" value={lines[i].rejectedQty} onChange={(e) => update(i, { rejectedQty: Number(e.target.value) })} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" aria-label="Rejected quantity" />
            <select value={lines[i].grade} onChange={(e) => update(i, { grade: e.target.value })} className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" aria-label="Grade">
              {['A', 'B', 'C'].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? 'Receiving…' : 'Receive goods & create batches'}</Button>
        {state && <p className={`text-sm ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>}
      </div>
    </form>
  );
}
