import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { renderTrainingForm } from "./training-form.js";
import { userCollection } from "./firestore-paths.js";
import { getDocs, addDoc, query, orderBy } from "./firestore.js";
import { todayIso } from "./date-utils.js";

renderEnvBadge();
renderBottomNav("today.html");

const params = new URLSearchParams(window.location.search);
const defaultDate = params.get("date") || todayIso();
const container = document.getElementById("form-root");

function destinationFor(date) {
  return date === todayIso() ? "today.html" : `day.html?date=${date}`;
}

requireAuth(async (user) => {
  const goalsSnap = await getDocs(query(userCollection(user.uid, "goals"), orderBy("eventDate")));
  const goals = goalsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  renderTrainingForm(container, {
    mode: "create",
    goals,
    defaultDate,
    submitLabel: "Training anlegen",
    onSubmit: async (values) => {
      await addDoc(userCollection(user.uid, "trainings"), { ...values, status: "geplant", createdAtMs: Date.now() });
      window.location.href = destinationFor(values.date);
    },
  });
});
