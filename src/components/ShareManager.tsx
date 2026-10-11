"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ShareView {
  id: string;
  viewer_email: string | null;
  token: string;
  created_at: string;
  revoked_at: string | null;
}

export default function ShareManager({ shares }: { shares: ShareView[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [viewerEmail, setViewerEmail] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ viewer_email: viewerEmail || null }),
    });
    setCreating(false);
    if (res.ok) {
      setViewerEmail("");
      router.refresh();
    }
  }

  async function revoke(id: string) {
    await fetch("/api/share", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const active = shares.filter((s) => !s.revoked_at);

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">Parent / advisor sharing</p>
        <p className="mt-1 text-xs text-muted">
          Opt-in and student-controlled. Viewers see a read-only summary, never your raw
          logs. You can revoke access at any time.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={viewerEmail}
          onChange={(e) => setViewerEmail(e.target.value)}
          placeholder="Viewer email (optional)"
          className="flex-1 min-w-40 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={create}
          disabled={creating}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create share link"}
        </button>
      </div>

      {active.length > 0 && (
        <ul className="grid gap-2">
          {active.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="truncate text-muted">
                {s.viewer_email ?? "Anyone with the link"}
              </span>
              <span className="flex gap-2">
                <button onClick={() => copyLink(s.token)} className="text-xs text-accent hover:underline">
                  {copied === s.token ? "Copied!" : "Copy link"}
                </button>
                <button onClick={() => revoke(s.id)} className="text-xs text-danger hover:underline">
                  Revoke
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
