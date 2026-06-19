// Datum-/Wochen-/Monats-Hilfsfunktionen, komplett ohne externe Bibliothek
// (reines Vanilla-JS mit der nativen Date-API). Daten werden überall als
// "YYYY-MM-DD"-String in lokaler Zeit gehandhabt, nie als UTC, damit es
// keine Zeitzonen-Verschiebungen gibt.

function pad(n) {
  return n.toString().padStart(2, "0");
}

export function toIso(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso() {
  return toIso(new Date());
}

export function isTodayIso(iso) {
  return iso === todayIso();
}

export function isPastIso(iso) {
  return parseIso(iso) < parseIso(todayIso());
}

export function addDaysIso(iso, amount) {
  const d = parseIso(iso);
  d.setDate(d.getDate() + amount);
  return toIso(d);
}

export function addWeeksIso(iso, amount) {
  return addDaysIso(iso, amount * 7);
}

export function addMonthsIso(iso, amount) {
  const d = parseIso(iso);
  d.setMonth(d.getMonth() + amount);
  return toIso(d);
}

/** Montag (0 = Montag) der Woche, in der `iso` liegt. */
export function weekStartIso(iso) {
  const d = parseIso(iso);
  const dayIdx = (d.getDay() + 6) % 7; // 0 = Montag ... 6 = Sonntag
  d.setDate(d.getDate() - dayIdx);
  return toIso(d);
}

/** 7 ISO-Daten von Montag bis Sonntag für die Woche von `iso`. */
export function weekDaysIso(iso) {
  const start = weekStartIso(iso);
  return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
}

export function daysUntil(iso) {
  const today = parseIso(todayIso());
  const target = parseIso(iso);
  return Math.round((target - today) / 86400000);
}

const MONTH_LABELS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
export function monthLabel(monthIndex) {
  return MONTH_LABELS[monthIndex];
}

const WEEKDAY_LABELS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export function weekdayShort(iso) {
  const idx = (parseIso(iso).getDay() + 6) % 7;
  return WEEKDAY_LABELS_SHORT[idx];
}

const WEEKDAY_LABELS_LONG = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag",
];
export function weekdayLong(iso) {
  const idx = (parseIso(iso).getDay() + 6) % 7;
  return WEEKDAY_LABELS_LONG[idx];
}

export function formatDayMonth(iso) {
  const d = parseIso(iso);
  return `${d.getDate()}. ${monthLabel(d.getMonth())}`;
}

export function formatWeekRangeLabel(weekStart) {
  const start = parseIso(weekStart);
  const end = addDaysIso(weekStart, 6);
  const endDate = parseIso(end);
  if (start.getMonth() === endDate.getMonth()) {
    return `${start.getDate()}.–${endDate.getDate()}. ${monthLabel(endDate.getMonth())} ${endDate.getFullYear()}`;
  }
  return `${start.getDate()}. ${monthLabel(start.getMonth())} – ${endDate.getDate()}. ${monthLabel(endDate.getMonth())} ${endDate.getFullYear()}`;
}

/** 6x7-Raster für eine Monatsübersicht, beginnend am Montag. */
export function monthGrid(iso) {
  const ref = parseIso(iso);
  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const gridStart = parseIso(weekStartIso(toIso(monthStart)));

  const weeks = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        dateIso: toIso(cursor),
        inCurrentMonth: cursor >= monthStart && cursor <= monthEnd,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor > monthEnd && w >= 3) break;
  }
  return weeks;
}
