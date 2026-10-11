import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export function pushConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/** Send a web push to every registered device of a user. Removes dead subscriptions. */
export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: { title: string; body: string }
): Promise<void> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@gamestu.app", pub, priv);

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys_p256dh, keys_auth")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return;

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint as string,
            keys: { p256dh: sub.keys_p256dh as string, auth: sub.keys_auth as string },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    })
  );
}

/** Send an email via Resend. Returns false when unconfigured so callers can skip silently. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const from = process.env.SUMMARY_EMAIL_FROM || "onboarding@resend.dev";
    await resend.emails.send({ from, to, subject, html });
    return true;
  } catch {
    return false;
  }
}
