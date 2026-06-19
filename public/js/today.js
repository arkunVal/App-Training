import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { renderDayView } from "./day-view.js";
import { todayIso, weekdayLong, formatDayMonth } from "./date-utils.js";

renderEnvBadge();
renderBottomNav("today.html");

const date = todayIso();
document.getElementById("date-label").textContent = `${weekdayLong(date)}, ${formatDayMonth(date)}`;

requireAuth(async (user) => {
  await renderDayView(document.getElementById("day-view-root"), { uid: user.uid, date, editable: true });
});
