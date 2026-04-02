interface DnaHelixProps {
  className?: string
  color?: string
  opacity?: number
  bgColor?: string
}

export default function DnaHelix({ className = '', color = '#10E1C2', opacity = 1, bgColor = '#000000' }: DnaHelixProps) {
  // viewBox: 80 wide, 300 tall
  // Filled lens shapes for strands — taper at crossings, wide at peaks.
  // Right lens: outer ctrl x=76, inner ctrl x=50 → ~20px wide at peak
  // Left lens: outer ctrl x=4, inner ctrl x=30 → ~20px wide at peak
  // Crossings at y=0, 90, 180, 270

  return (
    <svg
      viewBox="0 0 80 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >

      {/* === BACK STRAND SHAPES (drawn first, appear behind) === */}
      {/* Strand B left lens: section 1 (y=0→90) */}
      <path d="M 40,0 C 4,0 4,90 40,90 C 30,90 30,0 40,0 Z" fill={color} />
      {/* Strand A left lens: section 2 (y=90→180) */}
      <path d="M 40,90 C 4,90 4,180 40,180 C 30,180 30,90 40,90 Z" fill={color} />
      {/* Strand B left lens: section 3 (y=180→270) */}
      <path d="M 40,180 C 4,180 4,270 40,270 C 30,270 30,180 40,180 Z" fill={color} />

      {/* === BACK STRAND INNER LINES (3D tube effect) === */}
      <path d="M 40,0 C 17,0 17,90 40,90" stroke={bgColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 40,90 C 17,90 17,180 40,180" stroke={bgColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 40,180 C 17,180 17,270 40,270" stroke={bgColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* === RUNGS (between back and front strands) === */}
      {/* Section 1: y=0→90 */}
      <line x1="17" y1="27"  x2="63" y2="27"  stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="13" y1="45"  x2="67" y2="45"  stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="17" y1="63"  x2="63" y2="63"  stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      {/* Section 1 rung inner lines */}
      <line x1="17" y1="27"  x2="63" y2="27"  stroke={bgColor} strokeWidth="2" />
      <line x1="13" y1="45"  x2="67" y2="45"  stroke={bgColor} strokeWidth="2" />
      <line x1="17" y1="63"  x2="63" y2="63"  stroke={bgColor} strokeWidth="2" />

      {/* Section 2: y=90→180 */}
      <line x1="17" y1="117" x2="63" y2="117" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="13" y1="135" x2="67" y2="135" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="17" y1="153" x2="63" y2="153" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      {/* Section 2 rung inner lines */}
      <line x1="17" y1="117" x2="63" y2="117" stroke={bgColor} strokeWidth="2" />
      <line x1="13" y1="135" x2="67" y2="135" stroke={bgColor} strokeWidth="2" />
      <line x1="17" y1="153" x2="63" y2="153" stroke={bgColor} strokeWidth="2" />

      {/* Section 3: y=180→270 */}
      <line x1="17" y1="207" x2="63" y2="207" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="13" y1="225" x2="67" y2="225" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      <line x1="17" y1="243" x2="63" y2="243" stroke={color} strokeWidth="6.5" strokeLinecap="round" />
      {/* Section 3 rung inner lines */}
      <line x1="17" y1="207" x2="63" y2="207" stroke={bgColor} strokeWidth="2" />
      <line x1="13" y1="225" x2="67" y2="225" stroke={bgColor} strokeWidth="2" />
      <line x1="17" y1="243" x2="63" y2="243" stroke={bgColor} strokeWidth="2" />

      {/* === CROSSING CLEANUP — tidy the tips at crossing points === */}
      <ellipse cx="40" cy="90"  rx="5" ry="6" fill={bgColor} />
      <ellipse cx="40" cy="180" rx="5" ry="6" fill={bgColor} />

      {/* === FRONT STRAND SHAPES (drawn last, appear in front) === */}
      {/* Strand A right lens: section 1 (y=0→90) */}
      <path d="M 40,0 C 76,0 76,90 40,90 C 50,90 50,0 40,0 Z" fill={color} />
      {/* Strand B right lens: section 2 (y=90→180) */}
      <path d="M 40,90 C 76,90 76,180 40,180 C 50,180 50,90 40,90 Z" fill={color} />
      {/* Strand A right lens: section 3 (y=180→270) */}
      <path d="M 40,180 C 76,180 76,270 40,270 C 50,270 50,180 40,180 Z" fill={color} />

      {/* === FRONT STRAND INNER LINES (3D tube effect) === */}
      <path d="M 40,0 C 63,0 63,90 40,90" stroke={bgColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 40,90 C 63,90 63,180 40,180" stroke={bgColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 40,180 C 63,180 63,270 40,270" stroke={bgColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* === END CAPS === */}
      {/* Top curled tips */}
      <path d="M 40,0 C 54,-10 64,2 57,10" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M 40,0 C 26,-10 16,2 23,10" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {/* Bottom trailing ends */}
      <path d="M 40,270 C 54,270 62,283 54,291" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M 40,270 C 26,270 18,283 26,291" stroke={color} strokeWidth="4.5" strokeLinecap="round" fill="none" />

    </svg>
  )
}
