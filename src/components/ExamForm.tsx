"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Exam } from "@/lib/types";

export default function ExamForm({ exams }: { exams: Exam[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, exam_date: examDate }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Couldn't add the exam — check the date.");
      return;
    }
    setSubject("");
    setExamDate("");
    router.refresh();
  }

  async function removeExam(id: string) {
    await fetch("/api/exams", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  const upcoming = [...exams].sort((a, b) => a.exam_date.localeCompare(b.exam_date));

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Exam dates</p>
      <form onSubmit={addExam} className="flex flex-wrap gap-2">
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="flex-1 min-w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          required
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}
      {upcoming.length > 0 && (
        <ul className="grid gap-1">
          {upcoming.map((exam) => {
            const days = Math.ceil(
              (new Date(exam.exam_date + "T00:00:00").getTime() - Date.now()) / 86_400_000
            );
            return (
              <li key={exam.id} className="flex items-center justify-between text-sm">
                <span>
                  {exam.subject} ·{" "}
                  <span className="text-muted">
                    {days < 0 ? "past" : days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}
                  </span>
                </span>
                <button
                  onClick={() => removeExam(exam.id)}
                  className="text-xs text-muted hover:text-danger"
                >
                  remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
