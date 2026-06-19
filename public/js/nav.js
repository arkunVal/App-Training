// Rendert die untere Navigationsleiste mit den vier Bereichen Eingang,
// Woche, Zusammenfassung und Einstellungen.
import { el } from "./ui.js";
import { iconSvg } from "./icons.js";

const ITEMS = [
  { href: "today.html", label: "Eingang", icon: "house", match: ["today.html", "day.html", "training-new.html", "training-edit.html", "index.html"] },
  { href: "week.html", label: "Woche", icon: "calendar", match: ["week.html"] },
  { href: "summary.html", label: "Zusammenfassung", icon: "barChart", match: ["summary.html"] },
  { href: "settings.html", label: "Einstellungen", icon: "sliders", match: ["settings.html"] },
];

export function renderBottomNav(currentPage) {
  const inner = el(
    "div",
    { class: "bottom-nav-inner" },
    ITEMS.map((item) => {
      const active = item.match.includes(currentPage);
      return el(
        "a",
        { href: item.href, class: `bottom-nav-item${active ? " active" : ""}` },
        [el("span", { html: iconSvg(item.icon, 22) }), el("span", {}, item.label)]
      );
    })
  );
  const nav = el("nav", { class: "bottom-nav" }, [inner]);
  document.body.appendChild(nav);
}
