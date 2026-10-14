/** The shop counts days in its own time zone, as the backend does (order.statistics.zone). */
export const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Most days of a daily chart, and most months of a monthly one; the backend refuses more. */
export const MAX_DAILY_RANGE_DAYS = 366;
export const MAX_MONTHLY_RANGE_MONTHS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The day of an instant in the shop time zone, as yyyy-MM-dd. */
export function shopDay(instant: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {timeZone: SHOP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"}).format(instant);
}

/** The day `days` before the given yyyy-MM-dd day. */
export function daysBefore(day: string, days: number) {
  const base = Date.parse(`${day}T00:00:00Z`);
  return new Date(base - days * DAY_MS).toISOString().slice(0, 10);
}

/** Days from `from` to `to`, both counted. */
export function daysInRange(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

/** Months from the month of `from` to the month of `to`, both counted: a month is taken whole. */
export function monthsInRange(from: string, to: string) {
  return (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7)) + 1;
}

export type RangeProblem = "order" | "tooLong";

/** What the backend would refuse in a chart range, found before asking it. */
export function rangeProblem(from: string, to: string, granularity: "DAY" | "MONTH"): RangeProblem | undefined {
  if (from > to) return "order";
  const tooLong = granularity === "DAY"
    ? daysInRange(from, to) > MAX_DAILY_RANGE_DAYS
    : monthsInRange(from, to) > MAX_MONTHLY_RANGE_MONTHS;
  return tooLong ? "tooLong" : undefined;
}
