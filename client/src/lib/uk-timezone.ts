import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import type { Competition } from '@shared/schema';

const UK_TIMEZONE = 'Europe/London';

/**
 * Get the current date and time in UK timezone
 * Returns a Date object representing the current moment, which can be compared with other Date objects
 */
export function getUKNow(): Date {
  return new Date();
}

/**
 * Convert a date string and time string (in UK timezone) to a UTC Date object
 * @param date - Date string in YYYY-MM-DD format (interpreted as UK date)
 * @param time - Time string in HH:MM format (24-hour, interpreted as UK time)
 * @returns Date object in UTC that represents the given UK local time
 */
export function toUKDateTime(date: string, time: string = '00:00'): Date {
  // Ensure time is in HH:MM format
  const timeParts = time.split(':');
  if (timeParts.length !== 2) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
  }
  
  // Create a date string in ISO format (UK local time)
  const dateTimeString = `${date}T${time}:00`;
  
  // Parse this as UK local time and convert to UTC
  // fromZonedTime treats the input as being in the specified timezone
  const utcDate = fromZonedTime(dateTimeString, UK_TIMEZONE);
  
  return utcDate;
}

/**
 * Format a date for display in UK timezone
 * @param date - Date object
 * @param formatString - Format string (date-fns format)
 * @returns Formatted date string in UK timezone
 */
export function formatUKDate(date: Date, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return format(toZonedTime(date, UK_TIMEZONE), formatString, { timeZone: UK_TIMEZONE });
}

/**
 * Calculate competition status based on UK timezone
 * @param competition - Competition object with date, time, endDate, endTime
 * @returns Competition status: "upcoming", "live", or "completed"
 */
export function getCompetitionStatus(
  competition: Competition
): "upcoming" | "live" | "completed" {
  // Get current time (UTC)
  const now = new Date();
  
  // Parse start date and time (stored as UK local time, convert to UTC)
  const startDateTime = toUKDateTime(competition.date, competition.time || '00:00');
  
  // Calculate end date and time (stored as UK local time, convert to UTC)
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
  
  // Debug logging with UK timezone formatting
  console.log('[UK TIMEZONE DEBUG]', {
    competitionName: competition.name,
    storedDate: competition.date,
    storedTime: competition.time,
    storedEndDate: competition.endDate,
    storedEndTime: competition.endTime,
    currentTimeUTC: now.toISOString(),
    currentTimeUK: formatUKDate(now, 'yyyy-MM-dd HH:mm:ss'),
    startDateTimeUTC: startDateTime.toISOString(),
    startDateTimeUK: formatUKDate(startDateTime, 'yyyy-MM-dd HH:mm:ss'),
    endDateTimeUTC: endDateTime.toISOString(),
    endDateTimeUK: formatUKDate(endDateTime, 'yyyy-MM-dd HH:mm:ss'),
    comparison: {
      'now < start': now < startDateTime,
      'now >= start && now <= end': now >= startDateTime && now <= endDateTime,
      'now > end': now > endDateTime,
    },
    nowMillis: now.getTime(),
    startMillis: startDateTime.getTime(),
    endMillis: endDateTime.getTime(),
  });
  
  // Determine status based on UTC time comparison
  if (now < startDateTime) {
    return "upcoming";
  } else if (now >= startDateTime && now <= endDateTime) {
    return "live";
  } else {
    return "completed";
  }
}
