import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { el, card, chipGroup, multiChipGroup, stepper } from "./ui.js";
import { GENDERS, SPORTS, ZONES } from "./constants.js";
import { userDoc } from "./firestore-paths.js";
import { setDoc } from "./firestore.js";
import { resolveEntryDestination } from "./entry-redirect.js";
import { friendlyFirestoreError, showInlineError } from "./firestore-errors.js";

renderEnvBadge();

const root = document.getElementById("form-root");
let uid = null;

requireAuth((user) => {
  uid = user.uid;
  renderForm();
});

/** Grobe Z1–Z5-Herzfrequenzzonen aus der maximalen Herzfrequenz ableiten
 * (gängige Prozent-Bänder). Dient nur als sinnvoller Startwert — in den
 * Einstellungen lässt sich jede Zone später frei anpassen. */
function estimateHrZones(maxHr) {
  const bands = {
    Z1: [0.5, 0.6],
    Z2: [0.6, 0.7],
    Z3: [0.7, 0.8],
    Z4: [0.8, 0.9],
    Z5: [0.9, 1.0],
  };
  const zones = {};
  ZONES.forEach((z) => {
    const [lo, hi] = bands[z];
    zones[z] = { min: Math.round(maxHr * lo), max: Math.round(maxHr * hi) };
  });
  return zones;
}

function emptyPaceZones() {
  const zones = {};
  ZONES.forEach((z) => (zones[z] = { minSecPerKm: null, maxSecPerKm: null }));
  return zones;
}

function renderForm() {
  const values = {
    displayName: "",
    age: 30,
    gender: null,
    weightKg: 70,
    heightCm: 175,
    sports: [],
  };

  const nameInput = el("input", {
    class: "input",
    placeholder: "Wie sollen wir dich nennen?",
    oninput: (e) => (values.displayName = e.target.value),
  });

  const basicsCard = card({
    className: "stack",
    children: [
      el("p", { class: "card-title" }, "Über dich"),
      el("div", {}, [el("label", { class: "label" }, "Name"), nameInput]),
      stepper({ label: "Alter", value: values.age, min: 10, max: 99, onChange: (v) => (values.age = v), suffix: "Jahre" }),
      el("div", {}, [
        el("p", { class: "label" }, "Geschlecht"),
        chipGroup(GENDERS, values.gender, (v) => (values.gender = v), { accent: "tide", allowDeselect: true }),
      ]),
    ],
  });

  const bodyCard = card({
    className: "stack",
    children: [
      el("p", { class: "card-title" }, "Körperdaten"),
      stepper({ label: "Gewicht", value: values.weightKg, step: 0.5, min: 30, max: 200, onChange: (v) => (values.weightKg = v), suffix: "kg" }),
      stepper({ label: "Größe", value: values.heightCm, step: 1, min: 120, max: 220, onChange: (v) => (values.heightCm = v), suffix: "cm" }),
    ],
  });

  const sportsCard = card({
    className: "stack",
    children: [
      el("p", { class: "card-title" }, "Welche Sportarten betreibst du?"),
      multiChipGroup(SPORTS.map((s) => ({ value: s, label: s })), values.sports, (v) => (values.sports = v), { accent: "ember" }),
    ],
  });

  const submitBtn = el("button", { type: "button", class: "btn btn-primary" }, "Profil erstellen & loslegen");
  const submitSection = el("div", { class: "stack-sm" }, [submitBtn]);
  submitBtn.addEventListener("click", async () => {
    if (!values.displayName.trim()) {
      nameInput.focus();
      return;
    }
    submitBtn.disabled = true;
    const original = submitBtn.textContent;
    submitBtn.textContent = "Wird angelegt …";

    const maxHr = 220 - values.age;
    try {
      await setDoc(userDoc(uid, "profile", "main"), {
        displayName: values.displayName.trim(),
        age: values.age,
        gender: values.gender,
        weightKg: values.weightKg,
        heightCm: values.heightCm,
        sports: values.sports,
        maxHr,
        restingHr: 60,
        hrZones: estimateHrZones(maxHr),
        paceZones: emptyPaceZones(),
        createdAtMs: Date.now(),
      });
      const destination = await resolveEntryDestination(uid);
      window.location.href = destination;
    } catch (err) {
      showInlineError(submitSection, friendlyFirestoreError(err));
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });

  root.appendChild(el("div", { class: "stack" }, [basicsCard, bodyCard, sportsCard, submitSection]));
}
