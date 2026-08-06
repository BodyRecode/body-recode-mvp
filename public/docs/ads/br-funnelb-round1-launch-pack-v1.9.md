# BR-FunnelB Round 1: launch pack

**v1.9 · 6 Aug 2026.** Four ads, ready to upload. Supersedes `BR_FUNNELB_CAMPAIGN_SETUP.md`, which
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
| Ad 5 Four patterns | 1,293 | 4.9 | Pass |
| Ad 12 Anatomical plate | 726 | 4.3 | Pass |
| Ad 13 Notes app | 797 | 4.8 | Pass |
| Ad 14 Plain type | 861 | 4.2 | Pass |
| Ad 6 Insulin drift | 779 | 4.4 | Pass |
| Ad 3 Perimenopause | 953 | **7.3** | **Fails the grade rule** |
| Ad 2 Fat Map reveal | 896 | 4.2 | Pass |
| Ad 4 Day 7 check-in | 850 | 3.4 | Pass |
| Ad 8 The plan went down | 849 | 4.8 | Pass |
| Ad 10 Order of operations | 986 | 4.5 | Pass |

All are far under the 2,200 character ceiling and all use one idea per line. Ad 5 is the
longest at 1,293 and still clears the grade rule, because the length is extra short
sentences rather than denser ones.

**Ad 5 replaced the no-banner test in Round 1 on 5 Aug 2026.** It is the strongest pattern
interrupt in the set: the four-pattern panel names every driver and tells the reader one of
them is theirs while withholding which, which is the cleanest curiosity gap available. Its
old copy was scorecard-framed and could not ship, since it described five questions and a
score out of fifteen while the creative shows the four patterns. Rewritten to match.

Ad 11 stays out for a specific reason: it uses the same photograph as Ad 5. Running both is
face fatigue and they read as one ad. Ad 5 wins the pair because Ad 11 is a statement and
Ad 5 opens a gap.

**One outstanding failure against the checklist, one fixed.**

**Ad 3 reads at grade 7.3.** The words causing it are the unavoidable ones: perimenopause,
gluteofemoral, contraception, recalibrating. It is the most technical subject of the seven
and the audience for it is the most likely to know the terms, so this is a deliberate
exception rather than an oversight. Worth a plain-language variant as a test.

**Link descriptions: fixed 5 Aug 2026.** Five of the six stated the offer and closed no gap.
"Free 14 days. Day 0, day 7, day 14" described a schedule. "Find your pattern" was generic
enough to sit under any of the seven. Each now carries the offer plus a gap specific to that
ad, modelled on Ad 2's "Which of the four is running it", which was already correct and is
unchanged.

| Ad | Was | Now |
|---|---|---|
| Ad 6 | Find your pattern | The crash names the driver |
| Ad 3 | Find your pattern | Why less food tightened the hold |
| Ad 2 | Which of the four is running it | unchanged, the model |
| Ad 4 | Day 7 tells you what is holding | The markers that refuse to move |
| Ad 8 | Day 0, day 7, day 14 | When less training moves more fat |
| Ad 10 | The read is free. 14 days | The step almost everyone skips |

Every one keeps "Free 14 days" in front, because the free offer is the qualifier that stops
the wrong buyer clicking. The no-banner test inherits Ad 6's line, since that test is void if
any field differs.

**Positive framing leads** is the softest of the three. Ads 8 and 10 both open on the
failure state rather than the outcome. That is defensible because the failure state is the
recognition trigger, and recognition is what stops the scroll for this buyer. Flagged rather
than changed.

---

## The four ads

Destination `bodyrecode.au/challenge` on every ad. CTA button **Learn More** on every ad.

**Round 1 is Ad 5, Ad 6, Ad 2 and Ad 3.** Four concepts, four different images, no repeats.
The no-banner test moved to Round 2 on 5 Aug, see below for why.

### Ad 5 · Four patterns
`ad5-creative-breaking-news.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad5-creative-breaking-news.jpg)

**Headline**

> Twenty years of coaching, and effort was almost never the thing separating them

**Primary text**

> Twenty years of coaching people, and the same thing kept showing up.
>
> The ones whose body composition changed and the ones whose did not were not separated by
> effort. Both worked hard. Both were consistent. Plenty of the people who got nowhere were
> working harder than the people who got somewhere.
>
> What separated them was whether the body was in a state that could use the effort going in.
>
> Put a hard block of training into a body that is protecting itself and it does not come
> back as muscle and it does not come off as fat. It comes back as fatigue.
>
> There are four patterns that do this, and each one holds fat in a different place.
>
> Stress-Stored holds it on the front of the midsection while the arms and legs stay lean.
> Cortisol.
>
> Insulin-Drift holds it across the mid-back, lower back and flanks, and deep in the
> abdomen, while the front stays relatively spared. Insulin.
>
> Estrogen-Shift holds it at the hips, glutes and outer thighs, then starts moving it toward
> the middle. Oestrogen.
>
> Androgen-Decline is not a location at all. Central fat rises while muscle, tone and drive
> fall together. Testosterone.
>
> One of those four is running yours. Correct the wrong one and almost nothing moves, which
> is why so many plans half work.
>
> Fourteen days is enough to find out which one it is.

**Link description** Free 14 days. One of the four is running yours.

---

### Ad 6 · Insulin drift
`ad6-creative-B-headline-overlay.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad6-creative-B-headline-overlay.jpg)

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

**Link description** Free 14 days. The crash names the driver.

---

### Ad 3 · Perimenopause
`ad3-v2-squat-creative-B-headline-overlay.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad3-v2-squat-creative-B-headline-overlay.jpg)

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

**Link description** Free 14 days. Why less food tightened the hold.

---

### Ad 2 · Fat Map reveal
`ad2-fatmap-F-MZ1-revealed.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad2-fatmap-F-MZ1-revealed.jpg)

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

### Ad 6 no-banner · DEFERRED to Round 2
`ad6-TEST-nobanner.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad6-TEST-nobanner.jpg)

**Not in Round 1, changed 5 Aug 2026.** Built and ready, held deliberately.

The banner question is real and still worth settling: does the locked offer banner help or
hurt? The playbook says an ad that looks like an ad loses, Amanda's audit locked the banner,
and neither has evidence.

But running it in Round 1 spent one of four slots on a second copy of Ad 6, which meant
Round 1 tested three concepts rather than four, on a budget where four is already the
practical ceiling. It also answered a narrower question than it looked like: whether the
banner helps *Ad 6*, not whether the banner helps.

**Better sequencing.** Find the winning concept in Round 1, then run that winner with and
without the banner in Round 2. Same test, better subject, and it no longer costs a discovery
slot. When it runs, every field except the creative must match the winner exactly or the
test is void.

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
   below. ~~Ad 4 creative ring/pill collision.~~ **Fixed 6 Aug 2026**, `build_ad4.py`
   re-authored.

---

## Format-breakers

**Built 5 Aug 2026** to fix two things wrong with Round 1 as a set rather than as
individual ads.

**Everything looked like the same advertiser.** Greyscale photo, Signal Blue, the same
type treatment and the same 104px banner on all four. Each one interrupts on its own, but
four ads from one account that read as a matched set read as a campaign, and a campaign
reads as an ad. The playbook's whole point is variety in the rotation.

**Only Ads 2 and 5 sold body composition in the image.** Ad 6's image sells a symptom, a
clock at 3pm. Ad 3's sells effort, a squat. The copy rewrite fixed composition; the
creative mostly did not.

These three break the visual language in three different directions and put composition
back in the picture. No new photography was needed: Ad 12 reuses the existing figures,
Ads 13 and 14 are pure type.

**Banner note.** None of them carries the blue offer banner, because it would defeat the
point of all three. Each keeps the free offer as a native-looking line instead, so the
qualifier survives. This does entangle them with the deferred no-banner test, so run that
test on a Round 1 ad rather than on one of these.

### Ad 12 · Anatomical plate

`ad12-creative-anatomical-plate.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad12-creative-anatomical-plate.jpg)

Cream paper, ink type, oxide-red accent, serif. Reads as a textbook plate rather than a
fitness ad. Three panels carry a location, the fourth is withheld, because
Androgen-Decline is a composition shift and not a place. That asymmetry is the gap.

**Headline**

> Three of the four show up as a place on the body. The fourth does not.

**Primary text**

> Fat does not settle at random. Where it sits narrows which driver is holding it.
>
> Front of the midsection while the arms and legs stay lean. Cortisol.
>
> Mid-back, lower back and the flanks, with the front spared. Insulin.
>
> Hips, glutes and outer thighs, later moving central. Oestrogen.
>
> And the fourth, which cannot be read from where it sits at all. It shows up as the middle
> filling while muscle, tone and drive fall together. That one is testosterone, and the
> giveaway is the muscle going rather than the fat arriving.
>
> This is why two people carrying the same amount of fat need opposite corrections. Same
> effort, different target, completely different result.
>
> Where it sits narrows it to one. What comes with it decides.

**Link description** Free 14 days. Which plate is yours.

### Ad 13 · Notes app

`ad13-creative-notes-app.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad13-creative-notes-app.jpg)

Deliberately un-designed. System font, white ground, iOS Notes furniture. It interrupts by
not looking like a designed thing at all, which is the format the playbook rates highest
for native feel.

**Headline**

> The four patterns, written out in plain english

**Primary text**

> Front of the middle, arms and legs still lean. That is cortisol. The body is holding a
> reserve close to the organs because the stress never resolved.
>
> Mid-back, lower back, the flanks, front relatively spared. That is insulin. Fat burning
> stays switched off longer after meals than it should.
>
> Hips, glutes, outer thighs, then it starts moving central. That is oestrogen. A
> conservation state, not a willpower failure.
>
> No single place, the middle fills while muscle and drive drop together. That is
> testosterone. The giveaway is the muscle going, not the fat arriving.
>
> The reason it matters: run the cortisol correction on an insulin pattern and almost
> nothing moves. Same effort, wrong target. That is most of why plans half work.
>
> Fourteen days is enough to find out which one you are running.

**Link description** Free 14 days. Which one are you running.

### Ad 14 · Plain type

`ad14-creative-plain-type.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad14-creative-plain-type.jpg)

White ground, black type, no photograph and no Signal Blue anywhere. The exact inverse of
the house style, so in a feed it should not read as coming from the same advertiser as
Ads 2, 3, 5 and 6.

**Headline**

> It was never discipline. It was the target.

**Primary text**

> Five days a week, food handled, alcohol gone, and the body has not changed shape in a
> year. That is not a discipline problem. The discipline is already proven.
>
> Four different drivers hold fat in four different ways, and each answers to a different
> correction.
>
> Correct the wrong one and the effort still goes in. It just does not come back out as a
> change in composition. That is most of why plans half work, and why it feels so unfair
> when they do.
>
> Cortisol holds it on the front of the middle while the limbs stay lean.
>
> Insulin holds it across the mid-back, lower back and flanks, sparing the front.
>
> Oestrogen holds it at the hips and thighs, then starts moving it central.
>
> Testosterone is not a place at all. The middle fills while muscle and drive fall together.
>
> Fourteen days is enough to find out which one is yours. Nothing to buy at the end of it.

**Link description** Free 14 days. Same effort, right target.

### When and where to use these

**Not in Round 1.** Round 1 has one job: find out which *concept* wins on a broad audience
with the banner on. Put a format-breaker in beside them and a win becomes unreadable, because
concept and format moved at the same time. Hold all three.

They are the answer to **creative fatigue**, which is the thing that actually killed July.
The audience did not get more expensive to reach, CPM held flat at about $48. It stopped
converting the people it reached. New targeting was never the fix; new creative is.

#### The four triggers

**1. Frequency climbs past 2.** The single most important one. July died past roughly 2.4.
When frequency rises, the same people are seeing the same look repeatedly, and a look they
recognise is a look they scroll. Rotate one format-breaker in and pause the most-served ad.
Targeting does not change.

**2. Cost per signup rises while CPM stays flat.** That combination is fatigue, not audience.
If CPM were climbing you would have a reach problem. Flat CPM with worsening cost means the
creative stopped working. Swap the format, keep the message.

**3. The stage gate passes and you scale to $75/day.** The locked rule is add fresh creative,
never add audiences. These are the fresh creative. Going from $25 to $75 on four ads that
have already run their course just buys the same fatigue faster.

**4. A Round 1 ad gets killed at day 5 to 7.** Replace it with a format-breaker rather than
another ad in the house style. You already know that look works or does not.

#### Where they go

**The same campaign and the same broad ad set.** Never a new ad set. Splitting $25/day across
two sets recreates the exact mistake that produced the July exhaustion, and neither set gets
enough to learn.

Same destination, `bodyrecode.au/challenge`. Same CTA, Learn More. Automatic placements,
statics only, unchanged.

**One at a time.** Three new formats at once on $25/day teaches nothing about any of them.

#### Which one for which job

**Ad 12, the plate,** is the general-purpose replacement. It is closest to the core IP and it
is the most composition-forward creative you have. Use it when the ad it replaces was
carrying the Fat Map message.

**Ad 13, the notes app,** is the anti-fatigue specialist. It looks least like an ad, so it is
the strongest play precisely when frequency is high and the audience has already learned to
recognise the branded look.

**Ad 14, plain type,** is the scroll-stopper. White ground in a feed that is mostly dark
imagery is contrast alone. Best when you need attention rather than explanation.

#### How to read what happens

If a format-breaker beats the Round 1 winner, the lesson is **format, not message**. Keep the
message and build more formats. If all three underperform, the offer banner may be doing more
work than assumed, which partly answers the banner question, though not cleanly enough to
close it.

#### Two things to watch

**Text density.** Ads 13 and 14 are text-heavy. Meta dropped the formal 20% text rule in 2021
so there is no hard block, but heavy-text creatives can still draw weaker delivery in some
auctions. If either shows an unusually high CPM against the others, that is the likely cause
rather than the message.

**Do not run the no-banner test on these.** None of them carries the banner, so the test would
confound banner with format. It runs on a Round 1 ad.

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

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad4-creative-B-headline-overlay.jpg)

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

**Link description** Free 14 days. The markers that refuse to move.

### Ad 8 · The plan went down
`ad8-creative-B-headline-overlay.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad8-creative-B-headline-overlay.jpg)

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

**Link description** Free 14 days. When less training moves more fat.

### Ad 10 · The order of operations
`ad10-creative-B-headline-overlay.png`

![](/Users/kadedunstone/Library/CloudStorage/Dropbox/01_BODY_RECODE/07_ADS/_pdf_assets/ad10-creative-B-headline-overlay.jpg)

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

**Link description** Free 14 days. The step almost everyone skips.

### Ad 4 creative: fixed 6 Aug 2026

The ring/pill collision is resolved and `build_ad4.py` has been re-authored, so this is
reproducible rather than a one-off render.

The fix is structural rather than nudged coordinates. The blue ring used to be an absolutely
positioned circle sitting on top of the card, which is why it overlapped the MARKERS
IMPROVING pill and covered the caption beneath it. The score now sits in a bordered disc that
owns its own space in the layout flow, so nothing can collide with it however the type wraps.

Also rebalanced: both columns are content-height and vertically centred, instead of the card
stretching full height and leaving a dead white third at the bottom.
