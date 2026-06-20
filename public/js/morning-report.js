import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { el, card, chipGroup, slider, stepper } from "./ui.js";
import { userDoc } from "./firestore-paths.js";
import { getDoc, setDoc } from "./firestore.js";
import { todayIso, weekdayLong, formatDayMonth } from "./date-utils.js";
import { FATIGUE_TAGS, STRESS_LEVELS } from "./constants.js";
import { hmFromMinutes, minutesFromHm } from "./format.js";
import { friendlyFirestoreError, showInlineError } from "./firestore-errors.js";
import { skipMorningReportToday } from "./entry-redirect.js";

renderEnvBadge();
renderBottomNav("today.html");

const date = todayIso();
document.getElementById("date-label").textContent = `${weekdayLong(date)}, ${formatDayMonth(date)}`;

const skipLink = document.getElementById("skip-link");
skipLink.addEventListener("click", (e) => {
  e.preventDefault();
  skipMorningReportToday();
  window.location.href = "today.html";
});

const root = document.getElementById("form-root");
let uid = null;

requireAuth(async (user) => {
  uid = user.uid;
  const snap = await getDoc(userDoc(uid, "morningReports", date));
  renderForm(snap.exists() ? snap.data() : null);
});

function renderForm(existing) {
  const values = {
    fatigueLevel: existing?.fatigueLevel ?? 3,
    fatigueTag: existing?.fatigueTag ?? null,
    stressLevel: existing?.stressLevel ?? "medium",
    sleepMinutesTotal: existing?.sleepMinutesTotal ?? 420,
    sleepQuality: existing?.sleepQuality ?? 3,
  };

  const fatigueSlider = slider({
    label: "Ermüdung",
    value: values.fatigueLevel,
    min: 1,
    max: 5,
    onChange: (v) => (values.fatigueLevel = v),
    valueLabel: (v) => `${v}/5`,
  });

  const fatigueTagChips = chipGroup(FATIGUE_TAGS, values.fatigueTag, (v) => (values.fatigueTag = v), { allowDeselect: true });

  const stressChips = chipGroup(STRESS_LEVELS, values.stressLevel, (v) => (values.stressLevel = v), { accent: "tide" });

  const hm = hmFromMinutes(values.sleepMinutesTotal);
  let hours = hm.hours;
  let minutes = hm.minutes;
  const hoursStepper = stepper({
    label: "Stunden",
    value: hours,
    max: 14,
    onChange: (v) => {
      hours = v;
      values.sleepMinutesTotal = minutesFromHm(hours, minutes);
    },
  });
  const minutesStepper = stepper({
    label: "Minuten",
    value: minutes,
    step: 5,
    max: 55,
    onChange: (v) => {
      minutes = v;
      values.sleepMinutesTotal = minutesFromHm(hours, minutes);
    },
  });

  const qualitySlider = slider({
    label: "Schlafqualität",
    value: values.sleepQuality,
    min: 1,
    max: 5,
    onChange: (v) => (values.sleepQuality = v),
    valueLabel: (v) => `${v}/5`,
  });

  const fatigueCard = card({
    className: "stack",
    children: [el("p", { class: "card-title" }, "Ermüdung"), fatigueSlider, fatigueTagChips],
  });

  const stressCard = card({ className: "stack", children: [el("p", { class: "card-title" }, "Stress"), stressChips] });

  const sleepCard = card({
    className: "stack",
    children: [el("p", { class: "card-title" }, "Schlaf"), el("div", { class: "row" }, [hoursStepper, minutesStepper]), qualitySlider],
  });

  const saveBtn = el("button", { type: "button", class: "btn btn-primary" }, "Bericht speichern");
  const saveSection = el("div", { class: "stack-sm" }, [saveBtn]);
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = "Speichern …";
    try {
      await setDoc(userDoc(uid, "morningReports", date), { ...values, date, createdAtMs: Date.now() });
      window.location.href = "today.html";
    } catch (err) {
      showInlineError(saveSection, friendlyFirestoreError(err));
      saveBtn.disabled = false;
      saveBtn.textContent = original;
    }
  });

  root.appendChild(el("div", { class: "stack" }, [fatigueCard, stressCard, sleepCard, saveSection]));
}
