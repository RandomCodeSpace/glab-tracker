import type { Issue, ColumnState } from "../../types/tracker";
import { Column } from "./Column";

const ORDER: ColumnState[] = ["todo", "doing", "done"];
const NAMES: Record<ColumnState, string> = {
  todo: "To do", doing: "Doing", done: "Done", cancelled: "Cancelled",
};

export interface BoardProps {
  issues: Issue[];
  selectedIid: number | null;
  sourceUrlFor: (issue: Issue) => string | null;
  onSelectIssue: (iid: number) => void;
  onClearFlag: (iid: number, flag: "blocked" | "reviewing") => void;
  onOpenNotes: (iid: number) => void;
}

function sortIssues(issues: Issue[]): Issue[] {
  // reviewing-only first, then plain, then blocked (with or without reviewing)
  const rank = (i: Issue) => {
    if (i.flags.has("blocked")) return 2;
    if (i.flags.has("reviewing")) return 0;
    return 1;
  };
  return [...issues].sort((a, b) => rank(a) - rank(b));
}

export function Board(props: BoardProps) {
  return (
    <div className="tracker-board">
      {ORDER.map((s) => {
        const inCol = sortIssues(props.issues.filter((i) => i.state === s));
        const totalWeight = inCol.reduce((sum, i) => sum + (i.weight ?? 0), 0);
        return (
          <Column
            key={s}
            state={s}
            name={NAMES[s]}
            issues={inCol}
            selectedIid={props.selectedIid}
            sourceUrlFor={props.sourceUrlFor}
            onSelectIssue={props.onSelectIssue}
            onClearFlag={props.onClearFlag}
            onOpenNotes={props.onOpenNotes}
            totalWeight={totalWeight}
          />
        );
      })}
    </div>
  );
}
