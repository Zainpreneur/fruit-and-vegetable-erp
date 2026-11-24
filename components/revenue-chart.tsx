'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { money } from '@/lib/utils';

type Point = { date: string; label: string; revenueCents: number };

export default function RevenueChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#9ca3af" />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="#9ca3af"
            tickFormatter={(v: number) => `$${Math.round(v / 100)}`}
          />
          <Tooltip
            formatter={(value: number) => [money(value), 'Revenue']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="revenueCents"
            stroke="#16a34a"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
