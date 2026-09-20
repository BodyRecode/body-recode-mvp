export type QuestionType = 'scale' | 'text' | 'select' | 'multiselect' | 'date' | 'checkbox'

export interface Question {
  id: string
  text: string
  type: QuestionType
  options?: string[]
  required?: boolean
  scaleLabel?: { low: string; high: string }
  /**
   * What a generator's prompt sees INSTEAD of `text`. The client always sees
   * `text`; this only exists so a question can be phrased naturally for a human
   * without handing an internal term to a model that must not say it back.
   *
   * Added 2026-08-30 after the Progress Read deadlocked: `pc_wired_tired` asks
   * "I feel wired but tired", `formatProgressCheck` rendered it verbatim into
   * the prompt, the model quoted the client's own signal back, and the
   * banned-terms audit then rejected the entire reading. Four of four attempts.
   * See `scripts/audit-question-text.ts`, which fails if any question text hits
   * the banned list without one of these.
   */
  promptText?: string
  /**
   * Show this question only when another answer allows it. Declarative rather
   * than a function so the same rule can be read by the form, the read's prompt
   * and the Progress Check list generator.
   *
   * Added 2026-09-13 for the hormonal status section: a man should not be asked
   * about his periods. An unanswered controlling question counts as '' so
   * everything stays visible until she has told us enough to hide it.
   */
  showIf?: ShowIfCondition | ShowIfCondition[]
}

/**
 * One condition on another answer. An array means ALL must hold, added
 * 2026-09-16 so a question can depend on two answers at once: a woman whose
 * uterus has been removed should not be asked about pregnancy, and neither
 * should a man, and those are two different controlling questions.
 */
export interface ShowIfCondition { id: string; in?: string[]; notIn?: string[] }

/**
 * Whether a question applies, given the answers so far. The ONE rule for this:
 * the form uses it to render AND to decide what is missing, so a hidden required
 * question can never block her from moving on.
 */
export function isQuestionVisible(q: Question, answers: Record<string, unknown>): boolean {
  if (!q.showIf) return true
  const conditions = Array.isArray(q.showIf) ? q.showIf : [q.showIf]
  return conditions.every(c => {
    const raw = answers[c.id]
    const val = typeof raw === 'string' ? raw : ''
    if (c.in) return c.in.includes(val)
    if (c.notIn) return !c.notIn.includes(val)
    return true
  })
}

export interface Section {
  id: string
  title: string
  description: string
  questions: Question[]
}

export const INTAKE_SECTIONS: Section[] = [
  {
    id: 'identity',
    title: 'Client Identification',
    description: 'Welcome to your Foundational Intake. This form captures baseline information about your training background, injury history, lifestyle patterns, and current physical signals. There are no right or wrong answers. Please answer honestly based on your typical experience over time rather than your best or worst day.',
    questions: [
      { id: 'full_name', text: 'Full name', type: 'text', required: true },
      { id: 'date_of_birth', text: 'Date of birth', type: 'date', required: true },
      { id: 'gender', text: 'Gender', type: 'select', options: ['Male', 'Female', 'Prefer not to say', 'Other'], required: true },
      { id: 'occupation', text: 'Occupation', type: 'text', required: true },
      { id: 'mobile_number', text: 'Mobile number', type: 'text', required: true },
      { id: 'emergency_contact_name', text: 'Emergency contact name', type: 'text', required: true },
      { id: 'emergency_contact_phone', text: 'Emergency contact phone number', type: 'text', required: true },
      { id: 'how_did_you_hear', text: 'How did you hear about Body Recode™?', type: 'text', required: false },
      { id: 'intake_confirmation', text: 'I confirm that I have read the introduction above and will answer all sections honestly and accurately.', type: 'checkbox', required: true },
    ]
  },
  {
    // Added 2026-09-13. The intake asked nothing about hormonal status for men
    // or women: no cycle, no menopause stage, no hormone therapy. The read typed
    // the pattern on "Gender", which is the right question to ask a person and
    // the wrong one for choosing between Estrogen-Shift and Androgen-Decline.
    // See 06_SAAS_PLATFORM_BUILD/02_FEATURE_SPECS/2026-09-13_Progress_Check_Spec.md §4.
    id: 'hormonal',
    title: 'Hormonal Status',
    description: 'Some surgeries, health conditions and medical treatments can affect hormones, energy, body composition and recovery. We ask these questions so your program can be better tailored to you. Where and how your body stores fat depends partly on the hormones it is running on. Answer what applies to you, anything that does not apply has a way to say so, and you can choose to discuss anything privately with your coach instead.',
    questions: [
      { id: 'sex_at_birth', text: 'Sex recorded at birth', type: 'select', options: ['Female', 'Male', 'Intersex', "I'd rather talk this through with my coach"], required: true },
      { id: 'hormone_therapy', text: 'Are you currently taking any hormone therapy?', type: 'select', options: ['None', 'Menopausal hormone therapy (HRT)', 'Oestrogen', 'Progesterone', 'Testosterone therapy', 'Hormone-blocking or suppressing medication', 'Gender-affirming hormones', 'Other', 'I am not sure', "I'd rather talk this through with my coach"], required: true },
      { id: 'hormone_therapy_detail', text: 'Tell us about it: what you take, and roughly how long you have been on it.', type: 'text', required: false, showIf: { id: 'hormone_therapy', notIn: ['None', ''] } },
      // Added 2026-09-16, written by a client. Kimberly Hamilton, who has had a
      // hysterectomy with one ovary kept, wrote in after her intake: the form
      // reached her situation sideways, through a question about periods, and
      // then asked a woman with no uterus whether she was pregnant. It also
      // could not record ONE ovary, which is the difference between a normal
      // hormonal picture and reduced reserve with an earlier menopause.
      { id: 'gynae_surgery', text: 'Have you had a hysterectomy or surgery involving your ovaries?', type: 'select', options: ['No', 'Yes, my uterus was removed and I have both ovaries', 'Yes, my uterus was removed and I have one ovary', 'Yes, my uterus and both ovaries were removed', 'I have had other ovarian surgery', 'I am not sure what was removed', "I'd rather talk this through with my coach"], required: true, showIf: { id: 'sex_at_birth', notIn: ['Male'] } },
      // Cancer, its treatment and hormone-blocking medicines can stop the
      // ovaries working, and they change what a body tolerates in training.
      // Nothing in the intake asked, and the only other place it could surface
      // was a free-text box in the health declaration. The detail stays with
      // the coach in private: this asks what changes the program, not a history.
      { id: 'cancer_history', text: 'Have you ever been diagnosed with cancer?', type: 'select', options: ['No', 'Yes, and I have completed treatment', 'Yes, and I am currently receiving treatment', 'Yes, and I am being monitored or taking ongoing medication', "I'd rather talk this through with my coach"], required: true },
      { id: 'cancer_hormonal_effect', text: 'Did the cancer or its treatment affect your hormones?', type: 'select', options: ['Yes', 'No', 'I am not sure'], required: true, showIf: { id: 'cancer_history', in: ['Yes, and I have completed treatment', 'Yes, and I am currently receiving treatment', 'Yes, and I am being monitored or taking ongoing medication'] } },
      // Split 15 Sep 2026. "Stopped after surgery" covered a hysterectomy that
      // keeps the ovaries (hormones unchanged, just no bleed) and one that
      // removes them (a surgical menopause) as if they were the same. Treatment
      // such as pelvic radiotherapy or chemotherapy can also stop the ovaries.
      { id: 'period_pattern', text: 'Which best describes your periods now?', type: 'select', options: ['Regular', 'Irregular', 'None for 12 months or more', 'Stopped after surgery or medical treatment', 'Suppressed by contraception', 'None for another reason', 'Not applicable'], required: true, showIf: [{ id: 'sex_at_birth', notIn: ['Male'] }, { id: 'gynae_surgery', notIn: ['Yes, my uterus was removed and I have both ovaries', 'Yes, my uterus was removed and I have one ovary', 'Yes, my uterus and both ovaries were removed'] }] },
      { id: 'ovaries_after_treatment', text: 'Were your ovaries removed, or did treatment stop them working?', type: 'select', options: ['Yes', 'No, they still work', 'I am not sure'], required: true, showIf: { id: 'period_pattern', in: ['Stopped after surgery or medical treatment'] } },
      { id: 'hormonal_contraception', text: 'Are you using hormonal contraception?', type: 'select', options: ['No', 'Pill', 'Hormonal IUD', 'Implant', 'Injection', 'Other', 'Not applicable'], required: true, showIf: { id: 'sex_at_birth', notIn: ['Male'] } },
      { id: 'pregnant_or_postpartum', text: 'Are you pregnant now, or have you given birth in the last 12 months?', type: 'select', options: ['No', 'Yes, pregnant now', 'Yes, given birth in the last 12 months', 'Not applicable'], required: true, showIf: [{ id: 'sex_at_birth', notIn: ['Male'] }, { id: 'gynae_surgery', notIn: ['Yes, my uterus was removed and I have both ovaries', 'Yes, my uterus was removed and I have one ovary', 'Yes, my uterus and both ovaries were removed'] }] },
      // Added 2026-09-14. Estrogen-Shift is decided by cycle status AND the
      // direction of travel (Fat_Map_Definitions_LOCKED v2.2), and the intake
      // never asked the second half. Only the scorecard did, and the read never
      // received that answer. It is history over years, so no photo, tape or
      // later check can supply it. Same options as the scorecard so a carried
      // answer maps one to one (see DIRECTION_LABEL_FOR_CODE). When she already
      // answered on the scorecard the form carries that answer instead of asking,
      // because it was given before any pattern was shown to her (Interpretation
      // Logic v2.0 rule 5).
      { id: 'storage_direction', text: 'Has where your body stores fat changed over the last few years?', type: 'select', options: ['It has stayed on my hips, thighs and glutes', 'It used to be hips and thighs, now it is moving to my middle', 'It has always been my middle', 'It has always been fairly even all over', 'I am not sure'], required: true, showIf: { id: 'sex_at_birth', notIn: ['Male'] } },
      { id: 'androgen_use', text: 'Are you using testosterone or any anabolic compound, or have you in the past?', type: 'select', options: ['No, never', 'Yes, now, prescribed', 'Yes, now, not prescribed', 'Not now, but I have in the past', "I'd rather talk this through with my coach"], required: true },
      { id: 'vitality_energy', text: 'Compared with a year ago, your energy is', type: 'select', options: ['Better', 'About the same', 'Worse'], required: true },
      { id: 'vitality_drive', text: 'Compared with a year ago, your drive and motivation are', type: 'select', options: ['Better', 'About the same', 'Worse'], required: true },
      { id: 'vitality_libido', text: 'Compared with a year ago, your sex drive is', type: 'select', options: ['Better', 'About the same', 'Worse', "I'd rather not say"], required: true },
      { id: 'vitality_recovery', text: 'Compared with a year ago, how well you recover from training is', type: 'select', options: ['Better', 'About the same', 'Worse'], required: true },
    ],
  },
  {
    id: 'fat_map',
    title: 'Section A: Body Pattern Signals',
    description: 'This section captures recurring physical and recovery patterns that may not always be obvious day to day. Answer based on your usual experience across recent months. Focus on patterns rather than temporary spikes or short-term changes. There are no right or wrong responses.\n\n0 = Not present · 1 = Mild · 2 = Moderate · 3 = Frequent · 4 = Strong / Consistent',
    questions: [
      { id: 'fm_01', text: 'I tend to store fat primarily around my midsection.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_02', text: 'My waist measurement increases quickly during stressful periods.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      // promptText: "wired but tired" is banned in client-facing readings, and
      // cffs-prompt.ts renders scale-question text into the CFFS prompt, so the
      // client's own phrasing was reaching a model that must not say it back.
      // Same collision that deadlocked the Progress Read. See Question.promptText.
      { id: 'fm_03', text: 'I feel wired but tired most days.', promptText: 'I feel activated but unable to settle most days, and rest does not restore me.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_04', text: 'I experience frequent cravings for salty or savoury foods.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      // fm_04a to fm_04c added 17 Sep 2026, research pass E1a (A8). Salt
      // craving on its own means nothing and is scored neutral. Alongside ANY
      // of these three it is worth a same-week GP conversation, and the read
      // raises one. Asked here, next to the craving, so the answer is reliable
      // rather than hoped for in free text. All three are neutral for scoring:
      // they are referral inputs, not load.
      { id: 'fm_04a', text: 'I have lost weight over the last six months without trying to.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_04b', text: 'I feel dizzy or light-headed when I stand up.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_04c', text: 'I have noticed my skin or gums looking darker than usual.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_05', text: 'My sleep quality declines noticeably during high-pressure weeks.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_06', text: 'I store fat predominantly around my hips and thighs.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_07', text: 'My lower body fat is resistant even when weight elsewhere decreases.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_08', text: 'My legs feel heavy or swollen by the end of the day.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_09', text: 'I bruise easily on my lower body.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_10', text: 'Lower body fat gain is not closely linked to calorie intake changes.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_11', text: 'I carry more fat across my upper back, chest, or arms.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      // Corrected 5 Sep 2026. Was "I gain muscle easily but struggle to lose
      // upper-body fat", which is the Androgen-Decline claim v2.0 RETIRED:
      // 04_ANDROGEN_DECLINE says lean mass FALLS, and the discriminator is
      // "softer arms and shoulders are less muscle, not more fat". The old
      // wording asked the client to confirm the withdrawn model, and a high
      // score on it was evidence for the opposite of what it was read as.
      { id: 'fm_12', text: 'My arms and shoulders have lost shape or definition.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      // Corrected 5 Sep 2026 alongside fm_12, same reason: "I feel strong
      // but" asserted preserved strength, which is the retired model. v2.0's
      // single best question is whether strength is going backwards, and it is
      // the LAST of the three signs to move, so it must be asked directly.
      { id: 'fm_13', text: 'My strength on familiar lifts has been going backwards.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_14', text: 'Fat gain in my upper body occurs even with consistent training.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_15', text: 'I experience fluctuations in motivation and drive.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_16', text: 'I experience bloating or abdominal distension regularly.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_17', text: 'My stomach size fluctuates noticeably day to day.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_18', text: 'Digestive discomfort affects how my clothes fit.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_19', text: 'I react poorly to certain foods without clear patterns.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_20', text: 'Digestive issues coincide with changes in body composition.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_21', text: 'I notice rapid weight changes over short timeframes.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_22', text: 'My body feels puffy or swollen, especially in the mornings.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_23', text: 'Rings, shoes, or clothing fit tighter at certain times.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_24', text: 'Inflammation affects how lean or defined I appear.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_25', text: 'Recovery from training feels inconsistent.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      // Holding Signals, added 5 Sep 2026. The Extended Zones rebuild finished
      // with three observations and the intake captured ONE of them: fm_16 to
      // fm_18 cover distension, and nothing anywhere in the 230 covered
      // shoulder and neck bracing or trunk holding. That made two thirds of the
      // finished layer unreachable from the intake, so it could never enter a
      // read no matter what the doctrine said.
      //
      // Wording rules, from 09_EXTENDED_ZONES_v2.0 "How the report is taken":
      // ask what the body DOES across a day, never whether the client braces,
      // holds or cannot let go. Those words supply the answer, and a symptom
      // narrative alone produced significant reported symptoms during sham
      // exposure with nothing present. Hence "stay lifted" and "does not settle"
      // rather than "bracing" and "holding".
      //
      // These are recorded as REPORTED, never measured, and per the counting
      // rule in 11_INTERPRETATION_LOGIC_v2.0 the three observations enter a read
      // ONCE, together, as a single binary. More of them present does not mean
      // worse, and absence means nothing.
      { id: 'fm_26', text: 'My shoulders stay lifted or tight even when I am not doing anything.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_27', text: 'My neck feels tight at the end of a demanding day, and it comes back under the same conditions.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_28', text: 'My middle does not fully let go between efforts, even at rest.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
      { id: 'fm_29', text: 'These things track with how demanding life is, rather than with my weight.', type: 'scale', scaleLabel: { low: 'Not present', high: 'Strong / Consistent' } },
    ]
  },
  {
    id: 'injury',
    title: 'Section B: Injury and Pain Status',
    description: 'This section captures current pain presence, historical injuries, and movement sensitivities that may influence training tolerance. Answer based on your usual experience across recent months unless the question clearly refers to current status. Report patterns honestly.\n\n0 = No pain or limitation · 1 = Mild awareness, no limitation · 2 = Noticeable discomfort, manageable · 3 = Significant pain or limitation · 4 = Severe pain or restriction',
    questions: [
      { id: 'inj_01', text: 'I currently experience pain during daily activities.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_02', text: 'Pain affects my ability to train consistently.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_03', text: 'Pain intensity fluctuates throughout the day.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_04', text: 'Pain worsens with physical activity.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_05', text: 'Pain persists even at rest.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_06', text: 'I have had one or more significant injuries in the past.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_07', text: 'Previous injuries still affect my movement or confidence.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_08', text: 'I have required time away from training due to injury.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_09', text: 'Injuries have recurred in the same area.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_10', text: 'I avoid certain movements due to past injury.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_11', text: 'Certain joints feel unstable or vulnerable.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_12', text: 'I experience stiffness that limits range of motion.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_13', text: 'Warm-up is essential to reduce discomfort.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_14', text: 'My movement quality changes when fatigued.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_15', text: 'I experience asymmetry between left and right sides.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_16', text: 'I currently modify exercises to avoid pain.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_17', text: 'I rely on pain management strategies to continue training.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_18', text: 'I am cautious or hesitant when loading certain movements.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_19', text: 'Pain influences my exercise selection.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      { id: 'inj_20', text: 'I feel uncertain about pushing intensity due to pain.', type: 'scale', scaleLabel: { low: 'No pain', high: 'Severe' } },
      {
        id: 'inj_21',
        text: 'Areas currently affected by pain or discomfort (select all that apply)',
        type: 'multiselect',
        options: ['Neck', 'Upper back / thoracic spine', 'Lower back', 'Shoulders', 'Elbows', 'Wrists / hands', 'Hips', 'Knees', 'Ankles / feet', 'Other', 'None currently']
      },
      {
        id: 'inj_22',
        text: 'Areas with previous injury history (select all that apply)',
        type: 'multiselect',
        options: ['Neck', 'Upper back / thoracic spine', 'Lower back', 'Shoulders', 'Elbows', 'Wrists / hands', 'Hips', 'Knees', 'Ankles / feet', 'Other', 'No previous injuries']
      },
      { id: 'inj_23', text: 'Primary area of concern right now (1–2 sentences, or "none")', type: 'text' },
      { id: 'inj_24', text: 'Movements or activities that aggravate this area (if any)', type: 'text' },
    ]
  },
  {
    id: 'training',
    title: 'Section C: Training History and Exposure',
    description: 'This section captures your training background, consistency patterns, exposure level, and familiarity with different training environments. Answer based on your overall history rather than short recent phases. Focus on long-term patterns of behaviour and exposure.\n\n0 = Never / Not applicable · 1 = Very limited · 2 = Occasional or inconsistent · 3 = Regular · 4 = Long-term and consistent',
    questions: [
      { id: 'tr_01', text: 'I have engaged in structured resistance training.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_02', text: 'I am familiar with basic gym equipment and exercises.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_03', text: 'I have followed a formal training program before.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_04', text: 'I understand basic training terminology.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_05', text: 'I feel confident navigating a gym environment.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_06', text: 'I have trained consistently for extended periods.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_07', text: 'My training habits are easily disrupted.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_08', text: 'I frequently restart training after breaks.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_09', text: 'I struggle to maintain routines long-term.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_10', text: 'I have experienced cycles of high motivation followed by drop-off.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_11', text: 'I have trained with moderate to heavy loads.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_12', text: 'I am comfortable exerting high effort in training.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_13', text: 'I understand the difference between effort and failure.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_14', text: 'I have trained close to muscular fatigue.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_15', text: 'I recover adequately between training sessions.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_16', text: 'I have experience with compound lifts.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_17', text: 'I have used free weights regularly.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_18', text: 'I have trained with tempo or controlled movement.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_19', text: 'I have experience with unilateral exercises.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_20', text: 'I have trained across multiple modalities.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_21', text: 'Life demands frequently interfere with training.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_22', text: 'I have stopped training due to injury or pain.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_23', text: 'I have stopped training due to fatigue or burnout.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_24', text: 'I have stopped training due to schedule changes.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_25', text: 'I find it difficult to resume training after interruptions.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_26', text: 'I prefer structured, guided training.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_27', text: 'I prefer flexible or self-directed training.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_28', text: 'I train better with accountability.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_29', text: 'I struggle to train without external structure.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },
      { id: 'tr_30', text: 'I feel overwhelmed by complex programs.', type: 'scale', scaleLabel: { low: 'Never', high: 'Long-term and consistent' } },

      // Training environment, heat and competition. Added 19 Sep 2026 from
      // research pass E1b, sections 7 and 8. Every one changes an output;
      // none is asked for completeness. The heat questions matter because
      // Brisbane is hot or humid most of the year and many gyms here are not
      // air-conditioned, which is the only situation where fluid and sodium
      // advice genuinely changes. The competition questions stay hidden
      // unless the client says they compete, so almost nobody sees them.
      { id: 'tr_gym_heat', text: 'Is your gym air-conditioned, or do you train outdoors or somewhere hot?', type: 'select', options: ['Always cool or air-conditioned', 'Sometimes hot', 'Usually hot or outdoors'], required: true },
      { id: 'tr_session_length', text: 'How long is a typical session?', type: 'select', options: ['Under 60 minutes', '60 to 90 minutes', 'Over 90 minutes'], required: true },
      { id: 'tr_work_heat', text: 'Do you work outdoors or in a hot workplace?', type: 'select', options: ['No', 'Sometimes', 'Most days'], required: true },
      { id: 'tr_sweat_level', text: 'Compared with the people around you, how heavily do you sweat? For example, soaked through within 20 to 30 minutes.', type: 'select', options: ['Barely sweat', 'About average', 'Heavy sweater'], required: true },
      { id: 'tr_salt_marks', text: 'Do you see white salt marks on your clothing or cap after training?', type: 'select', options: ['No', 'Yes', 'Not sure'], required: false },
      { id: 'tr_weigh_sessions', text: 'Have you ever weighed yourself before and after a session? If so, what was the change, and did you use the toilet in between?', type: 'text', required: false },
      { id: 'tr_cramps', text: 'Do you get muscle cramps?', type: 'select', options: ['Never', 'Sometimes during or after training', 'Also at rest or at night'], required: true },
      { id: 'tr_heat_illness', text: 'Have you ever had heat exhaustion or heat stroke, or collapsed while exercising?', type: 'select', options: ['No', 'Yes'], required: true },
      { id: 'tr_dark_urine', text: 'Have you ever passed dark or cola-coloured urine after training?', type: 'select', options: ['No', 'Yes'], required: true },
      { id: 'tr_performance_supps', text: 'Do you use any of these?', type: 'multiselect', options: ['Creatine', 'Pre-workout', 'Stimulant fat burner', 'Electrolyte products', 'None of these'], required: false },

      { id: 'tr_competes', text: 'Are you preparing for a physique or bodybuilding competition?', type: 'select', options: ['No', 'Thinking about it', 'Yes'], required: true },
      { id: 'cp_federation', text: 'Which federation, and is it drug tested?', type: 'text', required: false, showIf: { id: 'tr_competes', in: ['Yes', 'Thinking about it'] } },
      { id: 'cp_weeks_out', text: 'How many weeks until your show?', type: 'text', required: false, showIf: { id: 'tr_competes', in: ['Yes'] } },
      { id: 'cp_compounds', text: 'Are you using, or planning to use, any of these?', type: 'multiselect', options: ['Fluid tablets or water tablets (diuretics)', 'Insulin', 'Thyroid hormone', 'Growth hormone', 'Anabolic steroids', 'SARMs', 'Clenbuterol or salbutamol', 'None of these'], required: false, showIf: { id: 'tr_competes', in: ['Yes', 'Thinking about it'] } },
      { id: 'cp_potassium_products', text: 'Do you plan to use potassium tablets, powders or salt substitutes?', type: 'select', options: ['No', 'Yes', 'Not sure'], required: false, showIf: { id: 'tr_competes', in: ['Yes', 'Thinking about it'] } },
      { id: 'cp_past_event', text: 'Have you ever cramped badly, collapsed, had palpitations, or become confused around a show or a hard cut?', type: 'select', options: ['No', 'Yes'], required: false, showIf: { id: 'tr_competes', in: ['Yes', 'Thinking about it'] } },
      { id: 'cp_bloods', text: 'When did you last have blood tests including kidney function, and were you using creatine or eating high protein at the time?', type: 'text', required: false, showIf: { id: 'tr_competes', in: ['Yes', 'Thinking about it'] } },
      { id: 'cp_cycle_prep', text: 'Have your periods stopped or become irregular during prep?', type: 'select', options: ['No', 'Yes', 'Not applicable'], required: false, showIf: [{ id: 'tr_competes', in: ['Yes'] }, { id: 'sex_at_birth', notIn: ['Male'] }] },
    ]
  },
  {
    id: 'nutrition',
    title: 'Section D: Nutrition History and Dietary Context',
    description: 'This section captures your nutrition history, dietary structure, behavioural patterns, and prior exposure to structured eating approaches. Answer based on your typical patterns across recent months rather than isolated weeks.\n\n0 = Never / Not applicable · 1 = Rarely · 2 = Sometimes · 3 = Often · 4 = Consistently',
    questions: [
      { id: 'nut_01', text: 'I follow a consistent eating pattern.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_02', text: 'My meal timing varies significantly day to day.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_03', text: 'I regularly skip meals.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_04', text: 'I eat in response to schedule rather than hunger.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_05', text: 'I eat differently on weekdays versus weekends.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_06', text: 'I have followed structured diets in the past.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_07', text: 'I have tracked calories or macros.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_08', text: 'I have followed restrictive eating plans.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_09', text: 'I have cycled on and off different eating approaches.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_10', text: 'I have experienced diet fatigue or burnout.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_11', text: 'Certain foods cause digestive discomfort.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_12', text: 'I notice bloating after meals.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_13', text: 'I feel better avoiding specific food groups.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_14', text: 'My energy levels change based on food choices.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_15', text: 'I experience cravings that feel hard to control.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_16', text: 'I eat differently when stressed.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_17', text: 'I eat past fullness.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_18', text: 'I restrict intake to compensate for over-eating.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_19', text: 'I feel anxious about food choices.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_20', text: 'I find food decisions mentally draining.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_21', text: 'I have foods I avoid for personal reasons.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_22', text: 'I have foods I avoid for medical or intolerance reasons.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_23', text: 'I have cultural or lifestyle eating preferences.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_24', text: 'I have limited time for food preparation.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'nut_25', text: 'I prefer simple, repeatable meals.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'dietary_restrictions', text: 'List any food allergies, intolerances, or medical dietary restrictions you have. Include severity if relevant (e.g. "Peanut allergy, anaphylactic" vs "Lactose intolerant, mild bloating"). Write "None" if none.', type: 'text', required: true },
      { id: 'dietary_preferences', text: 'List any foods you avoid for personal, cultural, or religious reasons, or any dietary framework you follow (e.g. vegetarian, vegan, halal, kosher, pescatarian, no pork, no red meat, no seafood, etc.). Write "None" if you eat everything.', type: 'text', required: true },
      { id: 'typical_day_eating', text: 'Walk us through what you typically eat on an average day. Include breakfast, lunch, dinner, and any snacks. Be honest, this is what we design from, not what you think we want to hear. If your days vary a lot, describe a common pattern and a common variant.', type: 'text', required: true },
      { id: 'meals_per_day', text: 'On a typical day, how many times do you eat? Count main meals and snacks separately (e.g. "3 meals plus 2 snacks"). If it varies, give your most common number.', type: 'text', required: true },
      { id: 'fluid_intake', text: 'What do you drink across a typical day, and roughly how much? Include water, tea, soft drink, juice, cordial, milk, and so on. A rough estimate is fine (e.g. "2 litres of water, 1 can of soft drink").', type: 'text', required: true },
      { id: 'caffeine_intake', text: 'What is your daily caffeine intake? Include coffee, tea, energy drinks, and pre-workout. Give the number of serves and roughly when you have them (e.g. "2 coffees, both before midday"). Write "None" if you have no caffeine.', type: 'text', required: true },
      { id: 'alcohol_intake', text: 'What is your typical alcohol intake? Include what you drink, how many standard drinks, and how many days per week (e.g. "2 glasses of wine, 3 nights a week"). Write "None" if you do not drink.', type: 'text', required: true },
      { id: 'eating_context', text: 'Anything we should know about your eating environment? Examples: who cooks at home, family meals, work-week meals (eat out, bring lunch, skip), frequent travel, takeaway habits, shared meals with a partner who eats differently. Optional but useful for designing a plan you can actually stick to.', type: 'text', required: false },
    ]
  },
  {
    id: 'schedule',
    title: 'Section E: Schedule and Availability',
    description: 'This section captures your weekly structure, time availability, routine stability, and scheduling constraints as they relate to training and recovery. Answer based on your typical weekly pattern across recent months rather than isolated weeks.\n\n0 = Never / Not applicable · 1 = Rarely · 2 = Sometimes · 3 = Often · 4 = Consistently',
    questions: [
      { id: 'sch_01', text: 'My weekly schedule is predictable.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_02', text: 'My work or life commitments change week to week.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_03', text: 'I can generally plan my week in advance.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_04', text: 'Unexpected demands frequently disrupt my plans.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_05', text: 'My weekdays and weekends follow similar routines.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_06', text: 'I have dedicated time blocks available for training.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_07', text: 'I struggle to find uninterrupted time to train.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_08', text: 'My available training time varies each week.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_09', text: 'I can train at consistent times of day.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_10', text: 'I need flexibility in training scheduling.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_11', text: 'Work demands limit my training availability.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_12', text: 'Family or caregiving responsibilities limit my time.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_13', text: 'Social or lifestyle commitments affect consistency.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_14', text: 'Travel disrupts my routine.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_15', text: 'Fatigue reduces my usable time.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_16', text: 'I follow routines well once established.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_17', text: 'I struggle to maintain routines long-term.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_18', text: 'I need external structure to stay consistent.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_19', text: 'I adapt well when routines change.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_20', text: 'I feel overwhelmed by rigid schedules.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_21', text: 'I prefer shorter, more frequent sessions.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_22', text: 'I prefer fewer, longer sessions.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_23', text: 'I need flexibility week to week.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_24', text: 'I value predictability over flexibility.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_25', text: 'My schedule limits recovery opportunities.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sch_days', text: 'Which days of the week are you typically available to train? Select all that apply.', type: 'multiselect', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: false },
    ]
  },
  {
    id: 'sleep',
    title: 'Section F: Sleep and Recovery',
    description: 'This section captures your sleep patterns, perceived recovery capacity, and fatigue signals that may influence training response and load tolerance. Answer based on your typical patterns across recent months rather than isolated nights or short-term changes.\n\n0 = Never / Not applicable · 1 = Rarely · 2 = Sometimes · 3 = Often · 4 = Consistently',
    questions: [
      { id: 'sl_01', text: 'I get a consistent amount of sleep each night.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_02', text: 'My bedtime and wake time are regular.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_03', text: 'I feel I get enough sleep most nights.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_04', text: 'My sleep duration varies significantly.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_05', text: 'I wake up earlier or later than planned.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_06', text: 'I fall asleep easily.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_07', text: 'I stay asleep through the night.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_08', text: 'I wake feeling refreshed.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_09', text: 'My sleep feels light or restless.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_10', text: 'I wake during the night.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_11', text: 'I feel alert in the mornings.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_12', text: 'I rely on caffeine to function.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_13', text: 'I experience afternoon energy crashes.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_14', text: 'I feel mentally fatigued during the day.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_15', text: 'I feel physically fatigued during the day.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_16', text: 'I recover well between training sessions.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_17', text: 'Soreness resolves within expected timeframes.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_18', text: 'Fatigue accumulates across the week.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_19', text: 'I feel run down after training.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_20', text: 'I feel resilient to training stress.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_21', text: 'I prioritise sleep when life gets busy.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_22', text: 'I use screens close to bedtime.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_23', text: 'My sleep environment supports good sleep.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_24', text: 'I intentionally use recovery strategies.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'sl_25', text: 'I struggle to unwind before bed.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
    ]
  },
  {
    id: 'stress',
    title: 'Section G: Stress and Load Context',
    description: 'This section captures perceived stress levels, cognitive and emotional load, and life pressures that may influence training response, recovery, and behavioural capacity. Answer based on your typical experience across recent months rather than isolated stressful days.\n\n0 = Never / Not applicable · 1 = Rarely · 2 = Sometimes · 3 = Often · 4 = Consistently',
    questions: [
      { id: 'str_01', text: 'I feel mentally overwhelmed.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_02', text: 'I feel emotionally drained.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_03', text: 'I feel under constant pressure.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_04', text: 'I find it hard to switch off.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_05', text: 'I feel tense or on edge.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_06', text: 'I struggle to concentrate.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_07', text: 'My mind feels busy most of the time.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_08', text: 'I find decision-making mentally taxing.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_09', text: 'I experience mental fatigue.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_10', text: 'I feel scattered or unfocused.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_11', text: 'Personal responsibilities feel heavy.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_12', text: 'Work demands are high.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_13', text: 'Family or relationship stress affects me.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_14', text: 'I feel pulled in many directions.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_15', text: 'I feel emotionally resilient.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_16', text: 'Stress affects my motivation to train.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_17', text: 'Training feels harder when life stress is high.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_18', text: 'I skip sessions due to mental or emotional fatigue.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_19', text: 'Training helps reduce my stress.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_20', text: 'I feel less patient or tolerant during training.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_21', text: 'Stress accumulates across the week.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_22', text: 'I feel worn down by the end of the week.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_23', text: 'I bounce back quickly from stressful periods.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_24', text: 'Stress interferes with my sleep.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
      { id: 'str_25', text: 'Stress affects my appetite or eating patterns.', type: 'scale', scaleLabel: { low: 'Never', high: 'Consistently' } },
    ]
  },
  {
    id: 'supplement',
    title: 'Section H: Medications, Supplements and Stimulant Use',
    description: 'This section captures current medications, supplements, stimulant exposure, and any performance or recovery compounds you are using. All of it shapes how we read your body\'s signal. The first question is asked in confidence and without judgement, disclosure produces a better read, missing context produces a worse one. The rest are 0–4 scale questions about your typical patterns across recent months.\n\n0 = Never / Not applicable · 1 = Occasionally · 2 = A few times per week · 3 = Most days · 4 = Daily or multiple times per day',
    questions: [
      { id: 'medications', text: 'List anything you are currently taking that may affect your hormones, recovery, training response, or body composition. Include:\n\n• Prescribed medications (hormonal support like TRT, HRT, or GLP-1; cardiovascular, antidepressants, ADHD medications, contraceptives, beta-blockers, corticosteroids)\n• Chronic over-the-counter use (daily anti-inflammatories, painkillers, antihistamines)\n• Performance and recovery peptides, SARMs, anabolic compounds, or any hormone-modulating compound\n• Hormone-affecting supplements at therapeutic dose (DIM, ashwagandha cycles, melatonin, etc.)\n\nInclude dose, frequency, and how long you have been on each where known. Write "None" if none apply.', type: 'text', required: true },
      { id: 'sup_01', text: 'I consume caffeinated beverages (coffee, tea, energy drinks).', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_02', text: 'I rely on caffeine to function during the day.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_03', text: 'I consume caffeine later in the day or evening.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_04', text: 'I feel dependent on stimulants to maintain energy.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_05', text: 'I notice negative effects from stimulant use (e.g. jitters, crashes).', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_06', text: 'I use pre-workout or stimulant-based performance products.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_07', text: 'I increase dosage or frequency to achieve effect.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_08', text: 'I feel flat or unmotivated without these products.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_09', text: 'These products affect my sleep or recovery.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_10', text: 'I have stopped or reduced use due to side effects.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_11', text: 'I take supplements regularly.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_12', text: 'I take supplements inconsistently or sporadically.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_13', text: 'I am unsure why I take certain supplements.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_14', text: 'I have changed supplements frequently.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_15', text: 'I feel overwhelmed by supplement choices.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_16', text: 'Supplement timing affects my sleep.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_17', text: 'I notice changes in mood or energy related to supplement use.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_18', text: 'I feel tolerant or less responsive over time.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_19', text: 'I experience digestive discomfort from supplements.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_20', text: 'I feel better when reducing supplement use.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_21', text: 'I have combined multiple stimulant products.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_22', text: 'I am unsure about safe dosages.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_23', text: 'I have experienced adverse reactions.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_24', text: 'I have been advised to limit stimulant use.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },
      { id: 'sup_25', text: 'I feel confident managing supplement intake.', type: 'scale', scaleLabel: { low: 'Never', high: 'Daily / multiple times' } },

      // Thyroid screen, added 20 Sep 2026 from research pass T1.
      //
      // These do NOT exist to work out whether she has a thyroid problem. A
      // thirteen-symptom score separates underactive thyroid function from
      // normal function at 0.91 in younger men and 0.64 in older women, which
      // in half our audience is close to a coin toss, and only three of the
      // thirteen symptoms were more common in the people who had it. So the
      // questionnaire may TRIGGER a referral and may never produce a
      // likelihood, a score or a pattern.
      //
      // Most of this is the case-finding list Australian guidelines already
      // use, and we were collecting some of it and doing nothing with it.
      // tq_changed asks about CHANGE over the past year rather than current
      // state, because change is the only framing with published
      // discriminating value (Canaris 1997).
      { id: 'tq_history', text: 'Tick anything that applies to you.', type: 'multiselect', required: false, options: ['A thyroid problem in the past', 'Thyroid surgery or radioactive iodine treatment', 'A parent, brother, sister or child with a thyroid problem', 'Type 1 diabetes', 'Coeliac disease', 'Another autoimmune condition', 'A lump or swelling in the front of my neck', 'Radiotherapy to my neck', 'I take amiodarone or lithium', 'Down syndrome or Turner syndrome', 'An irregular heartbeat I have been told about', 'None of these'] },
      { id: 'tq_medication', text: 'Do you take thyroid medication? If so, which one, and roughly when was your last thyroid blood test?', type: 'text', required: false },
      { id: 'tq_changed', text: 'In the last 12 months, have any of these CHANGED for you? Tick any that have.', type: 'multiselect', required: false, options: ['Feeling the cold more than people around me', 'Bowels slower', 'Skin drier', 'Voice hoarser or deeper', 'Breathless or wheezy on stairs', 'Something feeling stuck in my throat', 'Tiredness that sleep does not fix', 'Heart racing, pounding or skipping', 'Shaking or tremor', 'Feeling hot or sweating more than others', 'Weight dropping without me changing anything', 'None of these'] },
      { id: 'tq_products', text: 'Do you take any of these?', type: 'multiselect', required: false, options: ['Biotin, or a hair, skin and nails supplement', 'Kelp, seaweed or iodine', 'A product sold for thyroid health, a glandular product, or "natural thyroid"', 'A high-dose selenium supplement', 'None of these'] },

      // Bone screen, added 20 Sep 2026 from research pass B1. Five questions,
      // each tied to something it changes, and written so she can answer
      // without us naming anything.
      //
      // bq_fracture is the one that matters most: in Australia a bone broken
      // from a fall from standing height counts as osteoporosis on its own,
      // whatever a scan says, and it roughly doubles the risk of the next one.
      //
      // bq_height is the one a coach can miss by not asking. It is the pattern
      // that can be a spinal fracture.
      { id: 'bq_fracture', text: 'Since the age of 50, have you broken any bone from a fall from standing height or less? And at any age, have you broken a bone from a minor knock or fall?', type: 'select', required: false, options: ['No', 'Yes, since I turned 50', 'Yes, at some point from a minor knock or fall', 'Not sure'] },
      { id: 'bq_periods_age', text: 'At what age did your periods stop or become irregular? If you have had your ovaries or uterus removed, at what age?', type: 'text', required: false, showIf: { id: 'sex_at_birth', notIn: ['Male'] } },
      { id: 'bq_medicines', text: 'Are you taking any bone medicine, any steroid tablets or inhalers, or any medicine for breast or prostate cancer? If you are on a six-monthly bone injection, when was your last one?', type: 'text', required: false },
      { id: 'bq_height_back', text: 'Have you lost height, noticed your upper back rounding, or had new mid-back or lower-back pain?', type: 'multiselect', required: false, options: ['I have lost height', 'My upper back looks more rounded', 'New mid-back or lower-back pain', 'None of these'] },
      { id: 'bq_calcium', text: 'Roughly how many serves of dairy or calcium-fortified food do you have a day? A serve is a glass of milk, a tub of yoghurt, or two slices of cheese.', type: 'select', required: false, options: ['None', 'About 1', 'About 2', '3 or more', 'Not sure'] },
    ]
  },
  {
    id: 'goals',
    title: 'Section I: High-Level Goal Declaration',
    description: 'We ask about goals to understand what matters to you, not to lock you into a specific outcome. Your responses provide context only. They do not override safety requirements or determine program structure.\n\nYou may be broad, uncertain, or exploratory. You may leave any section blank. There are no right or wrong answers.',
    questions: [
      {
        id: 'goal_primary',
        text: 'Primary outcome intent (what are you hoping to achieve?)',
        type: 'text',
        required: false
      },
      {
        id: 'goal_secondary',
        text: 'Secondary outcome intent (anything else you would like to address?)',
        type: 'text',
        required: false
      },
      {
        id: 'goal_timeline',
        text: 'General time horizon or milestone (if any)',
        type: 'text',
        required: false
      },
      {
        id: 'goal_motivator',
        text: 'Personal motivation or context (what has brought you to this point?)',
        type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'final',
    title: 'Final Confirmation',
    description: 'Thank you for completing the Foundational Intake. This process is not designed to judge, diagnose, or label you. It exists to establish your baseline position within the Body Recode system so that training exposure aligns with your current capacity. There is no good or bad profile.\n\nYour responses will be reviewed in full and used to construct your initial training position. You are not expected to interpret or analyse your answers.',
    questions: [
      {
        id: 'final_disclosure',
        text: 'Is there anything important you would like your coach to know before reviewing your intake? (optional)',
        type: 'text',
        required: false
      },
      {
        id: 'final_system_alignment',
        text: 'I understand that Body Recode is a structured, capacity-based system and not a short-term transformation program.',
        type: 'checkbox',
        required: true
      },
      {
        id: 'final_accuracy',
        text: 'I confirm that the information provided is accurate to the best of my knowledge.',
        type: 'checkbox',
        required: true
      }
    ]
  }
]

/**
 * The scorecard, Body Decode and founding page store direction of change as a
 * code. The intake stores the answer text. One map so a carried answer lands on
 * exactly the option she would have picked.
 */
export const DIRECTION_LABEL_FOR_CODE: Record<string, string> = {
  gluteofemoral: 'It has stayed on my hips, thighs and glutes',
  to_middle: 'It used to be hips and thighs, now it is moving to my middle',
  always_central: 'It has always been my middle',
  always_even: 'It has always been fairly even all over',
  unsure: 'I am not sure',
}

export function getTotalQuestions(): number {
  return INTAKE_SECTIONS.reduce((total, section) => total + section.questions.length, 0)
}
