# BR-FunnelB Round 1: launch pack

**v1.3 · 5 Aug 2026.** Four ads, ready to upload. Supersedes `BR_FUNNELB_CAMPAIGN_SETUP.md`, which
was written before I had read the locked strategy and got three things wrong: it sent traffic
to the scorecard, measured scorecard completions, and ignored Option D.

---

## Corrections carried in

**Destination is `/challenge`, not the scorecard.** Cold paid is the explicit exception to
scorecard-first routing. All creatives carry the free 14-day offer banner.

**The metric is the Funnel B chain**, not scorecard completions. Cost per Challenge signup,
then Day 7 completion rate, then Blueprint take-rate.

**Structure follows Option D.** Phase 1 is one archetype at $25/day. Expansion only on a
gate pass.

---

## What the July run actually told us

The campaign ran 13 to 30 July and was paused on the 31st.

| Period | Spend | Results | Cost each |
|---|---|---|---|
| 13 to 22 Jul | $234.17 | 21 | **$11.15** |
| 23 to 30 Jul | $207.11 | 2 | **$103.56** |

It did not fail. It worked for ten days, then died. CPM held flat at about $48 across both
halves, so it did not get more expensive to reach people, it stopped converting the people
it reached. Reach only grew from 2,158 to 3,613 while serving roughly 4,300 more impressions.

**Audience exhaustion on a pool that was too small.** Pausing was right.

Two things follow. The fix is a bigger pool, not better bidding. And ten days at $11.15
means the unit economics work, so this is a capacity problem rather than a concept problem.

Also worth knowing: within the one ad set that ran, a single ad took $220 of $225. You have
been testing one creative, not three.

---

## The structure these ads are built on

Added 5 Aug 2026, because this pack was a pure upload sheet with the standard living in a
different document. The framework is from `AD_PLAYBOOK_EXTRACT_KINGKONG.md`. It is repeated
here so an ad can be checked at the moment it is uploaded rather than after it has spent
money.

**The formula.** Pattern interrupt (the image) plus burning intrigue (the headline) plus a
big specific benefit (targeted) equals a hyper dopamine ad. Miss any one of the three and the
ad does one of two failure modes: it gets scrolled past, or it gets clicked by the wrong
people.

**The two jobs.** An ad only has to stop the scroll and earn the click. It does not have to
sell, explain the method, or establish credibility. Those happen after the click.

**Intrigue with a benefit, not blind clickbait.** A curiosity gap that only clicking can
close, attached to something specific the reader wants. Blind clickbait gets the click and
wastes it, because the algorithm learns the wrong buyer.

### Pre-flight checklist

Run before any ad goes live.

- [ ] Image interrupts the pattern
- [ ] Headline creates a curiosity gap that only clicking closes
- [ ] A specific benefit is present so the algorithm can find the right people
- [ ] Lead-in copy earns the "see more" tap
- [ ] Readability grade 5 or below
- [ ] Under 2,200 characters
- [ ] Heavy line breaks, one idea per line
- [ ] Specific numbers, not vague claims
- [ ] Positive framing leads
- [ ] Link description is intriguing, not descriptive
- [ ] CTA button set to Learn More
- [ ] Creative, headline and copy all on one theme
- [ ] Does not look like an ad

### Where these seven actually sit

Measured, not estimated. Character counts and Flesch-Kincaid grade computed from the copy
below on 5 Aug 2026.

| Ad | Chars | Grade | Verdict |
|---|---|---|---|
| Ad 6 Insulin drift | 779 | 4.4 | Pass |
| Ad 3 Perimenopause | 953 | **7.3** | **Fails the grade rule** |
| Ad 2 Fat Map reveal | 896 | 4.2 | Pass |
| Ad 4 Day 7 check-in | 850 | 3.4 | Pass |
| Ad 8 The plan went down | 849 | 4.8 | Pass |
| Ad 10 Order of operations | 986 | 4.5 | Pass |

All seven are far under the 2,200 character ceiling and all use one idea per line.

**Two honest failures against the checklist.**

**Ad 3 reads at grade 7.3.** The words causing it are the unavoidable ones: perimenopause,
gluteofemoral, contraception, recalibrating. It is the most technical subject of the seven
and the audience for it is the most likely to know the terms, so this is a deliberate
exception rather than an oversight. Worth a plain-language variant as a test.

**Several link descriptions are descriptive, not intriguing.** "Free 14 days. Day 0, day 7,
day 14" states the schedule and closes no gap. The rule wants a line that makes the click
feel necessary. Ad 2's "Which of the four is running it" is the one that does this correctly
and is the model for the rest. Low-cost fix, worth doing before upload.

**Positive framing leads** is the softest of the three. Ads 8 and 10 both open on the
failure state rather than the outcome. That is defensible because the failure state is the
recognition trigger, and recognition is what stops the scroll for this buyer. Flagged rather
than changed.

---

## The four ads

Destination `bodyrecode.au/challenge` for all four. CTA button **Learn More** on all four.

### Ad 6 · Insulin drift
`ad6-creative-B-headline-overlay.png`

**Headline**
> The afternoon crash, the evening cravings, and the fat that will not shift are one signal

**Primary text**
> Not three problems. One.
>
> And it is not about how many carbs are in the diet.
>
> When insulin stays elevated longer after meals than it should, fat burning stays switched
> off and cravings get louder.
>
> The tells line up in a specific order. Energy dips hard between 2 and 4pm. Heavy and foggy
> for about an hour after eating. Cravings hit hardest after dinner. Storage sits around the
> back and sides rather than the front.
>
> Most common in people whose output has changed but whose fuelling has not.
>
> It is not pre-diabetes. That is a diagnosis, this is a state.
>
> It is not too many carbs. It is when they are eaten and what they sit next to.
>
> It is not age. Insulin sensitivity is one of the most responsive systems in the body.
>
> Sensitivity is a state, and states respond to inputs.

**Link description** Free 14 days. Find your pattern.

---

### Ad 3 · Perimenopause
`ad3-v2-squat-creative-B-headline-overlay.png`

**Headline**
> Hips and thighs will not shift, and eating less is making it worse

**Primary text**
> When storage settles in the hips, glutes and outer thighs, restriction makes it worse.
>
> Not slower. Worse.
>
> This is an oestrogen-driven conservation state. The body holds on as a protective response
> to hormone signalling that is recalibrating.
>
> It shows up most in women moving toward or through perimenopause, after coming off hormonal
> contraception, or after a long run of undereating.
>
> Standard advice is eat less, train more. This pattern reads scarcity and conserves harder.
> So the harder the restriction, the tighter the hold, and the more it feels like a personal
> failure when it is a predictable response.
>
> What it answers to instead: consistent fuelling, protected sleep, regular meal timing.
>
> The tells. Storage settles low and outer, and later begins moving toward the middle.
> Bloating and water shift unpredictably across the month. Sleep gets lighter.
>
> Menopause is a transition. This is a pattern inside it, and patterns respond to inputs.

**Link description** Free 14 days. Find your pattern.

---

### Ad 2 · Fat Map reveal
`ad2-fatmap-F-MZ1-revealed.png`

**Headline**
> Where the fat sits tells you which hormone is holding it there

**Primary text**
> Front of the middle. Back and sides. Hips and thighs.
>
> Three places the fat sits, three completely different drivers.
>
> Front of the midsection, while the arms and legs stay lean. That is cortisol. A stress load
> the system has not resolved, so it keeps a reserve close to the organs.
>
> Mid-back, lower back and the flanks, with the front spared. That is insulin. Blood sugar
> handling has drifted, so fat burning stays switched off longer after meals than it should.
>
> Hips, glutes and outer thighs, later moving toward the middle. That is oestrogen. A
> conservation state, common through perimenopause.
>
> And one that is not a place at all: central fat rising while muscle, tone and drive fall.
>
> Four drivers. Four different corrections. Run the cortisol fix on an insulin pattern and
> almost nothing happens, which is why so many plans half-work.
>
> Where it sits narrows it. What comes with it decides.

**Link description** Free 14 days. Which of the four is running it.

---

### Ad 6 no-banner · the structural test
`ad6-TEST-nobanner.png`

Identical to Ad 6 in every respect except the offer banner is removed. **Use exactly the same
headline, primary text and link description.** If any other field differs the test is void.

This answers a question that affects all 35 creatives: does the locked offer banner help or
hurt? The playbook says an ad that looks like an ad loses. Amanda's audit locked the banner.
Neither has evidence. One test settles it.

---

## Structure and budget

One campaign, one ad set, four ads. At $25/day, four separate ad sets would get about $6 each
and learn nothing.

- **Optimise for** the conversion event, as per July
- **Budget** $25/day at campaign level
- **Placements** automatic, statics only, no Reels
- **Age** 30 to 60, all genders, Australia

**Known trade-off.** Meta will pick a favourite early and starve the others, which is exactly
what happened in July at ad set level. If one ad takes most of the spend inside 48 hours,
either accept its verdict or pause the leader to force delivery into the rest.

### Targeting: BROAD — decided 5 Aug 2026

**No interest stacking, no lookalikes.** Location Australia, age 30 to 60, all genders. That
is the whole audience definition.

This is a deliberate change to the Option D interest-based structure, made because interest
targeting is what exhausted at 3,613 people in ten days. The creative carries the targeting
now: a broad pool plus a conversion event gives the algorithm room to find the buyer, where a
stacked interest set had already run out of people before the creative had a fair run.

**What to expect from broad that is different:**
- Early delivery will look worse before it looks better. Broad takes longer to stabilise.
- Do not judge it on the first 48 hours.
- CPM should fall relative to July's ~$48, because the pool is no longer narrow.
- If CPM does not fall, the audience was never the constraint and the creative is.

**Do not narrow it back mid-flight.** If it underperforms, change the creative or the offer,
not the targeting. Narrowing is what produced the July exhaustion.

---

## What to watch

**Click to Challenge signup** is the number that matters, not CTR and not cost per click.

**Frequency.** July died when frequency passed roughly 2.4 on a small pool. If it climbs
past 2 in the first ten days, the audience is too small again regardless of what the cost per
result says that week.

**Spend distribution across the four ads.** If it is not roughly even by day 3, you are
testing one ad again.

**Decision at day 5 to 7.** Kill the bottom two on cost per signup. If nothing is converting
at an acceptable cost, stop and look at the Challenge landing page rather than buying more.

---

## Still open

1. **`BR_AGGRESSIVE_AD_PACK.md` is now stale.** Its headlines and body copy predate the
   body-composition rewrite. The four ads above are current; the pack is not.
2. **Meta Business Verification** was flagged as stuck. Worth confirming it does not limit
   spend before scaling.
3. **Every photo is AI-generated.** One real phone photo would de-risk the ads carrying your
   face.
4. ~~**Ads 4, 8 and 10** still carry pre-v2.0 wording.~~ **Done 5 Aug 2026.** Rewritten
   below. Outstanding on those: the Ad 4 creative has a ring/pill collision to rebuild.

---

## Ads 4, 8 and 10: the second layer

**Rewritten 5 Aug 2026.** These three were still carrying the copy from
`BR_AGGRESSIVE_AD_PACK.md`, which predates both the Fat Map v2.0 lock and the
body-composition rewrite. The creatives were already rebuilt for the Challenge and are
fine as they stand. Only the copy was stale.

Three things were wrong in the old versions and are fixed here.

**Ad 4 described the scorecard, not the Challenge.** It sold a 15 point score and said
"scored 0 to 3 each". The real scale is 1 to 3 across five sections, so the floor is 5 and
not 0. The creative shows the day 7 check-in, which is eight markers, so the copy now
matches the creative.

**Ad 8 invented a client.** It reported a specific person's score moving 6 to 10. There is
no such client record. The creative is watermarked ILLUSTRATIVE EXAMPLE and the copy now
matches that framing, describing the mechanic rather than a person.

**None of the three mentioned body composition.** That was the whole point of the rewrite.

Destination `bodyrecode.au/challenge`, CTA **Learn More**, same as the other four.

### Ad 4 · The day 7 check-in
`ad4-creative-B-headline-overlay.png`

**Headline**
> Six of the eight markers moved in a week, and the two that did not are the read

**Primary text**
> Fourteen days is not long enough to change how a body looks. It is long enough to find
> out why it is not changing.
>
> Day 7 of the Challenge scores eight markers against where they sat on day one. Morning
> energy. Afternoon energy. Puffiness and bloating. Sleep. Cravings. Mental clarity. Mood.
> Digestion.
>
> None of those are body composition. All of them decide it.
>
> A body that is not sleeping, not clearing fluid and crashing at 3pm does not give up fat,
> whatever the training looks like. The markers move first. The shape follows.
>
> Which is why the ones that improve are not the interesting part. The ones sitting flat
> are. Two markers refusing to move in a week is a pattern showing itself, and it points at
> which of the four drivers is holding the fat where it sits.
>
> That is the point of the fortnight. Not a transformation. A read you can act on.

**Link description** Free 14 days. Day 7 tells you what is holding.

### Ad 8 · The plan went down
`ad8-creative-B-headline-overlay.png`

**Headline**
> The check-in came back better, so the training went down, not up

**Primary text**
> Most people read a good check-in as permission to push harder. It is usually the opposite.
>
> If a body is holding fat while sleep is broken and energy is crashing, it is protecting.
> Adding a third or a fourth hard session to a protecting body does not change composition.
> It confirms the threat, and the body holds tighter.
>
> The load has to drop far enough that adaptation switches back on. Then the training builds
> something. Then the composition moves.
>
> This is the part that feels backwards. Fewer sessions, better result. It only makes sense
> once you accept the body is not being stubborn. It is responding exactly as it should to
> the signals it is being given.
>
> The Challenge runs this over fourteen days. Intake on day 0, eight markers scored on day
> 7, the full pattern read on day 14.
>
> Nothing to buy at the end of it. The read is the product.

**Link description** Free 14 days. Day 0, day 7, day 14.

### Ad 10 · The order of operations
`ad10-creative-B-headline-overlay.png`

**Headline**
> Right actions, wrong order, and the body composition never moves

**Primary text**
> Five days a week in the gym, food tracked, alcohol gone, and the shape of the body has not
> changed in a year.
>
> That is not a discipline problem. The discipline is already proven. It is a sequencing
> problem.
>
> Composition only changes when a body can afford to spend. A body in protection mode
> cannot. So the harder someone pushes against it the more it protects, and the exact effort
> that should be producing the result is what holds it in place.
>
> The order that works is three steps.
>
> One. Read the state, which is whether the body is currently able to change at all.
>
> Two. Bring the foundation up. Sleep, energy and stress load, far enough that the body can
> act on what it is given.
>
> Three. Correct the pattern. Where the fat sits and what comes with it names which of the
> four drivers is running it, and each one answers to a different correction.
>
> Prescribing before reading is guessing, which is why so many plans half work.
>
> The free fourteen days is step one and most of step two.

**Link description** The read is free. 14 days.

### Known creative defect

`ad4-creative-B-headline-overlay.png` has a rendering collision. The blue ring around the
6/8 overlaps the MARKERS IMPROVING pill and covers the "Rated against day one" caption
underneath it. It does not stop the ad running, but it should be rebuilt before this layer
goes live. There is no `build_ad4.py` in `_creative_build`, so the script needs
re-authoring first.
