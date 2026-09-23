'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PortalPageShell from '../portal-page-shell'
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

  // Section 1 - Personal Details
  const [dob, setDob] = useDraftState(k('dob'), '')
  const [phone, setPhone] = useDraftState(k('phone'), '')
  const [address, setAddress] = useDraftState(k('address'), '')
  const [postcode, setPostcode] = useDraftState(k('postcode'), '')

  // Section 2 - Emergency Contact
  const [emergencyName, setEmergencyName] = useDraftState(k('emergencyName'), '')
  const [emergencyRelationship, setEmergencyRelationship] = useDraftState(k('emergencyRelationship'), '')
  const [emergencyPhone, setEmergencyPhone] = useDraftState(k('emergencyPhone'), '')

  // Section 3 - General Health
  const [healthRating, setHealthRating] = useDraftState<'Excellent' | 'Good' | 'Fair' | 'Poor' | ''>(k('healthRating'), '')
  const [exercisedBefore, setExercisedBefore] = useDraftState<YesNo>(k('exercisedBefore'), '')
  const [exerciseType, setExerciseType] = useDraftState(k('exerciseType'), '')
  const [exerciseEnjoy, setExerciseEnjoy] = useDraftState(k('exerciseEnjoy'), '')
  const [exerciseDislike, setExerciseDislike] = useDraftState(k('exerciseDislike'), '')

  // Section 4 - Cardiovascular Screening
  const [cardioSymptoms, setCardioSymptoms] = useDraftState<string[]>(k('cardioSymptoms'), [])

  // Section 5 - Medical History
  const [illnessInjury, setIllnessInjury] = useDraftState<YesNo>(k('illnessInjury'), '')
  const [illnessDetails, setIllnessDetails] = useDraftState(k('illnessDetails'), '')
  const [receivingTreatment, setReceivingTreatment] = useDraftState<YesNo>(k('receivingTreatment'), '')
  const [treatmentDetails, setTreatmentDetails] = useDraftState(k('treatmentDetails'), '')
  const [onMedication, setOnMedication] = useDraftState<YesNo>(k('onMedication'), '')
  const [medicationList, setMedicationList] = useDraftState(k('medicationList'), '')
  const [pregnant, setPregnant] = useDraftState<YesNo>(k('pregnant'), '')

  // Section 6 - Musculoskeletal
  const [painAreas, setPainAreas] = useDraftState(k('painAreas'), '')
  const [painAggravated, setPainAggravated] = useDraftState<YesNo>(k('painAggravated'), '')
  const [painTreatment, setPainTreatment] = useDraftState<YesNo>(k('painTreatment'), '')

  // Section 7 - Lifestyle
  const [alcohol, setAlcohol] = useDraftState<YesNo>(k('alcohol'), '')
  const [smoking, setSmoking] = useDraftState<YesNo>(k('smoking'), '')
  const [dietPattern, setDietPattern] = useDraftState(k('dietPattern'), '')
  const [eatingHabits, setEatingHabits] = useDraftState<number | null>(k('eatingHabits'), null)
  const [nutritionSupport, setNutritionSupport] = useDraftState<YesNo>(k('nutritionSupport'), '')

  // Section 8 - Barriers & Goals
  const [barriers, setBarriers] = useDraftState<string[]>(k('barriers'), [])
  const [healthGoals, setHealthGoals] = useDraftState(k('healthGoals'), '')
  const [action1, setAction1] = useDraftState(k('action1'), '')
  const [action2, setAction2] = useDraftState(k('action2'), '')
  const [action3, setAction3] = useDraftState(k('action3'), '')

  // Section 9 - Health Declaration
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

  // Validation
  const [missing, setMissing] = useState<Set<string>>(new Set())
  const [validationMessage, setValidationMessage] = useState('')

  function clearMissing(id: string) {
    if (!missing.has(id)) return
    setMissing(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // Clearance logic
  const requiresClearance = cardioSymptoms.filter(s => s !== 'None of the above').length > 0 || pregnant === 'yes'

  const toggleBarrier = (b: string) =>
    setBarriers(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])

  const toggleCardio = (s: string) =>
    setCardioSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  function buildMissing(): Set<string> {
    const m = new Set<string>()
    if (!dob) m.add('dob')
    if (!phone) m.add('phone')
    if (!emergencyName) m.add('emergencyName')
    if (!emergencyRelationship) m.add('emergencyRelationship')
    if (!emergencyPhone) m.add('emergencyPhone')
    if (!healthRating) m.add('healthRating')
    if (!exercisedBefore) m.add('exercisedBefore')
    if (!illnessInjury) m.add('illnessInjury')
    if (!receivingTreatment) m.add('receivingTreatment')
    if (!onMedication) m.add('onMedication')
    if (!pregnant) m.add('pregnant')
    if (!alcohol) m.add('alcohol')
    if (!smoking) m.add('smoking')
    if (!declaredHonest) m.add('declaredHonest')
    if (!declaredDisclosed) m.add('declaredDisclosed')
    if (!declaredWillNotify) m.add('declaredWillNotify')
    if (!declaredRisks) m.add('declaredRisks')
    if (!declaredResponsibility) m.add('declaredResponsibility')
    if (!declaredFollowGuidance) m.add('declaredFollowGuidance')
    if (!declaredNutrition) m.add('declaredNutrition')
    if (!declaredLiability) m.add('declaredLiability')
    if (!declaredPrivacy) m.add('declaredPrivacy')
    if (declarationName.trim().length < 3) m.add('declarationName')
    return m
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const m = buildMissing()
    if (m.size > 0) {
      setMissing(m)
      setValidationMessage(
        m.size === 1
          ? '1 question still needs an answer.'
          : `${m.size} questions still need an answer.`
      )
      setTimeout(() => {
        const first = Array.from(m)[0]
        const el = document.getElementById(`f-${first}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 80)
      return
    }

    setMissing(new Set())
    setValidationMessage('')
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

  const errClass = (id: string) => missing.has(id) ? 'border-[#E8C9C9]' : 'border-[#E4E4E0]'
  const errLabel = (id: string) => missing.has(id) ? 'text-[#8F2D2D]' : 'text-[#4A4F57]'
  const errMessage = (id: string) =>
    missing.has(id) ? (
      <p className="text-[#8F2D2D] text-xs mt-2 font-medium">Please answer this question.</p>
    ) : null

  const yesNoButton = (id: string, current: YesNo, setter: (v: YesNo) => void, opt: 'Yes' | 'No') => {
    const isSelected = current === opt.toLowerCase()
    const hasError = missing.has(id) && !current
    return (
      <button
        key={opt}
        type="button"
        onClick={() => { setter(opt.toLowerCase() as YesNo); clearMissing(id) }}
        className={`px-6 py-3.5 min-h-[52px] rounded-xl text-[15px] font-medium transition-colors border-2 ${
          isSelected
            ? 'bg-[rgba(15,17,21,0.06)] text-[#0F1115] font-medium border-[#0F1115]'
            : hasError
            ? 'bg-white text-[#4A4F57] border-[#E8C9C9]'
            : 'bg-white text-[#4A4F57] border-[#E4E4E0] hover:border-[#DCDCD7]'
        }`}
      >
        {opt}
      </button>
    )
  }

  return (
    <PortalPageShell
      eyebrow="Health Declaration"
      title="Health declaration"
      description="This screening ensures your coaching program is structured safely and appropriately for you. Answer all questions honestly and completely."
    >
      {validationMessage && (
          <div className="mb-6 border-l-2 border-[#8F2D2D] bg-[#FBF1F1] rounded-r-2xl px-4 py-3">
            <p className="text-[#8F2D2D] text-sm font-medium">{validationMessage}</p>
            <p className="text-[#8F2D2D]/70 text-xs mt-1">Missing fields are highlighted in red below.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Section 1 - Personal Details */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-4">Personal Details</p>
            <div className="space-y-3">
              <div className="bg-[#FFFFFF] rounded-xl border border-[#E4E4E0] px-4 py-3">
                <p className="text-xs text-[#9CA2AB] mb-1">Full Name</p>
                <p className="text-sm text-[#4A4F57]">{clientName}</p>
              </div>
              <div id="f-dob" className="scroll-mt-24">
                <input
                  type="date"
                  value={dob}
                  onChange={e => { setDob(e.target.value); clearMissing('dob') }}
                  className={`w-full bg-[#FFFFFF] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] border ${errClass('dob')}`}
                  placeholder="Date of Birth"
                />
                <p className={`text-xs mt-1 ml-1 ${errLabel('dob')}`}>Date of Birth</p>
                {errMessage('dob')}
              </div>
              <div id="f-phone" className="scroll-mt-24">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); clearMissing('phone') }}
                  placeholder="Mobile Number"
                  className={`w-full bg-[#FFFFFF] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] border ${errClass('phone')}`}
                />
                {errMessage('phone')}
              </div>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Address (optional)"
                className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB]"
              />
              <input
                type="text"
                value={postcode}
                onChange={e => setPostcode(e.target.value)}
                placeholder="Postcode (optional)"
                className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB]"
              />
            </div>
          </section>

          {/* Section 2 - Emergency Contact */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-4">Emergency Contact</p>
            <div className="space-y-3">
              <div id="f-emergencyName" className="scroll-mt-24">
                <input
                  type="text"
                  value={emergencyName}
                  onChange={e => { setEmergencyName(e.target.value); clearMissing('emergencyName') }}
                  placeholder="Full Name"
                  className={`w-full bg-[#FFFFFF] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] border ${errClass('emergencyName')}`}
                />
                {errMessage('emergencyName')}
              </div>
              <div id="f-emergencyRelationship" className="scroll-mt-24">
                <input
                  type="text"
                  value={emergencyRelationship}
                  onChange={e => { setEmergencyRelationship(e.target.value); clearMissing('emergencyRelationship') }}
                  placeholder="Relationship (e.g. Partner, Parent)"
                  className={`w-full bg-[#FFFFFF] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] border ${errClass('emergencyRelationship')}`}
                />
                {errMessage('emergencyRelationship')}
              </div>
              <div id="f-emergencyPhone" className="scroll-mt-24">
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={e => { setEmergencyPhone(e.target.value); clearMissing('emergencyPhone') }}
                  placeholder="Phone Number"
                  className={`w-full bg-[#FFFFFF] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] border ${errClass('emergencyPhone')}`}
                />
                {errMessage('emergencyPhone')}
              </div>
            </div>
          </section>

          {/* Section 3 - General Health */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-4">General Health</p>
            <div className="space-y-5">
              <div id="f-healthRating" className="scroll-mt-24">
                <p className={`text-sm mb-3 ${errLabel('healthRating')}`}>How would you rate your general health?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Excellent', 'Good', 'Fair', 'Poor'] as const).map(r => {
                    const isSelected = healthRating === r
                    const hasError = missing.has('healthRating') && !healthRating
                    return (
                      <button key={r} type="button"
                        onClick={() => { setHealthRating(r); clearMissing('healthRating') }}
                        className={`py-3.5 min-h-[52px] rounded-xl text-[15px] font-medium transition-colors border-2 ${
                          isSelected ? 'bg-[rgba(15,17,21,0.06)] text-[#0F1115] font-medium border-[#0F1115]'
                          : hasError ? 'bg-white text-[#4A4F57] border-[#E8C9C9]'
                          : 'bg-white text-[#4A4F57] border-[#E4E4E0] hover:border-[#DCDCD7]'
                        }`}
                      >{r}</button>
                    )
                  })}
                </div>
                {errMessage('healthRating')}
              </div>

              <div id="f-exercisedBefore" className="scroll-mt-24">
                <p className={`text-sm mb-3 ${errLabel('exercisedBefore')}`}>Have you done structured exercise before?</p>
                <div className="flex gap-3">
                  {yesNoButton('exercisedBefore', exercisedBefore, setExercisedBefore, 'Yes')}
                  {yesNoButton('exercisedBefore', exercisedBefore, setExercisedBefore, 'No')}
                </div>
                {errMessage('exercisedBefore')}
              </div>

              {exercisedBefore === 'yes' && (
                <textarea value={exerciseType} onChange={e => setExerciseType(e.target.value)}
                  placeholder="What type of exercise did you do?"
                  className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={2} />
              )}

              <textarea value={exerciseEnjoy} onChange={e => setExerciseEnjoy(e.target.value)}
                placeholder="Types of exercise you enjoy (optional)"
                className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={2} />

              <textarea value={exerciseDislike} onChange={e => setExerciseDislike(e.target.value)}
                placeholder="Types of exercise you dislike (optional)"
                className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={2} />
            </div>
          </section>

          {/* Section 4 - Cardiovascular Screening */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-1">Cardiovascular & Respiratory Screening</p>
            <p className="text-sm text-[#6E747D] mb-4">Tick any symptoms you currently experience or have experienced recently:</p>
            <div className="space-y-2">
              {CARDIO_SYMPTOMS.map(symptom => (
                <label key={symptom} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#FFFFFF] transition-colors">
                  <input type="checkbox" checked={cardioSymptoms.includes(symptom)} onChange={() => toggleCardio(symptom)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#0F1115] flex-shrink-0" />
                  <span className="text-sm text-[#4A4F57]">{symptom}</span>
                </label>
              ))}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#FFFFFF] transition-colors">
                <input type="checkbox" checked={cardioSymptoms.includes('None of the above')} onChange={() => toggleCardio('None of the above')}
                  className="mt-0.5 w-4 h-4 rounded accent-[#0F1115] flex-shrink-0" />
                <span className="text-sm text-[#4A4F57]">None of the above</span>
              </label>
            </div>
          </section>

          {/* Section 5 - Medical History */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-4">Medical History</p>
            <div className="space-y-5">

              <div id="f-illnessInjury" className="scroll-mt-24">
                <p className={`text-sm mb-3 ${errLabel('illnessInjury')}`}>Have you had any major illness or injury in the last 5 years?</p>
                <div className="flex gap-3">
                  {yesNoButton('illnessInjury', illnessInjury, setIllnessInjury, 'Yes')}
                  {yesNoButton('illnessInjury', illnessInjury, setIllnessInjury, 'No')}
                </div>
                {errMessage('illnessInjury')}
                {illnessInjury === 'yes' && (
                  <textarea value={illnessDetails} onChange={e => setIllnessDetails(e.target.value)}
                    placeholder="Please provide details..."
                    className="mt-3 w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={3} />
                )}
              </div>

              <div id="f-receivingTreatment" className="scroll-mt-24">
                <p className={`text-sm mb-3 ${errLabel('receivingTreatment')}`}>Are you currently receiving medical treatment for any condition?</p>
                <div className="flex gap-3">
                  {yesNoButton('receivingTreatment', receivingTreatment, setReceivingTreatment, 'Yes')}
                  {yesNoButton('receivingTreatment', receivingTreatment, setReceivingTreatment, 'No')}
                </div>
                {errMessage('receivingTreatment')}
                {receivingTreatment === 'yes' && (
                  <textarea value={treatmentDetails} onChange={e => setTreatmentDetails(e.target.value)}
                    placeholder="Please provide details..."
                    className="mt-3 w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={3} />
                )}
              </div>

              <div id="f-onMedication" className="scroll-mt-24">
                <p className={`text-sm mb-3 ${errLabel('onMedication')}`}>Are you currently taking any prescription medication?</p>
                <div className="flex gap-3">
                  {yesNoButton('onMedication', onMedication, setOnMedication, 'Yes')}
                  {yesNoButton('onMedication', onMedication, setOnMedication, 'No')}
                </div>
                {errMessage('onMedication')}
                {onMedication === 'yes' && (
                  <textarea value={medicationList} onChange={e => setMedicationList(e.target.value)}
                    placeholder="Please list all medications..."
                    className="mt-3 w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={3} />
                )}
              </div>

              <div id="f-pregnant" className="scroll-mt-24">
                <p className={`text-sm mb-3 ${errLabel('pregnant')}`}>Are you currently pregnant or recently postpartum (within 12 months)?</p>
                <div className="flex gap-3">
                  {yesNoButton('pregnant', pregnant, setPregnant, 'Yes')}
                  {yesNoButton('pregnant', pregnant, setPregnant, 'No')}
                </div>
                {errMessage('pregnant')}
              </div>
            </div>
          </section>

          {/* Section 6 - Musculoskeletal */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-4">Musculoskeletal Health</p>
            <div className="space-y-5">
              <textarea value={painAreas} onChange={e => setPainAreas(e.target.value)}
                placeholder="Describe any current pain, injuries, or areas of concern (or write 'None')"
                className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={3} />

              {painAreas && painAreas.toLowerCase() !== 'none' && painAreas.length > 2 && (
                <>
                  <div>
                    <p className="text-sm text-[#4A4F57] mb-3">Is this aggravated by exercise?</p>
                    <div className="flex gap-3">
                      {(['Yes', 'No'] as const).map(opt => (
                        <button key={opt} type="button"
                          onClick={() => setPainAggravated(opt.toLowerCase() as YesNo)}
                          className={`px-6 py-3.5 min-h-[52px] rounded-xl text-[15px] font-medium transition-colors ${painAggravated === opt.toLowerCase() ? 'bg-[rgba(15,17,21,0.06)] text-[#0F1115] font-medium border-2 border-[#0F1115]' : 'bg-white text-[#4A4F57] border-2 border-[#E4E4E0] hover:border-[#DCDCD7]'}`}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A4F57] mb-3">Are you currently receiving treatment for it?</p>
                    <div className="flex gap-3">
                      {(['Yes', 'No'] as const).map(opt => (
                        <button key={opt} type="button"
                          onClick={() => setPainTreatment(opt.toLowerCase() as YesNo)}
                          className={`px-6 py-3.5 min-h-[52px] rounded-xl text-[15px] font-medium transition-colors ${painTreatment === opt.toLowerCase() ? 'bg-[rgba(15,17,21,0.06)] text-[#0F1115] font-medium border-2 border-[#0F1115]' : 'bg-white text-[#4A4F57] border-2 border-[#E4E4E0] hover:border-[#DCDCD7]'}`}
                        >{opt}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Section 7 - Lifestyle */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-4">Lifestyle</p>
            <div className="space-y-5">
              <div id="f-alcohol" className="scroll-mt-24">
                <p className={`text-sm mb-3 ${errLabel('alcohol')}`}>Do you drink alcohol?</p>
                <div className="flex gap-3">
                  {yesNoButton('alcohol', alcohol, setAlcohol, 'Yes')}
                  {yesNoButton('alcohol', alcohol, setAlcohol, 'No')}
                </div>
                {errMessage('alcohol')}
              </div>

              <div id="f-smoking" className="scroll-mt-24">
                <p className={`text-sm mb-3 ${errLabel('smoking')}`}>Do you smoke?</p>
                <div className="flex gap-3">
                  {yesNoButton('smoking', smoking, setSmoking, 'Yes')}
                  {yesNoButton('smoking', smoking, setSmoking, 'No')}
                </div>
                {errMessage('smoking')}
              </div>

              <textarea value={dietPattern} onChange={e => setDietPattern(e.target.value)}
                placeholder="Describe your typical diet pattern (optional)"
                className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={2} />

              <div>
                <p className="text-sm text-[#4A4F57] mb-3">Rate your eating habits (1 = poor, 10 = excellent)</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} type="button"
                      onClick={() => setEatingHabits(n)}
                      className={`py-3.5 min-h-[52px] rounded-xl text-[15px] font-medium transition-colors ${eatingHabits === n ? 'bg-[rgba(15,17,21,0.06)] text-[#0F1115] font-medium border-2 border-[#0F1115]' : 'bg-white text-[#4A4F57] border-2 border-[#E4E4E0] hover:border-[#DCDCD7]'}`}
                    >{n}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-[#4A4F57] mb-3">Do you need nutrition support?</p>
                <div className="flex gap-3">
                  {(['Yes', 'No'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setNutritionSupport(opt.toLowerCase() as YesNo)}
                      className={`px-6 py-3.5 min-h-[52px] rounded-xl text-[15px] font-medium transition-colors ${nutritionSupport === opt.toLowerCase() ? 'bg-[rgba(15,17,21,0.06)] text-[#0F1115] font-medium border-2 border-[#0F1115]' : 'bg-white text-[#4A4F57] border-2 border-[#E4E4E0] hover:border-[#DCDCD7]'}`}
                    >{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 - Barriers & Goals */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-4">Barriers & Readiness</p>
            <div className="space-y-5">
              <div>
                <p className="text-sm text-[#4A4F57] mb-3">What barriers do you currently face? (select all that apply)</p>
                <div className="space-y-2">
                  {BARRIERS.map(b => (
                    <label key={b} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[#FFFFFF] transition-colors">
                      <input type="checkbox" checked={barriers.includes(b)} onChange={() => toggleBarrier(b)}
                        className="w-4 h-4 rounded accent-[#0F1115]" />
                      <span className="text-sm text-[#4A4F57]">{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              <textarea value={healthGoals} onChange={e => setHealthGoals(e.target.value)}
                placeholder="What are your health and performance goals for the next 3 months? (optional)"
                className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] resize-none" rows={3} />

              <div>
                <p className="text-sm text-[#4A4F57] mb-3">List 3 actions you will take to improve your health: (optional)</p>
                <div className="space-y-2">
                  {[[action1, setAction1], [action2, setAction2], [action3, setAction3]].map(([val, setter], i) => (
                    <input key={i} type="text" value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                      placeholder={`Action ${i + 1}`}
                      className="w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB]" />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Medical clearance notice */}
          {requiresClearance && (
            <div className="bg-[#FDF8F1] border border-[#EADCC4] rounded-xl p-4">
              <p className="text-sm text-[#B06E1F] font-semibold mb-1">Medical clearance required</p>
              <p className="text-xs text-[#B06E1F]/70">Based on your responses, your coach will request written clearance from your GP before training begins. This is a standard precautionary requirement.</p>
            </div>
          )}

          {/* Section 9 - Health Declaration */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-1">Health Declaration</p>
            <p className="text-sm text-[#6E747D] mb-4">Please read and tick each statement to confirm your understanding:</p>
            <div className="space-y-3">
              {[
                { id: 'declaredHonest', state: declaredHonest, setter: setDeclaredHonest, text: 'I have completed this form honestly and to the best of my knowledge.' },
                { id: 'declaredDisclosed', state: declaredDisclosed, setter: setDeclaredDisclosed, text: 'I have disclosed all relevant medical conditions, medications, and health history.' },
                { id: 'declaredWillNotify', state: declaredWillNotify, setter: setDeclaredWillNotify, text: 'I will notify Body Recode of any changes to my health status during coaching.' },
                { id: 'declaredRisks', state: declaredRisks, setter: setDeclaredRisks, text: 'I understand that exercise carries inherent risks including soreness, strain, fatigue, and the possibility of accidental injury.' },
                { id: 'declaredResponsibility', state: declaredResponsibility, setter: setDeclaredResponsibility, text: 'I accept responsibility for staying within my limits, following guidance, communicating honestly about discomfort, and seeking medical advice when recommended.' },
                { id: 'declaredFollowGuidance', state: declaredFollowGuidance, setter: setDeclaredFollowGuidance, text: 'I will use proper form and technique, and modify or pause exercises when needed.' },
                { id: 'declaredNutrition', state: declaredNutrition, setter: setDeclaredNutrition, text: 'I understand that any nutrition guidance provided by Body Recode is general information only and does not constitute medical or dietetic treatment.' },
                { id: 'declaredLiability', state: declaredLiability, setter: setDeclaredLiability, text: 'I agree that Body Recode is not liable for injuries or health complications arising from participation, provided coaching is delivered within its professional scope of practice. Nothing in this declaration limits my rights under Australian Consumer Law.' },
                { id: 'declaredPrivacy', state: declaredPrivacy, setter: setDeclaredPrivacy, text: 'I consent to my health information being securely stored and used solely for the purpose of delivering my coaching program. It will not be shared with third parties without my permission.' },
              ].map(({ id, state, setter, text }) => {
                const hasError = missing.has(id) && !state
                return (
                  <label
                    key={id}
                    id={`f-${id}`}
                    className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border transition-colors scroll-mt-24 ${
                      state
                        ? 'border-[#DCDCD7] bg-[#F2F2EF]'
                        : hasError
                        ? 'border-[#E8C9C9] bg-[#FBF1F1]'
                        : 'border-[#E4E4E0] bg-[#FFFFFF] hover:border-[#E4E4E0]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state}
                      onChange={e => { setter(e.target.checked); clearMissing(id) }}
                      className="mt-0.5 w-4 h-4 rounded accent-[#0F1115] flex-shrink-0"
                    />
                    <span className={`text-sm leading-relaxed ${hasError ? 'text-[#8F2D2D]' : 'text-[#4A4F57]'}`}>{text}</span>
                  </label>
                )
              })}
            </div>
          </section>

          {/* Declaration */}
          <section>
            <p className="text-[12.5px] font-medium text-[#9CA2AB] mb-4">Declaration</p>
            <div id="f-declarationName" className={`bg-[#FFFFFF] rounded-xl p-5 space-y-4 border scroll-mt-24 ${missing.has('declarationName') ? 'border-[#E8C9C9]' : 'border-[#E4E4E0]'}`}>
              <p className={`text-sm ${missing.has('declarationName') ? 'text-[#8F2D2D]' : 'text-[#6E747D]'}`}>By typing your full name below, you confirm that all information provided in this form is accurate and complete, and that you agree to the declarations above.</p>
              <input
                type="text"
                value={declarationName}
                onChange={e => { setDeclarationName(e.target.value); if (e.target.value.trim().length >= 3) clearMissing('declarationName') }}
                placeholder="Type your full name"
                className={`w-full bg-[#FFFFFF] rounded-xl px-4 py-3 text-sm text-[#0F1115] outline-none focus:ring-2 focus:ring-[#0F1115]/50 placeholder-[#9CA2AB] border ${missing.has('declarationName') ? 'border-[#E8C9C9]' : 'border-[#E4E4E0]'}`}
              />
              <p className="text-xs text-[#9CA2AB]">Date: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              {errMessage('declarationName')}
            </div>
          </section>

        {error && <p className="text-[#8F2D2D] text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#0F1115] text-white text-sm font-bold py-4 rounded-2xl hover:bg-[#000000] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving…' : 'Submit Health Declaration →'}
        </button>
      </form>
    </PortalPageShell>
  )
}
