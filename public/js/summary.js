import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { el, clear, card } from "./ui.js";
import { iconSvg } from "./icons.js";
import { userCollection, userDoc } from "./firestore-paths.js";
import { getDocs, getDoc, setDoc, query, where } from "./firestore.js";
import { todayIso, weekStartIso, weekDaysIso, addWeeksIso, formatWeekRangeLabel, weekdayShort } from "./date-utils.js";
import { formatMinutes, formatDistanceKm, formatSleep } from "./format.js";
import { STRESS_TO_NUM, NUM_TO_STRESS_LABEL } from "./constants.js";
import { friendlyFirestoreError, showInlineError } from "./firestore-errors.js";

renderEnvBadge();
renderBottomNav("summary.html");

const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
prevBtn.innerHTML = iconSvg("chevronLeft", 18);
nextBtn.innerHTML = iconSvg("chevronRight", 18);

const rangeLabel = document.getElementById("range-label");
const indicator = document.getElementById("current-indicator");
const root = document.getElementById("summary-root");

let uid = null;
let weekStart = weekStartIso(todayIso());

requireAuth(async (user) => {
  uid = user.uid;
  await renderWeek();
  prevBtn.addEventListener("click", async () => {
    weekStart = addWeeksIso(weekStart, -1);
    await renderWeek();
  });
  nextBtn.addEventListener("click", async () => {
    weekStart = addWeeksIso(weekStart, 1);
    await renderWeek();
  });
});

function statCard(label, value) {
  return el("div", { class: "stat-card" }, [el("p", { class: "stat-label" }, label), el("p", { class: "stat-value" }, value)]);
}

function buildWeekChartSvg(days, reportByDate) {
  const width = 320;
  const height = 170;
  const padTop = 14;
  const padBottom = 22;
  const chartHeight = height - padTop - padBottom;
  const colWidth = width / 7;
  const maxSleepMin = 600;

  let bars = "";
  const stressPoints = [];

  days.forEach((iso, i) => {
    const report = reportByDate.get(iso);
    const sleepMin = report?.sleepMinutesTotal ?? 0;
    const barH = sleepMin > 0 ? Math.max(3, (sleepMin / maxSleepMin) * chartHeight) : 0;
    const barW = colWidth * 0.42;
    const x = i * colWidth + (colWidth - barW) / 2;
    const y = padTop + chartHeight - barH;
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="3" style="fill:var(--tide-500);opacity:0.85" />`;

    const stressNum = report ? STRESS_TO_NUM[report.stressLevel] : null;
    if (stressNum) {
      const px = i * colWidth + colWidth / 2;
      const py = padTop + chartHeight - ((stressNum - 1) / 2) * chartHeight;
      stressPoints.push([px, py]);
    }
  });

  let linePart = "";
  if (stressPoints.length > 1) {
    linePart = `<polyline points="${stressPoints.map((p) => p.join(",")).join(" ")}" style="fill:none;stroke:var(--flare-400);stroke-width:2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const dotsPart = stressPoints
    .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" style="fill:var(--flare-400)" />`)
    .join("");
  const labelsPart = days
    .map((iso, i) => {
      const x = i * colWidth + colWidth / 2;
      return `<text x="${x.toFixed(1)}" y="${height - 6}" text-anchor="middle" font-size="9" style="fill:var(--ink-400);font-family:Inter,sans-serif">${weekdayShort(iso)}</text>`;
    })
    .join("");

  const legend = `<rect x="0" y="0" width="9" height="9" rx="2" style="fill:var(--tide-500);opacity:0.85" /><text x="13" y="8" font-size="9" style="fill:var(--ink-400);font-family:Inter,sans-serif">Schlaf</text><circle cx="62" cy="4.5" r="3.5" style="fill:var(--flare-400)" /><text x="69" y="8" font-size="9" style="fill:var(--ink-400);font-family:Inter,sans-serif">Stress</text>`;

  return `<svg viewBox="0 -14 ${width} ${height + 14}" width="100%" height="184" xmlns="http://www.w3.org/2000/svg">${legend}${bars}${linePart}${dotsPart}${labelsPart}</svg>`;
}

function renderNotesForm(initial) {
  const wentWellInput = el("textarea", { class: "textarea", rows: 2, placeholder: "z.B. Lange Läufe liefen gut" });
  wentWellInput.value = initial.wentWell ?? "";
  const issuesInput = el("textarea", { class: "textarea", rows: 2, placeholder: "z.B. Knie hat nach dem Intervalltraining gezogen" });
  issuesInput.value = initial.issues ?? "";

  const savedMsg = el("p", { class: "text-success hidden" }, "Gespeichert ✓");
  const saveBtn = el("button", { type: "button", class: "btn btn-secondary" }, "Notizen speichern");
  const saveSection = el("div", { class: "stack-sm" }, [el("div", { class: "row" }, [saveBtn, savedMsg])]);
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    const original = saveBtn.textContent;
    saveBtn.textContent = "Speichern …";
    try {
      await setDoc(userDoc(uid, "weeklyNotes", weekStart), {
        wentWell: wentWellInput.value.trim(),
        issues: issuesInput.value.trim(),
        updatedAtMs: Date.now(),
      });
      savedMsg.classList.remove("hidden");
      setTimeout(() => savedMsg.classList.add("hidden"), 2000);
    } catch (err) {
      showInlineError(saveSection, friendlyFirestoreError(err));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = original;
    }
  });

  return card({
    className: "stack",
    children: [
      el("p", { class: "card-title" }, "Wochenrückblick"),
      el("div", {}, [el("label", { class: "label" }, "Was lief gut?"), wentWellInput]),
      el("div", {}, [el("label", { class: "label" }, "Was gab es für Probleme?"), issuesInput]),
      saveSection,
    ],
  });
}

async function renderWeek() {
  rangeLabel.textContent = formatWeekRangeLabel(weekStart);
  indicator.textContent = weekStartIso(todayIso()) === weekStart ? "Aktuelle Woche" : "";

  const days = weekDaysIso(weekStart);
  const weekEnd = days[6];

  const [trainingsSnap, reportsSnap, noteSnap] = await Promise.all([
    getDocs(query(userCollection(uid, "trainings"), where("date", ">=", weekStart), where("date", "<=", weekEnd))),
    getDocs(query(userCollection(uid, "morningReports"), where("date", ">=", weekStart), where("date", "<=", weekEnd))),
    getDoc(userDoc(uid, "weeklyNotes", weekStart)),
  ]);

  const trainings = trainingsSnap.docs.map((d) => d.data());
  const reports = reportsSnap.docs.map((d) => d.data());
  const reportByDate = new Map(reports.map((r) => [r.date, r]));

  const completed = trainings.filter((t) => t.status === "erledigt");
  const totalDurationMin = completed.reduce((sum, t) => sum + (t.actualDurationMin || t.plannedDurationMin || 0), 0);
  const totalDistanceKm = completed.reduce((sum, t) => sum + (t.actualDistanceKm || t.plannedDistanceKm || 0), 0);

  const sleepValues = reports.map((r) => r.sleepMinutesTotal).filter((v) => v != null);
  const avgSleepMin = sleepValues.length ? Math.round(sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length) : null;

  const stressValues = reports.map((r) => STRESS_TO_NUM[r.stressLevel]).filter(Boolean);
  const avgStressNum = stressValues.length ? Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length) : null;

  clear(root);
  root.appendChild(
    el("div", { class: "stat-grid" }, [
      statCard("Trainingszeit", formatMinutes(totalDurationMin)),
      statCard("Distanz", formatDistanceKm(totalDistanceKm)),
      statCard("Ø Schlaf", avgSleepMin ? formatSleep(avgSleepMin) : "–"),
      statCard("Ø Stress", avgStressNum ? NUM_TO_STRESS_LABEL[avgStressNum] : "–"),
    ])
  );

  root.appendChild(
    card({
      children: [
        el("p", { class: "card-title", style: "margin-bottom:0.75rem;" }, "Schlaf & Stress"),
        el("div", { html: buildWeekChartSvg(days, reportByDate) }),
      ],
    })
  );

  root.appendChild(renderNotesForm(noteSnap.exists() ? noteSnap.data() : {}));
}
