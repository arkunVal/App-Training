// Kleine, wiederverwendbare DOM-Bausteine — das Vanilla-JS-Äquivalent zu den
// React-Komponenten in components/ui/ der ursprünglichen Version.
import { iconSvg } from "./icons.js";
import { ZONES } from "./constants.js";

/** Mini-Hyperscript-Helfer: erzeugt ein DOM-Element mit Attributen/Kindern. */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === "string" || typeof child === "number" ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function card({ accent, className = "", children = [] } = {}) {
  const classes = ["card"];
  if (accent) classes.push(`card--accent-${accent}`);
  if (className) classes.push(className);
  return el("div", { class: classes.join(" ") }, children);
}

export function iconButton(name, { className = "btn-icon", size = 16, onClick, ariaLabel } = {}) {
  return el("button", {
    type: "button",
    class: className,
    html: iconSvg(name, size),
    onClick,
    "aria-label": ariaLabel,
  });
}

/** Einzeiliges Chip-Auswahlfeld. options: [{value,label}]. */
export function chipGroup(options, initialValue, onChange, { accent = "ember", allowDeselect = false } = {}) {
  let current = initialValue;
  const container = el("div", { class: "chip-group" });

  function render() {
    container.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.value === String(current));
    });
  }

  options.forEach((opt) => {
    const btn = el(
      "button",
      {
        type: "button",
        class: "chip",
        "data-value": opt.value,
        "data-accent": accent,
        onClick: () => {
          current = allowDeselect && current === opt.value ? null : opt.value;
          render();
          onChange(current);
        },
      },
      opt.label
    );
    container.appendChild(btn);
  });

  render();
  container.setValue = (v) => {
    current = v;
    render();
  };
  container.getValue = () => current;
  return container;
}

export function slider({ label, value, min, max, step = 1, onChange, valueLabel }) {
  const valueEl = el("span", { class: "slider-value" }, valueLabel(value));
  const input = el("input", {
    type: "range",
    min,
    max,
    step,
    value,
    oninput: (e) => {
      const v = Number(e.target.value);
      valueEl.textContent = valueLabel(v);
      onChange(v);
    },
  });
  return el("div", { class: "slider-row" }, [
    el("div", { class: "slider-head" }, [el("span", { class: "slider-label" }, label), valueEl]),
    input,
  ]);
}

export function stepper({ label, value, onChange, step = 1, min = 0, max = 9999, suffix }) {
  let current = value;
  const valueEl = el("span", { class: "stepper-value" });

  function format(v) {
    return Number.isInteger(step) ? String(v) : v.toFixed(1);
  }
  function renderValue() {
    clear(valueEl);
    valueEl.appendChild(document.createTextNode(format(current)));
    if (suffix) valueEl.appendChild(el("span", { class: "suffix" }, suffix));
  }

  const minusBtn = el("button", {
    type: "button",
    class: "stepper-btn",
    html: iconSvg("minus", 16),
    "aria-label": `${label} verringern`,
    onClick: () => {
      current = Math.max(min, round1(current - step));
      renderValue();
      onChange(current);
    },
  });
  const plusBtn = el("button", {
    type: "button",
    class: "stepper-btn",
    html: iconSvg("plus", 16),
    "aria-label": `${label} erhöhen`,
    onClick: () => {
      current = Math.min(max, round1(current + step));
      renderValue();
      onChange(current);
    },
  });

  renderValue();
  const row = el("div", { class: "stepper-row" }, [
    el("span", { class: "stepper-label" }, label),
    el("div", { class: "stepper-controls" }, [minusBtn, valueEl, plusBtn]),
  ]);
  row.setValue = (v) => {
    current = v;
    renderValue();
  };
  row.getValue = () => current;
  return row;
}

export function checkbox({ checked, onChange, accent = "sprout" }) {
  let current = checked;
  const btn = el("button", {
    type: "button",
    class: "checkbox",
    "data-accent": accent,
    html: iconSvg("check", 14),
  });
  function render() {
    btn.classList.toggle("checked", current);
  }
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    current = !current;
    render();
    onChange(current);
  });
  render();
  btn.setChecked = (v) => {
    current = v;
    render();
  };
  return btn;
}

export function zoneBadge(zone) {
  return el("span", { class: `zone-badge ${zone.toLowerCase()}` }, [
    el("span", { class: "dot" }),
    document.createTextNode(zone),
  ]);
}

/** Reihe aus Z1–Z5-Pillen (+ optional "kein Wert"), togglebar. */
export function zonePicker({ value, onChange, label, allowNone = true }) {
  let current = value ?? null;
  const pillRow = el("div", { class: "chip-group" });

  function render() {
    pillRow.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.value === String(current));
    });
  }

  if (allowNone) {
    const noneBtn = el(
      "button",
      {
        type: "button",
        class: "zone-pill",
        "data-value": "null",
        onClick: () => {
          current = null;
          render();
          onChange(null);
        },
      },
      "–"
    );
    pillRow.appendChild(noneBtn);
  }

  ZONES.forEach((z) => {
    const b = el(
      "button",
      {
        type: "button",
        class: "zone-pill",
        "data-value": z,
        onClick: () => {
          current = current === z ? (allowNone ? null : z) : z;
          render();
          onChange(current);
        },
      },
      z
    );
    pillRow.appendChild(b);
  });

  render();
  const wrap = el("div", {}, label ? [el("p", { class: "label" }, label), pillRow] : [pillRow]);
  wrap.setValue = (v) => {
    current = v;
    render();
  };
  return wrap;
}

export function progressBar(value, total, accent = "ember") {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const fillClass = accent === "ember" ? "progress-bar-fill" : `progress-bar-fill ${accent}`;
  const fill = el("div", { class: fillClass });
  fill.style.width = `${pct}%`;
  return el("div", { class: "progress-bar" }, [fill]);
}

export function pageHeader(title, subtitle, actionNode) {
  const left = el("div", {}, [
    el("h1", {}, title),
    subtitle ? el("p", {}, subtitle) : null,
  ]);
  const children = [left];
  if (actionNode) children.push(el("div", {}, actionNode));
  return el("div", { class: "page-header" }, children);
}
