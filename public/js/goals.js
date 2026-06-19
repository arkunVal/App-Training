import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { el, clear, card, chipGroup } from "./ui.js";
import { iconSvg } from "./icons.js";
import { RACE_TYPES } from "./constants.js";
import { userCollection, userDoc } from "./firestore-paths.js";
import { getDocs, addDoc, deleteDoc, query, orderBy } from "./firestore.js";
import { todayIso, daysUntil, formatDayMonth } from "./date-utils.js";
import { formatSecondsAsClock } from "./format.js";

renderEnvBadge();
renderBottomNav("week.html");

const listRoot = document.getElementById("goals-list");
const formRoot = document.getElementById("goal-form-root");
const addBtn = document.getElementById("add-goal-btn");
addBtn.innerHTML = iconSvg("plus", 20);

let uid = null;
let goals = [];

requireAuth(async (user) => {
  uid = user.uid;
  await loadGoals();
});

async function loadGoals() {
  const snap = await getDocs(query(userCollection(uid, "goals"), orderBy("eventDate")));
  goals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderList();
}

function renderList() {
  clear(listRoot);
  if (goals.length === 0) {
    listRoot.appendChild(el("p", { class: "text-muted" }, "Noch keine Ziele angelegt. Über das Plus oben kannst du eines hinzufügen."));
    return;
  }
  goals.forEach((g) => listRoot.appendChild(renderGoalCard(g)));
}

function renderGoalCard(g) {
  const days = daysUntil(g.eventDate);
  const daysLabel = days === 0 ? "Heute" : days > 0 ? `in ${days} Tagen` : `vor ${Math.abs(days)} Tagen`;

  const head = el("div", { class: "row-between" }, [
    el("div", {}, [
      el("p", { class: "card-title" }, g.title),
      el("p", { class: "card-subtle" }, `${g.raceType} · ${formatDayMonth(g.eventDate)}`),
    ]),
    el("button", {
      type: "button",
      class: "btn-icon",
      html: iconSvg("trash", 15),
      "aria-label": "Ziel löschen",
      onClick: () => removeGoal(g.id),
    }),
  ]);

  const statChildren = [
    el("div", {}, [
      el("p", { style: "font-family:var(--font-data);font-size:1.25rem;font-weight:600;color:var(--flare-400);" }, daysLabel),
      el("p", { class: "card-subtle" }, "Countdown"),
    ]),
  ];
  if (g.targetTimeSec) {
    statChildren.push(
      el("div", {}, [
        el("p", { style: "font-family:var(--font-data);font-size:1.25rem;font-weight:600;color:var(--ink-100);" }, formatSecondsAsClock(g.targetTimeSec)),
        el("p", { class: "card-subtle" }, "Zielzeit"),
      ])
    );
  }
  const statRow = el("div", { class: "row", style: "margin-top:0.9rem;gap:1.75rem;" }, statChildren);

  const children = [head, statRow];
  if (g.notes) children.push(el("p", { class: "text-muted", style: "margin-top:0.75rem;" }, g.notes));

  return card({ accent: "flare", children });
}

async function removeGoal(id) {
  if (!window.confirm("Dieses Ziel wirklich löschen?")) return;
  goals = goals.filter((g) => g.id !== id);
  renderList();
  await deleteDoc(userDoc(uid, "goals", id));
}

function parseTimeToSec(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":").map(Number);
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? null;
}

function renderForm() {
  clear(formRoot);
  const values = { title: "", raceType: RACE_TYPES[0], eventDate: todayIso(), targetTime: "", notes: "" };

  const titleInput = el("input", { class: "input", placeholder: "z.B. Berlin-Marathon", oninput: (e) => (values.title = e.target.value) });
  const dateInput = el("input", { type: "date", class: "input", value: values.eventDate, oninput: (e) => (values.eventDate = e.target.value) });
  const timeInput = el("input", { class: "input", placeholder: "z.B. 3:45:00 (optional)", oninput: (e) => (values.targetTime = e.target.value) });
  const notesInput = el("textarea", { class: "textarea", rows: 2, placeholder: "Notizen (optional)", oninput: (e) => (values.notes = e.target.value) });

  const cancelBtn = el("button", { type: "button", class: "btn btn-ghost" }, "Abbrechen");
  cancelBtn.addEventListener("click", () => {
    formRoot.classList.add("hidden");
    addBtn.classList.remove("hidden");
  });

  const saveBtn = el("button", { type: "button", class: "btn btn-primary" }, "Ziel speichern");
  saveBtn.addEventListener("click", async () => {
    if (!values.title.trim()) {
      titleInput.focus();
      return;
    }
    saveBtn.disabled = true;
    saveBtn.textContent = "Speichern …";
    await addDoc(userCollection(uid, "goals"), {
      title: values.title.trim(),
      raceType: values.raceType,
      eventDate: values.eventDate,
      targetTimeSec: parseTimeToSec(values.targetTime),
      notes: values.notes.trim() || null,
      createdAtMs: Date.now(),
    });
    formRoot.classList.add("hidden");
    addBtn.classList.remove("hidden");
    await loadGoals();
  });

  formRoot.appendChild(
    card({
      className: "stack",
      children: [
        el("div", {}, [el("label", { class: "label" }, "Titel"), titleInput]),
        el("div", {}, [
          el("p", { class: "label" }, "Art"),
          chipGroup(RACE_TYPES.map((r) => ({ value: r, label: r })), values.raceType, (v) => (values.raceType = v), { accent: "flare" }),
        ]),
        el("div", {}, [el("label", { class: "label" }, "Datum"), dateInput]),
        el("div", {}, [el("label", { class: "label" }, "Zielzeit (h:mm:ss, optional)"), timeInput]),
        el("div", {}, [el("label", { class: "label" }, "Notizen"), notesInput]),
        el("div", { class: "row" }, [saveBtn, cancelBtn]),
      ],
    })
  );
}

addBtn.addEventListener("click", () => {
  renderForm();
  formRoot.classList.remove("hidden");
  addBtn.classList.add("hidden");
});
