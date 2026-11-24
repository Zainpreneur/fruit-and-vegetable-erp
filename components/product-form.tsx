'use client';

import { useActionState } from 'react';
import { createProductAction } from '@/app/actions';
import { Button } from '@/components/ui';

type Option = { id: number; name: string };

const field = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900';
const label = 'block text-xs font-medium text-gray-600 dark:text-gray-300';

export default function ProductForm({ categories, suppliers }: { categories: Option[]; suppliers: Option[] }) {
  const [state, action, pending] = useActionState(createProductAction, null);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className={label}>Name<input name="name" required className={field} placeholder="e.g. Rainbow carrots" /></label>
      <label className={label}>SKU (optional)<input name="sku" className={field} placeholder="Auto-generated" /></label>
      <label className={label}>Category
        <select name="categoryId" className={field} defaultValue="">
          <option value="">None</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className={label}>Supplier
        <select name="supplierId" className={field} defaultValue="">
          <option value="">None</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className={label}>Unit
        <select name="unit" className={field} defaultValue="kg">
          {['kg', 'pcs', 'bunch', 'pack', 'dozen'].map((u) => <option key={u}>{u}</option>)}
        </select>
      </label>
      <label className={label}>Emoji<input name="emoji" maxLength={8} className={field} placeholder="🥕" /></label>
      <label className={label}>Cost (cents)<input name="costCents" type="number" min={0} defaultValue={0} required className={field} /></label>
      <label className={label}>Retail price (cents)<input name="priceCents" type="number" min={0} required className={field} /></label>
      <label className={label}>Wholesale price (cents)<input name="wholesalePriceCents" type="number" min={0} defaultValue={0} className={field} /></label>
      <label className={label}>Opening stock<input name="stockQty" type="number" min={0} step="0.01" defaultValue={0} className={field} /></label>
      <label className={label}>Reorder level<input name="reorderLevel" type="number" min={0} step="0.01" defaultValue={0} className={field} /></label>
      <label className={label}>Shelf life (days)<input name="shelfLifeDays" type="number" min={1} defaultValue={7} className={field} /></label>
      <label className={label}>Storage
        <select name="storageReq" className={field} defaultValue="ambient">
          {['ambient', 'chilled', 'cold', 'dry'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Add product'}</Button>
        {state && (
          <p className={`text-sm ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
