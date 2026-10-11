import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assessRisk } from "@/lib/risk-model";
import { buildRecommendation } from "@/lib/recommendations";
import { computeWeeklySummary, weekStartDate } from "@/lib/weekly-summary";
import RiskBadge from "@/components/RiskBadge";
import RatioChart from "@/components/RatioChart";
import AlertsList from "@/components/AlertsList";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";
import RecommendationCard from "@/components/RecommendationCard";
import GoalProgress from "@/components/GoalProgress";
import type { Alert, DailyLog, Exam, Goal } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: logs }, { data: alerts }, { data: goals }, { data: exams }] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("id, user_id, log_date, game_hours, study_hours, source, notes")
      .eq("user_id", user.id)
      .gte("log_date", since)
      .order("log_date"),
    supabase
      .from("alerts")
      .select("id, type, message, created_at, acknowledged_at")
      .eq("user_id", user.id)
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("goals")
      .select("id, target_ratio, target_study_hours, active_from")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("exams")
      .select("id, subject, exam_date")
      .eq("user_id", user.id)
      .gte("exam_date", new Date().toISOString().slice(0, 10)),
  ]);

  const dailyLogs = (logs ?? []) as unknown as DailyLog[];
  const assessment = assessRisk(dailyLogs);
  const thisWeek = computeWeeklySummary(dailyLogs, weekStartDate());
  const recommendation = buildRecommendation(dailyLogs, (exams ?? []) as unknown as Exam[], new Date());

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-xl font-bold">Your ratio</h1>
        <p className="text-sm text-muted">Last 4 weeks · updated as you log</p>
      </header>

      <AlertsList alerts={(alerts ?? []) as unknown as Alert[]} />
      <RiskBadge assessment={assessment} />
      <RatioChart logs={dailyLogs} />
      <GoalProgress goal={(goals as unknown as Goal) ?? null} logs={dailyLogs} />
      <WeeklySummaryCard summary={thisWeek} />
      <RecommendationCard text={recommendation} />
    </div>
  );
}
