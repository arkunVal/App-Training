// Übersetzt Firestore-/Firebase-Fehler in verständliche deutsche Hinweise.
// Wird überall dort eingesetzt, wo Daten gespeichert werden, damit ein
// fehlgeschlagenes Speichern NIE unbemerkt bleibt.
export function friendlyFirestoreError(err) {
  const code = err?.code ?? "";

  if (code.includes("permission-denied")) {
    return "Zugriff verweigert. Wurden die Firestore-Sicherheitsregeln deployt (firebase deploy --only firestore:rules) und existiert eine Firestore-Datenbank im Firebase-Projekt?";
  }
  if (code.includes("unauthenticated")) {
    return "Du bist nicht mehr angemeldet. Bitte lade die Seite neu und melde dich erneut an.";
  }
  if (code.includes("unavailable") || code.includes("network")) {
    return "Keine Verbindung zur Datenbank. Bitte Internetverbindung prüfen und erneut versuchen.";
  }
  if (code.includes("not-found")) {
    return "Eintrag wurde nicht gefunden. Eventuell wurde er bereits gelöscht.";
  }

  return "Speichern fehlgeschlagen. Bitte erneut versuchen.";
}

/** Erstellt (oder findet) ein Fehlertext-Element direkt nach `afterNode`
 * und zeigt die Nachricht darin an. Gibt das Element zurück, damit es bei
 * Erfolg wieder versteckt werden kann. */
export function showInlineError(container, message) {
  let errorEl = container.querySelector(".js-inline-error");
  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.className = "text-error js-inline-error";
    container.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  return errorEl;
}

export function hideInlineError(container) {
  const errorEl = container.querySelector(".js-inline-error");
  if (errorEl) errorEl.classList.add("hidden");
}
