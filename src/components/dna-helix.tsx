import Image from 'next/image'

interface DnaHelixProps {
  className?: string
  opacity?: number
}

export default function DnaHelix({ className = '', opacity = 1 }: DnaHelixProps) {
  return (
    <Image
      src="/helix-icon.png"
      alt=""
      width={320}
      height={580}
      className={className}
      style={{ opacity }}
      aria-hidden="true"
      unoptimized
    />
  )
}
