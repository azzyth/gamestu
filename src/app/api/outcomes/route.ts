import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TRENDS = new Set(["improved", "stable", "declined"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { term?: string; subject?: string; grade?: string; grade_trend?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body.term?.trim() ||
    !body.subject?.trim() ||
    !body.grade?.trim() ||
    !TRENDS.has(body.grade_trend ?? "")
  ) {
    return NextResponse.json({ error: "term, subject, grade and a valid trend are required" }, { status: 400 });
  }

  const { error } = await supabase.from("grade_outcomes").insert({
    user_id: user.id,
    term: body.term.trim().slice(0, 100),
    subject: body.subject.trim().slice(0, 100),
    grade: body.grade.trim().slice(0, 20),
    grade_trend: body.grade_trend,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
