export default function RecommendationCard({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
      <p className="text-sm font-semibold text-accent">Suggestion</p>
      <p className="mt-1 text-sm">{text}</p>
      <p className="mt-2 text-xs text-muted/70">
        Based only on your own logged history.
      </p>
    </div>
  );
}
