"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Outcome {
  id: string;
  term: string;
  subject: string;
  grade: string;
  grade_trend: string;
  created_at: string;
}

const TRENDS = ["improved", "stable", "declined"] as const;

export default function OutcomeForm({ existing }: { existing: Outcome[] }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [trend, setTrend] = useState<(typeof TRENDS)[number]>("stable");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/outcomes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ term, subject, grade, grade_trend: trend }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Couldn't save the outcome.");
      return;
    }
    setTerm("");
    setSubject("");
    setGrade("");
    setTrend("stable");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold">Report a grade outcome</p>
        <p className="text-xs text-muted">
          Self-reported outcomes train the real prediction model. Roughly once per term is plenty.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Term (e.g. Fall 2026)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            required
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Grade (e.g. B+)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={trend}
            onChange={(e) => setTrend(e.target.value as (typeof TRENDS)[number])}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {TRENDS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save outcome"}
        </button>
      </form>

      {existing.length > 0 && (
        <ul className="grid gap-1 rounded-xl border border-border bg-card p-4 text-sm">
          {existing.map((o) => (
            <li key={o.id} className="flex justify-between">
              <span>
                {o.term} · {o.subject} · {o.grade}
              </span>
              <span
                className={
                  o.grade_trend === "declined"
                    ? "text-danger"
                    : o.grade_trend === "improved"
                      ? "text-success"
                      : "text-muted"
                }
              >
                {o.grade_trend}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
