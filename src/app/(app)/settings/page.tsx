import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PushEnableButton } from "@/components/PwaRegister";
import { EmailToggle, LogoutButton } from "@/components/SettingsControls";
import ShareManager from "@/components/ShareManager";
import SteamForm from "@/components/SteamForm";
import GoogleConnectButton from "@/components/GoogleConnectButton";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: integrations }, { data: shares }] = await Promise.all([
    supabase
      .from("profiles")
      .select("weekly_summary_email, benchmarking_opt_in")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("integrations")
      .select("provider, data")
      .eq("user_id", user.id),
    supabase
      .from("shared_views")
      .select("id, viewer_email, token, created_at, revoked_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const steamData = integrations?.find((i) => i.provider === "steam")?.data as
    | { steamId?: string }
    | undefined;
  const googleConnected = integrations?.some((i) => i.provider === "google_calendar");

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <section className="grid gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Notifications</p>
        <EmailToggle initial={profile?.weekly_summary_email ?? true} />
        <div>
          <p className="text-sm">Push alerts</p>
          <div className="mt-1">
            <PushEnableButton />
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <p className="text-sm font-semibold">Integrations</p>
        <SteamForm connectedSteamId={steamData?.steamId ?? null} />
        <GoogleConnectButton connected={!!googleConnected} />
      </section>

      <section className="grid gap-3">
        <p className="text-sm font-semibold">Model training</p>
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
          <p>
            Report how your grades actually went — self-reported outcomes are what turn
            the proxy signal into a real prediction model.
          </p>
          <Link href="/outcomes" className="mt-2 inline-block text-accent hover:underline">
            Report a grade outcome →
          </Link>
        </div>
      </section>

      <ShareManager shares={(shares ?? []) as never[]} />

      <section className="grid gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Account</p>
        <LogoutButton />
      </section>
    </div>
  );
}
