interface DnaHelixProps {
  className?: string
  color?: string
  opacity?: number
  bgColor?: string
}

export default function DnaHelix({ className = '', color = '#10E1C2', opacity = 1, bgColor = '#000000' }: DnaHelixProps) {
  // viewBox: 80 wide, 300 tall
  // Center x=40, crossings at y=0,90,180,270
  // Strand peaks at y=45 (x≈61 right, x≈19 left) and y=135, y=225

  return (
    <svg
      viewBox="0 0 80 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* === BACK segments (drawn first, lower z-order) === */}

      {/* Strand A back: left arc y=90→180 */}
      <path
        d="M 40 90 C 15 90, 15 180, 40 180"
        stroke={color} strokeWidth="5" strokeLinecap="round" fill="none"
      />
      {/* Strand B back: left arc y=0→90 */}
      <path
        d="M 40 0 C 15 0, 15 90, 40 90"
        stroke={color} strokeWidth="5" strokeLinecap="round" fill="none"
      />
      {/* Strand B back: left arc y=180→270 */}
      <path
        d="M 40 180 C 15 180, 15 270, 40 270"
        stroke={color} strokeWidth="5" strokeLinecap="round" fill="none"
      />

      {/* === RUNGS (drawn between back and front strands) === */}
      {/* Arc 1 rungs (y=0→90, strand A right, strand B left) */}
      <line x1="24" y1="30"  x2="56" y2="30"  stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="20" y1="45"  x2="60" y2="45"  stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="24" y1="60"  x2="56" y2="60"  stroke={color} strokeWidth="3.5" strokeLinecap="round" />

      {/* Arc 2 rungs (y=90→180, strand B right, strand A left) */}
      <line x1="24" y1="120" x2="56" y2="120" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="20" y1="135" x2="60" y2="135" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="24" y1="150" x2="56" y2="150" stroke={color} strokeWidth="3.5" strokeLinecap="round" />

      {/* Arc 3 rungs (y=180→270, strand A right, strand B left) */}
      <line x1="24" y1="210" x2="56" y2="210" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="20" y1="225" x2="60" y2="225" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="24" y1="240" x2="56" y2="240" stroke={color} strokeWidth="3.5" strokeLinecap="round" />

      {/* === CROSSING GAPS — cover back strand at crossing points === */}
      <line x1="40" y1="84"  x2="40" y2="96"  stroke={bgColor} strokeWidth="10" />
      <line x1="40" y1="174" x2="40" y2="186" stroke={bgColor} strokeWidth="10" />

      {/* === FRONT segments (drawn last, higher z-order) === */}

      {/* Strand A front: right arc y=0→90 */}
      <path
        d="M 40 0 C 65 0, 65 90, 40 90"
        stroke={color} strokeWidth="5" strokeLinecap="round" fill="none"
      />
      {/* Strand A front: right arc y=180→270 */}
      <path
        d="M 40 180 C 65 180, 65 270, 40 270"
        stroke={color} strokeWidth="5" strokeLinecap="round" fill="none"
      />
      {/* Strand B front: right arc y=90→180 */}
      <path
        d="M 40 90 C 65 90, 65 180, 40 180"
        stroke={color} strokeWidth="5" strokeLinecap="round" fill="none"
      />

      {/* === END CAPS === */}
      {/* Top small loops */}
      <path d="M 40 0 C 55 -8, 62 4, 55 10" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 40 0 C 25 -8, 18 4, 25 10" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Bottom trailing ends */}
      <path d="M 40 270 C 54 270, 60 282, 52 290" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 40 270 C 26 270, 20 282, 28 290" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  )
}
