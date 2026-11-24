import type { Metadata } from 'next';
import { Snowflake } from 'lucide-react';
import TemperatureForm from '@/components/temperature-form';
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { getTemperatureReadings, getZones } from '@/lib/data';
import { dateTime } from '@/lib/utils';

export const metadata: Metadata = { title: 'Cold chain' };
export const dynamic = 'force-dynamic';

export default function ColdChainPage() {
  const zones = getZones();
  const readings = getTemperatureReadings();
  const breaches = zones.filter((z: any) => z.breachCount > 0).length;

  return (
    <>
      <PageHeader title="Cold chain" description="Zone temperature ranges and the latest sensor readings" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Monitored zones" value={String(zones.length)} tone="blue" icon={<Snowflake size={20} />} />
        <StatCard label="Zones with breaches" value={String(breaches)} tone={breaches ? 'red' : 'green'} />
        <StatCard label="Latest readings" value={String(readings.length)} tone="gray" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Zones" description="Live state is derived from the most recent reading" />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {zones.map((z: any) => {
                const breach =
                  (z.min_temp != null && z.lastTemp < z.min_temp) ||
                  (z.max_temp != null && z.lastTemp > z.max_temp);
                return (
                  <div key={z.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{z.name}</p>
                      <Badge tone={breach ? 'red' : 'blue'}>{z.type}</Badge>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
                      {z.lastTemp != null ? `${z.lastTemp}°C` : '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Target {z.min_temp ?? '—'} to {z.max_temp ?? '—'}°C · {z.breachCount} historical breach(es)
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{dateTime(z.lastReadingAt)}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Reading history" />
            {readings.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {readings.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{r.zoneName}</p>
                      <p className="text-xs text-gray-400">{dateTime(r.recorded_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{r.temp_c}°C</span>
                      <Badge tone={r.status === 'breach' ? 'red' : 'green'}>{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No readings yet" />
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Log a reading" description="Breaches are flagged automatically" />
          <div className="p-5"><TemperatureForm zones={zones} /></div>
        </Card>
      </div>
    </>
  );
}
