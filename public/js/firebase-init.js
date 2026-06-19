// Firebase-Initialisierung. Wird per ES-Modul-Import von jeder Seite aus
// genutzt (kein Build-Schritt nötig — die Firebase-SDKs werden direkt als
// ES-Module von Googles CDN geladen).
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  getAnalytics,
  isSupported as analyticsIsSupported,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBd1Xk01pEMMAbbRr_QoSQH2ldGE3WmW6w",
  authDomain: "trainings-app-a94c0.firebaseapp.com",
  projectId: "trainings-app-a94c0",
  storageBucket: "trainings-app-a94c0.firebasestorage.app",
  messagingSenderId: "712000787514",
  appId: "1:712000787514:web:6e88eb36aa5ecdbf629103",
  measurementId: "G-W7CSRSV1C7",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics ist optional und funktioniert nur unter bestimmten Bedingungen
// (z.B. nicht bei file://-Aufruf ohne https). Schlägt es fehl, läuft die
// App trotzdem ganz normal weiter.
analyticsIsSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {});
