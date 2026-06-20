// Kleines, selbst gezeichnetes Icon-Set im Strich-Stil (24x24, currentColor).
// Bewusst ohne externe Icon-Bibliothek, damit das Projekt zu 100% aus
// eigenem HTML/CSS/JS besteht.

const PATHS = {
  house: '<path d="M4 11L12 4L20 11"/><path d="M6 11V20H18V11"/><path d="M10 20V14H14V20"/>',
  calendar:
    '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5H20"/><path d="M8 3V6"/><path d="M16 3V6"/>',
  barChart: '<path d="M5 19V12"/><path d="M12 19V7"/><path d="M19 19V14"/>',
  sliders:
    '<path d="M4 7H20"/><circle cx="9" cy="7" r="2"/><path d="M4 12H20"/><circle cx="15" cy="12" r="2"/><path d="M4 17H20"/><circle cx="11" cy="17" r="2"/>',
  plus: '<path d="M12 5V19"/><path d="M5 12H19"/>',
  minus: '<path d="M5 12H19"/>',
  check: '<path d="M5 13L9 17L19 7"/>',
  x: '<path d="M6 6L18 18"/><path d="M18 6L6 18"/>',
  chevronLeft: '<path d="M15 5L8 12L15 19"/>',
  chevronRight: '<path d="M9 5L16 12L9 19"/>',
  trash: '<path d="M5 7H19"/><path d="M9 7V5H15V7"/><path d="M7 7L8 20H16L17 7"/>',
  pencil:
    '<path d="M4 20L4.8 16.5L15 6.3C15.6 5.7 16.6 5.7 17.2 6.3L17.7 6.8C18.3 7.4 18.3 8.4 17.7 9L7.5 19.2L4 20Z"/>',
  moon: '<path d="M19 13.5A7.5 7.5 0 1 1 10.5 5 6 6 0 0 0 19 13.5Z"/>',
  zap: '<path d="M13 3L6 14H11L10 21L18 10H13L13 3Z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  activity: '<path d="M3 12H7L9.5 6L14 18L16.5 12H21"/>',
  bike:
    '<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="M6 17L11 8H15M11 8L14 13H18M9 17H14L11 8"/>',
  waves:
    '<path d="M3 9C5 7 7 7 9 9S13 11 15 9 19 7 21 9"/><path d="M3 15C5 13 7 13 9 15S13 17 15 15 19 13 21 15"/>',
  dumbbell:
    '<path d="M4 12H20"/><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><rect x="6" y="7" width="2.5" height="10" rx="1"/><rect x="15.5" y="7" width="2.5" height="10" rx="1"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  logOut: '<path d="M9 4H5V20H9"/><path d="M13 12H21"/><path d="M18 8L22 12L18 16"/>',
  sparkles: '<path d="M12 3L13.2 8.8L19 10L13.2 11.2L12 17L10.8 11.2L5 10L10.8 8.8L12 3Z"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20C5 16.5 8 14 12 14S19 16.5 19 20"/>',
  scale: '<circle cx="12" cy="13" r="7"/><path d="M12 13L15 10"/><path d="M9 4H15"/>',
  ruler: '<path d="M5 16L16 5L19 8L8 19L5 16Z"/><path d="M9.5 11.5L11.5 13.5"/><path d="M12 9L14 11"/><path d="M14.5 6.5L16.5 8.5"/>',
  arrowRight: '<path d="M5 12H19"/><path d="M13 6L19 12L13 18"/>',
};

export function iconSvg(name, size = 18) {
  const inner = PATHS[name] ?? PATHS.circle;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

export const SPORT_ICONS = {
  Laufen: "activity",
  Rad: "bike",
  Schwimmen: "waves",
  Kraft: "dumbbell",
  Sonstiges: "circle",
};
