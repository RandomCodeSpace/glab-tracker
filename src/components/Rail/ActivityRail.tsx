import { Icon, type IconName } from "../Icon";

// Activity rail — VS-Code-style 48px nav. Opt-in (gated by .tracker[data-rail="on"]),
// hidden on mobile. Presentational: every button maps to an existing action/toggle
// passed in by Tracker. No store access, no new data.

export interface ActivityRailProps {
  theme: "dark" | "light";
  crt: boolean;
  hasSelection: boolean;
  onFocusBoard: () => void;
  onNewIssue: () => void;
  onFocusFilter: () => void;
  onSync: () => void;
  onToggleTheme: () => void;
  onToggleCrt: () => void;
}

interface RailBtn {
  id: string;
  icon: IconName;
  label: string;
  onClick: () => void;
  active?: boolean;
  pressed?: boolean;
}

export function ActivityRail(props: ActivityRailProps) {
  const top: RailBtn[] = [
    { id: "board", icon: "board", label: "Board", onClick: props.onFocusBoard, active: !props.hasSelection },
    { id: "new", icon: "plus", label: "New issue", onClick: props.onNewIssue },
    { id: "filter", icon: "filter", label: "Focus filter", onClick: props.onFocusFilter },
    { id: "sync", icon: "refresh", label: "Sync all", onClick: props.onSync },
  ];
  const bottom: RailBtn[] = [
    {
      id: "theme",
      icon: "contrast",
      label: props.theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      onClick: props.onToggleTheme,
    },
    {
      id: "crt",
      icon: "monitor",
      label: props.crt ? "Disable CRT texture" : "Enable CRT texture",
      onClick: props.onToggleCrt,
      active: props.crt,
      pressed: props.crt,
    },
  ];

  const render = (b: RailBtn) => (
    <button
      key={b.id}
      type="button"
      className={`tracker-rail__btn${b.active ? " is-active" : ""}`}
      onClick={b.onClick}
      title={b.label}
      aria-label={b.label}
      {...(b.pressed !== undefined ? { "aria-pressed": b.pressed } : {})}
    >
      <Icon name={b.icon} size={18} />
    </button>
  );

  return (
    <nav className="tracker-rail" aria-label="Activity">
      <div className="tracker-rail__group">{top.map(render)}</div>
      <div className="tracker-rail__spacer" />
      <div className="tracker-rail__group">{bottom.map(render)}</div>
    </nav>
  );
}
