import type { UserLabel } from "../../types/tracker";
import { Chip } from "../Chip";

const MAX_VISIBLE = 3;

export function CardLabels({ labels }: { labels: UserLabel[] }) {
  if (labels.length === 0) return null;
  const visible = labels.slice(0, MAX_VISIBLE);
  const overflow = labels.length - visible.length;
  return (
    <div className="tracker-card__labels">
      {visible.map((l) => (
        <Chip key={l.name} name={l.name} hue={l.hue} />
      ))}
      {overflow > 0 ? (
        <span
          className="tracker-card__label-more"
          title={labels.slice(MAX_VISIBLE).map((l) => l.name).join(", ")}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
