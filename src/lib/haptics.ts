// =============================================================================
// NaKmetiji.si — Haptic Feedback (Web Vibration API)
// "Apple Standard" micro-interactions for mobile PWA
// Safe no-op on unsupported browsers
// =============================================================================

/** Light tap — stamp claimed, button press */
export function hapticLight(): void {
  try {
    navigator?.vibrate?.(10);
  } catch {
    /* unsupported — silent */
  }
}

/** Medium pulse — booking confirmed, important action */
export function hapticMedium(): void {
  try {
    navigator?.vibrate?.(25);
  } catch {
    /* unsupported — silent */
  }
}

/** Heavy pattern — achievement unlocked, Pioneer level-up */
export function hapticHeavy(): void {
  try {
    navigator?.vibrate?.([15, 30, 15]);
  } catch {
    /* unsupported — silent */
  }
}

/** Success pattern — double tap for celebratory feedback */
export function hapticSuccess(): void {
  try {
    navigator?.vibrate?.([10, 50, 20]);
  } catch {
    /* unsupported — silent */
  }
}
