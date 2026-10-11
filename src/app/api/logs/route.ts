import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runRiskPipeline } from "@/lib/alerts";
import type { DailyLog } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface IncomingEntry {
  log_date: string;
  game_hours: number;
  study_hours: number;
  notes?: string | null;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const days = Math.min(90, Number(new URL(request.url).searchParams.get("days")) || 28);
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_logs")
    .select("id, user_id, log_date, game_hours, study_hours, source, notes")
    .eq("user_id", user.id)
    .gte("log_date", since)
    .order("log_date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { entries?: IncomingEntry[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const entries = (body.entries ?? []).filter(
    (e) =>
      ISO_DATE.test(e.log_date) &&
      Number.isFinite(Number(e.game_hours)) &&
      Number.isFinite(Number(e.study_hours))
  );
  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid entries provided" }, { status: 400 });
  }

  const oldest = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
  const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  for (const e of entries) {
    if (e.log_date < oldest || e.log_date >= future) {
      return NextResponse.json(
        { error: `Date ${e.log_date} is outside the editable window (past 14 days)` },
        { status: 400 }
      );
    }
  }

  const rows = entries.map((e) => ({
    user_id: user.id,
    log_date: e.log_date,
    game_hours: Math.min(24, Math.max(0, Number(e.game_hours))),
    study_hours: Math.min(24, Math.max(0, Number(e.study_hours))),
    source: "manual" as const,
    notes: e.notes?.toString().slice(0, 500) ?? null,
  }));

  const { error } = await supabase
    .from("daily_logs")
    .upsert(rows, { onConflict: "user_id,log_date" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Re-run the risk pipeline on the updated history.
  const since = new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10);
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("id, user_id, log_date, game_hours, study_hours, source, notes")
    .eq("user_id", user.id)
    .gte("log_date", since)
    .order("log_date");

  const assessment = await runRiskPipeline(supabase, user.id, (logs ?? []) as unknown as DailyLog[]);
  return NextResponse.json({ ok: true, assessment });
}
