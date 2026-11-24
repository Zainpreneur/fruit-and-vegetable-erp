'use client';

import { useActionState } from 'react';
import { restockAction } from '@/app/actions';
import { Button } from '@/components/ui';

export default function RestockForm({ productId }: { productId: number }) {
  const [state, action, pending] = useActionState(restockAction, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
        Quantity
        <input name="qty" type="number" min="0.01" step="0.01" required className="mt-1 w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
      </label>
      <label className="block flex-1 text-xs font-medium text-gray-600 dark:text-gray-300">
        Note
        <input name="note" maxLength={200} placeholder="Supplier delivery" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
      </label>
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Restock'}</Button>
      {state && <p className={`w-full text-xs ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>}
    </form>
  );
}
