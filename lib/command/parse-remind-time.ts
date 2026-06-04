import { addDays, addHours, setHours, setMinutes, startOfTomorrow } from "date-fns";

/**
 * Rule-based reminder time parser (no AI).
 * Examples: "tomorrow 9am", "in 2 hours", "tonight", "9pm"
 */
export function parseRemindTime(text: string): Date | null {
  const lower = text.toLowerCase().trim();
  const now = new Date();

  const inHoursMatch = lower.match(/\bin\s+(\d+)\s*h(?:our)?s?\b/);
  if (inHoursMatch) {
    return addHours(now, Number(inHoursMatch[1]));
  }

  if (/\btonight\b/.test(lower)) {
    const d = new Date(now);
    return setMinutes(setHours(d, 20), 0);
  }

  if (/\btomorrow\b/.test(lower)) {
    let d = startOfTomorrow();
    const ampm = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    if (ampm) {
      let hour = Number(ampm[1]);
      const minute = ampm[2] ? Number(ampm[2]) : 0;
      if (ampm[3] === "pm" && hour < 12) hour += 12;
      if (ampm[3] === "am" && hour === 12) hour = 0;
      d = setMinutes(setHours(d, hour), minute);
    } else {
      d = setMinutes(setHours(d, 9), 0);
    }
    return d;
  }

  const timeOnly = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (timeOnly) {
    let hour = Number(timeOnly[1]);
    const minute = timeOnly[2] ? Number(timeOnly[2]) : 0;
    if (timeOnly[3] === "pm" && hour < 12) hour += 12;
    if (timeOnly[3] === "am" && hour === 12) hour = 0;
    const d = new Date(now);
    const candidate = setMinutes(setHours(d, hour), minute);
    if (candidate <= now) {
      return addDays(candidate, 1);
    }
    return candidate;
  }

  return null;
}

export function stripTimePhrases(title: string): string {
  return title
    .replace(/\bin\s+\d+\s*h(?:our)?s?\b/gi, "")
    .replace(/\btonight\b/gi, "")
    .replace(/\btomorrow\b/gi, "")
    .replace(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
