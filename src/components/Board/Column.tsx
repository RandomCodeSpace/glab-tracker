import { useDroppable } from "@dnd-kit/core";
import type { Issue, ColumnState } from "../../types/tracker";
import { Card } from "../Card/Card";

export interface ColumnProps {
  state: ColumnState;
  name: string;
  issues: Issue[];
  selectedIid: number | null;
  sourceUrlFor: (issue: Issue) => string | null;
  onSelectIssue: (iid: number) => void;
  onClearFlag: (iid: number, flag: "blocked" | "reviewing") => void;
  onOpenNotes: (iid: number) => void;
  totalWeight: number;
}

export function Column(props: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${props.state}`,
    data: { kind: "column", state: props.state },
  });
  return (
    <div className="tracker-col" data-state={props.state}>
      <div className="tracker-col__head">
        <span className="tracker-col__name">{props.name}</span>
        <span className="tracker-col__count">{props.issues.length}</span>
        {props.totalWeight > 0 && (
          <span className="tracker-col__extras">
            total weight <span className="tracker-col__num">w{props.totalWeight}</span>
          </span>
        )}
      </div>
      <div className={`tracker-col__list${isOver ? " is-over" : ""}`} ref={setNodeRef}>
        {props.issues.map((i) => (
          <Card
            key={i.iid}
            issue={i}
            sourceUrl={props.sourceUrlFor(i)}
            isActive={props.selectedIid === i.iid}
            onSelect={() => props.onSelectIssue(i.iid)}
            onClearFlag={(f) => props.onClearFlag(i.iid, f)}
            onOpenNotes={() => props.onOpenNotes(i.iid)}
          />
        ))}
      </div>
    </div>
  );
}
