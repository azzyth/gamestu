"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EmailToggle({ initial }: { initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !value;
    await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weekly_summary_email: next }),
    });
    setValue(next);
    setSaving(false);
  }

  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>
        Weekly summary email
        <span className="block text-xs text-muted">A plain-language recap every Sunday.</span>
      </span>
      <button
        onClick={toggle}
        disabled={saving}
        className={`h-6 w-11 shrink-0 rounded-full transition ${value ? "bg-success" : "bg-border"} disabled:opacity-50`}
      >
        <span
          className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition ${value ? "translate-x-5.5" : ""}`}
        />
      </button>
    </label>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="truncate text-muted">{email ?? "Signed in"}</span>
      <button
        onClick={logout}
        className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium transition hover:bg-card"
      >
        Log out
      </button>
    </div>
  );
}
