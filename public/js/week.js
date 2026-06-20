import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { el, clear } from "./ui.js";
import { iconSvg, SPORT_ICONS } from "./icons.js";
import { userCollection } from "./firestore-paths.js";
import { getDocs, query, where } from "./firestore.js";
import {
  todayIso,
  weekStartIso,
  weekDaysIso,
  addWeeksIso,
  addMonthsIso,
  addDaysIso,
  formatWeekRangeLabel,
  monthGrid,
  monthLabel,
  parseIso,
  weekdayShort,
  isTodayIso,
} from "./date-utils.js";

renderEnvBadge();
renderBottomNav("week.html");

const params = new URLSearchParams(window.location.search);
let refDate = params.get("date") || todayIso();
let view = params.get("view") === "month" ? "month" : "week";
let uid = null;

const root = document.getElementById("week-root");
const rangeLabel = document.getElementById("range-label");
const tabWeekBtn = document.getElementById("tab-week");
const tabMonthBtn = document.getElementById("tab-month");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

prevBtn.innerHTML = iconSvg("chevronLeft", 18);
nextBtn.innerHTML = iconSvg("chevronRight", 18);

requireAuth(async (user) => {
  uid = user.uid;
  await renderAll();

  prevBtn.addEventListener("click", async () => {
    refDate = view === "week" ? addWeeksIso(refDate, -1) : addMonthsIso(refDate, -1);
    await renderAll();
  });
  nextBtn.addEventListener("click", async () => {
    refDate = view === "week" ? addWeeksIso(refDate, 1) : addMonthsIso(refDate, 1);
    await renderAll();
  });
  tabWeekBtn.addEventListener("click", async () => {
    if (view === "week") return;
    view = "week";
    await renderAll();
  });
  tabMonthBtn.addEventListener("click", async () => {
    if (view === "month") return;
    view = "month";
    await renderAll();
  });
});

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("date", refDate);
  url.searchParams.set("view", view);
  window.history.replaceState({}, "", url);
}

async function fetchRange(startIso, endIso) {
  const [trainingsSnap, todosSnap] = await Promise.all([
    getDocs(query(userCollection(uid, "trainings"), where("date", ">=", startIso), where("date", "<=", endIso))),
    getDocs(query(userCollection(uid, "todos"), where("date", ">=", startIso), where("date", "<=", endIso))),
  ]);
  const dataByDate = new Map();
  function ensure(d) {
    if (!dataByDate.has(d)) dataByDate.set(d, { trainings: [], todos: [] });
    return dataByDate.get(d);
  }
  trainingsSnap.docs.forEach((d) => ensure(d.data().date).trainings.push(d.data()));
  todosSnap.docs.forEach((d) => ensure(d.data().date).todos.push(d.data()));
  return dataByDate;
}

function dayDots(info) {
  const dots = [];
  if (info.trainings.length > 0) {
    const allDone = info.trainings.every((t) => t.status === "erledigt");
    dots.push(el("span", { class: "wd-dot", style: `background:${allDone ? "var(--sprout-500)" : "var(--ember-500)"};` }));
  }
  if (info.todos.length > 0) {
    dots.push(el("span", { class: "wd-dot", style: "background:var(--tide-500);" }));
  }
  return dots;
}

/** Größere Indikatoren für die Wochenansicht: ein kleines Sport-Icon statt
 * eines reinen Punktes, plus Zähler bei mehreren Trainings am selben Tag. */
function dayIndicators(info) {
  const indicators = [];
  if (info.trainings.length > 0) {
    const first = info.trainings[0];
    const allDone = info.trainings.every((t) => t.status === "erledigt");
    const sportIcon = SPORT_ICONS[first.sport] ?? "circle";
    indicators.push(
      el("span", {
        class: "wd-sport-icon",
        style: allDone
          ? "color:var(--sprout-400);background:rgba(63,179,172,0.16);"
          : "color:var(--ember-400);background:rgba(239,140,74,0.16);",
        html: iconSvg(sportIcon, 12),
      })
    );
    if (info.trainings.length > 1) {
      indicators.push(el("span", { class: "wd-count" }, `+${info.trainings.length - 1}`));
    }
  }
  if (info.todos.length > 0) {
    const openCount = info.todos.filter((t) => !t.done).length;
    indicators.push(
      el("span", {
        class: "wd-sport-icon",
        style: openCount > 0 ? "color:var(--tide-400);background:rgba(79,143,232,0.16);" : "color:var(--ink-500);background:var(--ink-800);",
        html: iconSvg("check", 11),
      })
    );
  }
  return indicators;
}

function renderWeekStrip(weekStart, dataByDate) {
  const days = weekDaysIso(weekStart);
  return el(
    "div",
    { class: "week-strip" },
    days.map((iso) => {
      const info = dataByDate.get(iso) || { trainings: [], todos: [] };
      return el("a", { href: `day.html?date=${iso}`, class: `week-day${isTodayIso(iso) ? " today" : ""}` }, [
        el("span", { class: "wd-label" }, weekdayShort(iso)),
        el("span", { class: "wd-num" }, String(parseIso(iso).getDate())),
        el("div", { class: "wd-indicators" }, dayIndicators(info)),
      ]);
    })
  );
}

function renderMonthView(refIso, dataByDate) {
  const weeks = monthGrid(refIso);
  const wrap = el("div", {}, [
    el(
      "div",
      { class: "month-headers" },
      ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => el("span", {}, d))
    ),
  ]);
  weeks.forEach((week) => {
    const row = el(
      "div",
      { class: "month-week" },
      week.map(({ dateIso, inCurrentMonth }) => {
        const info = dataByDate.get(dateIso) || { trainings: [], todos: [] };
        const classes = ["month-day"];
        if (!inCurrentMonth) classes.push("outside");
        if (isTodayIso(dateIso)) classes.push("today");
        return el("a", { href: `day.html?date=${dateIso}`, class: classes.join(" ") }, [
          el("span", { class: "md-num" }, String(parseIso(dateIso).getDate())),
          el("div", { class: "wd-dots" }, dayDots(info)),
        ]);
      })
    );
    wrap.appendChild(row);
  });
  return wrap;
}

async function renderAll() {
  tabWeekBtn.classList.toggle("active", view === "week");
  tabMonthBtn.classList.toggle("active", view === "month");
  clear(root);

  if (view === "week") {
    const start = weekStartIso(refDate);
    rangeLabel.textContent = formatWeekRangeLabel(start);
    const dataByDate = await fetchRange(start, addDaysIso(start, 6));
    root.appendChild(renderWeekStrip(start, dataByDate));
  } else {
    const ref = parseIso(refDate);
    rangeLabel.textContent = `${monthLabel(ref.getMonth())} ${ref.getFullYear()}`;
    const weeks = monthGrid(refDate);
    const gridStart = weeks[0][0].dateIso;
    const gridEnd = weeks[weeks.length - 1][6].dateIso;
    const dataByDate = await fetchRange(gridStart, gridEnd);
    root.appendChild(renderMonthView(refDate, dataByDate));
  }
  updateUrl();
}
