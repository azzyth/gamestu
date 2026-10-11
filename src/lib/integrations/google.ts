const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const STUDY_PATTERN = /stud|class|lecture|homework|assignment|revision|reading|lab|tutorial|prep|exam/i;

export function googleAuthUrl(redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string | null;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
  const data = await res.json();
  return { access_token: data.access_token, refresh_token: data.refresh_token ?? null };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

interface CalendarEvent {
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

/**
 * Fetch events from the primary calendar for the last `days` days and sum the
 * durations of study-looking events per local calendar day (ISO date -> hours).
 */
export async function fetchStudyHoursByDate(
  accessToken: string,
  days: number
): Promise<Map<string, number>> {
  const timeMin = new Date(Date.now() - days * 86_400_000).toISOString();
  const timeMax = new Date().toISOString();
  const url = `${CALENDAR_EVENTS_URL}?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`;
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google Calendar error ${res.status}`);
  const data = await res.json();
  const byDate = new Map<string, number>();
  for (const event of (data.items ?? []) as CalendarEvent[]) {
    const text = `${event.summary ?? ""} ${event.description ?? ""}`;
    if (!STUDY_PATTERN.test(text)) continue;
    const startISO = event.start?.dateTime;
    const endISO = event.end?.dateTime;
    if (!startISO || !endISO) continue;
    const start = new Date(startISO);
    const end = new Date(endISO);
    const hours = (end.getTime() - start.getTime()) / 3_600_000;
    if (hours <= 0 || hours > 16) continue;
    const date = start.toISOString().slice(0, 10);
    byDate.set(date, (byDate.get(date) || 0) + hours);
  }
  return byDate;
}
