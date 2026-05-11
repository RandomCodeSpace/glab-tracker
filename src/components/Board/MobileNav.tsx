import { useEffect, useState, type RefObject } from "react";
import type { ColumnState } from "../../types/tracker";

export interface MobileNavProps {
  order: ColumnState[];
  names: Record<ColumnState, string>;
  counts: Record<ColumnState, number>;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export function MobileNav({ order, names, counts, scrollRef }: MobileNavProps) {
  const [active, setActive] = useState<ColumnState>(order[0] ?? "todo");

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) {
          const s = (top.target as HTMLElement).dataset["state"] as ColumnState | undefined;
          if (s) setActive(s);
        }
      },
      { root, threshold: [0.5, 0.75, 1] },
    );
    root.querySelectorAll<HTMLElement>(".tracker-col").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [scrollRef]);

  const onClick = (s: ColumnState) => {
    const root = scrollRef.current;
    if (!root) return;
    const idx = order.indexOf(s);
    if (idx < 0) return;
    root.scrollTo({ left: idx * root.clientWidth, behavior: "smooth" });
  };

  return (
    <nav className="tracker-mobnav" role="tablist" aria-label="Board columns">
      {order.map((s) => (
        <button
          key={s}
          type="button"
          role="tab"
          aria-selected={active === s}
          className={`tracker-mobnav__tab${active === s ? " is-active" : ""}`}
          data-state={s}
          onClick={() => onClick(s)}
        >
          <span className="tracker-mobnav__name">{names[s]}</span>
          <span className="tracker-mobnav__count">{counts[s]}</span>
        </button>
      ))}
    </nav>
  );
}
