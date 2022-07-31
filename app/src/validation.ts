import { DateTime } from "luxon";

export function dateTimeAreInFuture(
  timeZone: string,
  date: string,
  time: string
) {
  const dateTime = DateTime.fromISO(time ? date + "T" + time : date, {
    zone: timeZone,
  });
  return dateTime > DateTime.now();
}
