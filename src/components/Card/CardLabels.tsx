import type { UserLabel } from "../../types/tracker";
import { Chip } from "../Chip";

export function CardLabels({ labels }: { labels: UserLabel[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="tracker-card__labels">
      {labels.map((l) => (
        <Chip key={l.name} name={l.name} hue={l.hue} />
      ))}
    </div>
  );
}
