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
    <main className="relative min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative hero-glow grid-pattern">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-1.5 text-sm text-muted">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Track your ratio. Know your risk.
            </div>

            <h1 className="max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Know where the line is{" "}
              <span className="gradient-text">before a bad grade tells you.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-muted sm:text-xl">
              Log your game and study hours. Get your ratio, a risk signal, and one alert when your
              trend crosses into dangerous territory. No lectures, just a number.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-full bg-accent px-8 py-4 text-center text-base font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-8 py-4 text-center text-base font-semibold transition-all hover:border-accent hover:bg-surface"
              >
                Log in
              </Link>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. Takes 30 seconds to set up.
            </p>
          </div>

          {/* Stats Row */}
          <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: "2", label: "Numbers a day", suffix: "" },
              { value: "3", label: "Risk levels", suffix: "" },
              { value: "1", label: "Alert when it matters", suffix: "" },
              { value: "0", label: "Lectures given", suffix: "" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border-subtle bg-surface/50 p-6 text-center backdrop-blur-sm"
              >
                <div className="text-3xl font-bold gradient-text sm:text-4xl">
                  {stat.value}
                  {stat.suffix}
                </div>
                <div className="mt-2 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-t border-border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="mb-16 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps. No complexity.
            </h2>
            <p className="mt-4 text-lg text-muted">
              The app asks for two numbers a day. Everything else is automatic.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Log in seconds",
                body: "Two numbers a day is all the app asks for. Game hours and study hours. That's it.",
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
                title: "See your ratio",
                body: "A clear trend line over the last few weeks. Watch your pattern emerge from the numbers.",
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                ),
                title: "Get the signal",
                body: "A low / moderate / high risk flag you can act on. One alert when your trend crosses into dangerous territory.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border-subtle bg-card p-8 card-lift"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Levels Section */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-accent">
                Risk signal
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Know before your GPA does.
              </h2>
              <p className="mt-4 text-lg text-muted">
                Three clear levels. No ambiguity. No lectures. Just a number that tells you when to
                put the controller down.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    level: "Low",
                    color: "bg-success",
                    text: "text-success",
                    desc: "Your ratio is healthy. Keep going.",
                  },
                  {
                    level: "Moderate",
                    color: "bg-warning",
                    text: "text-warning",
                    desc: "Trending up. Time to check in.",
                  },
                  {
                    level: "High",
                    color: "bg-danger",
                    text: "text-danger",
                    desc: "Crossing the line. Act now.",
                  },
                ].map((risk) => (
                  <div
                    key={risk.level}
                    className="flex items-center gap-4 rounded-xl border border-border-subtle bg-card p-4"
                  >
                    <div className={`h-3 w-3 rounded-full ${risk.color}`} />
                    <div>
                      <span className={`font-semibold ${risk.text}`}>{risk.level}</span>
                      <span className="ml-2 text-sm text-muted">{risk.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-border-subtle bg-card p-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Game hours (7 days)</span>
                      <span className="font-semibold">14h</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border-subtle">
                      <div className="h-full w-[70%] rounded-full bg-danger" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Study hours (7 days)</span>
                      <span className="font-semibold">8h</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-border-subtle">
                      <div className="h-full w-[40%] rounded-full bg-accent" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-danger" />
                      <span className="font-semibold text-danger">High Risk</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Your game-to-study ratio is 1.75. Consider reducing gaming time this week.
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-accent/5 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t border-border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              What students say
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Real feedback from real players.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "Finally, my phone goes quiet. I got this after my gaming hours blew up every week. It pulls me back before it's too late.",
                name: "Rizky",
                role: "Computer Science, Semester 3",
              },
              {
                quote:
                  "Everyone should track their ratio. I didn't realize how casually I gave away study time. Worth every second of logging.",
                name: "Dinda",
                role: "Data Science, Semester 1",
              },
              {
                quote:
                  "I can't tell you the amount of stress that has been lifted. One number, one alert, and I know exactly when to stop gaming.",
                name: "Fajar",
                role: "Information Systems, Semester 5",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border-subtle bg-card p-8"
              >
                <div className="mb-4 text-accent">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
                <p className="text-sm leading-relaxed text-muted">{t.quote}</p>
                <div className="mt-6">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border-subtle">
        <div className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Questions? Answered.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does the risk signal work?",
                a: "The app calculates your game-to-study ratio over the last 7 days and flags it as low, moderate, or high risk. High risk means gaming is significantly outpacing studying.",
              },
              {
                q: "Do I need to log every day?",
                a: "Two numbers a day is all it asks for. Miss a day and the trend still works — it just uses what you've logged.",
              },
              {
                q: "Is my data private?",
                a: "Your logs are stored securely and only visible to you. No sharing, no selling, no lectures.",
              },
              {
                q: "Can I use this on my phone?",
                a: "Yes. The app is a PWA — install it from your browser and use it like a native app.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border-subtle bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-medium transition hover:text-accent">
                  {faq.q}
                  <svg
                    className="h-5 w-5 text-muted transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed text-muted">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative border-t border-border-subtle">
        <div className="absolute inset-0 hero-glow opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Start tracking your ratio{" "}
              <span className="gradient-text">today.</span>
            </h2>
            <p className="mt-4 text-lg text-muted">
              Free to use. No credit card. Takes 30 seconds to set up.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="rounded-full bg-accent px-8 py-4 text-base font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-8 py-4 text-base font-semibold transition-all hover:border-accent hover:bg-surface"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Game to Study Ratio</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 Game to Study Ratio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
