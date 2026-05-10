import { Markdown } from "../../utils/markdown";

export interface StreamNote {
  author: string;
  createdAt: string;
  body: string;
  system: boolean;
}

const SNAPSHOT_RE = /^```\nstate: (?:opened|closed)\n/;

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

export function Stream({ notes }: { notes: StreamNote[] }) {
  return (
    <div className="tracker-drawer__stream">
      {notes.map((n, i) => {
        const isSnapshot = SNAPSHOT_RE.test(n.body);
        return (
          <div className="tracker-drawer__entry" key={i}>
            <div className="tracker-drawer__entry-head">
              {isSnapshot ? (
                <span className="tracker-drawer__entry-kind">Source snapshot</span>
              ) : (
                <span className="tracker-drawer__entry-who">{n.author}</span>
              )}
              <span>{formatTimestamp(n.createdAt)}</span>
            </div>
            <div className="tracker-drawer__entry-body">
              <Markdown>{n.body}</Markdown>
            </div>
          </div>
        );
      })}
    </div>
  );
}
