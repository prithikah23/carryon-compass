export function fmtWeight(g: number): string {
  const v = Math.round(Math.abs(g));
  if (v < 1000) return `${v} g`;
  return `${(v / 1000).toFixed(1).replace(/\.0$/, "")} kg`;
}

export function fmtVolume(l: number): string {
  const v = Math.abs(l);
  return `${(Math.round(v * 10) / 10).toString()} L`;
}

export function parseDate(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

export function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(s: string, n: number): string {
  return toISO(parseDate(s) + n * 86400000);
}

export function fmtDay(s: string): string {
  return new Date(parseDate(s)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function fmtShort(s: string): string {
  return new Date(parseDate(s)).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
}

export function listJoin(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
