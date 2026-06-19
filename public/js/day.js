import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { renderDayView } from "./day-view.js";
import { todayIso, weekdayLong, formatDayMonth, isTodayIso } from "./date-utils.js";

const params = new URLSearchParams(window.location.search);
const date = params.get("date") || todayIso();

if (isTodayIso(date)) {
  window.location.replace("today.html");
} else {
  renderEnvBadge();
  renderBottomNav("day.html");
  document.getElementById("date-title").textContent = weekdayLong(date);
  document.getElementById("date-sub").textContent = formatDayMonth(date);

  requireAuth(async (user) => {
    await renderDayView(document.getElementById("day-view-root"), { uid: user.uid, date, editable: false });
  });
}
