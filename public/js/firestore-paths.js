// Baut Firestore-Referenzen innerhalb eines eigenen Bereichs für diese App
// (apps/trainingsApp), getrennt nach Umgebung (envs/prod bzw. envs/dev) und
// nach Nutzer (users/{uid}). So bleiben die Daten dieser App von eventuell
// anderen Apps im selben Firebase-Projekt getrennt, und Test-/Dev-Daten
// vermischen sich nie mit den echten Produktionsdaten.
//
// Pfadschema: apps/trainingsApp/envs/{env}/users/{uid}/<sammlung>/<id>
import { collection, doc } from "./firestore.js";
import { db } from "./firebase-init.js";
import { getEnv } from "./env.js";

export function userRootRef(uid) {
  return doc(db, "apps", "trainingsApp", "envs", getEnv(), "users", uid);
}

export function userCollection(uid, name) {
  return collection(userRootRef(uid), name);
}

export function userDoc(uid, collectionName, docId) {
  return doc(userCollection(uid, collectionName), docId);
}

export const COLLECTIONS = {
  morningReports: "morningReports",
  todos: "todos",
  trainings: "trainings",
  goals: "goals",
  weeklyNotes: "weeklyNotes",
  profile: "profile",
};
