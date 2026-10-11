import type { DailyLog, Goal } from "@/lib/types";
import { formatRatio, rollingRatio } from "@/lib/ratio";

export default function GoalProgress({ goal, logs }: { goal: Goal | null; logs: DailyLog[] }) {
  if (!goal) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted">
          No goal set yet — pick a target ratio or daily study hours on the Goals tab.
        </p>
      </div>
    );
  }

  const { ratio, studyHours } = rollingRatio(logs, 7);
  const studyPerDay = Math.round((studyHours / 7) * 10) / 10;
  const pct =
    goal.target_ratio != null
      ? ratio !== null && Number.isFinite(ratio)
        ? Math.min(100, Math.round((goal.target_ratio / ratio) * 100))
        : ratio === null ? 0 : 100 // infinite ratio (zero study) = as bad as it gets... show 0 actually
      : Math.min(100, Math.round((studyPerDay / goal.target_study_hours!) * 100));
  const pctClamped =
    goal.target_ratio != null && ratio === Infinity ? 0 : pct;

  const label =
    goal.target_ratio != null
      ? `Target: ${goal.target_ratio}:1 or lower · currently ${formatRatio(ratio)}`
      : `Target: ${goal.target_study_hours}h study/day · currently ${studyPerDay}h`;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Goal progress</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-background">
        <div
          className={`h-full rounded-full transition-all ${
            pctClamped >= 100 ? "bg-success" : pctClamped >= 60 ? "bg-warning" : "bg-danger"
          }`}
          style={{ width: `${pctClamped}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-muted">{pctClamped}% of target</p>
    </div>
  );
}
