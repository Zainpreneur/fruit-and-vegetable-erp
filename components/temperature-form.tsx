'use client';

import { useActionState } from 'react';
import { recordTemperatureAction } from '@/app/actions';
import { Button } from '@/components/ui';

export default function TemperatureForm({ zones }: { zones: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(recordTemperatureAction, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
        Zone
        <select name="zoneId" className="mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
        Temperature (°C)
        <input name="tempC" type="number" step="0.1" min={-40} max={80} required className="mt-1 w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
      </label>
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Record reading'}</Button>
      {state && <p className={`w-full text-xs ${state.ok ? 'text-brand-700' : 'text-red-600'}`}>{state.message}</p>}
    </form>
  );
}
