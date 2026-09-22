/**
 * Shared look for the two floating launchers - Support (bottom left) and the
 * Co-Pilot (bottom right).
 *
 * They are peers and should read as a pair. They used not to: Support was a
 * 48px pill labelled SUPPORT in uppercase monospace, the Co-Pilot a 56px flat
 * circle, both on a heavy drop shadow. Once the rest of the dashboard stopped
 * shouting, the pair became the loudest thing on the screen.
 *
 * 22 September 2026, and the same thing happened again in reverse. The
 * dashboard went dark and these two stayed Signal Blue, so on a page whose
 * only colour is a readiness they were the brightest objects on it, saying
 * nothing. A launcher is a control, not a state: it is paper on graphite like
 * every other control, and it goes graphite when open so it reads as a close.
 */

/** Position class (bottom-N left-N / right-N) is added by each launcher. */
export const LAUNCHER_BUTTON =
  'fixed z-50 h-12 w-12 rounded-full flex items-center justify-center ' +
  'transition-all active:translate-y-[1px] print:hidden'

/** Open goes near-black so the button reads as a close control, not a second CTA. */
export function launcherStyle(open: boolean): React.CSSProperties {
  return open
    ? {
        background: '#1A1E26',
        color: '#FAFAF8',
        border: '1px solid #2A2F39',
        boxShadow: '0 6px 16px -4px rgba(0,0,0,0.5)',
      }
    : {
        background: '#FAFAF8',
        color: '#0B0D10',
        boxShadow: '0 6px 16px -4px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(0,0,0,0.12)',
      }
}

/** Panel shadow, shared so both surfaces sit at the same height off the page. */
export const LAUNCHER_PANEL_SHADOW =
  '0 20px 44px -16px rgba(0,0,0,0.6), 0 4px 10px -4px rgba(0,0,0,0.4)'
