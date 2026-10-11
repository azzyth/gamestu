import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { assessRisk } from "@/lib/risk-model";
import { formatRatio } from "@/lib/ratio";
import { computeWeeklySummary, weekStartDate } from "@/lib/weekly-summary";
import RiskBadge from "@/components/RiskBadge";
import type { DailyLog, RiskLevel } from "@/lib/types";

interface ShareRow {
  user_id: string;
  revoked_at: string | null;
}

/**
 * Public, read-only parent/advisor view. Looks up the share token with the
 * service client (the viewer has no session), then renders aggregates only —
 * never raw logs.
 */
export default async function SharedViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: share } = await supabase
    .from("shared_views")
    .select("user_id, revoked_at")
    .eq("token", token)
    .maybeSingle<ShareRow>();

  if (!share || share.revoked_at) notFound();

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("log_date, game_hours, study_hours")
    .eq("user_id", share.user_id)
    .gte("log_date", since)
    .order("log_date");

  const dailyLogs = (logs ?? []) as unknown as DailyLog[];
  const assessment = assessRisk(dailyLogs);
  const safeAssessment = { ...assessment, level: assessment.level as RiskLevel };
  const thisWeek = computeWeeklySummary(dailyLogs, weekStartDate());
  const game = dailyLogs.reduce((s, l) => s + (Number(l.game_hours) || 0), 0);
  const study = dailyLogs.reduce((s, l) => s + (Number(l.study_hours) || 0), 0);

  return (
    <main className="mx-auto grid w-full max-w-2xl gap-4 px-4 py-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Shared summary
        </p>
        <h1 className="mt-1 text-xl font-bold">Game to Study Ratio — last 30 days</h1>
        <p className="mt-1 text-sm text-muted">
          A student chose to share this read-only overview with you. It shows
          aggregates only, no daily details, and they can revoke it at any time.
        </p>
      </header>

      <RiskBadge assessment={safeAssessment} />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{Math.round(game * 10) / 10}h</p>
          <p className="text-xs text-muted">gaming (30 days)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{Math.round(study * 10) / 10}h</p>
          <p className="text-xs text-muted">studying (30 days)</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-accent">This week</p>
        <p className="mt-1 text-sm">
          {thisWeek?.summary ?? "No hours logged this week."}
        </p>
        <p className="mt-2 text-xs text-muted">
          Current rolling ratio: {formatRatio(assessment.ratio)} · signal:{" "}
          {assessment.level} risk
        </p>
      </div>
    </main>
  );
}
