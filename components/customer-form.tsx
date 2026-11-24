'use client';

import { useActionState } from 'react';
import { createCustomerAction } from '@/app/actions';
import { Button } from '@/components/ui';

export default function CustomerForm() {
  const [state, action, pending] = useActionState(createCustomerAction, null);
  const field = 'mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900';
  return (
    <form action={action} className="space-y-3">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Name<input name="name" required className={field} /></label>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Phone<input name="phone" className={field} /></label>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Email<input name="email" type="email" className={field} /></label>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Segment
        <select name="segment" className={field}>
          {['retail', 'reseller', 'restaurant', 'b2b'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Payment terms<input name="paymentTerms" placeholder="e.g. net14" className={field} /></label>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Notes<input name="notes" className={field} /></label>
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Add customer'}</Button>
      {state && <p className={`text-xs ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>}
    </form>
  );
}
