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
 * @param time - Optional time string in HH:MM format (24-hour format)
 * @returns Date object representing the UK time
 */
export function toUKDateTime(date: string, time?: string): Date {
  // Create the datetime string in ISO format
  const dateTimeString = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  
  // Create a date object treating the input as UK local time
  // fromZonedTime creates a Date from a time value that is assumed to be in a given time zone
  const ukDateTime = fromZonedTime(dateTimeString, UK_TIMEZONE);
  
  return ukDateTime;
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
  
  // Debug logging
  console.log('[UK TIMEZONE DEBUG]', {
    competitionName: competition.name,
    storedDate: competition.date,
    storedTime: competition.time,
    storedEndDate: competition.endDate,
    storedEndTime: competition.endTime,
    ukNow: ukNow.toISOString(),
    startDateTime: startDateTime.toISOString(),
    endDateTime: endDateTime.toISOString(),
    comparison: {
      'ukNow < startDateTime': ukNow < startDateTime,
      'ukNow >= startDateTime': ukNow >= startDateTime,
      'ukNow <= endDateTime': ukNow <= endDateTime,
    }
  });
  
  // Determine status based on UK time
  if (ukNow < startDateTime) {
    return "upcoming";
  } else if (ukNow >= startDateTime && ukNow <= endDateTime) {
    return "live";
  } else {
    return "completed";
  }
}
