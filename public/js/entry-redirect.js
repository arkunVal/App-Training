// Bestimmt, wohin ein eingeloggter Nutzer nach dem Login geleitet werden
// soll: erst das Profil anlegen (falls noch keins existiert), dann den
// Morgenbericht ausfüllen (falls heute noch keiner abgegeben wurde), sonst
// direkt zur Heute-Ansicht. Wird sowohl von index.html als auch von
// login.js verwendet, damit die Logik an genau einer Stelle lebt.
import { userDoc } from "./firestore-paths.js";
import { getDoc } from "./firestore.js";
import { todayIso } from "./date-utils.js";

const SKIP_KEY = "morningReportSkippedDate";

export async function resolveEntryDestination(uid) {
  const profileSnap = await getDoc(userDoc(uid, "profile", "main"));
  if (!profileSnap.exists() || !profileSnap.data().displayName) {
    return "onboarding.html";
  }

  const date = todayIso();
  let skippedToday = false;
  try {
    skippedToday = window.sessionStorage.getItem(SKIP_KEY) === date;
  } catch {
    /* sessionStorage evtl. nicht verfügbar, ignorieren */
  }

  if (!skippedToday) {
    const reportSnap = await getDoc(userDoc(uid, "morningReports", date));
    if (!reportSnap.exists()) {
      return "morning-report.html";
    }
  }

  return "today.html";
}

/** Markiert den Morgenbericht für heute als "übersprungen", damit der
 * Eintritts-Check nicht erneut dorthin umleitet. */
export function skipMorningReportToday() {
  try {
    window.sessionStorage.setItem(SKIP_KEY, todayIso());
  } catch {
    /* ignorieren */
  }
}
