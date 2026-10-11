import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GoalForm from "@/components/GoalForm";
import GoalProgress from "@/components/GoalProgress";
import type { DailyLog, Goal } from "@/lib/types";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: goals }, { data: logs }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, target_ratio, target_study_hours, active_from")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_logs")
      .select("id, user_id, log_date, game_hours, study_hours, source, notes")
      .eq("user_id", user.id)
      .gte("log_date", since)
      .order("log_date"),
  ]);

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-xl font-bold">Goals</h1>
        <p className="text-sm text-muted">A target makes the number mean something.</p>
      </header>
      <GoalProgress goal={(goals as unknown as Goal) ?? null} logs={(logs ?? []) as unknown as DailyLog[]} />
      <GoalForm current={(goals as unknown as Goal) ?? null} />
    </div>
  );
}
