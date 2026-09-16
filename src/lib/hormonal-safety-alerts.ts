/**
 * Hormonal status answers that must reach the coach as an ALERT, not only as a
 * line inside the read.
 *
 * WHY ONLY THESE TWO (2026-09-13)
 *
 * The read already puts every hormonal confounder in front of the coach, in
 * pattern_watch_for. An alert is for the answers where waiting until someone
 * opens the read is the wrong speed:
 *
 *   Pregnant now. Duty of care. A coach must know before any training or eating
 *   plan is written, and 03_ESTROGEN_SHIFT section 7 calls it "different
 *   physiology altogether".
 *
 *   Using testosterone or an anabolic compound now, not prescribed.
 *   04_ANDROGEN_DECLINE section 8 makes self-treatment a same-week referral in
 *   its own right, and section 11 puts current use requiring management with
 *   Arete or a GP.
 *
 * Deliberately NOT alerts: past use, prescribed use, hormone therapy, a birth in
 * the last 12 months, "talk this through with my coach". Each is a referral
 * CONVERSATION the read already raises. Alerting on all of them would teach the
 * coach to ignore the two that matter.
 *
 * Wording obeys the same scope lines as the read: never advise on a compound,
 * its dose or stopping it, never moralise, never diagnose.
 */

/** The exact answer text that raises each alert. Matched verbatim, so rewording
 *  the option in intake-questions.ts would silently switch the alert off —
 *  scripts/audit-question-text.ts fails if either string stops existing. */
export const ALERT_ANSWERS = {
  pregnant_or_postpartum: 'Yes, pregnant now',
  androgen_use: 'Yes, now, not prescribed',
  cancer_history: 'Yes, and I am currently receiving treatment',
} as const

export interface HormonalSafetyAlert {
  key: 'pregnant_now' | 'androgen_not_prescribed' | 'cancer_in_treatment'
  headline: string
  detail: string
}

export function hormonalSafetyAlerts(
  answers: { pregnant_or_postpartum?: string | null; androgen_use?: string | null; cancer_history?: string | null } | null | undefined,
): HormonalSafetyAlert[] {
  if (!answers) return []
  const alerts: HormonalSafetyAlert[] = []
  if (answers.pregnant_or_postpartum === ALERT_ANSWERS.pregnant_or_postpartum) {
    alerts.push({
      key: 'pregnant_now',
      headline: 'Pregnant now',
      detail:
        'Reported on the intake. Before any training or eating plan is written, talk with her and confirm her doctor or midwife has cleared her to train. The read treats body shape during pregnancy as not a pattern signal.',
    })
  }
  if (answers.androgen_use === ALERT_ANSWERS.androgen_use) {
    alerts.push({
      key: 'androgen_not_prescribed',
      headline: 'Using testosterone or an anabolic compound without a prescription',
      detail:
        'Reported on the intake. Raise it this week, without judgement, and refer to Arete or a GP. Do not advise on the compound, the dose or stopping it. Changes in muscle and recovery will not read as a clean training signal.',
    })
  }
  // Added 2026-09-16 with the cancer question. Someone mid-treatment is the one
  // answer here that should reach the coach before a program is written: fatigue,
  // bone health and exercise tolerance can all be affected, and their oncology
  // team, not us, sets what they can do.
  if (answers.cancer_history === ALERT_ANSWERS.cancer_history) {
    alerts.push({
      key: 'cancer_in_treatment',
      headline: 'Currently receiving cancer treatment',
      detail:
        'Reported on the intake. Talk with her before writing anything, and confirm her treating team is happy for her to train and at what level. Do not advise on the treatment. Expect capacity and recovery to move week to week, so read a quiet week as treatment, not as behaviour.',
    })
  }

  return alerts
}
