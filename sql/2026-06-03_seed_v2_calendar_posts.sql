-- Seed the V2 IG content pipeline (Wed 3 Jun - Tue 30 Jun 2026) into calendar_posts
-- so it surfaces in /dashboard/business/strategy → Content Calendar tab.
--
-- 20 posts mirroring 06_SAAS_PLATFORM_BUILD/IG-4-WEEK-PIPELINE-V2.md + the
-- v2 graphic manifest. Format counts:
--   - 10 single-slide statics
--   - 6 carousels (multi-slide PNGs at {slug}_01..NN.png)
--   - 4 reels (produced by Amanda via HeyGen, graphic path TBD)
--
-- Phase: all 'scale' (June 2026 sits inside the 24 May - 31 Dec scale range
-- defined in src/app/dashboard/business/strategy/page.tsx).
--
-- Safe to re-run: clears the June 2026 Body Recode IG rows first, then
-- inserts the 20 fresh ones. WON'T touch other brands / platforms / months.

begin;

delete from calendar_posts
where date between '2026-06-03' and '2026-06-30'
  and coalesce(brand, 'body_recode') = 'body_recode'
  and coalesce(platform, 'instagram') = 'instagram';

insert into calendar_posts (date, time, brand, platform, type, phase, title, notes, caption, graphic) values

-- Week 1 (3-9 Jun)
('2026-06-03', '12:00', 'body_recode', 'instagram', 'pattern', 'scale',
 'Three years postnatal and still stuck?',
 'CAROUSEL (6 slides) · Arch 03 Postnatal Athlete · Topic 1 Body State',
 $cap$The cultural narrative says you have 12 months to lose the baby weight. Maybe 18. After that you should be back.

The bodies I read tell a different story.

Most postnatal women I work with are three to five years out from their last baby. The kids are in school now. The sleep hasn't been right since the first one. And the weight has not moved, even though the training has been consistent and the food has been clean and the discipline has been there the whole time.

She has been told it's her. It almost never is.

A body that has spent five years on broken sleep and sustained stress and incomplete recovery doesn't release stored substrate, no matter what the food and the training look like. It goes into protection. It holds. The conditions to shift out of that haven't been present.

She isn't behind. Her body has been waiting for conditions that never came.

#bodyrecode #postnatalfitness #postpartumfitness #mumfitness #performancecoaching$cap$,
 '/calendar/br-2026-06-03_pattern_01.png,/calendar/br-2026-06-03_pattern_02.png,/calendar/br-2026-06-03_pattern_03.png,/calendar/br-2026-06-03_pattern_04.png,/calendar/br-2026-06-03_pattern_05.png,/calendar/br-2026-06-03_pattern_06.png'),

('2026-06-05', '18:00', 'body_recode', 'instagram', 'coach', 'scale',
 '"Every protocol I try fails."',
 'STATIC · Arch 04 Slipping High Performer · Topic 4 Prescription Without Interpretation',
 $cap$"Every protocol I try fails."

Almost every man in his mid-40s says this when he sits down for the first time.

He runs through the list. TRT for six months. Carnivore for ninety days. The CGM. The cold plunges. The bloodwork from three different labs.

None of them moved what he actually came in to fix.

The protocols weren't wrong. They were just chosen on the back of what worked for his friend, or what someone posted on LinkedIn. Not on a reading of his specific state.

A protocol applied to the wrong state is a guess. The same protocol applied to the right state can be the unlock. The system underneath it is what makes the difference.

#bodyrecode #mensthealth40 #executiveperformance #testosterone #longevity$cap$,
 '/calendar/br-2026-06-05_coach.png'),

('2026-06-07', '08:00', 'body_recode', 'instagram', 'diagnostic', 'scale',
 'Most plateaus reverse in 6 to 8 weeks.',
 'STATIC · Arch 01 Stressed Executive Woman · Topic 1 Body State · Hard CTA → Scorecard',
 $cap$Most women I see push through plateaus.

Train harder. Eat less. Wait it out. The plateau gets longer.

Here's what's actually happening. A real plateau in a well-regulated body is rare. Most "plateaus" are state problems the training and food can't solve, because the underlying system isn't in a position to release what it's holding.

Once the state shifts, those plateaus reverse fast. Six to eight weeks is the usual window. The training was never the problem.

Are you Depleted, Transitioning, or Ready? The 2-minute Scorecard tells you which.

Free. No email until you see your result.

Link in bio.

#bodyrecode #performancecoaching #bodystate #executivehealth #onlinecoaching$cap$,
 '/calendar/br-2026-06-07_diagnostic.png'),

('2026-06-08', '07:00', 'body_recode', 'instagram', 'authority', 'scale',
 'Where you store fat is a state signal.',
 'STATIC · Arch 01 Stressed Executive Woman · Topic 3 Cortisol and Fat Storage',
 $cap$Where you store fat is a readout.

Most women I see assume it's bad genetics, or just where they've always carried it. Almost never true.

Cortisol drives storage to the lower abdomen. Oestrogen drives it to hips and thighs. Insulin softens the whole frame.

So when you've been training hard, eating clean, and one specific place won't move, you're reading the signal wrong. You don't need to push harder. The body is telling you which driver is dominant right now.

Stubborn fat is a hormonal address. Not a discipline failure.

Read where it sits. Then read the state behind it.

#bodyrecode #performancecoaching #cortisol #executivehealth #womenshealth$cap$,
 '/calendar/br-2026-06-08_authority.png'),

('2026-06-09', '07:00', 'body_recode', 'instagram', 'contrarian', 'scale',
 'Fasted cardio in perimenopause.',
 'CAROUSEL (5 slides) · Arch 02 Perimenopausal Performer · Topic 5 Intelligent Approach',
 $cap$Fasted morning cardio is the default advice for women in their 40s wanting to lose body fat.

It's the wrong tool for the body you have now.

Fasted cardio in a perimenopausal system pushes cortisol higher. It empties already-thin glycogen. It deepens the sleep debt that was already eating your recovery. The body reads the input as a survival signal and shuts down a little more.

So you train more. You eat less. The body holds tighter.

Eat before you train. Drop the cardio dose. Give the system something to recover from before you ask it to perform again.

Once the state shifts, the body releases what it's been holding. Until then, every fasted morning is another deposit into a debt the system can't afford.

#bodyrecode #perimenopause #womenshealth40 #hormonehealth #performancecoaching$cap$,
 '/calendar/br-2026-06-09_contrarian_01.png,/calendar/br-2026-06-09_contrarian_02.png,/calendar/br-2026-06-09_contrarian_03.png,/calendar/br-2026-06-09_contrarian_04.png,/calendar/br-2026-06-09_contrarian_05.png'),

-- Week 2 (10-16 Jun)
('2026-06-10', '12:00', 'body_recode', 'instagram', 'pattern', 'scale',
 'Belly fat at 45? It is a state signal.',
 'CAROUSEL (6 slides) · Arch 04 Slipping High Performer · Topic 3 Cortisol and Fat Storage',
 $cap$If you're a high-performing man in your mid-40s and abdominal fat has appeared in the last two to four years, you're reading a signal.

Not "I've aged out of being lean." Cortisol has shifted. The body is storing the way it stores under chronic stress.

You'll notice it stack. Fat moves from peripheral to abdominal. Morning puffiness in the face and jaw that wasn't there before. Afternoon crashes that recover with coffee but not with food. Sleep that's technically seven to eight hours but no longer restoring. Drive that's variable in a way it wasn't.

This is cortisol stacked on declining testosterone, on years of running too hard for too long.

The distribution is information. The body is showing you where the dysregulation is.

#bodyrecode #mensthealth40 #cortisol #executiveperformance #midlifehealth$cap$,
 '/calendar/br-2026-06-10_pattern_01.png,/calendar/br-2026-06-10_pattern_02.png,/calendar/br-2026-06-10_pattern_03.png,/calendar/br-2026-06-10_pattern_04.png,/calendar/br-2026-06-10_pattern_05.png,/calendar/br-2026-06-10_pattern_06.png'),

('2026-06-12', '18:00', 'body_recode', 'instagram', 'coach', 'scale',
 '"I am doing everything right."',
 'STATIC · Arch 01 Stressed Executive Woman · Topic 4 Prescription Without Interpretation',
 $cap$"I'm doing everything right."

This is the first line out of almost every executive woman who sits down with me.

She is. The data agrees. She trains four to six times a week. The food is clean. She sleeps what the schedule allows. She has read the books and listened to the podcasts.

And nothing is changing.

The story she has is that she must be doing something wrong. There has to be a hidden mistake. If she could just find it, the body would respond.

There's nothing to find. The system she's applying her effort to isn't in a state where effort can convert. Cortisol is broken. Sleep is fragmented. The nervous system is running on stress hormones. The training and the food are appropriate for a body that doesn't currently exist.

The discipline she already has is more than enough. The conditions for it to work are what's missing.

#bodyrecode #performancecoaching #womenshealth #cortisol #executivehealth$cap$,
 '/calendar/br-2026-06-12_coach.png'),

('2026-06-14', '08:00', 'body_recode', 'instagram', 'diagnostic', 'scale',
 'The state changes before the body does.',
 'STATIC · Arch 01 Stressed Executive Woman · Topic 1 Body State · Hard CTA → Scorecard',
 $cap$When the body finally starts moving after a long plateau, most people credit the new program. Or the new food. Or the new supplement.

It wasn't any of them.

What changed was the state. The visible body shift comes weeks behind the underlying state shift, but it's the state shift that drives it.

This is why two clients on the same protocol get completely different results. One was in a state where the protocol could land. One wasn't.

Are you Depleted, Transitioning, or Ready? The 2-minute Scorecard reads the state.

Free. No email until you see your result.

Once the state moves, the body follows. Until then, every change is a guess.

Link in bio.

#bodyrecode #performancecoaching #bodystate #executivehealth #onlinecoaching$cap$,
 '/calendar/br-2026-06-14_diagnostic.png'),

('2026-06-15', '07:00', 'body_recode', 'instagram', 'authority', 'scale',
 'Protein is not the answer to perimenopause.',
 'STATIC · Arch 02 Perimenopausal Performer · Topic 2 Why Effort Isn''t Working',
 $cap$More protein is the headline advice for perimenopause.

Not wrong. Just incomplete.

Protein matters more after 40. The body becomes less efficient at building and holding lean tissue. But protein alone can't solve a state problem. You can eat 130g a day into a cortisol-broken, sleep-fragmented system and the body will still hold composition tighter than it lets go of it.

Building requires a body in a state that can build. A Depleted body in protection mode isn't in that state. It redirects what you give it to protection, not construction.

Read the state. Reduce the load. Then layer the protein where the system can actually use it.

The order matters more than the ingredients.

#bodyrecode #perimenopause #womenshealth40 #protein #hormonehealth$cap$,
 '/calendar/br-2026-06-15_authority.png'),

('2026-06-16', '07:00', 'body_recode', 'instagram', 'contrarian', 'scale',
 'Your old training program is not coming back.',
 'CAROUSEL (5 slides) · Arch 03 Postnatal Athlete · Topic 5 Intelligent Approach',
 $cap$Most postnatal women trying to return to training try to return to the program that built them before kids.

Five days a week. Early mornings. The classes. The volume.

It doesn't work. The body has changed.

The body that responded to that program before kids isn't the body she has now. Pregnancy. Delivery. Years of broken sleep. Sustained cortisol. The same input now produces a different output. Usually a worse one.

She isn't being loyal to the version of herself that was. She's asking a body that has been through five years of physiological cost to perform like a body that hasn't.

The new program is designed for the body she has now, not the one she had. Lower frequency. Higher recovery priority. The same effort placed differently starts producing results again once the state has shifted to accept it.

#bodyrecode #postnatalfitness #mumlife #postpartumstrength #performancecoaching$cap$,
 '/calendar/br-2026-06-16_contrarian_01.png,/calendar/br-2026-06-16_contrarian_02.png,/calendar/br-2026-06-16_contrarian_03.png,/calendar/br-2026-06-16_contrarian_04.png,/calendar/br-2026-06-16_contrarian_05.png'),

-- Week 3 (17-23 Jun) — REELS BEGIN
('2026-06-17', '12:00', 'body_recode', 'instagram', 'pattern', 'scale',
 'Cortisol stores fat in three places.',
 'CAROUSEL (5 slides) · Arch 01 Stressed Executive Woman · Topic 3 Cortisol and Fat Storage',
 $cap$Women send me photos because they think the lower belly is a fat problem.

It usually isn't. It's a cortisol signal.

When the body is running on stress hormones for months at a time, it stores fat in a specific signature. Lower abdomen and visceral area first. Then morning puffiness in the face and jaw. Then a softening across the upper back and base of the neck. Together, those three points are almost a fingerprint.

You can train hard and eat clean and watch all three hold for a year. The state has to shift before they will.

The fat hasn't betrayed her. It's a reading of what the system is doing right now.

#bodyrecode #cortisol #fatloss #womenshealth #executivehealth$cap$,
 '/calendar/br-2026-06-17_pattern_01.png,/calendar/br-2026-06-17_pattern_02.png,/calendar/br-2026-06-17_pattern_03.png,/calendar/br-2026-06-17_pattern_04.png,/calendar/br-2026-06-17_pattern_05.png'),

('2026-06-19', '18:00', 'body_recode', 'instagram', 'coach', 'scale',
 'Same advice. Different bodies. (REEL)',
 'REEL · Arch 02 Perimenopausal Performer · Topic 4 · Amanda HeyGen production. FIRST REEL OF V2. Voice decision (HeyGen+Kade VO vs ElevenLabs) must be locked before this fires. B-ROLL: S4 https://bodyrecode.au/broll/states-split · S5 https://bodyrecode.au/broll/blueprint-six-weeks',
 $cap$Every week I see content telling women in perimenopause to lift heavy, eat more protein, and stop doing cardio.

The advice itself is reasonable. It skips the part that matters.

There's no such thing as a generic perimenopause body. Two women in perimenopause, same age, same training history, can be in completely different states. One in Depleted with cortisol broken. One in Transitioning with cycle changes leading. A program written for the demographic doesn't fit either of them.

The four patterns sit underneath the state read. Stress-Stored. Insulin-Drift. Estrogen-Shift. Androgen-Decline. Same demographic, different patterns, different programs.

What works is reading the body in front of me, designing for where it actually is, and adjusting as the state shifts. Most women have been given prescriptions without ever being read first.

If you want a read on your own state, the 2-minute Scorecard is in my bio.

#bodyrecode #perimenopause #womenshealth40 #hormonehealth #performancecoaching$cap$,
 '/calendar/br-2026-06-19_coach.png'),

('2026-06-21', '08:00', 'body_recode', 'instagram', 'diagnostic', 'scale',
 'Between Depleted and Transitioning?',
 'STATIC · Arch 01 Stressed Executive Woman · Topic 1 Body State · Hard CTA → Scorecard',
 $cap$Body state isn't a binary. It's a continuum.

Depleted is a system in protection mode. Transitioning is a system that has come out of protection but isn't yet building. Ready is a system that can be loaded for performance.

Most high-performing women who arrive at coaching are between Depleted and Transitioning. The system has come down off the worst of the stress load, but it hasn't stabilised. Training response is starting to return but is inconsistent. Sleep is better some weeks. Composition shifts in fits and starts.

In that bracket, the same change cuts both ways. The wrong input drops her back into Depleted. The right one shifts her toward Ready faster than she expected.

Reading where on the continuum you actually are is the difference between a six-week shift and another six months of guessing.

The 2-minute Scorecard gives you the read. Free. No email until you see your result.

Link in bio.

#bodyrecode #performancecoaching #bodystate #executivehealth #onlinecoaching$cap$,
 '/calendar/br-2026-06-21_diagnostic.png'),

('2026-06-22', '07:00', 'body_recode', 'instagram', 'authority', 'scale',
 'Postnatal weight is a state problem.',
 'STATIC · Arch 03 Postnatal Athlete · Topic 1 Body State',
 $cap$She walks in with a number in her head. Four kilos she didn't used to carry, three years after her last baby.

She has tried the things. Two rounds of F45. A nutritionist last year. The early-morning training when the toddler finally slept through. Nothing has moved it.

What I see when I read her is not a discipline gap. I see a body that has spent three to five years carrying a load nobody designed it to carry. Broken sleep stacked on returning to work stacked on still running her household. The hormonal recovery never had the conditions it needed.

So the body did what bodies do under sustained load. It went into protection. It held what it had. It stopped responding to inputs that used to work.

She isn't behind on a schedule. Her body has been waiting for conditions that haven't arrived yet.

#bodyrecode #postnatalfitness #postpartumstrength #mumfitness #performancecoaching$cap$,
 '/calendar/br-2026-06-22_authority.png'),

('2026-06-23', '07:00', 'body_recode', 'instagram', 'contrarian', 'scale',
 'TRT is not first. (REEL)',
 'REEL · Arch 04 Slipping High Performer · Topic 5 Intelligent Approach · Amanda HeyGen production. B-ROLL: S3 https://bodyrecode.au/broll/one-vs-many-variables · S4 https://bodyrecode.au/broll/order-of-operations',
 $cap$Every man in his 40s who walks into my practice has either looked at TRT or already started it.

It rarely delivers what they expect.

TRT addresses one variable. The system in front of me is usually dysregulated across many. Chronic stress. Sleep that doesn't restore. Years of recovery debt. Adding testosterone to that environment shifts one number on a blood panel. It doesn't fix the underlying state.

The work, in order: read the state. Reduce the load the body is carrying. Restore the regulatory environment. Then look at whether hormonal support is the right input, and what dose, in what state.

TRT isn't wrong. It's just not first. Most men skip the first three steps and go straight to the fourth, and wonder why the same problems come back six months later.

#bodyrecode #testosterone #mensthealth40 #executiveperformance #midlifehealth$cap$,
 '/calendar/br-2026-06-23_contrarian.png'),

-- Week 4 (24-30 Jun)
('2026-06-24', '12:00', 'body_recode', 'instagram', 'pattern', 'scale',
 'Cycle irregular AND training stops working?',
 'CAROUSEL (6 slides) · Arch 02 Perimenopausal Performer · Topic 1 Body State',
 $cap$Perimenopause doesn't announce itself with a single signal. It stacks.

The signal worth reading is when two specific things start happening together.

Your cycle changes. Shorter. Longer. Skipped. Heavier. Lighter. The pattern that held for fifteen years stops holding.

And your training response disappears. The program that was building you is now producing fatigue without adaptation. The recovery between sessions is taking longer.

Either one alone is easy to dismiss. Together they're a body shifting state. The hormonal environment is moving and the body is reading the same training input completely differently than it was six months ago.

If sleep has also fragmented in a way it hadn't before, if mood is more variable around the cycle, if heat regulation has shifted, you're watching the state turn over in front of you. If the prescription doesn't catch up to the new physiology, the same training will break her faster than it built her.

#bodyrecode #perimenopause #womenshealth40 #cyclehealth #hormonehealth$cap$,
 '/calendar/br-2026-06-24_pattern_01.png,/calendar/br-2026-06-24_pattern_02.png,/calendar/br-2026-06-24_pattern_03.png,/calendar/br-2026-06-24_pattern_04.png,/calendar/br-2026-06-24_pattern_05.png,/calendar/br-2026-06-24_pattern_06.png'),

('2026-06-26', '18:00', 'body_recode', 'instagram', 'coach', 'scale',
 'You are not behind. You are reading the wrong map. (REEL)',
 'REEL · Arch 03 Postnatal Athlete · Topic 4 Prescription Without Interpretation · Amanda HeyGen production. B-ROLL: S4 https://bodyrecode.au/broll/postnatal-substrate (Zone 1) · S5 https://bodyrecode.au/broll/postnatal-substrate (Zone 2)',
 $cap$The first thing I tell every postnatal woman I work with is that the timeline she has in her head is wrong.

She believes the window to lose the baby weight was the first 12 months. It wasn't. She believes she should be back to pre-baby shape by now. She shouldn't necessarily be. She believes other women she sees are doing it, so she should be able to.

The other women she sees who are doing it are either genetically advantaged, deeply unwell, or doing things she can't see that aren't sustainable.

Her body hasn't had the regulatory environment it needed to recover. Sleep was broken for years. Stress load was high. Recovery was incomplete. The state shifted. The conditions to shift back haven't been present.

The work is to create those conditions. Not to add more training. Not to cut more food. To restore the substrate, then build from where the body actually is.

She isn't behind. She's reading the wrong map.

If you want to read the right map, the 2-minute Scorecard is in my bio.

#bodyrecode #postnatalfitness #mumfitness #postpartumstrength #performancecoaching$cap$,
 '/calendar/br-2026-06-26_coach.png'),

('2026-06-28', '08:00', 'body_recode', 'instagram', 'diagnostic', 'scale',
 'Read the state. Then prescribe.',
 'STATIC · Arch 01 Stressed Executive Woman · Topic 1 Body State · Hard CTA → Scorecard',
 $cap$The hardest thing to convince someone of is that the program isn't the issue.

She has run three different ones in the last 18 months. None of them moved what she came in to fix. By the time she sits down with me, she's certain something is wrong with her.

There isn't. The body is doing exactly what the conditions tell it to do. A regulated body in Ready state will respond to almost any reasonable program. A body in Depleted will respond to almost none of them, no matter how well the program is written.

If you've tried the things and nothing has moved, that's the read worth getting. Depleted, Transitioning, or Ready? The 2-minute Scorecard tells you.

Free. No email until you see your result.

Link in bio.

#bodyrecode #performancecoaching #bodystate #executivehealth #onlinecoaching$cap$,
 '/calendar/br-2026-06-28_diagnostic.png'),

('2026-06-29', '07:00', 'body_recode', 'instagram', 'authority', 'scale',
 'Slipping capacity at 45 is not willpower.',
 'STATIC · Arch 04 Slipping High Performer · Topic 2 Why Effort Isn''t Working',
 $cap$When a high-performing man tells me his capacity is slipping, his first frame is usually that he needs to be tougher.

Train harder. Lock in the discipline he had at 35. Stop making excuses.

That frame is what keeps him stuck.

Capacity at 45 sits downstream of the state. The willpower he had at 35 was applied to a system that could convert it. The system has changed, so the same willpower produces a different output.

Doubling down on willpower into a dysregulated system makes the dysregulation worse. More training stacks more cortisol on a system that can't clear it. Less food deepens the recovery debt. Capacity slips faster, not slower.

Read the state first. Reduce the load. Then rebuild systematically.

The willpower isn't the problem. The order of operations is.

#bodyrecode #mensthealth40 #executiveperformance #midlifehealth #longevity$cap$,
 '/calendar/br-2026-06-29_authority.png'),

('2026-06-30', '07:00', 'body_recode', 'instagram', 'contrarian', 'scale',
 'Pulling back is the intervention. (REEL)',
 'REEL · Arch 01 Stressed Executive Woman · Topic 5 Intelligent Approach · Amanda HeyGen production. B-ROLL: S3 https://bodyrecode.au/broll/rhythm-vs-restriction · S4 https://bodyrecode.au/broll/pull-back-intervention',
 $cap$When a high-performing woman hits a plateau, every instinct she has is to push harder.

Add training. Cut food. Lock in tighter.

For a body in protection mode, this is the worst possible response.

The training and the food are stress inputs. To a system already running on stress hormones, more stress is more cortisol, more inflammation, more breakdown. The body holds tighter because the conditions to release are even less present than they were before.

The intervention that actually works is the opposite. Reduce training volume. Increase recovery priority. Restore the sleep and regulation the body has been doing without.

Pulling back feels like giving up. To a system already running on stress hormones, it's the only intervention that lets state shift. Once it shifts, the same effort starts producing results again.

The bottleneck isn't effort. It's the conditions for effort to land.

#bodyrecode #cortisol #womenshealth #executivehealth #performancecoaching$cap$,
 '/calendar/br-2026-06-30_contrarian.png');

commit;

-- Verify after running:
-- select date, type, title from calendar_posts
-- where date between '2026-06-03' and '2026-06-30'
--   and coalesce(brand,'body_recode') = 'body_recode'
-- order by date;
