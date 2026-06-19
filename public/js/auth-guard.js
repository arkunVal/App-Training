// Schützt eine Seite: ist niemand eingeloggt, wird zu login.html
// weitergeleitet. Ist jemand eingeloggt, wird der Callback mit dem
// User-Objekt aufgerufen. Jede geschützte Seite ruft das einmal beim Start auf.
import { onAuthStateChanged } from "./auth.js";
import { auth } from "./firebase-init.js";

export function requireAuth(onReady) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    onReady(user);
  });
}

/** Für login.html: ist schon jemand eingeloggt, direkt weiter zu today.html. */
export function redirectIfLoggedIn(targetPage) {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = targetPage;
  });
}
