import type { Metadata } from 'next'
import CheckInQuiz from './check-in-quiz'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Performance Check-In | Body Recode™',
}

export default function PerformanceCheckInQuizPage() {
  return <CheckInQuiz />
}
