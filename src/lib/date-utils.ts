const US_STATE_TIMEZONES: Record<string, string> = {
  TX: "America/Chicago",
  IL: "America/Chicago",
  TN: "America/Chicago",
  MO: "America/Chicago",
  WI: "America/Chicago",
  MN: "America/Chicago",
  IA: "America/Chicago",
  KS: "America/Chicago",
  OK: "America/Chicago",
  AR: "America/Chicago",
  LA: "America/Chicago",
  MS: "America/Chicago",
  AL: "America/Chicago",
  NE: "America/Chicago",
  ND: "America/Chicago",
  SD: "America/Chicago",

  NY: "America/New_York",
  NJ: "America/New_York",
  PA: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  NC: "America/New_York",
  SC: "America/New_York",
  VA: "America/New_York",
  MD: "America/New_York",
  DE: "America/New_York",
  OH: "America/New_York",
  MI: "America/New_York",
  IN: "America/New_York",
  KY: "America/New_York",
  MA: "America/New_York",
  CT: "America/New_York",
  NH: "America/New_York",
  VT: "America/New_York",
  ME: "America/New_York",

  CO: "America/Denver",
  UT: "America/Denver",
  NM: "America/Denver",
  WY: "America/Denver",
  MT: "America/Denver",
  ID: "America/Denver",

  CA: "America/Los_Angeles",
  WA: "America/Los_Angeles",
  OR: "America/Los_Angeles",
  NV: "America/Los_Angeles",

  AZ: "America/Phoenix",
};

export function getTimezoneForState(state?: string): string {
  if (!state) return "America/Chicago";
  const st = state.trim().toUpperCase();
  return US_STATE_TIMEZONES[st] || "America/Chicago";
}

export function formatLoadTime(
  isoDate?: string,
  state: string = "TX"
): string {
  if (!isoDate) return "--:--";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;

  const tz = getTimezoneForState(state);

  const dateStr = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  });

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tz,
  });

  const tzName =
    tz === "America/Chicago"
      ? "CDT"
      : tz === "America/New_York"
      ? "EDT"
      : tz === "America/Los_Angeles"
      ? "PDT"
      : tz === "America/Denver"
      ? "MDT"
      : "CDT";

  return `${dateStr} • ${timeStr} ${tzName}`;
}
