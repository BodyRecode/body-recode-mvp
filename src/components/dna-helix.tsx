interface DnaHelixProps {
  className?: string
  color?: string
  opacity?: number
}

export default function DnaHelix({ className = '', color = '#10E1C2', opacity = 1 }: DnaHelixProps) {
  return (
    <svg
      viewBox="0 0 120 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Strand A — left curve */}
      <path
        d="M 20 10 C 60 40, 100 70, 60 100 C 20 130, 60 160, 100 190 C 60 220, 20 250, 60 280 C 100 310, 60 340, 20 370"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Strand B — right curve */}
      <path
        d="M 100 10 C 60 40, 20 70, 60 100 C 100 130, 60 160, 20 190 C 60 220, 100 250, 60 280 C 20 310, 60 340, 100 370"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rungs */}
      <line x1="28" y1="38"  x2="92" y2="38"  stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="20" y1="62"  x2="100" y2="62" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="28" y1="86"  x2="92" y2="86"  stroke={color} strokeWidth="4" strokeLinecap="round" />

      <line x1="28" y1="138" x2="92" y2="138" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="20" y1="162" x2="100" y2="162" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="28" y1="186" x2="92" y2="186" stroke={color} strokeWidth="4" strokeLinecap="round" />

      <line x1="28" y1="238" x2="92" y2="238" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="20" y1="262" x2="100" y2="262" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="28" y1="286" x2="92" y2="286" stroke={color} strokeWidth="4" strokeLinecap="round" />

      <line x1="28" y1="338" x2="92" y2="338" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1="20" y1="362" x2="100" y2="362" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
