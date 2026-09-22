/**
 * Shared look for the two floating launchers - Support (bottom left) and the
 * Co-Pilot (bottom right).
 *
 * They are peers and should read as a pair. They used not to: Support was a
 * 48px pill labelled SUPPORT in uppercase monospace, the Co-Pilot a 56px flat
 * circle, both on a heavy drop shadow. Once the rest of the dashboard stopped
 * shouting, the pair became the loudest thing on the screen.
 *
 * 22 September 2026, twice. The sidebar then went PAPER while the work surface
 * stayed graphite, and the Support launcher sits over the sidebar, so a paper
 * button on a paper ground vanished. It is graphite now: a control is the
 * highest-contrast thing against whatever it is sitting on, and these two sit
 * on different grounds, which is why they are not the same colour as each
 * other any more.
 *
 * Earlier the same day, and in reverse: The
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
        background: '#4A4F57',
        color: '#FAFAF8',
        boxShadow: '0 6px 16px -4px rgba(0,0,0,0.35)',
      }
    : {
        background: '#0F1115',
        color: '#FAFAF8',
        boxShadow: '0 6px 16px -4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
      }
}

/** Panel shadow, shared so both surfaces sit at the same height off the page. */
export const LAUNCHER_PANEL_SHADOW =
  '0 20px 44px -16px rgba(0,0,0,0.6), 0 4px 10px -4px rgba(0,0,0,0.4)'
