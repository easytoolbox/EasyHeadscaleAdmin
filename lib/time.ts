function pad(value: string | number) {
  return String(value).padStart(2, "0");
}

function getParts(value: string | Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  const parts = formatter.formatToParts(new Date(value));
  const entries = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: entries.year,
    month: entries.month,
    day: entries.day,
    hour: entries.hour,
    minute: entries.minute,
    second: entries.second
  };
}

export const timezoneOptions = [
  "UTC",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York"
] as const;

export function isValidTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function formatDateTime(value: string | Date, timeZone = "UTC") {
  const parts = getParts(value, timeZone);
  return `${parts.year}/${pad(parts.month)}/${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)} ${timeZone}`;
}

export function formatTime(value: string | Date, timeZone = "UTC") {
  const parts = getParts(value, timeZone);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}
