"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { STAGE_LABELS } from "@/lib/constants/pipeline";

interface DailyActivity {
  date: string;
  calls: number;
  prospects: number;
}

interface PipelineItem {
  stage: string;
  count: number;
}

export function ActivityChart({ data }: { data: DailyActivity[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradientCalls" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientProspects" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          className="text-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
        />
        <Area
          type="monotone"
          dataKey="calls"
          name="Appels"
          stroke="hsl(var(--primary))"
          fill="url(#gradientCalls)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="prospects"
          name="Prospects"
          stroke="#10b981"
          fill="url(#gradientProspects)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PipelineChart({ data }: { data: PipelineItem[] }) {
  const chartData = data.map((p) => ({
    name: STAGE_LABELS[p.stage] || p.stage,
    value: p.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 80, right: 20 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          formatter={(value) => [value, "Prospects"]}
        />
        <Bar
          dataKey="value"
          fill="hsl(var(--primary))"
          radius={[0, 6, 6, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
