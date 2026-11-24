import type { Metadata } from 'next';
import SettingsForm from '@/components/settings-form';
import { Card, CardHeader, PageHeader } from '@/components/ui';
import { getSettings } from '@/lib/data';

export const metadata: Metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const settings = getSettings();
  return (
    <>
      <PageHeader title="Settings" description="Store identity and tax configuration" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="General" description="Applied to POS totals and the app header" />
          <div className="p-5"><SettingsForm storeName={settings.storeName} taxRate={settings.taxRate} /></div>
        </Card>
        <Card>
          <CardHeader title="Data & API" description="The original JSON API remains available" />
          <div className="space-y-2 p-5 text-sm text-gray-600 dark:text-gray-300">
            <p>All 61 legacy endpoints are served from <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">/api/*</code>.</p>
            <p>Stock is stored in a local SQLite database shared by the UI and API.</p>
            <p className="text-xs text-gray-400">FEFO allocation and grade-based pricing are applied at checkout.</p>
          </div>
        </Card>
      </div>
    </>
  );
}
