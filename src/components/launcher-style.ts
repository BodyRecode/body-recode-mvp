/**
 * Shared look for the two floating launchers - Support (bottom left) and the
 * Co-Pilot (bottom right).
 *
 * They are peers and should read as a pair. They used not to: Support was a
 * 48px pill labelled SUPPORT in uppercase monospace, the Co-Pilot a 56px flat
 * circle, both on a heavy drop shadow. Once the rest of the dashboard stopped
 * shouting, the pair became the loudest thing on the screen.
 */

/** Position class (bottom-N left-N / right-N) is added by each launcher. */
export const LAUNCHER_BUTTON =
  'fixed z-50 h-12 w-12 rounded-full text-white flex items-center justify-center ' +
  'transition-all active:translate-y-[1px] print:hidden'

/** Open goes near-black so the button reads as a close control, not a second CTA. */
export function launcherStyle(open: boolean): React.CSSProperties {
  return open
    ? {
        background: 'linear-gradient(180deg,#2A303C,#141821)',
        boxShadow: '0 6px 16px -4px rgba(16,24,40,0.4), inset 0 1px 0 rgba(255,255,255,0.14)',
      }
    : {
        background: 'linear-gradient(180deg,#3B82F9,#1B6DFC)',
        boxShadow: '0 6px 16px -4px rgba(27,109,252,0.45), inset 0 1px 0 rgba(255,255,255,0.28)',
      }
}

/** Panel shadow, shared so both surfaces sit at the same height off the page. */
export const LAUNCHER_PANEL_SHADOW =
  '0 20px 44px -16px rgba(16,24,40,0.32), 0 4px 10px -4px rgba(16,24,40,0.16)'
