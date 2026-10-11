import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-10 px-6 py-16">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Game to Study Ratio
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight">
          Know where the line is before a bad grade tells you.
        </h1>
        <p className="mt-4 text-lg text-muted">
          Log your game and study hours. Get your ratio, a risk signal, and one alert when
          your trend crosses into dangerous territory. No lectures, just a number.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          ["Log in seconds", "Two numbers a day is all the app asks for."],
          ["See your ratio", "A clear trend line over the last few weeks."],
          ["Get the signal", "A low / moderate / high risk flag you can act on."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/signup"
          className="flex-1 rounded-xl bg-accent px-5 py-3 text-center font-semibold text-white transition hover:opacity-90"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="flex-1 rounded-xl border border-border px-5 py-3 text-center font-semibold transition hover:bg-card"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
