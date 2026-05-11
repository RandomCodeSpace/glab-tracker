import { useRef } from "react";
import type { Issue, ColumnState } from "../../types/tracker";
import { Column } from "./Column";
import { MobileNav } from "./MobileNav";

const ORDER: ColumnState[] = ["todo", "doing", "done"];
const NAMES: Record<ColumnState, string> = {
  todo: "To do", doing: "In Progress", done: "Done", cancelled: "Cancelled",
};

export interface BoardProps {
  issues: Issue[];
  selectedIid: number | null;
  webUrlFor: (issue: Issue) => string;
  onSelectIssue: (iid: number) => void;
  onClearFlag: (iid: number, flag: "blocked" | "reviewing") => void;
  onOpenNotes: (iid: number) => void;
}

function sortIssues(issues: Issue[]): Issue[] {
  const rank = (i: Issue) => {
    if (i.flags.has("blocked")) return 2;
    if (i.flags.has("reviewing")) return 0;
    return 1;
  };
  return [...issues].sort((a, b) => rank(a) - rank(b));
}

export function Board(props: BoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const counts: Record<ColumnState, number> = { todo: 0, doing: 0, done: 0, cancelled: 0 };
  for (const i of props.issues) counts[i.state] += 1;

  return (
    <div className="tracker-boardwrap">
      <MobileNav order={ORDER} names={NAMES} counts={counts} scrollRef={scrollRef} />
      <div className="tracker-board" ref={scrollRef}>
        {ORDER.map((s) => {
          const inCol = sortIssues(props.issues.filter((i) => i.state === s));
          return (
            <Column
              key={s}
              state={s}
              name={NAMES[s]}
              issues={inCol}
              selectedIid={props.selectedIid}
              webUrlFor={props.webUrlFor}
              onSelectIssue={props.onSelectIssue}
              onClearFlag={props.onClearFlag}
              onOpenNotes={props.onOpenNotes}
            />
          );
        })}
      </div>
    </div>
  );
}
