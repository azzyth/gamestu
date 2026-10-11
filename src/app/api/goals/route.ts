import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { target_ratio?: number | null; target_study_hours?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const hasRatio = body.target_ratio != null && Number(body.target_ratio) > 0;
  const hasHours = body.target_study_hours != null && Number(body.target_study_hours) > 0;
  if (!hasRatio && !hasHours) {
    return NextResponse.json({ error: "Provide a target ratio or study hours" }, { status: 400 });
  }

  const { error: deactivateError } = await supabase
    .from("goals")
    .update({ active: false })
    .eq("user_id", user.id)
    .eq("active", true);
  if (deactivateError) return NextResponse.json({ error: deactivateError.message }, { status: 500 });

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    target_ratio: hasRatio ? Math.min(10, Number(body.target_ratio)) : null,
    target_study_hours: hasHours ? Math.min(16, Number(body.target_study_hours)) : null,
    active: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
