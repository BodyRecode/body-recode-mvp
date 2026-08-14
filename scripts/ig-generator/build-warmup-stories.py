#!/usr/bin/env python3
"""Story manifest for the warm-up, 15-31 Aug 2026. 3 a day, 51 total.

Each day's stories reinforce that day's feed post, so the account says one thing
at a time rather than three. Days with no feed post carry the week's theme
forward instead of introducing a new one.

Numbers are real (n=88, pulled 14 Aug). Anything quoted here must match
scripts/state-of-the-data.ts - a soft number undoes the positioning.

Routes to the CHALLENGE, not the scorecard, matching the feed decision: the Day 0
intake IS the scorecard, so an enroller gets state-typed either way, and only an
enrolment tests whether the Day 7 Check-In fix holds.

Writes scripts/ig-generator/warmup-stories.json. Render with
07_ADS/_creative_build/build_warmup_stories.py, then seed.
"""
import json, pathlib

OUT = pathlib.Path(__file__).parent / "warmup-stories.json"

# (date, [(category, label, hook, sub)])
# categories: hook | pattern | quote | inside_challenge | photo_overlay
DAYS = [
  ("2026-08-15", [
    ("hook", "State of the data", "Eighty-eight scorecards.<br>One number <em>stopped me.</em>", "The strongest foundation of the five was training. The weakest was sleep."),
    ("pattern", "The five", "Best at <em>effort.</em><br>Worst at <em>repair.</em>", "Training response 2.06. Sleep 1.80. Out of three."),
    ("quote", None, "Whatever is holding your body back, it probably isn't the part you're trying hardest at.", None),
  ]),
  ("2026-08-16", [
    ("hook", "Half of everyone", "Fifty-one per cent land in <em>the middle.</em>", "Not depleted. Not ready. Doing the work and waiting for it to show."),
    ("inside_challenge", "Day 0 &middot; 7 &middot; 14", "Read the state. Score the markers. Name the pattern.", "Fourteen days. Free. Nothing to pay to get the read."),
    ("photo_overlay", "Body Decode", "Only eighteen per cent come out <em>Ready.</em>", "Link in bio."),
  ]),
  ("2026-08-17", [
    ("hook", "Twenty years", "The hardest workers were often the ones <em>getting nowhere.</em>", "Effort was almost never what separated people."),
    ("pattern", "Four patterns", "Same fat.<br><em>Opposite plans.</em>", "Cortisol. Insulin. Oestrogen. Testosterone. Each answers to something different."),
    ("quote", None, "Train hard into a body that is protecting itself and it comes back as fatigue.", None),
  ]),
  ("2026-08-18", [
    ("hook", "The autopsy", "Eat less, move more is right about <em>one body in four.</em>", "It is right about insulin. It makes the other three worse."),
    ("pattern", "One in four", "Cut the load on a stress pattern and <em>it holds tighter.</em>", "Restriction reads as scarcity. The body conserves harder."),
    ("quote", None, "You did stick to it. It was pointed at the wrong body.", None),
  ]),
  ("2026-08-19", [
    ("hook", "Same place", "Forty-four per cent say <em>the middle.</em>", "Which on its own tells you almost nothing."),
    ("pattern", "The difference", "Front of the belly while the limbs <em>get thinner.</em>", "That is cortisol. The limbs thinning is the tell, not the belly filling."),
    ("quote", None, "Location narrows it down. What comes with it is what decides.", None),
  ]),
  ("2026-08-20", [
    ("pattern", "The other one", "Back, flanks, <em>3pm crash.</em>", "Same middle. Completely different driver. That one is insulin."),
    ("hook", "Three of four", "Three of the four drivers push fat <em>to the middle.</em>", "So belly fat means cortisol is the most confidently repeated wrong thing in this industry."),
    ("inside_challenge", "Day 14", "Which of the four is <em>running yours.</em>", "And what that specific one answers to. Link in bio."),
  ]),
  ("2026-08-21", [
    ("quote", None, "Consistent clean food. Strength training. No results for months.", None),
    ("hook", "Read it again", "There is <em>no confession</em> in that sentence.", "No I fell off. No I have been slack. She knows what she is doing and she is doing it."),
    ("photo_overlay", "The read", "It isn't <em>discipline.</em>", "Nobody without discipline asks this question."),
  ]),
  ("2026-08-22", [
    ("hook", "The half-result", "Most plans <em>half work.</em>", "A bit of movement early, then a stall."),
    ("quote", None, "The half-result is what convinces you the plan was right and you were the problem.", None),
    ("pattern", "Wrong target", "Same effort.<br><em>Wrong target.</em>", "Run a cortisol correction on an insulin pattern and almost nothing moves."),
  ]),
  ("2026-08-23", [
    ("hook", "The sequence", "The read comes <em>before</em> the prescription.", "Guessing is expensive when the cost is a year of your life."),
    ("inside_challenge", "Fourteen days", "Day zero reads the state. Day seven scores the markers. Day fourteen names the pattern.", "Free. Nothing to pay to get the read."),
    ("photo_overlay", "Body Decode", "Prescribing before reading is <em>guessing.</em>", "Link in bio."),
  ]),
  ("2026-08-24", [
    ("hook", "State of the data", "Sleep is the <em>weakest</em> of the five.", "Thirty-eight per cent score the floor on it."),
    ("pattern", "The floor reads", "Waking through the night. <em>Not rested.</em>", "Training is the request. Sleep is where the body answers it."),
    ("quote", None, "A body that trains hard and sleeps badly is not building. It is accumulating.", None),
  ]),
  ("2026-08-25", [
    ("hook", "Over-diagnosed", "Discipline is almost never <em>the problem.</em>", "The people who arrive frustrated are the ones already doing the most."),
    ("quote", None, "You cannot fix an aim problem by pulling the trigger harder.", None),
    ("pattern", "What is missing", "Not effort.<br><em>A read.</em>", "Nobody has told them which of the four is holding the result."),
  ]),
  ("2026-08-26", [
    ("hook", "Women &middot; two phases", "Sixty per cent are perimenopausal <em>or past it.</em>", "So this one matters more than any other here."),
    ("pattern", "It moves", "Hips and thighs, then <em>the middle.</em>", "Phase one holds low. Phase two redistributes, and lean mass goes with it."),
    ("quote", None, "The question is not where it sits. It is whether where it sits has changed.", None),
  ]),
  ("2026-08-27", [
    ("pattern", "The trap", "In phase two it looks <em>identical</em> to stress.", "You cannot tell them apart by looking. Plenty of women get typed wrong because of it."),
    ("hook", "The separator", "Stress was central <em>from the start.</em>", "Oestrogen arrives at the middle from somewhere else."),
    ("inside_challenge", "Day 14", "The full pattern read.", "Which of the four is running yours. Link in bio."),
  ]),
  ("2026-08-28", [
    ("hook", "Same complaint", "Two women.<br><em>Opposite instructions.</em>", "Same age, same fat around the middle, same complaint that nothing moves."),
    ("pattern", "One takes load out", "Fewer hard sessions. <em>Protect the sleep.</em>", "The other changes when she eats. Her training was already fine."),
    ("quote", None, "Swap the plans and both of them stall.", None),
  ]),
  ("2026-08-29", [
    ("hook", "Four drivers", "Aim at the wrong one and <em>you lose a year.</em>", "Four drivers. Four different corrections."),
    ("quote", None, "A plan built for the wrong driver still does something. That is what makes it so hard to spot.", None),
    ("photo_overlay", "The read", "Read the state.<br><em>Then</em> decide.", "Link in bio."),
  ]),
  ("2026-08-30", [
    ("hook", "If the effort is there", "The problem is almost never the effort. <em>It is the target.</em>", "Fourteen days is a cheap way to find out which."),
    ("inside_challenge", "Free &middot; 14 days", "It will not give you a plan.", "It tells you what a plan would need to account for, which is the part almost everyone skips."),
    ("photo_overlay", "Body Decode", "Nothing to pay <em>to get the read.</em>", "Link in bio."),
  ]),
  ("2026-08-31", [
    ("hook", "A fortnight of numbers", "Train harder.<br><em>Eat less.</em>", "Aimed at a group whose training is already the strongest thing they have."),
    ("pattern", "The picture", "Best at effort.<br>Worst at <em>recovery.</em>", "That is not a motivation gap. It is a targeting failure."),
    ("quote", None, "Read the state first. Then decide what to change. In that order, every time.", None),
  ]),
]

posts = []
for date, items in DAYS:
    for i, (cat, label, hook, sub) in enumerate(items, 1):
        posts.append({
            "slug": f"story_wu_{date.replace('-', '')[4:]}_{i}",
            "date": date,
            "type": "story",
            "category": cat,
            "label": label,
            "hook_1": hook,
            "sub_1": sub,
            "photo": str((i % 3) + 1),
        })

OUT.write_text(json.dumps({"posts": posts}, indent=2, ensure_ascii=False))
print(f"{len(posts)} stories across {len(DAYS)} days -> {OUT}")
