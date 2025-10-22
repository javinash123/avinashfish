import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { Competition } from '@shared/schema';

const UK_TIMEZONE = 'Europe/London';

/**
 * Get the current date and time in UK timezone
 */
export function getUKNow(): Date {
  return toZonedTime(new Date(), UK_TIMEZONE);
}

/**
 * Convert a date string and time string to UK timezone Date object
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Optional time string in HH:MM format
 * @returns Date object in UK timezone
 */
export function toUKDateTime(date: string, time?: string): Date {
  const dateTimeString = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  // Parse as UK timezone and convert to Date
  return fromZonedTime(dateTimeString, UK_TIMEZONE);
}

/**
 * Calculate competition status based on UK timezone
 * @param competition - Competition object with date, time, endDate, endTime
 * @returns Competition status: "upcoming", "live", or "completed"
 */
export function getCompetitionStatus(
  competition: Competition
): "upcoming" | "live" | "completed" {
  const ukNow = getUKNow();
  
  // Parse start date and time in UK timezone
  const startDateTime = toUKDateTime(competition.date, competition.time);
  
  // Calculate end date and time
  let endDateTime: Date;
  if (competition.endDate && competition.endTime) {
    // Multi-day competition with specific end date and time
    endDateTime = toUKDateTime(competition.endDate, competition.endTime);
  } else if (competition.endDate) {
    // Multi-day competition without specific end time - use end of endDate
    endDateTime = toUKDateTime(competition.endDate, '23:59');
  } else if (competition.endTime) {
    // Same day competition with end time but no end date
    endDateTime = toUKDateTime(competition.date, competition.endTime);
  } else {
    // No end date or time specified - use end of start day (23:59:59)
    endDateTime = toUKDateTime(competition.date, '23:59');
  }
  
  // Determine status based on UK time
  if (ukNow < startDateTime) {
    return "upcoming";
  } else if (ukNow >= startDateTime && ukNow <= endDateTime) {
    return "live";
  } else {
    return "completed";
  }
}
