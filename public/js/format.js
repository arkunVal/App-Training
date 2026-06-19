// Kleine, reine Formatierungsfunktionen für Anzeige-Zwecke (deutsch).

export function formatMinutes(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined) return "–";
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function formatSleep(totalMinutes) {
  if (!totalMinutes) return "–";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}min`;
}

export function formatDistanceKm(km) {
  if (km === null || km === undefined) return "–";
  return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(2)} km`;
}

export function formatSecondsAsClock(totalSeconds) {
  if (!totalSeconds) return "–";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatMmSs(totalSeconds) {
  if (!totalSeconds) return "";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Parst "5:30" oder "330" zu Sekunden. Gibt null bei ungültiger Eingabe zurück. */
export function parseMmSs(input) {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.includes(":")) {
    const [mPart, sPart] = trimmed.split(":");
    const m = Number(mPart);
    const s = Number(sPart);
    if (Number.isNaN(m) || Number.isNaN(s)) return null;
    return m * 60 + s;
  }
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

export function minutesFromHm(hours, minutes) {
  return hours * 60 + minutes;
}

export function hmFromMinutes(totalMinutes) {
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
