// Erkennt, ob die App gerade als "prod" oder "dev" läuft, und sorgt dafür,
// dass alle Firestore-Daten der beiden Umgebungen strikt getrennt bleiben
// (siehe firestore-paths.js). So lassen sich neue Versionen der App später
// gegen einen eigenen "Entwickler/Test"-Datenbereich ausprobieren, ohne die
// echten Trainingsdaten zu berühren.
//
// Reihenfolge der Erkennung:
//   1. URL-Parameter ?env=dev / ?env=prod (wird gemerkt, siehe unten)
//   2. Zuvor im Browser gemerkte Wahl (localStorage)
//   3. Hostname enthält "dev" oder ist localhost -> "dev"
//   4. Sonst -> "prod"

const STORAGE_KEY = "trainingsAppEnv";

function detectFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("env");
  if (value === "dev" || value === "prod") return value;
  return null;
}

function detectFromHostname() {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "dev";
  if (host.includes("dev")) return "dev";
  return "prod";
}

function resolveEnv() {
  const fromUrl = detectFromUrl();
  if (fromUrl) {
    try {
      window.localStorage.setItem(STORAGE_KEY, fromUrl);
    } catch {
      /* localStorage evtl. nicht verfügbar, ignorieren */
    }
    return fromUrl;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dev" || stored === "prod") return stored;
  } catch {
    /* ignorieren */
  }

  return detectFromHostname();
}

let cachedEnv = null;

/** Liefert "prod" oder "dev". Wird einmal pro Seitenaufruf ermittelt. */
export function getEnv() {
  if (!cachedEnv) cachedEnv = resolveEnv();
  return cachedEnv;
}

/** Umgebung dauerhaft wechseln (z.B. über einen Schalter in den Einstellungen). */
export function setEnv(env) {
  if (env !== "dev" && env !== "prod") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, env);
  } catch {
    /* ignorieren */
  }
  cachedEnv = env;
}

/** Zeigt oben auf der Seite einen Hinweisbalken, wenn die Dev-Umgebung aktiv ist. */
export function renderEnvBadge() {
  if (getEnv() !== "dev") return;
  const bar = document.createElement("div");
  bar.className = "env-badge";
  bar.textContent = "🧪 Entwicklungsumgebung — Daten getrennt von Produktion";
  document.body.prepend(bar);
}
