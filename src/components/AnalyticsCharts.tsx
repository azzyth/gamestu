"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyLog, Exam } from "@/lib/types";
import { dailyRatio, sortByDate } from "@/lib/ratio";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsCharts({ logs, exams }: { logs: DailyLog[]; exams: Exam[] }) {
  const sorted = sortByDate(logs);
  const last56 = sorted.slice(-56);

  // Ratio by weekday over the last 8 weeks.
  const byWeekday: number[][] = [[], [], [], [], [], [], []];
  for (const log of last56) {
    const r = dailyRatio(log);
    if (r !== null && Number.isFinite(r)) {
      byWeekday[new Date(log.log_date + "T00:00:00").getDay()].push(r);
    }
  }
  const weekdayData = WEEKDAY_LABELS.map((label, i) => ({
    day: label,
    ratio: byWeekday[i].length
      ? Math.round((byWeekday[i].reduce((s, v) => s + v, 0) / byWeekday[i].length) * 100) / 100
      : 0,
  }));

  // Ratio by distance to the next exam (buckets).
  const examDates = exams
    .map((e) => new Date(e.exam_date + "T00:00:00").getTime())
    .sort((a, b) => a - b);
  const buckets: Record<string, number[]> = { "0-2 days": [], "3-7 days": [], "8+ days": [] };
  for (const log of last56) {
    const r = dailyRatio(log);
    if (r === null || !Number.isFinite(r)) continue;
    const logTime = new Date(log.log_date + "T00:00:00").getTime();
    const nextExam = examDates.find((t) => t >= logTime);
    if (nextExam === undefined) continue;
    const daysTo = Math.floor((nextExam - logTime) / 86_400_000);
    const bucket = daysTo <= 2 ? "0-2 days" : daysTo <= 7 ? "3-7 days" : "8+ days";
    buckets[bucket].push(r);
  }
  const examData = Object.entries(buckets).map(([bucket, ratios]) => ({
    bucket,
    ratio: ratios.length
      ? Math.round((ratios.reduce((s, v) => s + v, 0) / ratios.length) * 100) / 100
      : 0,
  }));

  const hasExamData = Object.values(buckets).some((b) => b.length > 0);

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-sm font-semibold">Average ratio by weekday (last 8 weeks)</p>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#24304d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#8fa3c0", fontSize: 11 }} />
              <YAxis tick={{ fill: "#8fa3c0", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#121c31", border: "1px solid #24304d", borderRadius: 8 }}
                formatter={(value: number) => [`${value}:1`, "Avg ratio"]}
              />
              <Bar dataKey="ratio" fill="#4f8cff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {hasExamData && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-sm font-semibold">Ratio by days until the next exam</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={examData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#24304d" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fill: "#8fa3c0", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8fa3c0", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#121c31", border: "1px solid #24304d", borderRadius: 8 }}
                  formatter={(value: number) => [`${value}:1`, "Avg ratio"]}
                />
                <Bar dataKey="ratio" fill="#f5b83d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
