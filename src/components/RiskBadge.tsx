import type { RiskAssessment, RiskLevel } from "@/lib/types";
import { formatRatio } from "@/lib/ratio";

const STYLES: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Low risk", className: "bg-success/15 text-success border-success/40" },
  moderate: { label: "Moderate risk", className: "bg-warning/15 text-warning border-warning/40" },
  high: { label: "High risk", className: "bg-danger/15 text-danger border-danger/40" },
};

export default function RiskBadge({ assessment }: { assessment: RiskAssessment }) {
  const style = STYLES[assessment.level];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${style.className}`}>
          {style.label}
        </span>
        <span className="text-2xl font-bold">{formatRatio(assessment.ratio)}</span>
      </div>
      <p className="mt-3 text-sm text-muted">{assessment.reason}</p>
      <p className="mt-2 text-xs text-muted/70">
        {assessment.source === "ml" ? "ML model" : "Rules-based signal"} · confidence{" "}
        {Math.round(assessment.confidence * 100)}% · 7-day rolling ratio
      </p>
    </div>
  );
}
