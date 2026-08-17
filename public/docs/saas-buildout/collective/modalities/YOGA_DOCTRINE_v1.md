% Yoga Programming Doctrine v1
% Body Recode Modality Pack: Yoga
% June 2026

# What this is

This is the doctrine that drives the yoga generation engine. It is the equivalent of the strength training doctrine, written for yoga. The engine reads the client's body state, then sequences a practice that fits that state, within the rules below.

The principle is the same as everywhere else in the platform: **the engine proposes the shape, but hard limits are enforced in code.** The model writes the practice; the doctrine clamps it to what is safe and coherent. Nothing the engine produces reaches a client until the coach reviews and approves it.

This is a **v1 baseline**, authored from general yoga programming knowledge. It is competent and safe, not yet expert-differentiated. A domain expert (Melisa) deepens it later without changing the structure: richer sequencing, her own style signature, a finer state-to-practice map, and a larger, more nuanced pose library.

---

# 1. State sets the ceiling

The client's recovery and regulation state decides the strongest practice we will allow. This reuses the platform's existing Recovery and Regulation System (RRS) levels, so the body-state reading carries straight over from the rest of the platform. This is a hard ceiling: the coach and the engine may go gentler, never stronger.

| Recovery state (RRS level) | Strongest practice allowed |
|---|---|
| Level 0-1 — protective / instability | **Restorative only** |
| Level 2 — stabilisation | **Gentle** |
| Level 3 — standard | **Moderate** |
| Level 4 — advanced, sustained stability | **Strong** |

A depleted or dysregulated client gets restorative or gentle practice: long supported holds, breath, floor work. No strong balances, deep backbends, or inversions, regardless of what they ask for. A stable, well-recovered client can be built toward a peak.

This is where yoga and the Body Recode engine fit together naturally: regulation is yoga's home ground, so the same reading that flags a depleted strength client flags a client who needs restorative rather than strong practice.

---

# 2. The practice arc

Every practice is a bell curve of intensity: settle, warm, build to a peak appropriate to the ceiling, counterpose, then rest. It always ends in stillness. The arc changes shape with the ceiling.

**Restorative**
1. Centering and breath (~20%)
2. Gentle opening — supine, kneeling, supported (~30%)
3. Supported holds — restorative, forward folds, gentle twists (~35%)
4. Rest (~15%)

**Gentle**
1. Centering and breath (~15%)
2. Warm-up — kneeling, supine, seated (~25%)
3. Gentle movement — standing, forward folds, side bends (~30%)
4. Cooldown and twist (~18%)
5. Rest (~12%)

**Moderate / Strong**
1. Centering and breath (~10%)
2. Warm-up — kneeling, sun salutations (~18%)
3. Standing and flow — sun salutations, standing, balance (~27%)
4. Peak — backbend, balance, inversion, core (~17%)
5. Counterpose and unwind — forward folds, twists (~16%)
6. Rest (~12%)

---

# 3. Sequencing rules

- Warm the spine before any backbend.
- Never follow a deep backbend directly with a deep forward fold. Pass through neutral.
- After a backbend, twist, or inversion, give a counterpose before moving on.
- Anything done on one side is done on the other. Keep the practice symmetrical.
- Build complexity gradually. Do not open with the hardest shape.
- Link breath to movement in flowing segments. Lengthen the holds in still ones.
- Always close with rest.

---

# 4. Safety and contraindications

Contraindications are a hard floor. Any pose whose contraindications match a client's flag is removed before the engine ever sees it, the same way injury contraindications work in the strength engine.

- Respect every client contraindication. Where it is safe, offer a prop or a gentler variant rather than dropping an opening entirely.
- Inversions are contraindication-sensitive: blood pressure, neck, eyes (glaucoma), pregnancy. They appear only at moderate or strong ceilings, and never against a flag.
- Each pose in the library carries its own contraindication list (for example: deep backbends flag low-back injury, neck injury, high blood pressure, and pregnancy).

---

# 5. The pose library (v1 seed)

The library is the yoga equivalent of the exercise database. Each pose is tagged with family, intensity, level, target regions, weight-bearing, props, contraindications, breath cue, and counterpose family, so the engine can sequence intelligently.

**Families:** standing, seated, kneeling, supine, prone, balance, inversion, twist, backbend, forward fold, side bend, core, restorative, sun salutation, pranayama (breath), transition.

**v1 library: 86 poses across all families**, with depth in each so the engine can sequence varied, non-repetitive practices at every intensity and length:

| Family | Poses | Family | Poses |
|---|---|---|---|
| Standing | 11 | Pranayama (breath) | 6 |
| Seated / hips | 10 | Forward fold | 6 |
| Backbend | 9 | Twist | 6 |
| Restorative | 9 | Kneeling | 5 |
| Balance | 7 | Inversion | 5 |
| Core | 5 | Supine | 3 |
| Sun salutation | 2 | Side bend | 2 |

This is a strong working repertoire, not a token starter, covering breath, warm-ups, standing, balance, backbends, twists, hip openers, core, inversions (contraindication-gated), and a full restorative set. Refining it further (finer attributes, named transitions between poses, style-specific variations) is part of what an expert deepens.

---

# 6. The generation doctrine (model-facing instructions)

This is the prose handed to the model at generation time. Enforcement still lives in code; this steers the model's choices within those bounds.

> **State first.** The client's recovery state sets the strongest practice allowed. A depleted or dysregulated client gets restorative or gentle practice. A stable client can be built toward a peak.
>
> **The arc.** Every practice is a bell curve: settle and breathe, warm the body, build to a peak appropriate to the ceiling, counterpose, then rest. Always end in stillness.
>
> **Sequencing.** Warm the spine before backbends. Counterpose after backbends, twists, and inversions. Keep the practice symmetrical. Build complexity gradually. Link breath to movement in flow; lengthen the holds in stillness.
>
> **Safety.** Respect every contraindication. Offer a prop or gentler variant rather than omitting a safe opening. Inversions only at moderate/strong, never against a flag.
>
> **Voice.** Plain, warm, specific. Name the breath. No diagnoses, no medical claims.

---

# 7. What an expert deepens later

This v1 is the floor. With a yoga expert, the doctrine grows in the ways that make generated practice feel authored rather than generic:

- A finer state-to-practice map (how specific states shape style, pace, and focus).
- Their own sequencing signature and class structure.
- A larger, richer pose library with transitions and variations.
- Style variants (restorative, yin, vinyasa, strong) as selectable approaches.
- Cueing language in their voice.

None of that changes the engine. It only deepens this doctrine and the library it draws from.
