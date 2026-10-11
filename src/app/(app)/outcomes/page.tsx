import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OutcomeForm from "@/components/OutcomeForm";

export default async function OutcomesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: outcomes } = await supabase
    .from("grade_outcomes")
    .select("id, term, subject, grade, grade_trend, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-xl font-bold">Grade outcomes</h1>
        <p className="text-sm text-muted">
          The missing half of the prediction: what actually happened. Your
          self-reports turn the proxy signal into a real model.
        </p>
      </header>
      <OutcomeForm existing={(outcomes ?? []) as never[]} />
    </div>
  );
}
