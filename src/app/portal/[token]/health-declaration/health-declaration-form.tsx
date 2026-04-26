'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ClientHeader from '@/components/client-header'
import { useDraftState, clearDraftsByPrefix } from '@/lib/use-form-draft'

const CARDIO_SYMPTOMS = [
  'Unusual shortness of breath with light effort',
  'Chest pain or pressure',
  'Unexplained pain in arms, jaw, abdomen, or shoulder',
  'Dizziness or fainting',
  'Irregular heartbeat or palpitations',
  'Lower leg pain or cramping relieved by rest',
]

const BARRIERS = [
  'Lack of time',
  'Low motivation',
  'Injury or pain',
  'Work or family commitments',
  'Lack of knowledge',
  'Other',
]

type YesNo = 'yes' | 'no' | ''

export default function HealthDeclarationForm({
  clientId,
  clientName,
  portalToken,
}: {
  clientId: string
  clientName: string
  portalToken: string
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const draftPrefix = `health:${clientId}:`
  const k = (n: string) => `${draftPrefix}${n}`

  // Section 1 — Personal Details
  const [dob, setDob] = useDraftState(k('dob'), '')
  const [phone, setPhone] = useDraftState(k('phone'), '')
  const [address, setAddress] = useDraftState(k('address'), '')
  const [postcode, setPostcode] = useDraftState(k('postcode'), '')

  // Section 2 — Emergency Contact
  const [emergencyName, setEmergencyName] = useDraftState(k('emergencyName'), '')
  const [emergencyRelationship, setEmergencyRelationship] = useDraftState(k('emergencyRelationship'), '')
  const [emergencyPhone, setEmergencyPhone] = useDraftState(k('emergencyPhone'), '')

  // Section 3 — General Health
  const [healthRating, setHealthRating] = useDraftState<'Excellent' | 'Good' | 'Fair' | 'Poor' | ''>(k('healthRating'), '')
  const [exercisedBefore, setExercisedBefore] = useDraftState<YesNo>(k('exercisedBefore'), '')
  const [exerciseType, setExerciseType] = useDraftState(k('exerciseType'), '')
  const [exerciseEnjoy, setExerciseEnjoy] = useDraftState(k('exerciseEnjoy'), '')
  const [exerciseDislike, setExerciseDislike] = useDraftState(k('exerciseDislike'), '')

  // Section 4 — Cardiovascular Screening
  const [cardioSymptoms, setCardioSymptoms] = useDraftState<string[]>(k('cardioSymptoms'), [])

  // Section 5 — Medical History
  const [illnessInjury, setIllnessInjury] = useDraftState<YesNo>(k('illnessInjury'), '')
  const [illnessDetails, setIllnessDetails] = useDraftState(k('illnessDetails'), '')
  const [receivingTreatment, setReceivingTreatment] = useDraftState<YesNo>(k('receivingTreatment'), '')
  const [treatmentDetails, setTreatmentDetails] = useDraftState(k('treatmentDetails'), '')
  const [onMedication, setOnMedication] = useDraftState<YesNo>(k('onMedication'), '')
  const [medicationList, setMedicationList] = useDraftState(k('medicationList'), '')
  const [pregnant, setPregnant] = useDraftState<YesNo>(k('pregnant'), '')

  // Section 6 — Musculoskeletal
  const [painAreas, setPainAreas] = useDraftState(k('painAreas'), '')
  const [painAggravated, setPainAggravated] = useDraftState<YesNo>(k('painAggravated'), '')
  const [painTreatment, setPainTreatment] = useDraftState<YesNo>(k('painTreatment'), '')

  // Section 7 — Lifestyle
  const [alcohol, setAlcohol] = useDraftState<YesNo>(k('alcohol'), '')
  const [smoking, setSmoking] = useDraftState<YesNo>(k('smoking'), '')
  const [dietPattern, setDietPattern] = useDraftState(k('dietPattern'), '')
  const [eatingHabits, setEatingHabits] = useDraftState<number | null>(k('eatingHabits'), null)
  const [nutritionSupport, setNutritionSupport] = useDraftState<YesNo>(k('nutritionSupport'), '')

  // Section 8 — Barriers & Goals
  const [barriers, setBarriers] = useDraftState<string[]>(k('barriers'), [])
  const [healthGoals, setHealthGoals] = useDraftState(k('healthGoals'), '')
  const [action1, setAction1] = useDraftState(k('action1'), '')
  const [action2, setAction2] = useDraftState(k('action2'), '')
  const [action3, setAction3] = useDraftState(k('action3'), '')

  // Section 9 — Health Declaration
  const [declaredHonest, setDeclaredHonest] = useDraftState(k('declaredHonest'), false)
  const [declaredDisclosed, setDeclaredDisclosed] = useDraftState(k('declaredDisclosed'), false)
  const [declaredWillNotify, setDeclaredWillNotify] = useDraftState(k('declaredWillNotify'), false)
  const [declaredRisks, setDeclaredRisks] = useDraftState(k('declaredRisks'), false)
  const [declaredResponsibility, setDeclaredResponsibility] = useDraftState(k('declaredResponsibility'), false)
  const [declaredFollowGuidance, setDeclaredFollowGuidance] = useDraftState(k('declaredFollowGuidance'), false)
  const [declaredNutrition, setDeclaredNutrition] = useDraftState(k('declaredNutrition'), false)
  const [declaredLiability, setDeclaredLiability] = useDraftState(k('declaredLiability'), false)
  const [declaredPrivacy, setDeclaredPrivacy] = useDraftState(k('declaredPrivacy'), false)
  const [declarationName, setDeclarationName] = useDraftState(k('declarationName'), '')

  // Clearance logic
  const requiresClearance = cardioSymptoms.filter(s => s !== 'None of the above').length > 0 || pregnant === 'yes'

  const allDeclarationsTicked =
    declaredHonest && declaredDisclosed && declaredWillNotify && declaredRisks &&
    declaredResponsibility && declaredFollowGuidance && declaredNutrition &&
    declaredLiability && declaredPrivacy

  const canSubmit =
    dob && phone && emergencyName && emergencyPhone && emergencyRelationship &&
    healthRating && exercisedBefore &&
    illnessInjury && receivingTreatment && onMedication && pregnant &&
    alcohol && smoking &&
    allDeclarationsTicked && declarationName.trim().length > 2 &&
    !submitting

  const toggleBarrier = (b: string) =>
    setBarriers(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])

  const toggleCardio = (s: string) =>
    setCardioSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')

    const data = {
      personalDetails: { dob, phone, address, postcode },
      emergencyContact: { name: emergencyName, relationship: emergencyRelationship, phone: emergencyPhone },
      generalHealth: { healthRating, exercisedBefore, exerciseType, exerciseEnjoy, exerciseDislike },
      cardiovascularScreening: { symptoms: cardioSymptoms },
      medicalHistory: { illnessInjury, illnessDetails, receivingTreatment, treatmentDetails, onMedication, medicationList, pregnant },
      musculoskeletal: { painAreas, painAggravated, painTreatment },
      lifestyle: { alcohol, smoking, dietPattern, eatingHabits, nutritionSupport },
      barriersAndGoals: { barriers, healthGoals, actions: [action1, action2, action3].filter(Boolean) },
      declaration: { name: declarationName, date: new Date().toISOString().split('T')[0] },
    }

    const res = await fetch('/api/portal/submit-health-declaration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, requiresClearance, data }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    clearDraftsByPrefix(draftPrefix)
    router.push(`/portal/${portalToken}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Health Declaration</h1>
          <p className="text-stone-400 text-sm leading-relaxed">This screening ensures your coaching program is structured safely and appropriately for you. Answer all questions honestly and completely.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Section 1 — Personal Details */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Personal Details</p>
            <div className="space-y-3">
              <div className="bg-stone-900 rounded-xl border border-stone-800 px-4 py-3">
                <p className="text-xs text-stone-500 mb-1">Full Name</p>
                <p className="text-sm text-stone-300">{clientName}</p>
              </div>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                required
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
                placeholder="Date of Birth"
              />
              <p className="text-xs text-stone-600 -mt-1 ml-1">Date of Birth</p>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder="Mobile Number"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
              />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Address (optional)"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
              />
              <input
                type="text"
                value={postcode}
                onChange={e => setPostcode(e.target.value)}
                placeholder="Postcode (optional)"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
              />
            </div>
          </section>

          {/* Section 2 — Emergency Contact */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Emergency Contact</p>
            <div className="space-y-3">
              <input
                type="text"
                value={emergencyName}
                onChange={e => setEmergencyName(e.target.value)}
                required
                placeholder="Full Name"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
              />
              <input
                type="text"
                value={emergencyRelationship}
                onChange={e => setEmergencyRelationship(e.target.value)}
                required
                placeholder="Relationship (e.g. Partner, Parent)"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
              />
              <input
                type="tel"
                value={emergencyPhone}
                onChange={e => setEmergencyPhone(e.target.value)}
                required
                placeholder="Phone Number"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
              />
            </div>
          </section>

          {/* Section 3 — General Health */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">General Health</p>
            <div className="space-y-5">
              <div>
                <p className="text-sm text-stone-300 mb-3">How would you rate your general health?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Excellent', 'Good', 'Fair', 'Poor'] as const).map(r => (
                    <button key={r} type="button"
                      onClick={() => setHealthRating(r)}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${healthRating === r ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{r}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-stone-300 mb-3">Have you done structured exercise before?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setExercisedBefore(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${exercisedBefore === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{opt}</button>
                  ))}
                </div>
              </div>

              {exercisedBefore === 'yes' && (
                <textarea value={exerciseType} onChange={e => setExerciseType(e.target.value)}
                  placeholder="What type of exercise did you do?"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={2} />
              )}

              <textarea value={exerciseEnjoy} onChange={e => setExerciseEnjoy(e.target.value)}
                placeholder="Types of exercise you enjoy (optional)"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={2} />

              <textarea value={exerciseDislike} onChange={e => setExerciseDislike(e.target.value)}
                placeholder="Types of exercise you dislike (optional)"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={2} />
            </div>
          </section>

          {/* Section 4 — Cardiovascular Screening */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-1">Cardiovascular & Respiratory Screening</p>
            <p className="text-sm text-stone-400 mb-4">Tick any symptoms you currently experience or have experienced recently:</p>
            <div className="space-y-2">
              {CARDIO_SYMPTOMS.map(symptom => (
                <label key={symptom} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-900 transition-colors">
                  <input type="checkbox" checked={cardioSymptoms.includes(symptom)} onChange={() => toggleCardio(symptom)}
                    className="mt-0.5 w-4 h-4 rounded accent-teal-400 flex-shrink-0" />
                  <span className="text-sm text-stone-300">{symptom}</span>
                </label>
              ))}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-900 transition-colors">
                <input type="checkbox" checked={cardioSymptoms.includes('None of the above')} onChange={() => toggleCardio('None of the above')}
                  className="mt-0.5 w-4 h-4 rounded accent-teal-400 flex-shrink-0" />
                <span className="text-sm text-stone-300">None of the above</span>
              </label>
            </div>
          </section>

          {/* Section 5 — Medical History */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Medical History</p>
            <div className="space-y-5">

              <div>
                <p className="text-sm text-stone-300 mb-3">Have you had any major illness or injury in the last 5 years?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setIllnessInjury(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${illnessInjury === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{opt}</button>
                  ))}
                </div>
                {illnessInjury === 'yes' && (
                  <textarea value={illnessDetails} onChange={e => setIllnessDetails(e.target.value)}
                    placeholder="Please provide details..."
                    className="mt-3 w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={3} />
                )}
              </div>

              <div>
                <p className="text-sm text-stone-300 mb-3">Are you currently receiving medical treatment for any condition?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setReceivingTreatment(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${receivingTreatment === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{opt}</button>
                  ))}
                </div>
                {receivingTreatment === 'yes' && (
                  <textarea value={treatmentDetails} onChange={e => setTreatmentDetails(e.target.value)}
                    placeholder="Please provide details..."
                    className="mt-3 w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={3} />
                )}
              </div>

              <div>
                <p className="text-sm text-stone-300 mb-3">Are you currently taking any prescription medication?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setOnMedication(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${onMedication === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{opt}</button>
                  ))}
                </div>
                {onMedication === 'yes' && (
                  <textarea value={medicationList} onChange={e => setMedicationList(e.target.value)}
                    placeholder="Please list all medications..."
                    className="mt-3 w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={3} />
                )}
              </div>

              <div>
                <p className="text-sm text-stone-300 mb-3">Are you currently pregnant or recently postpartum (within 12 months)?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setPregnant(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${pregnant === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 — Musculoskeletal */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Musculoskeletal Health</p>
            <div className="space-y-5">
              <textarea value={painAreas} onChange={e => setPainAreas(e.target.value)}
                placeholder="Describe any current pain, injuries, or areas of concern (or write 'None')"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={3} />

              {painAreas && painAreas.toLowerCase() !== 'none' && painAreas.length > 2 && (
                <>
                  <div>
                    <p className="text-sm text-stone-300 mb-3">Is this aggravated by exercise?</p>
                    <div className="flex gap-3">
                      {(['Yes', 'No'] as const).map(opt => (
                        <button key={opt} type="button"
                          onClick={() => setPainAggravated(opt.toLowerCase() as YesNo)}
                          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${painAggravated === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-stone-300 mb-3">Are you currently receiving treatment for it?</p>
                    <div className="flex gap-3">
                      {(['Yes', 'No'] as const).map(opt => (
                        <button key={opt} type="button"
                          onClick={() => setPainTreatment(opt.toLowerCase() as YesNo)}
                          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${painTreatment === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Section 7 — Lifestyle */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Lifestyle</p>
            <div className="space-y-5">
              <div>
                <p className="text-sm text-stone-300 mb-3">Do you drink alcohol?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setAlcohol(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${alcohol === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-stone-300 mb-3">Do you smoke?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setSmoking(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${smoking === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{opt}</button>
                  ))}
                </div>
              </div>

              <textarea value={dietPattern} onChange={e => setDietPattern(e.target.value)}
                placeholder="Describe your typical diet pattern (optional)"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={2} />

              <div>
                <p className="text-sm text-stone-300 mb-3">Rate your eating habits (1 = poor, 10 = excellent)</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} type="button"
                      onClick={() => setEatingHabits(n)}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${eatingHabits === n ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{n}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-stone-300 mb-3">Do you need nutrition support?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setNutritionSupport(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${nutritionSupport === opt.toLowerCase() ? 'bg-teal-400/20 text-teal-400 border border-teal-400/40' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'}`}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 — Barriers & Goals */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Barriers & Readiness</p>
            <div className="space-y-5">
              <div>
                <p className="text-sm text-stone-300 mb-3">What barriers do you currently face? (select all that apply)</p>
                <div className="space-y-2">
                  {BARRIERS.map(b => (
                    <label key={b} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-900 transition-colors">
                      <input type="checkbox" checked={barriers.includes(b)} onChange={() => toggleBarrier(b)}
                        className="w-4 h-4 rounded accent-teal-400" />
                      <span className="text-sm text-stone-300">{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              <textarea value={healthGoals} onChange={e => setHealthGoals(e.target.value)}
                placeholder="What are your health and performance goals for the next 3 months? (optional)"
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none" rows={3} />

              <div>
                <p className="text-sm text-stone-300 mb-3">List 3 actions you will take to improve your health: (optional)</p>
                <div className="space-y-2">
                  {[[action1, setAction1], [action2, setAction2], [action3, setAction3]].map(([val, setter], i) => (
                    <input key={i} type="text" value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                      placeholder={`Action ${i + 1}`}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600" />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Medical clearance notice */}
          {requiresClearance && (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
              <p className="text-sm text-amber-400 font-semibold mb-1">Medical clearance required</p>
              <p className="text-xs text-amber-400/70">Based on your responses, your coach will request written clearance from your GP before training begins. This is a standard precautionary requirement.</p>
            </div>
          )}

          {/* Section 9 — Health Declaration */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-1">Health Declaration</p>
            <p className="text-sm text-stone-400 mb-4">Please read and tick each statement to confirm your understanding:</p>
            <div className="space-y-3">
              {[
                { state: declaredHonest, setter: setDeclaredHonest, text: 'I have completed this form honestly and to the best of my knowledge.' },
                { state: declaredDisclosed, setter: setDeclaredDisclosed, text: 'I have disclosed all relevant medical conditions, medications, and health history.' },
                { state: declaredWillNotify, setter: setDeclaredWillNotify, text: 'I will notify Body Recode of any changes to my health status during coaching.' },
                { state: declaredRisks, setter: setDeclaredRisks, text: 'I understand that exercise carries inherent risks including soreness, strain, fatigue, and the possibility of accidental injury.' },
                { state: declaredResponsibility, setter: setDeclaredResponsibility, text: 'I accept responsibility for staying within my limits, following guidance, communicating honestly about discomfort, and seeking medical advice when recommended.' },
                { state: declaredFollowGuidance, setter: setDeclaredFollowGuidance, text: 'I will use proper form and technique, and modify or pause exercises when needed.' },
                { state: declaredNutrition, setter: setDeclaredNutrition, text: 'I understand that any nutrition guidance provided by Body Recode is general information only and does not constitute medical or dietetic treatment.' },
                { state: declaredLiability, setter: setDeclaredLiability, text: 'I agree that Body Recode is not liable for injuries or health complications arising from participation, provided coaching is delivered within its professional scope of practice. Nothing in this declaration limits my rights under Australian Consumer Law.' },
                { state: declaredPrivacy, setter: setDeclaredPrivacy, text: 'I consent to my health information being securely stored and used solely for the purpose of delivering my coaching program. It will not be shared with third parties without my permission.' },
              ].map(({ state, setter, text }, i) => (
                <label key={i} className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-colors ${state ? 'border-teal-400/30 bg-teal-400/5' : 'border-stone-800 bg-stone-900 hover:border-stone-700'}`}>
                  <input type="checkbox" checked={state} onChange={e => setter(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-teal-400 flex-shrink-0" />
                  <span className="text-sm text-stone-300 leading-relaxed">{text}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Declaration */}
          <section>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-4">Declaration</p>
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
              <p className="text-sm text-stone-400">By typing your full name below, you confirm that all information provided in this form is accurate and complete, and that you agree to the declarations above.</p>
              <input
                type="text"
                value={declarationName}
                onChange={e => setDeclarationName(e.target.value)}
                placeholder="Type your full name"
                required
                className="w-full bg-[#0a0a0a] border border-stone-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
              />
              <p className="text-xs text-stone-600">Date: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </section>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Submit Health Declaration →'}
          </button>

          {!canSubmit && !submitting && (
            <p className="text-xs text-stone-600 text-center">Complete all required fields and tick all declarations to continue.</p>
          )}
        </form>
      </div>
    </div>
  )
}
