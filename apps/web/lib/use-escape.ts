import { useEffect } from "react";

/** Closes a dialog when Escape is pressed, unless `disabled` (e.g. while saving). */
export function useEscape(onClose: () => void, disabled = false) {
  useEffect(() => {
    if (disabled) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, disabled]);
}
