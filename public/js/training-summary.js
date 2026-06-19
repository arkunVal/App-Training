// Erzeugt aus der Segment-Liste eines Trainings eine kurze, lesbare
// Zusammenfassung, z.B. "10min Aufwärmen · 4x 400m / 90s · 10min Cooldown".

function phaseLabel(seg) {
  if (seg.distanceM) {
    return seg.distanceM >= 1000 ? `${(seg.distanceM / 1000).toFixed(1)}km` : `${seg.distanceM}m`;
  }
  if (seg.durationSec) {
    const min = Math.round(seg.durationSec / 60);
    return min > 0 ? `${min}min` : `${seg.durationSec}s`;
  }
  return seg.label ?? "";
}

export function summarizeStructure(structure) {
  if (!structure || structure.length === 0) return "";

  const parts = structure.map((seg) => {
    switch (seg.type) {
      case "warmup":
        return `${phaseLabel(seg) || "Aufwärmen"} Aufwärmen`;
      case "cooldown":
        return `${phaseLabel(seg) || "Cooldown"} Cooldown`;
      case "interval": {
        const work = phaseLabel(seg);
        const restLabel = seg.restDurationSec
          ? seg.restDurationSec < 60
            ? `${seg.restDurationSec}s`
            : `${Math.round(seg.restDurationSec / 60)}min`
          : "";
        return `${seg.repeats ?? 1}x ${work}${restLabel ? ` / ${restLabel}` : ""}`;
      }
      case "steady":
      default:
        return phaseLabel(seg) || seg.label || "Belastung";
    }
  });

  return parts.join(" · ");
}
