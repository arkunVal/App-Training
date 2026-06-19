// Zentrale Konstanten der App (Entsprechung zu lib/types.ts in der
// ursprünglichen Version, hier als reine Laufzeit-Werte ohne TypeScript).

export const ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5"];

export const ZONE_LABELS = {
  Z1: "Z1 · Locker",
  Z2: "Z2 · Grundlage",
  Z3: "Z3 · Mittel",
  Z4: "Z4 · Schwellen",
  Z5: "Z5 · Maximal",
};

export const SPORTS = ["Laufen", "Rad", "Schwimmen", "Kraft", "Sonstiges"];

export const RACE_TYPES = ["Marathon", "Halbmarathon", "10km", "5km", "Triathlon", "Sonstiges"];

export const FATIGUE_TAGS = [
  { value: "frisch", label: "Frisch" },
  { value: "ermuedet", label: "Ermüdet" },
  { value: "muskelkater", label: "Muskelkater" },
];

export const STRESS_LEVELS = [
  { value: "niedrig", label: "Niedrig" },
  { value: "medium", label: "Mittel" },
  { value: "hoch", label: "Hoch" },
];

export const SEGMENT_TYPES = [
  { value: "warmup", label: "Aufwärmen" },
  { value: "interval", label: "Intervall" },
  { value: "steady", label: "Dauerbelastung" },
  { value: "cooldown", label: "Cooldown" },
];

export const STRESS_TO_NUM = { niedrig: 1, medium: 2, hoch: 3 };
export const NUM_TO_STRESS_LABEL = { 1: "Niedrig", 2: "Mittel", 3: "Hoch" };
