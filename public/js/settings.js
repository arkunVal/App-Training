import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge, getEnv, setEnv } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { el, clear, card, chipGroup } from "./ui.js";
import { auth } from "./firebase-init.js";
import { signOut } from "./auth.js";
import { userDoc } from "./firestore-paths.js";
import { getDoc, setDoc } from "./firestore.js";
import { ZONES } from "./constants.js";
import { formatMmSs, parseMmSs } from "./format.js";

renderEnvBadge();
renderBottomNav("settings.html");

const root = document.getElementById("settings-root");
let uid = null;

requireAuth(async (user) => {
  uid = user.uid;
  const snap = await getDoc(userDoc(uid, "profile", "main"));
  renderForm(snap.exists() ? snap.data() : defaultProfile());
});

function defaultProfile() {
  const hrZones = {};
  const paceZones = {};
  ZONES.forEach((z) => {
    hrZones[z] = { min: 0, max: 0 };
    paceZones[z] = { minSecPerKm: null, maxSecPerKm: null };
  });
  return { displayName: "", maxHr: 190, restingHr: 55, hrZones, paceZones };
}

function renderEnvCard() {
  const current = getEnv();
  const chips = chipGroup(
    [
      { value: "prod", label: "Produktion" },
      { value: "dev", label: "Entwicklung" },
    ],
    current,
    (v) => {
      if (v === current) return;
      const target = v === "dev" ? "Entwicklung" : "Produktion";
      if (!window.confirm(`Zu "${target}" wechseln? Die Seite wird neu geladen und zeigt einen eigenen, getrennten Datenbereich.`)) {
        chips.setValue(current);
        return;
      }
      setEnv(v);
      window.location.reload();
    },
    { accent: "tide" }
  );
  return card({
    className: "stack-sm",
    children: [
      el("p", { class: "card-title" }, "Umgebung"),
      el("p", { class: "text-muted" }, "In der Entwicklungsumgebung kannst du neue Versionen testen, ohne deine echten Trainingsdaten zu verändern."),
      chips,
    ],
  });
}

function renderForm(profile) {
  clear(root);
  const values = JSON.parse(JSON.stringify(profile));
  if (!values.hrZones) values.hrZones = {};
  if (!values.paceZones) values.paceZones = {};

  const nameInput = el("input", { class: "input", value: values.displayName ?? "", oninput: (e) => (values.displayName = e.target.value) });
  const maxHrInput = el("input", { type: "number", class: "input", value: values.maxHr ?? 190, oninput: (e) => (values.maxHr = Number(e.target.value)) });
  const restingHrInput = el("input", { type: "number", class: "input", value: values.restingHr ?? 55, oninput: (e) => (values.restingHr = Number(e.target.value)) });

  const profileCard = card({
    className: "stack",
    children: [
      el("p", { class: "card-title" }, "Profil"),
      el("div", {}, [el("label", { class: "label" }, "Name"), nameInput]),
      el("div", { class: "row" }, [
        el("div", { class: "flex-1" }, [el("label", { class: "label" }, "Max. Herzfrequenz"), maxHrInput]),
        el("div", { class: "flex-1" }, [el("label", { class: "label" }, "Ruheherzfrequenz"), restingHrInput]),
      ]),
    ],
  });

  const hrRows = ZONES.map((z) => {
    if (!values.hrZones[z]) values.hrZones[z] = { min: 0, max: 0 };
    const minInput = el("input", {
      type: "number",
      class: "input input-sm flex-1",
      value: values.hrZones[z].min ?? 0,
      oninput: (e) => (values.hrZones[z].min = Number(e.target.value)),
    });
    const maxInput = el("input", {
      type: "number",
      class: "input input-sm flex-1",
      value: values.hrZones[z].max ?? 0,
      oninput: (e) => (values.hrZones[z].max = Number(e.target.value)),
    });
    return el("div", { class: "row", style: "margin-bottom:0.6rem;" }, [
      el("span", { class: `zone-badge ${z.toLowerCase()}`, style: "width:2.5rem;justify-content:center;flex-shrink:0;" }, z),
      minInput,
      el("span", { class: "text-muted" }, "–"),
      maxInput,
      el("span", { class: "text-muted", style: "flex-shrink:0;" }, "bpm"),
    ]);
  });
  const hrCard = card({
    className: "stack-sm",
    children: [el("p", { class: "card-title", style: "margin-bottom:0.5rem;" }, "Herzfrequenz-Zonen"), ...hrRows],
  });

  const paceRows = ZONES.map((z) => {
    if (!values.paceZones[z]) values.paceZones[z] = { minSecPerKm: null, maxSecPerKm: null };
    const minInput = el("input", {
      class: "input input-sm flex-1",
      placeholder: "mm:ss",
      value: values.paceZones[z].minSecPerKm ? formatMmSs(values.paceZones[z].minSecPerKm) : "",
      oninput: (e) => (values.paceZones[z].minSecPerKm = parseMmSs(e.target.value)),
    });
    const maxInput = el("input", {
      class: "input input-sm flex-1",
      placeholder: "mm:ss",
      value: values.paceZones[z].maxSecPerKm ? formatMmSs(values.paceZones[z].maxSecPerKm) : "",
      oninput: (e) => (values.paceZones[z].maxSecPerKm = parseMmSs(e.target.value)),
    });
    return el("div", { class: "row", style: "margin-bottom:0.6rem;" }, [
      el("span", { class: `zone-badge ${z.toLowerCase()}`, style: "width:2.5rem;justify-content:center;flex-shrink:0;" }, z),
      minInput,
      el("span", { class: "text-muted" }, "–"),
      maxInput,
      el("span", { class: "text-muted", style: "flex-shrink:0;" }, "/km"),
    ]);
  });
  const paceCard = card({
    className: "stack-sm",
    children: [el("p", { class: "card-title", style: "margin-bottom:0.5rem;" }, "Pace-Zonen (min:sek pro km)"), ...paceRows],
  });

  const saveBtn = el("button", { type: "button", class: "btn btn-primary" }, "Speichern");
  const savedMsg = el("p", { class: "text-success hidden" }, "Gespeichert ✓");
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = "Speichern …";
    await setDoc(userDoc(uid, "profile", "main"), { ...values, updatedAtMs: Date.now() });
    saveBtn.disabled = false;
    saveBtn.textContent = original;
    savedMsg.classList.remove("hidden");
    setTimeout(() => savedMsg.classList.add("hidden"), 2000);
  });

  const signOutBtn = el("button", { type: "button", class: "btn btn-secondary" }, "Abmelden");
  signOutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });

  root.appendChild(
    el("div", { class: "stack" }, [
      profileCard,
      hrCard,
      paceCard,
      el("div", { class: "row" }, [saveBtn, savedMsg]),
      renderEnvCard(),
      signOutBtn,
    ])
  );
}
