import { requireAuth } from "./auth-guard.js";
import { renderEnvBadge } from "./env.js";
import { renderBottomNav } from "./nav.js";
import { renderTrainingForm } from "./training-form.js";
import { userCollection, userDoc } from "./firestore-paths.js";
import { getDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from "./firestore.js";
import { todayIso } from "./date-utils.js";
import { el } from "./ui.js";

renderEnvBadge();
renderBottomNav("today.html");

const params = new URLSearchParams(window.location.search);
const trainingId = params.get("id");
const container = document.getElementById("form-root");

function destinationFor(date) {
  return date === todayIso() ? "today.html" : `day.html?date=${date}`;
}

if (!trainingId) {
  container.appendChild(el("p", { class: "text-muted" }, "Kein Training angegeben."));
} else {
  requireAuth(async (user) => {
    const [trainingSnap, goalsSnap] = await Promise.all([
      getDoc(userDoc(user.uid, "trainings", trainingId)),
      getDocs(query(userCollection(user.uid, "goals"), orderBy("eventDate"))),
    ]);

    if (!trainingSnap.exists()) {
      container.appendChild(el("p", { class: "text-muted" }, "Training nicht gefunden."));
      return;
    }

    const initial = trainingSnap.data();
    const goals = goalsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    renderTrainingForm(container, {
      mode: "edit",
      initial,
      goals,
      submitLabel: "Änderungen speichern",
      onSubmit: async (values) => {
        await updateDoc(userDoc(user.uid, "trainings", trainingId), values);
        window.location.href = destinationFor(values.date);
      },
      onDelete: async () => {
        await deleteDoc(userDoc(user.uid, "trainings", trainingId));
        window.location.href = destinationFor(initial.date);
      },
    });
  });
}
