'use client';

import { useActionState } from 'react';
import { batchFormAction } from '@/app/actions';
import { Button } from '@/components/ui';

export default function BatchActions({ batchId }: { batchId: number }) {
  const [state, action, pending] = useActionState(batchFormAction, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="batchId" value={batchId} />
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
        Markdown %
        <input name="discountPct" type="number" min={0} max={90} defaultValue={0} className="mt-1 w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
      </label>
      <Button type="submit" name="action" value="discount" variant="secondary" disabled={pending}>
        Apply markdown
      </Button>
      <Button type="submit" name="action" value="quarantine" variant="secondary" disabled={pending}>
        Quarantine
      </Button>
      <Button type="submit" name="action" value="dispose" variant="danger" disabled={pending}>
        Dispose
      </Button>
      {state && <p className={`w-full text-xs ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>}
    </form>
  );
}
