"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HIGH_RISK_RATIO, MODERATE_RISK_RATIO } from "@/lib/risk-model";
import { dailyRatio, sortByDate } from "@/lib/ratio";
import type { DailyLog } from "@/lib/types";

export default function RatioChart({ logs }: { logs: DailyLog[] }) {
  const data = sortByDate(logs).map((log) => ({
    date: log.log_date.slice(5),
    ratio: (() => {
      const r = dailyRatio(log);
      return r !== null && Number.isFinite(r) ? Math.round(r * 100) / 100 : null;
    })(),
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted">No data yet — log today's hours to start the trend line.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-sm font-semibold">Daily ratio trend</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fill: "#8fa3c0", fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#8fa3c0", fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#121c31", border: "1px solid #24304d", borderRadius: 8 }}
              labelStyle={{ color: "#e6ecf7" }}
              formatter={(value: number) => [`${value}:1`, "Ratio"]}
            />
            <ReferenceLine
              y={HIGH_RISK_RATIO}
              stroke="#f0616d"
              strokeDasharray="4 4"
              label={{ value: "high risk", fill: "#f0616d", fontSize: 10, position: "insideTopRight" }}
            />
            <ReferenceLine
              y={MODERATE_RISK_RATIO}
              stroke="#f5b83d"
              strokeDasharray="2 4"
              label={{ value: "watch", fill: "#f5b83d", fontSize: 10, position: "insideBottomRight" }}
            />
            <Line
              type="monotone"
              dataKey="ratio"
              stroke="#4f8cff"
              strokeWidth={2}
              dot={{ r: 2, fill: "#4f8cff" }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
