import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogForm from "@/components/LogForm";
import type { DailyLog } from "@/lib/types";

export default async function LogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("daily_logs")
    .select("id, user_id, log_date, game_hours, study_hours, source, notes")
    .eq("user_id", user.id)
    .gte("log_date", since)
    .order("log_date");

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-xl font-bold">Log your hours</h1>
        <p className="text-sm text-muted">
          Takes ten seconds. Decimal entries are fine — 1.5 means ninety minutes.
        </p>
      </header>
      <LogForm existingLogs={(data ?? []) as unknown as DailyLog[]} />
    </div>
  );
}
