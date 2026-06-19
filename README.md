# Trainings- & Life-Log (Firebase-Version)

Privates Trainings- & Life-Log als Web-App. Komplett in **reinem HTML, CSS
und JavaScript** geschrieben — kein Framework, kein Build-Schritt, kein
`npm run build`. Gehostet als statische Web-App auf **Vercel**; die
Firebase-SDKs werden direkt als ES-Module von Googles CDN geladen.
Backend ist **Firebase** (Auth + Firestore).

Die KI-Screenshot-Funktion aus der ursprünglichen Planung wurde entfernt —
Trainings werden ausschließlich manuell angelegt.

## Projektstruktur

```
training-app-firebase/
├── vercel.json              Vercel-Hosting-Konfiguration (statisch, kein Build)
├── firebase.json            Nur noch für Firestore-Regeln-Deployment
├── .firebaserc              Firebase-Projektzuordnung
├── firestore.rules          Sicherheitsregeln
└── public/                  Alles, was ausgeliefert wird (Vercel "Output Directory")
    ├── index.html           Einstiegspunkt, leitet zu today.html oder login.html weiter
    ├── login.html           Anmelden / Registrieren
    ├── today.html           Heute-Ansicht (Morgenbericht, Trainings, To-Dos)
    ├── day.html             Beliebiger Tag (read-only bzgl. Morgenbericht)
    ├── week.html            Wochenstreifen + Monatsansicht
    ├── goals.html            Ziele/Wettkämpfe mit Countdown
    ├── summary.html         Wochenzusammenfassung mit Chart
    ├── settings.html        Profil, HF-/Pace-Zonen, Umgebungs-Umschalter
    ├── morning-report.html  Morgenbericht-Formular
    ├── training-new.html    Neues Training anlegen
    ├── training-edit.html   Training bearbeiten/abschließen/löschen
    ├── manifest.json, icon.svg
    ├── css/styles.css        Komplettes Design-System (Dark Mode)
    └── js/                   Alle Module (siehe unten)
```

### Die wichtigsten JS-Module

| Datei | Zweck |
|---|---|
| `firebase-init.js` | Initialisiert Firebase mit der App-Konfiguration |
| `env.js` | Erkennt/verwaltet die Umgebung (`prod` / `dev`) |
| `firestore-paths.js` | Baut Firestore-Pfade im eigenen App-Bereich |
| `auth-guard.js` | Schützt Seiten, leitet bei fehlendem Login um |
| `firestore.js`, `auth.js` | Schlanke Re-Exports der Firebase-SDK-Funktionen |
| `day-view.js` | Tagesansicht (wiederverwendet von today.html & day.html) |
| `training-form.js` | Trainingsformular inkl. Struktur-/Segment-Editor |
| `ui.js`, `icons.js`, `nav.js` | Wiederverwendbare UI-Bausteine, eigenes Icon-Set, Navigation |
| `date-utils.js`, `format.js` | Datums- und Formatierungs-Hilfsfunktionen |

## Firestore-Datenmodell

Alle Daten dieser App liegen in einem eigenen, abgegrenzten Bereich, getrennt
nach Umgebung und Nutzer:

```
apps/trainingsApp/envs/{prod|dev}/users/{uid}/
  ├── profile/main              Profil, HF-Zonen, Pace-Zonen
  ├── morningReports/{date}     Ein Dokument pro Tag (ID = YYYY-MM-DD)
  ├── todos/{id}                 To-Dos mit date-Feld
  ├── trainings/{id}             Trainings mit date-Feld + structure[]
  ├── goals/{id}                 Ziele mit eventDate
  └── weeklyNotes/{weekStart}    Wochenrückblick (ID = Montag der Woche)
```

So bleiben die Daten dieser App von eventuell anderen Apps im selben
Firebase-Projekt getrennt — und Produktions- und Testdaten vermischen sich
nie.

## Dev-/Test-Umgebung

Damit du neue Versionen der App ausprobieren kannst, ohne deine echten
Trainingsdaten zu verändern, unterscheidet die App zwei Umgebungen:

- **`prod`** — deine echten Daten
- **`dev`** — komplett getrennter Datenbereich zum Testen

Das ist komplett unabhängig davon, wo die App gehostet wird (Vercel ändert
daran nichts) — die Trennung passiert rein über den Firestore-Datenpfad.

**So wechselst du die Umgebung:**

1. **Über die Einstellungen** — in den Einstellungen gibt es einen Umschalter
   "Umgebung" (Produktion/Entwicklung). Die Wahl wird im Browser gespeichert
   und bleibt bis zur nächsten Änderung erhalten.
2. **Über die URL** — `https://deine-app.vercel.app/today.html?env=dev` öffnet
   die App direkt in der Entwicklungsumgebung (wird ebenfalls gemerkt).
3. **Über ein zweites Vercel-Projekt** (optional, für eine wirklich separate
   URL) — siehe unten.

Ist die Dev-Umgebung aktiv, zeigt ein gelber Hinweisbalken oben auf jeder
Seite "🧪 Entwicklungsumgebung".

### Optional: eigene URL für die Dev-Umgebung

Falls du eine komplett eigene URL für Testversionen möchtest, kannst du in
Vercel einfach ein zweites Projekt aus demselben Repository anlegen, z.B.
mit dem Projektnamen `trainings-app-dev`. Vercel vergibt dann automatisch
eine Domain wie `trainings-app-dev.vercel.app` — und weil der Hostname
"dev" enthält, erkennt `env.js` automatisch die Entwicklungsumgebung, ganz
ohne zusätzlichen Code oder URL-Parameter.

**Wichtig bei Vercel Preview-Deployments:** Pull-Request- bzw.
Branch-Previews bekommen von Vercel zufällige Hostnamen (z.B.
`trainings-app-abc123.vercel.app`), die nicht automatisch als "dev" erkannt
werden. Öffne solche Previews lieber direkt mit `?env=dev` am Ende der URL,
damit du nicht versehentlich gegen deine Produktionsdaten testest.

## Setup & Deployment

Die App läuft als **statische Web-App auf Vercel** (kein Build-Schritt
nötig). Firebase liefert im Hintergrund Login (Auth) und Datenbank
(Firestore).

### 1. Firebase einmalig vorbereiten

Voraussetzung: [Firebase CLI](https://firebase.google.com/docs/cli)
(`npm install -g firebase-tools`) und ein Firebase-Account mit Zugriff auf
das Projekt `trainings-app-a94c0`.

```bash
firebase login
cd training-app-firebase
firebase deploy --only firestore:rules
```

In der [Firebase Console](https://console.firebase.google.com/) unter
**Authentication → Sign-in method** die Methode **E-Mail/Passwort**
aktivieren. Die App nutzt ausschließlich E-Mail/Passwort-Login.

### 2. Auf Vercel deployen

**Über die Vercel-Weboberfläche (einfachster Weg):**

1. Repository (das den Inhalt dieses Projekts enthält) bei
   [vercel.com](https://vercel.com) importieren.
2. Vercel erkennt `vercel.json` automatisch — kein Framework-Preset, keine
   Build-Befehle nötig, es wird einfach der Inhalt von `public/` ausgeliefert.
3. Deploy klicken.

**Über die Vercel CLI:**

```bash
npm install -g vercel
cd training-app-firebase
vercel        # erstellt ein Preview-Deployment
vercel --prod # deployt auf die Produktions-Domain
```

### 3. Wichtig: Vercel-Domain bei Firebase freischalten

Firebase Auth akzeptiert standardmäßig nur bestimmte Domains. Damit sich
Nutzer auf der Vercel-URL anmelden können, musst du diese einmalig
freischalten:

In der [Firebase Console](https://console.firebase.google.com/) unter
**Authentication → Settings → Authorized domains → Add domain** die
Vercel-Domain eintragen, z.B. `trainings-app-a94c0.vercel.app` (und ggf.
deine eigene Domain, falls du eine custom Domain in Vercel einrichtest).
Ohne diesen Schritt schlägt die Anmeldung mit dem Fehler
`auth/unauthorized-domain` fehl.

### Lokal testen

Da die App keinen Build-Schritt benötigt, reicht ein einfacher statischer
Server:

```bash
cd public
python3 -m http.server 5173
# oder: vercel dev
```

Dann `http://localhost:5173` öffnen. Da `localhost` automatisch als
Dev-Umgebung erkannt wird, landen lokale Tests automatisch im getrennten
Dev-Datenbereich. (Für `localhost` mit Firebase Auth ist keine zusätzliche
Freischaltung nötig — das ist bei Firebase standardmäßig autorisiert.)

## Design

Dunkles, mobiles Design mit vier Hauptbereichen über eine Bottom-Navigation:
Eingang (Heute), Woche, Zusammenfassung, Einstellungen. Farbkodierung:
Orange = Kalender/Training, Blau = Wochenberichte/Schlaf, Weichrot = Ziele.
Eine einheitliche Z1–Z5-Zonenfarbskala (Blau → Grün → Gelb → Orange → Rot)
zieht sich durch die gesamte App.
