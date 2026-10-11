"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/** Registers the service worker and offers push opt-in (rendered inside Settings). */
export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

export function PushEnableButton() {
  const [state, setState] = useState<"idle" | "working" | "on" | "unsupported">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "idle"))
      .catch(() => setState("idle"));
  }, []);

  async function enablePush() {
    const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!pubKey) {
      setState("unsupported");
      return;
    }
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("idle");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pubKey) as BufferSource,
        });
      }
      const supabase = createClient();
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            endpoint: sub.endpoint,
            keys_p256dh: (sub.toJSON().keys as { p256dh: string }).p256dh,
            keys_auth: (sub.toJSON().keys as { auth: string }).auth,
          },
          { onConflict: "endpoint" }
        );
      if (error) throw error;
      setState("on");
    } catch {
      setState("idle");
    }
  }

  if (state === "on") {
    return (
      <p className="text-sm text-success">
        Push alerts are enabled on this device. You'll get one when your risk level rises.
      </p>
    );
  }
  if (state === "unsupported") {
    return (
      <p className="text-sm text-muted">
        Push notifications aren't available in this browser, or aren't configured on
        the server yet.
      </p>
    );
  }
  return (
    <button
      onClick={enablePush}
      disabled={state === "working"}
      className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-card disabled:opacity-50"
    >
      {state === "working" ? "Enabling…" : "Enable push alerts"}
    </button>
  );
}
