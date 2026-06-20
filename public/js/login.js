import { auth } from "./firebase-init.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "./auth.js";
import { redirectIfLoggedIn } from "./auth-guard.js";
import { resolveEntryDestination } from "./entry-redirect.js";

redirectIfLoggedIn("today.html");

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");
const submitBtn = document.getElementById("submit-btn");
const toggleText = document.getElementById("toggle-text");
const toggleMode = document.getElementById("toggle-mode");

let mode = "signin";

function applyMode() {
  submitBtn.textContent = mode === "signin" ? "Anmelden" : "Registrieren";
  toggleText.textContent = mode === "signin" ? "Noch kein Konto?" : "Schon ein Konto?";
  toggleMode.textContent = mode === "signin" ? "Registrieren" : "Anmelden";
}

toggleMode.addEventListener("click", (e) => {
  e.preventDefault();
  mode = mode === "signin" ? "signup" : "signin";
  errorMsg.classList.add("hidden");
  applyMode();
});

function germanAuthError(code) {
  const map = {
    "auth/invalid-email": "Ungültige E-Mail-Adresse.",
    "auth/user-not-found": "Kein Konto mit dieser E-Mail gefunden.",
    "auth/wrong-password": "Falsches Passwort.",
    "auth/invalid-credential": "E-Mail oder Passwort ist falsch.",
    "auth/email-already-in-use": "Diese E-Mail wird bereits verwendet.",
    "auth/weak-password": "Das Passwort muss mindestens 6 Zeichen haben.",
    "auth/too-many-requests": "Zu viele Versuche. Bitte später erneut versuchen.",
  };
  return map[code] ?? "Etwas ist schiefgelaufen. Bitte erneut versuchen.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.add("hidden");
  submitBtn.disabled = true;
  const original = submitBtn.textContent;
  submitBtn.textContent = "Einen Moment …";
  try {
    let user;
    if (mode === "signin") {
      const result = await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      user = result.user;
    } else {
      const result = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      user = result.user;
    }
    const destination = await resolveEntryDestination(user.uid);
    window.location.href = destination;
  } catch (err) {
    errorMsg.textContent = germanAuthError(err.code);
    errorMsg.classList.remove("hidden");
    submitBtn.disabled = false;
    submitBtn.textContent = original;
  }
});

applyMode();
