import { Assessment } from '../_lib/assessment'

/**
 * The interactive Practice Readiness Assessment. Renders the Assessment
 * component which manages all its own state (question progress,
 * answers, email capture, loading, result). Nothing persists.
 *
 * The parent layout inserts the site header + footer around it.
 */
export default function HarmonyAssessment() {
  return <Assessment />
}
