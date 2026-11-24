'use client';

import { useActionState } from 'react';
import { saveSettingsAction } from '@/app/actions';
import { Button } from '@/components/ui';

export default function SettingsForm({ storeName, taxRate }: { storeName: string; taxRate: number }) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  const field = 'mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900';
  return (
    <form action={action} className="max-w-md space-y-4">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Store name<input name="storeName" defaultValue={storeName} className={field} /></label>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Tax rate (%)<input name="taxRate" type="number" min={0} max={50} step={0.1} defaultValue={taxRate} className={field} /></label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save settings'}</Button>
        {state && <p className={`text-sm ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>}
      </div>
    </form>
  );
}
