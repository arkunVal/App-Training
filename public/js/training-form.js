// Baut das komplette Trainingsformular inkl. Struktur-Editor (Aufwärmen /
// Intervalle / Cooldown). Wird sowohl für "Neues Training" als auch für
// "Training bearbeiten" verwendet (Parameter `mode`).
import { el, clear, card, chipGroup, stepper, zonePicker } from "./ui.js";
import { iconSvg } from "./icons.js";
import { SPORTS, SEGMENT_TYPES } from "./constants.js";
import { todayIso } from "./date-utils.js";

function minutesFromSec(sec) {
  return sec ? Math.round(sec / 60) : 0;
}

function newSegment(type = "steady") {
  return { id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type };
}

function renderSegmentCard(seg, onTypeChanged, onRemove) {
  const body = el("div", { class: "stack-sm" });

  function renderBody() {
    clear(body);
    if (seg.type === "interval") {
      body.appendChild(
        stepper({
          label: "Wiederholungen",
          value: seg.repeats ?? 4,
          min: 1,
          max: 50,
          onChange: (v) => (seg.repeats = v),
        })
      );
      body.appendChild(
        stepper({
          label: "Belastung (min)",
          value: minutesFromSec(seg.durationSec),
          min: 0,
          max: 60,
          onChange: (v) => (seg.durationSec = v * 60),
        })
      );
      body.appendChild(
        zonePicker({ value: seg.zone, label: "Zone Belastung", onChange: (z) => (seg.zone = z) })
      );
      body.appendChild(
        stepper({
          label: "Erholung (min)",
          value: minutesFromSec(seg.restDurationSec),
          min: 0,
          max: 30,
          onChange: (v) => (seg.restDurationSec = v * 60),
        })
      );
      body.appendChild(
        zonePicker({ value: seg.restZone, label: "Zone Erholung", onChange: (z) => (seg.restZone = z) })
      );
    } else {
      body.appendChild(
        stepper({
          label: "Dauer (min)",
          value: minutesFromSec(seg.durationSec),
          min: 0,
          max: 240,
          onChange: (v) => (seg.durationSec = v * 60),
        })
      );
      body.appendChild(zonePicker({ value: seg.zone, label: "Zone", onChange: (z) => (seg.zone = z) }));
      body.appendChild(
        el("input", {
          class: "input input-sm",
          value: seg.description ?? "",
          placeholder: "Notiz (optional)",
          oninput: (e) => (seg.description = e.target.value),
        })
      );
    }
  }
  renderBody();

  const head = el("div", { class: "segment-card-head" }, [
    el("span", { class: "seg-index" }, "Segment"),
    el("button", { type: "button", class: "btn-icon", html: iconSvg("x", 14), onClick: onRemove }),
  ]);

  const typeChips = chipGroup(SEGMENT_TYPES, seg.type, (v) => {
    seg.type = v;
    renderBody();
    onTypeChanged();
  });

  return el("div", { class: "segment-card" }, [head, el("div", { class: "stack-sm" }, [typeChips]), body]);
}

function renderSegmentsSection(structure) {
  const wrap = el("div", { class: "stack-sm" });

  function render() {
    clear(wrap);
    structure.forEach((seg, idx) => {
      wrap.appendChild(
        renderSegmentCard(
          seg,
          () => render(),
          () => {
            structure.splice(idx, 1);
            render();
          }
        )
      );
    });
    wrap.appendChild(
      el(
        "button",
        {
          type: "button",
          class: "btn btn-secondary",
          onClick: () => {
            structure.push(newSegment());
            render();
          },
        },
        "+ Segment hinzufügen"
      )
    );
  }
  render();
  return wrap;
}

/**
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {"create"|"edit"} options.mode
 * @param {Object} options.initial - vorausgefüllte Werte
 * @param {Array} options.goals
 * @param {string} options.defaultDate
 * @param {string} options.submitLabel
 * @param {(values: Object) => Promise<void>} options.onSubmit
 * @param {(() => Promise<void>)|null} options.onDelete
 */
export function renderTrainingForm(container, options) {
  const { mode, initial = {}, goals = [], defaultDate, submitLabel, onSubmit, onDelete } = options;

  const values = {
    title: initial.title ?? "Training",
    sport: initial.sport ?? "Laufen",
    date: initial.date ?? defaultDate ?? todayIso(),
    goalId: initial.goalId ?? null,
    targetZone: initial.targetZone ?? null,
    plannedDurationMin: initial.plannedDurationMin ?? 0,
    plannedDistanceKm: initial.plannedDistanceKm ?? 0,
    structure: (initial.structure ?? []).map((s) => ({ ...s })),
    notes: initial.notes ?? "",
    status: initial.status ?? "geplant",
    actualDurationMin: initial.actualDurationMin ?? initial.plannedDurationMin ?? 0,
    actualDistanceKm: initial.actualDistanceKm ?? initial.plannedDistanceKm ?? 0,
    rpe: initial.rpe ?? 5,
  };

  clear(container);

  // --- Basis ---
  const titleInput = el("input", {
    class: "input",
    value: values.title,
    oninput: (e) => (values.title = e.target.value),
  });
  const dateInput = el("input", {
    type: "date",
    class: "input",
    value: values.date,
    oninput: (e) => (values.date = e.target.value),
  });

  const basisChildren = [
    el("div", {}, [el("label", { class: "label" }, "Titel"), titleInput]),
    el("div", {}, [
      el("p", { class: "label" }, "Sportart"),
      chipGroup(SPORTS.map((s) => ({ value: s, label: s })), values.sport, (v) => (values.sport = v)),
    ]),
    el("div", {}, [el("label", { class: "label" }, "Datum"), dateInput]),
  ];

  if (goals.length > 0) {
    const goalOptions = [{ value: "none", label: "Kein Ziel" }, ...goals.map((g) => ({ value: g.id, label: g.title }))];
    basisChildren.push(
      el("div", {}, [
        el("p", { class: "label" }, "Verknüpftes Ziel (optional)"),
        chipGroup(goalOptions, values.goalId ?? "none", (v) => (values.goalId = v === "none" ? null : v), {
          accent: "flare",
        }),
      ])
    );
  }

  const basisCard = card({ className: "stack", children: basisChildren });

  // --- Geplante Zielwerte ---
  const targetCard = card({
    className: "stack",
    children: [
      el("p", { class: "card-title" }, "Geplante Zielwerte"),
      zonePicker({ value: values.targetZone, label: "Ziel-Zone (optional)", onChange: (z) => (values.targetZone = z) }),
      stepper({
        label: "Dauer (min)",
        value: values.plannedDurationMin,
        step: 5,
        max: 600,
        onChange: (v) => (values.plannedDurationMin = v),
      }),
      stepper({
        label: "Distanz (km)",
        value: values.plannedDistanceKm,
        step: 0.5,
        max: 300,
        onChange: (v) => (values.plannedDistanceKm = v),
      }),
    ],
  });

  // --- Struktur ---
  const structureBlock = el("div", {}, [
    el("p", { class: "card-title", style: "margin: 0 0 0.75rem 0.25rem;" }, "Struktur"),
    renderSegmentsSection(values.structure),
  ]);

  // --- Notizen ---
  const notesTextarea = el("textarea", {
    class: "textarea",
    rows: 3,
    oninput: (e) => (values.notes = e.target.value),
  });
  notesTextarea.value = values.notes;
  const notesCard = card({ children: [el("label", { class: "label" }, "Notizen"), notesTextarea] });

  const formChildren = [basisCard, targetCard, structureBlock, notesCard];

  // --- Abschluss (nur beim Bearbeiten) ---
  if (mode === "edit") {
    const rpeValueEl = el("span", { class: "slider-value" }, `${values.rpe} / 10`);
    const rpeInput = el("input", {
      type: "range",
      min: 1,
      max: 10,
      value: values.rpe,
      oninput: (e) => {
        values.rpe = Number(e.target.value);
        rpeValueEl.textContent = `${values.rpe} / 10`;
      },
    });

    const completionCard = card({
      accent: "ember",
      className: "stack",
      children: [
        el("p", { class: "card-title" }, "Abschluss"),
        chipGroup(
          [
            { value: "geplant", label: "Geplant" },
            { value: "erledigt", label: "Erledigt" },
          ],
          values.status,
          (v) => (values.status = v)
        ),
        stepper({
          label: "Tatsächliche Dauer (min)",
          value: values.actualDurationMin,
          step: 5,
          max: 600,
          onChange: (v) => (values.actualDurationMin = v),
        }),
        stepper({
          label: "Tatsächliche Distanz (km)",
          value: values.actualDistanceKm,
          step: 0.5,
          max: 300,
          onChange: (v) => (values.actualDistanceKm = v),
        }),
        el("div", {}, [
          el("div", { class: "slider-head" }, [el("span", { class: "slider-label" }, "Anstrengung (RPE)"), rpeValueEl]),
          rpeInput,
        ]),
      ],
    });
    formChildren.push(completionCard);
  }

  // --- Speichern-Button ---
  const submitBtn = el("button", { type: "button", class: "btn btn-primary" }, submitLabel);
  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    const original = submitBtn.textContent;
    submitBtn.textContent = "Speichern …";
    try {
      await onSubmit(values);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });
  formChildren.push(submitBtn);

  if (mode === "edit" && onDelete) {
    const deleteBtn = el(
      "button",
      { type: "button", class: "btn btn-ghost text-error", style: "margin-top: 0.5rem;" },
      [el("span", { html: iconSvg("trash", 15), style: "margin-right:0.4rem;display:inline-flex;vertical-align:-2px;" }), "Training löschen"]
    );
    deleteBtn.addEventListener("click", async () => {
      if (!window.confirm("Dieses Training wirklich löschen?")) return;
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Löschen …";
      await onDelete();
    });
    formChildren.push(deleteBtn);
  }

  container.appendChild(el("div", { class: "stack" }, formChildren));
}
