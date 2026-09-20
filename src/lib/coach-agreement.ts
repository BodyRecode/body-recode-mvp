/**
 * The coach agreement, accepted in the app the way a client already accepts theirs.
 *
 * 20 September 2026. A client reads their coaching agreement in the portal,
 * types their full name and the system records it. A coach, until now, set a
 * password and was in. That is the wrong way round: the coach agreement is the
 * document carrying the referral obligation, the screening obligation and the
 * insurance requirement, and it was the one being handled on paper.
 *
 * THE GATE IS OFF UNTIL A LAWYER CLEARS THE WORDING. Three clauses depend on
 * questions that have not been answered: whether a coach using this with
 * clients counts as clinical practice, who the collecting entity is, and what
 * the licence must require on scope and insurance. Presenting an uncleared
 * agreement to a real coach and recording their acceptance of it would be
 * worse than having no agreement at all, because it would look like consent to
 * terms nobody has checked.
 *
 * So the mechanism is built and switched off. When the lawyer answers, the
 * wording is corrected and CURRENT_AGREEMENT.cleared becomes true; from that
 * moment every coach is held at the agreement until they accept it.
 */

export type AgreementClause = {
  heading: string
  /** Paragraphs. A string starting with '- ' renders as a list item. */
  body: string[]
  /** Marked in the document as needing the lawyer, and shown as such. */
  forTheLawyer?: boolean
}

export type CoachAgreement = {
  kind: 'pilot'
  version: string
  title: string
  subtitle: string
  /** False until a lawyer has read it. While false, nothing is gated. */
  cleared: boolean
  /** Shown above the agreement while it is uncleared. */
  draftNotice: string
  clauses: AgreementClause[]
  /** What the coach must type to accept. Their own full name, nothing else. */
  acceptanceStatement: string
}

export const CURRENT_AGREEMENT: CoachAgreement = {
  kind: 'pilot',
  version: 'v0.1',
  title: 'Founding Coach Pilot Agreement',
  subtitle: '90 days, no charge. Either of us can end it with seven days’ notice.',
  cleared: false,
  draftNotice:
    'This wording has not yet been reviewed by a lawyer. It is shown here so the mechanism can be tested, and nobody is being asked to accept it yet.',
  acceptanceStatement:
    'I have read this agreement, I understand it, and I accept it on behalf of my business.',
  clauses: [
    {
      heading: 'What the platform is, and is not',
      body: [
        'It produces an interpretation: a written explanation of what a client’s reported information appears to show, a weekly reading of their check-in answers, and a re-read at a scheduled interval.',
        'It does not diagnose, treat, cure or prevent any disease, illness or condition, and nothing it produces is a diagnosis or medical advice. You must not describe it that way to a client or in any marketing.',
        'The training programme generator and the nutrition plan generator are not licensed to you and are not part of this pilot. You write your clients’ programmes and eating plans yourself.',
        'It is pre-release. It will change during the pilot, sometimes without notice, and it may contain faults.',
      ],
    },
    {
      heading: 'The pilot period',
      body: [
        'Ninety days from the start date, at no charge. Neither of us owes the other a fee.',
        'At the end, your access stops unless we have agreed commercial terms in writing beforehand. You will get at least fourteen days’ notice of what those terms would be, and you are under no obligation to take them.',
      ],
    },
    {
      heading: 'What you may do',
      body: [
        'Use the platform with your own clients, for your own coaching business, during the pilot.',
        'You may not resell it, sub-licence it, white-label it, or make it available to another coach or business.',
        'You may not use it or its outputs to build a competing product, and you may not attempt to extract or reconstruct the doctrine, the prompts, the classification logic or the engine.',
      ],
    },
    {
      heading: 'Your clients, and your responsibilities to them',
      forTheLawyer: true,
      body: [
        'The client is yours. We do not contact them except to send the platform’s own emails on your behalf, and we do not market to them.',
        'Before you enter any client’s information, that client must have consented through the platform’s own consent wording. You must not enter information about somebody who does not know you are doing it.',
        'You remain responsible for screening every client before they train, to the standard your qualification, insurance and professional body require. The platform does not clear anybody to exercise.',
        '- Not with anyone under 18.',
        '- Not with anyone pregnant or within twelve weeks post partum, without written clearance from their treating practitioner.',
        '- Not with anyone the platform has flagged for referral, until they confirm they have seen a doctor.',
        'Where the platform tells you or your client to see a doctor, you must pass that on. You must not talk them out of it, soften it, or offer to watch and wait instead. This is the most important obligation in this agreement.',
        'You must hold current professional indemnity and public liability insurance for the whole pilot. Ours does not cover you.',
        'If a client is harmed, reports harm, or complains about anything the platform said, tell us in writing within two business days.',
      ],
    },
    {
      heading: 'Information, privacy and security',
      forTheLawyer: true,
      body: [
        'Client information entered here is held by both of us: by you because it is your client, and by us because we operate the system it sits in. Each of us must comply with the Privacy Act and the Australian Privacy Principles.',
        'Almost everything a client enters is health information and is sensitive information under that Act. Handle it accordingly, including on your own devices and in your own email.',
        'Client information is stored in Australia. Producing an interpretation involves sending information to an artificial intelligence provider outside Australia. This is disclosed to every client before they answer anything.',
        'If a client asks to be deleted, tell us and we will delete them from the live system within thirty days. Backups are kept for a period, so a deleted record may persist in a backup until that backup ages out.',
        'If either of us learns of unauthorised access to client information, we tell the other within twenty-four hours.',
        'Your login is yours alone. Tell us immediately if you think somebody else has used it.',
      ],
    },
    {
      heading: 'What we get, and this is the point of the pilot',
      body: [
        'You permit us to use interpretations produced for your clients, with all identifying details removed, as evidence of how the platform performs. No name, contact detail, photograph or anything that could reasonably identify a client is used this way.',
        'You take part in a review at thirty, sixty and ninety days, about forty-five minutes each, covering where the interpretation landed wrong and what you could not work out.',
        'Where an interpretation is wrong for a client you know well, we want it in your words, not softened. Nothing bad happens to you for saying it.',
        'We may quote you and name your business only with your written approval of the specific wording each time. You may decline without giving a reason.',
        'When commercial terms open, you get first refusal on founding pricing, held for at least fourteen days.',
      ],
    },
    {
      heading: 'Confidentiality and ownership',
      body: [
        'The doctrine, prompts, classification logic, engine, architecture, roadmap and pricing are confidential. You may still tell anyone that you are in the pilot and describe in general terms what it does.',
        'We own the platform and everything in it. You own your coaching methods, your programmes and your client relationships. Neither of those changes.',
        'Feedback you give us may be used freely to improve the platform.',
      ],
    },
    {
      heading: 'No warranty, and who is responsible for what',
      forTheLawyer: true,
      body: [
        'During the pilot the platform is provided as it stands and without warranty, except for any guarantee that cannot lawfully be excluded under the Australian Consumer Law.',
        'We do not warrant that it will be available continuously, that it will be free of faults, or that any interpretation is correct for a particular person.',
        'Neither of us is liable to the other for indirect or consequential loss, or loss of profits. Nothing limits liability for death or personal injury caused by negligence, or for a breach of the Privacy Act.',
        'You indemnify us against a claim by one of your clients arising from your coaching, your screening, your scope of practice, or a referral you did not pass on. We indemnify you against a claim arising from our own breach of the privacy clause.',
      ],
    },
    {
      heading: 'Ending it',
      body: [
        'Either of us may end this at any time, for any reason, with seven days’ written notice. It is a pilot and neither of us should be trapped in it.',
        'We may suspend your access immediately if we reasonably believe a client is at risk.',
        'When it ends you stop using the platform, and we give you an export of your clients’ information in a readable format within thirty days.',
      ],
    },
    {
      heading: 'General',
      body: [
        'Governed by the laws of Queensland, Australia.',
        'This is the entire agreement about the pilot and can only be varied in writing.',
        'Nothing here creates a partnership, employment or agency relationship. You are not our employee, agent or representative and must not hold yourself out as one.',
      ],
    },
  ],
}

/**
 * Whether this coach is held at the agreement before anything else.
 *
 * Deliberately false whenever the agreement is uncleared, so switching the
 * wording on is one line rather than a search for every place that gates.
 */
export function agreementGateActive(): boolean {
  return CURRENT_AGREEMENT.cleared
}

/** True when this coach has accepted the version currently in force. */
export async function hasAcceptedCurrent(
  admin: { from: (t: string) => any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  coachId: string,
): Promise<boolean> {
  try {
    const { data } = await admin
      .from('coach_agreements')
      .select('id')
      .eq('coach_id', coachId)
      .eq('agreement_kind', CURRENT_AGREEMENT.kind)
      .eq('version', CURRENT_AGREEMENT.version)
      .limit(1)
    return Array.isArray(data) && data.length > 0
  } catch {
    // A read failure must not lock a coach out of their own clients. The gate
    // exists to record agreement, not to become an outage.
    return true
  }
}

/**
 * A typed name only counts if it is actually a name. Not validation theatre:
 * an acceptance recorded against "x" is worth nothing if it is ever questioned.
 */
export function nameLooksReal(name: string): boolean {
  const trimmed = name.trim()
  if (trimmed.length < 4) return false
  if (!/[a-z]/i.test(trimmed)) return false
  return trimmed.split(/\s+/).filter((p) => p.length >= 2).length >= 2
}
