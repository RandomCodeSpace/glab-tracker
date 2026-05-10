import { useEffect } from "react";
import { useTracker } from "../../store/store";

export function ToastTray() {
  const toasts = useTracker((s) => s.toasts);
  const dismiss = useTracker((s) => s.dismissToast);
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), t.kind === "undo" ? 6000 : 4000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);
  return (
    <div className="tracker-toast-tray">
      {toasts.map((t) => (
        <div key={t.id} className={`tracker-toast tracker-toast--${t.kind}`}>
          <span>{t.message}</span>
          {t.undo && <button type="button" onClick={() => { t.undo!(); dismiss(t.id); }}>Undo</button>}
          <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
