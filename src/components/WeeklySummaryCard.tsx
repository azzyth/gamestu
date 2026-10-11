import type { WeeklySummary } from "@/lib/types";

export default function WeeklySummaryCard({ summary }: { summary: WeeklySummary | null }) {
  if (!summary) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-accent">This week's recap</p>
      <p className="mt-1 text-sm">{summary.summary}</p>
      <p className="mt-2 text-xs text-muted">
        {summary.game_hours}h gaming · {summary.study_hours}h studying
      </p>
    </div>
  );
}
