interface DnaHelixProps {
  className?: string
  color?: string
  opacity?: number
  bgColor?: string
}

export default function DnaHelix({ className = '', color = '#10E1C2', opacity = 1, bgColor = '#000000' }: DnaHelixProps) {
  // viewBox: 80 wide, 300 tall
  // Crossings at y=0, 90, 180, 270
  // Strand peaks at x≈12 (left) and x≈68 (right)
  // Thick ribbon strands with inner cutout line to match logo

  const sw = 11   // strand outer stroke width
  const iw = 4    // inner ribbon cutout width
  const rw = 5    // rung stroke width

  return (
    <svg
      viewBox="0 0 80 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* === BACK segments (lower z-order) === */}

      {/* Strand B back: left arc y=0→90 */}
      <path d="M 40 0 C 12 0, 12 90, 40 90" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {/* Strand A back: left arc y=90→180 */}
      <path d="M 40 90 C 12 90, 12 180, 40 180" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {/* Strand B back: left arc y=180→270 */}
      <path d="M 40 180 C 12 180, 12 270, 40 270" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />

      {/* === BACK inner ribbon lines === */}
      <path d="M 40 0 C 12 0, 12 90, 40 90" stroke={bgColor} strokeWidth={iw} strokeLinecap="round" fill="none" />
      <path d="M 40 90 C 12 90, 12 180, 40 180" stroke={bgColor} strokeWidth={iw} strokeLinecap="round" fill="none" />
      <path d="M 40 180 C 12 180, 12 270, 40 270" stroke={bgColor} strokeWidth={iw} strokeLinecap="round" fill="none" />

      {/* === RUNGS (drawn between back and front strands) === */}
      {/* Section 1: y=0→90, peak at y=45 */}
      <line x1="21" y1="28"  x2="59" y2="28"  stroke={color} strokeWidth={rw} strokeLinecap="round" />
      <line x1="16" y1="45"  x2="64" y2="45"  stroke={color} strokeWidth={rw} strokeLinecap="round" />
      <line x1="21" y1="62"  x2="59" y2="62"  stroke={color} strokeWidth={rw} strokeLinecap="round" />

      {/* Section 2: y=90→180, peak at y=135 */}
      <line x1="21" y1="118" x2="59" y2="118" stroke={color} strokeWidth={rw} strokeLinecap="round" />
      <line x1="16" y1="135" x2="64" y2="135" stroke={color} strokeWidth={rw} strokeLinecap="round" />
      <line x1="21" y1="152" x2="59" y2="152" stroke={color} strokeWidth={rw} strokeLinecap="round" />

      {/* Section 3: y=180→270, peak at y=225 */}
      <line x1="21" y1="208" x2="59" y2="208" stroke={color} strokeWidth={rw} strokeLinecap="round" />
      <line x1="16" y1="225" x2="64" y2="225" stroke={color} strokeWidth={rw} strokeLinecap="round" />
      <line x1="21" y1="242" x2="59" y2="242" stroke={color} strokeWidth={rw} strokeLinecap="round" />

      {/* === RUNG inner cutout lines === */}
      <line x1="21" y1="28"  x2="59" y2="28"  stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="45"  x2="64" y2="45"  stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="62"  x2="59" y2="62"  stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="118" x2="59" y2="118" stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="135" x2="64" y2="135" stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="152" x2="59" y2="152" stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="208" x2="59" y2="208" stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="225" x2="64" y2="225" stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="242" x2="59" y2="242" stroke={bgColor} strokeWidth="1.5" strokeLinecap="round" />

      {/* === CROSSING GAPS — cover back strand at crossing points === */}
      <line x1="40" y1="82"  x2="40" y2="98"  stroke={bgColor} strokeWidth="16" />
      <line x1="40" y1="172" x2="40" y2="188" stroke={bgColor} strokeWidth="16" />

      {/* === FRONT segments (higher z-order) === */}

      {/* Strand A front: right arc y=0→90 */}
      <path d="M 40 0 C 68 0, 68 90, 40 90" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {/* Strand B front: right arc y=90→180 */}
      <path d="M 40 90 C 68 90, 68 180, 40 180" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {/* Strand A front: right arc y=180→270 */}
      <path d="M 40 180 C 68 180, 68 270, 40 270" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />

      {/* === FRONT inner ribbon lines === */}
      <path d="M 40 0 C 68 0, 68 90, 40 90" stroke={bgColor} strokeWidth={iw} strokeLinecap="round" fill="none" />
      <path d="M 40 90 C 68 90, 68 180, 40 180" stroke={bgColor} strokeWidth={iw} strokeLinecap="round" fill="none" />
      <path d="M 40 180 C 68 180, 68 270, 40 270" stroke={bgColor} strokeWidth={iw} strokeLinecap="round" fill="none" />

      {/* === END CAPS === */}
      {/* Top caps */}
      <path d="M 40 0 C 54 -10, 64 2, 56 10" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 40 0 C 26 -10, 16 2, 24 10" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Bottom trailing ends */}
      <path d="M 40 270 C 54 270, 61 283, 53 291" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 40 270 C 26 270, 19 283, 27 291" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  )
}
