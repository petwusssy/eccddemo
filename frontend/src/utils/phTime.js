/**
 * Philippine Standard Time (PST / PHT - Asia/Manila, UTC+8) Utilities
 * Republic Act No. 10535 - Philippine Standard Time Act
 */

const PHT_TIMEZONE = 'Asia/Manila';

/**
 * Returns YYYY-MM-DD in Philippine Time (Asia/Manila, UTC+8).
 * Avoids UTC day-shift bugs when calling toISOString() between 00:00 and 08:00 PHT.
 * @param {Date|string|number} [dateInput]
 * @returns {string} e.g. "2026-10-04"
 */
export function getPhilippinesDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PHT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

/**
 * Returns ISO-like string strictly in Philippine Time with +08:00 offset or PHT representation.
 * @param {Date|string|number} [dateInput]
 * @returns {string} e.g. "2026-10-04T23:51:00+08:00"
 */
export function getPhilippinesDateTime(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString();
  
  // Format parts in Asia/Manila
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: PHT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;
}

/**
 * Format date for display in Philippine Time
 * @param {Date|string|number} dateInput 
 * @param {'short'|'medium'|'long'|'full'} [style='medium'] 
 * @returns {string} e.g. "Oct 4, 2026"
 */
export function formatPHTDate(dateInput, style = 'medium') {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const options = {
    timeZone: PHT_TIMEZONE,
    year: 'numeric',
    month: style === 'short' ? 'numeric' : (style === 'long' || style === 'full' ? 'long' : 'short'),
    day: 'numeric'
  };

  return new Intl.DateTimeFormat('en-PH', options).format(d);
}

/**
 * Format date and time for display in Philippine Time
 * @param {Date|string|number} dateInput 
 * @param {boolean} [includeSeconds=false]
 * @returns {string} e.g. "Oct 4, 2026, 11:51 PM"
 */
export function formatPHTDateTime(dateInput, includeSeconds = false) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: PHT_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true
  }).format(d);
}

/**
 * Format time only in Philippine Time
 * @param {Date|string|number} dateInput 
 * @param {boolean} [includeSeconds=true]
 * @returns {string} e.g. "11:51:22 PM"
 */
export function formatPHTTime(dateInput, includeSeconds = true) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-PH', {
    timeZone: PHT_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true
  }).format(d);
}

/**
 * Add days to a date in Philippine Time and return YYYY-MM-DD
 * @param {number} days 
 * @param {Date|string|number} [dateInput] 
 * @returns {string} YYYY-MM-DD
 */
export function addDaysPHT(days, dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  d.setDate(d.getDate() + days);
  return getPhilippinesDate(d);
}

/**
 * Calculate difference in calendar days based on Philippine Time midnights
 * @param {string|Date} dateInput 
 * @returns {number} days ago (positive if past, negative if future)
 */
export function getDaysAgoPHT(dateInput) {
  if (!dateInput) return 0;
  const todayPHT = getPhilippinesDate();
  const targetPHT = getPhilippinesDate(dateInput);
  
  const d1 = new Date(todayPHT + 'T00:00:00+08:00');
  const d2 = new Date(targetPHT + 'T00:00:00+08:00');
  
  const diffMs = d1.getTime() - d2.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
