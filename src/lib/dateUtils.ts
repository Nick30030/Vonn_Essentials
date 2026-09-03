/**
 * Date & Timezone utilities for localized order timestamps and receipts.
 * Accurately detects and formats customer-specific local time (e.g. Africa/Douala, America/Toronto, etc.)
 */

export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";
  } catch {
    return "America/Toronto";
  }
};

export const getTimezoneAbbreviation = (
  date: Date = new Date(),
  timeZone?: string,
  locale: string = "en-US"
): string => {
  try {
    const tz = timeZone || getUserTimezone();
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart ? tzPart.value : "";
  } catch {
    return "";
  }
};

export interface FormattedDateTimeResult {
  fullString: string;
  dateString: string;
  timeString: string;
  timezone: string;
  timezoneAbbr: string;
}

/**
 * Formats a Date or ISO timestamp in the specified timezone (or user local timezone)
 * with language localization (en / fr).
 *
 * Example:
 * In Cameroon (Africa/Douala): "3 sept. 2026 à 19:42 (Africa/Douala • WAT)"
 * In Canada (America/Toronto): "Sep 3, 2026, 1:42 PM (America/Toronto • EDT)"
 */
export const formatOrderDateTime = (
  dateInput: Date | string | number | undefined,
  targetTimezone?: string,
  language: "en" | "fr" = "en"
): FormattedDateTimeResult => {
  let date: Date;
  if (!dateInput) {
    date = new Date();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else {
    // Try to parse string
    const parsed = new Date(dateInput);
    date = isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  const tz = targetTimezone || getUserTimezone();
  const locale = language === "fr" ? "fr-CA" : "en-US";

  try {
    // Date part (e.g., "Sep 3, 2026" or "3 sept. 2026")
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const dateString = dateFormatter.format(date);

    // Time part (e.g., "19:42" or "7:42 PM")
    const timeFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: language === "en",
    });
    const timeString = timeFormatter.format(date);

    // Timezone Abbr (e.g., "WAT", "EDT", "GMT+1")
    const tzAbbr = getTimezoneAbbreviation(date, tz, locale);

    // Human-friendly combined display
    // e.g., "Sep 3, 2026, 7:42 PM (Africa/Douala)" or "3 sept. 2026 à 19:42 (Africa/Douala)"
    const connector = language === "fr" ? " à " : ", ";
    const tzSuffix = tzAbbr ? ` (${tz} • ${tzAbbr})` : ` (${tz})`;
    const fullString = `${dateString}${connector}${timeString}${tzSuffix}`;

    return {
      fullString,
      dateString,
      timeString,
      timezone: tz,
      timezoneAbbr: tzAbbr,
    };
  } catch (e) {
    console.warn("Date formatting error:", e);
    return {
      fullString: date.toLocaleString(locale),
      dateString: date.toLocaleDateString(locale),
      timeString: date.toLocaleTimeString(locale),
      timezone: tz,
      timezoneAbbr: "",
    };
  }
};
