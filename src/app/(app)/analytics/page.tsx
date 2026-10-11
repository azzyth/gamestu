import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import ExamForm from "@/components/ExamForm";
import type { DailyLog, Exam } from "@/lib/types";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date(Date.now() - 56 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: logs }, { data: exams }] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("id, user_id, log_date, game_hours, study_hours, source, notes")
      .eq("user_id", user.id)
      .gte("log_date", since)
      .order("log_date"),
    supabase
      .from("exams")
      .select("id, subject, exam_date")
      .eq("user_id", user.id)
      .order("exam_date"),
  ]);

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-xl font-bold">Patterns</h1>
        <p className="text-sm text-muted">Understand why, not just that.</p>
      </header>
      <AnalyticsCharts
        logs={(logs ?? []) as unknown as DailyLog[]}
        exams={(exams ?? []) as unknown as Exam[]}
      />
      <ExamForm exams={(exams ?? []) as unknown as Exam[]} />
    </div>
  );
}
