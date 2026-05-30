import { useEffect, type CSSProperties } from "react";
import { useTracker } from "../../store/store";
import { Icon } from "../Icon";
import { Kbd } from "../common/Kbd";

const DURATION_MS: Record<string, number> = { undo: 6000, info: 4000, error: 4000 };

function toastDuration(kind: string): number {
  return DURATION_MS[kind] ?? 4000;
}

export function ToastTray() {
  const toasts = useTracker((s) => s.toasts);
  const dismiss = useTracker((s) => s.dismissToast);
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), toastDuration(t.kind)));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);
  return (
    <div className="tracker-toast-tray">
      {/* Each toast carries its own role (alert/status) so the announcement is
          per-severity; a tray-level aria-live would double-announce. */}
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`tracker-toast tracker-toast--${t.kind}`}
          role={t.kind === "error" ? "alert" : "status"}
          style={{ "--toast-dur": `${toastDuration(t.kind)}ms` } as CSSProperties}
        >
          <span className="tracker-toast__rail" aria-hidden />
          <span className="tracker-toast__message">{t.message}</span>
          {t.undo && (
            <button
              type="button"
              className="tracker-toast__action"
              onClick={() => { t.undo!(); dismiss(t.id); }}
            >
              Undo
              <Kbd keys="mod+z" className="tracker-toast__kbd" />
            </button>
          )}
          <button
            type="button"
            className="tracker-toast__close"
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
          >
            <Icon name="close" size={14} />
          </button>
          <span className="tracker-toast__progress" aria-hidden />
        </div>
      ))}
    </div>
  );
}
