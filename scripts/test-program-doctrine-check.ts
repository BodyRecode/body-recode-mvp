/**
 * The training doctrine check. Fixtures use the stored field name, exercise_name,
 * because reading `name` is the bug that left the library check silently off.
 *   npm run test:program-doctrine
 */
import { checkProgramDoctrine, injuredJointsFromIntake, clampRegulationRedRpe } from '../src/lib/program-doctrine-check'

let failed = 0, passed = 0
const check = (n: string, c: boolean, d?: unknown) => { if (c) { passed++; console.log(`  PASS  ${n}`) } else { failed++; console.log(`  FAIL  ${n}`, d ?? '') } }

const lib = new Map([
  ['barbell back squat', { axial_loading: true, stability_demand: 'high', primary_joint_stress: 'knee' }],
  ['leg press', { axial_loading: false, stability_demand: 'low', primary_joint_stress: 'knee' }],
  ['chest supported row', { axial_loading: false, stability_demand: 'low', primary_joint_stress: 'thoracic_spine' }],
  ['farmer carry', { axial_loading: true, stability_demand: 'high', primary_joint_stress: 'lumbar_spine' }],
  ['machine chest press', { axial_loading: false, stability_demand: 'low', primary_joint_stress: 'shoulder' }],
])
const block = (label: string, ...names: string[]) => ({ block_label: label, exercises: names.map(n => ({ exercise_name: n, rpe: 8 })) })
const sessions = [{ day_label: 'Monday', blocks: [block('Block A — Primary', 'Barbell Back Squat'), block('Block B — Secondary', 'Farmer Carry', 'Machine Chest Press')] }]
const base = { bodyState: 'Optimisation', regulationReadiness: 'Green', injuredJoints: [] as string[], exerciseByName: lib }

check('a green, optimising, pain-free client: no breaks', checkProgramDoctrine(sessions, base).length === 0)
const red = checkProgramDoctrine(sessions, { ...base, regulationReadiness: 'Red' })
check('regulation Red: both spine-loading exercises flagged', red.filter(v => v.code === 'REGULATION_RED_AXIAL').length === 2, red)
const rem = checkProgramDoctrine(sessions, { ...base, bodyState: 'Remediation' })
check('Remediation: spine loading allowed in the primary slot, flagged outside it', rem.some(v => v.code === 'REMEDIATION_AXIAL' && v.exercise === 'Farmer Carry') && !rem.some(v => v.code === 'REMEDIATION_AXIAL' && v.exercise === 'Barbell Back Squat'))
check('Remediation: high stability demand flagged', rem.filter(v => v.code === 'REMEDIATION_STABILITY').length === 2)
check('knee pain maps to the knee', JSON.stringify(injuredJointsFromIntake(['Knees', 'Lower back', 'Neck', 'None currently'])) === JSON.stringify(['knee', 'lumbar_spine']))
const knee = checkProgramDoctrine(sessions, { ...base, injuredJoints: ['knee'] })
check('knee pain: the squat is flagged, the chest press is not', knee.some(v => v.code === 'INJURED_JOINT' && v.exercise === 'Barbell Back Squat') && !knee.some(v => v.exercise === 'Machine Chest Press'))
check('an exercise not in the library is left to the library check', checkProgramDoctrine([{ blocks: [block('Primary', 'Mystery Lift')] }], { ...base, regulationReadiness: 'Red' }).length === 0)
check('the old field name still reads, for older rows', checkProgramDoctrine([{ blocks: [{ block_label: 'Secondary', exercises: [{ name: 'Farmer Carry' }] }] }], { ...base, regulationReadiness: 'Red' }).length === 1)
const clamped = JSON.parse(JSON.stringify(sessions))
const c = clampRegulationRedRpe(clamped, 'Red', 'intermediate')
check('the red-day effort ceiling lowers RPE 8 to 7 for an intermediate', c.clamps === 3 && clamped[0].blocks[0].exercises[0].rpe === 7)
check('and does nothing on a green day', clampRegulationRedRpe(JSON.parse(JSON.stringify(sessions)), 'Green', 'beginner').clamps === 0)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
