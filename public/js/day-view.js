// Rendert die komplette Tagesansicht (Morgenbericht-Zusammenfassung,
// Trainings mit Checkbox, To-Do-Liste) für ein gegebenes Datum. Wird sowohl
// von today.html (heute, editierbar) als auch von day.html (beliebiger Tag,
// nur lesbar bzgl. Morgenbericht) verwendet.
import { el, clear, card, checkbox, progressBar, zoneBadge } from "./ui.js";
import { iconSvg, SPORT_ICONS } from "./icons.js";
import { userDoc, userCollection } from "./firestore-paths.js";
import { getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from "./firestore.js";
import { formatSleep, formatMinutes, formatDistanceKm } from "./format.js";
import { summarizeStructure } from "./training-summary.js";

const FATIGUE_TAG_LABEL = { frisch: "Frisch", ermuedet: "Ermüdet", muskelkater: "Muskelkater" };
const STRESS_LABEL = { niedrig: "Niedrig", medium: "Mittel", hoch: "Hoch" };
const STRESS_COLOR = { niedrig: "var(--sprout-400)", medium: "var(--amber-400)", hoch: "var(--flare-400)" };

export async function renderDayView(container, { uid, date, editable }) {
  clear(container);
  const wrap = el("div", { class: "stack" });
  container.appendChild(wrap);

  const reportSnap = await getDoc(userDoc(uid, "morningReports", date));
  wrap.appendChild(renderMorningReportSummary(reportSnap.exists() ? reportSnap.data() : null, editable));

  const trainingsSnap = await getDocs(query(userCollection(uid, "trainings"), where("date", "==", date)));
  const trainings = trainingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  trainings.sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0));
  wrap.appendChild(renderTrainingSection(trainings, date, uid));

  const todosSnap = await getDocs(query(userCollection(uid, "todos"), where("date", "==", date)));
  const todos = todosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  todos.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  wrap.appendChild(renderTodoList(uid, date, todos));
}

function statBlock(iconHtml, iconColor, value, label) {
  return el("div", { class: "flex-1", style: "text-align:center;" }, [
    el("div", {
      style: `margin:0 auto 0.4rem;width:2.25rem;height:2.25rem;border-radius:999px;background:var(--ink-850);display:flex;align-items:center;justify-content:center;${iconColor ? `color:${iconColor};` : ""}`,
      html: iconHtml,
    }),
    el("p", { style: "font-family:var(--font-data);font-size:0.875rem;font-weight:600;color:var(--ink-100);" }, value),
    el("p", { style: "font-size:0.6875rem;color:var(--ink-400);" }, label),
  ]);
}

function renderMorningReportSummary(report, editable) {
  if (!report) {
    const children = [
      el("div", { class: "row" }, [
        el("div", { class: "training-icon", html: iconSvg("sparkles", 20) }),
        el("div", { class: "flex-1" }, [
          el("p", { style: "font-weight:500;color:var(--ink-100);" }, editable ? "Guten Morgen!" : "Kein Morgenbericht"),
          el("p", { class: "text-muted" }, editable ? "Noch kein Bericht für heute" : "An diesem Tag wurde keiner erfasst"),
        ]),
      ]),
    ];
    if (editable) {
      children.push(el("a", { href: "morning-report.html", class: "btn btn-primary", style: "margin-top:1rem;" }, "Morgenbericht ausfüllen"));
    }
    return card({ children });
  }

  const head = el("div", { class: "row-between", style: "margin-bottom:1rem;" }, [
    el("p", { class: "card-title" }, "Guten-Morgen-Bericht"),
    editable ? el("a", { href: "morning-report.html", html: iconSvg("pencil", 16), style: "color:var(--ink-400);" }) : null,
  ]);

  const grid = el("div", { class: "row" }, [
    statBlock(iconSvg("zap", 16), "var(--ember-400)", `${report.fatigueLevel}/5`, report.fatigueTag ? FATIGUE_TAG_LABEL[report.fatigueTag] : "Ermüdung"),
    statBlock('<span style="font-weight:700;">●</span>', STRESS_COLOR[report.stressLevel], STRESS_LABEL[report.stressLevel], "Stress"),
    statBlock(iconSvg("moon", 16), "var(--tide-400)", formatSleep(report.sleepMinutesTotal), `Schlaf · ${report.sleepQuality}/5`),
  ]);

  return card({ children: [head, grid] });
}

function renderTrainingCard(t, uid) {
  const sportIcon = SPORT_ICONS[t.sport] ?? "circle";
  const summary = summarizeStructure(t.structure || []);

  const metaChildren = [];
  if (t.targetZone) metaChildren.push(zoneBadge(t.targetZone));
  if (t.plannedDurationMin) metaChildren.push(el("span", { class: "meta-value" }, formatMinutes(t.plannedDurationMin)));
  if (t.plannedDistanceKm) metaChildren.push(el("span", { class: "meta-value" }, formatDistanceKm(t.plannedDistanceKm)));

  const cb = checkbox({
    checked: t.status === "erledigt",
    onChange: async (checked) => {
      await updateDoc(userDoc(uid, "trainings", t.id), { status: checked ? "erledigt" : "geplant" });
    },
  });

  const a = el("a", { href: `training-edit.html?id=${t.id}`, class: "training-card" }, [
    el("div", { class: "training-icon", html: iconSvg(sportIcon, 18) }),
    el("div", { class: "training-info" }, [
      el("p", { class: "training-title" }, t.title),
      el("p", { class: "training-summary-text" }, summary || t.sport),
      el("div", { class: "training-meta" }, metaChildren),
    ]),
  ]);
  a.appendChild(cb);
  return a;
}

function renderTrainingSection(trainings, date, uid) {
  const addBtn = el("a", {
    href: `training-new.html?date=${date}`,
    class: "btn-fab",
    html: iconSvg("plus", 16),
    "aria-label": "Training hinzufügen",
  });
  const header = el("div", { class: "row-between", style: "margin-bottom:0.9rem;" }, [
    el("p", { class: "card-title" }, "Training"),
    addBtn,
  ]);

  const body = [];
  if (trainings.length === 0) {
    body.push(el("p", { class: "text-muted" }, "Kein Training geplant. Über das Plus kannst du eines hinzufügen."));
  } else {
    const doneCount = trainings.filter((t) => t.status === "erledigt").length;
    body.push(progressBar(doneCount, trainings.length, "ember"));
    body.push(
      el(
        "div",
        { class: "stack-sm", style: "margin-top:1rem;" },
        trainings.map((t) => renderTrainingCard(t, uid))
      )
    );
  }

  return card({ children: [header, ...body] });
}

function renderTodoList(uid, date, initialTodos) {
  let todos = [...initialTodos];
  const listEl = el("div", { class: "stack-sm" });
  const countEl = el("span", { style: "font-family:var(--font-data);font-size:0.75rem;color:var(--ink-400);" });
  const progressWrap = el("div", { style: "margin-bottom:1rem;" });

  function renderCounts() {
    clear(countEl);
    countEl.appendChild(document.createTextNode(`${todos.filter((t) => t.done).length}/${todos.length}`));
    clear(progressWrap);
    if (todos.length > 0) progressWrap.appendChild(progressBar(todos.filter((t) => t.done).length, todos.length));
  }

  function renderList() {
    clear(listEl);
    todos.forEach((todo) => {
      const textEl = el("span", { class: "flex-1", style: `font-size:0.9rem;${todo.done ? "color:var(--ink-500);text-decoration:line-through;" : "color:var(--ink-100);"}` }, todo.text);
      const cb = checkbox({
        checked: todo.done,
        onChange: async (checked) => {
          todo.done = checked;
          renderList();
          renderCounts();
          await updateDoc(userDoc(uid, "todos", todo.id), { done: checked });
        },
      });
      const delBtn = el("button", {
        type: "button",
        class: "btn-icon",
        style: "width:1.75rem;height:1.75rem;background:none;box-shadow:none;",
        html: iconSvg("x", 15),
        onClick: async () => {
          todos = todos.filter((t) => t.id !== todo.id);
          renderList();
          renderCounts();
          await deleteDoc(userDoc(uid, "todos", todo.id));
        },
      });
      listEl.appendChild(el("div", { class: "row" }, [cb, textEl, delBtn]));
    });
  }

  const input = el("input", { class: "input", placeholder: "Neues To-Do …" });
  const addBtn = el("button", { type: "submit", class: "btn-fab", html: iconSvg("plus", 18) });

  async function addTodo() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    const optimistic = { id: `temp-${Math.random().toString(36).slice(2)}`, date, text, done: false, position: todos.length };
    todos.push(optimistic);
    renderList();
    renderCounts();
    const ref = await addDoc(userCollection(uid, "todos"), {
      date,
      text,
      done: false,
      position: todos.length,
      createdAtMs: Date.now(),
    });
    optimistic.id = ref.id;
  }

  const form = el(
    "form",
    {
      class: "row",
      style: "margin-top:1.1rem;",
      onSubmit: (e) => {
        e.preventDefault();
        addTodo();
      },
    },
    [input, addBtn]
  );

  renderList();
  renderCounts();

  return card({
    children: [
      el("div", { class: "row-between", style: "margin-bottom:0.9rem;" }, [el("p", { class: "card-title" }, "To-Dos"), countEl]),
      progressWrap,
      listEl,
      form,
    ],
  });
}
