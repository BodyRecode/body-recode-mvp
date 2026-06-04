-- Seed the @kade_dunstone_ personal-brand calendar into calendar_posts (shared, brand=personal_brand).
-- Brand colour CLAY. Launch (8 Jun-5 Jul) leads with the human: story + photo posts,
-- 2 carousels, punctuation cards. Reels = Phase-2 block from w/c 6 Jul (pending HeyGen avatar).
-- Captions are DRAFTS in Kade's register (no em dashes, no slop) - review/adjust the personal ones.
-- Carousels store comma-separated slide URLs. Safe to re-run (clears window first, re-inserts).

begin;

delete from calendar_posts
where date between '2026-06-08' and '2026-07-27'
  and coalesce(brand, 'body_recode') = 'personal_brand'
  and coalesce(platform, 'instagram') = 'instagram';

insert into calendar_posts (date, time, brand, platform, type, phase, title, notes, caption, graphic) values

('2026-06-08', '07:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I've spent 20 years helping people understand their body. Most of the work was never in the gym.$t$,
 $n$Launch · STORY (photo) · arrival.$n$,
 $c$Twenty years in. The sessions, the programs, the training floors.
The work that actually changed people was almost never the workout. It was helping them read what their body was already telling them, before we touched a single weight.
Most coaching skips that part. It prescribes first and reads later, if at all.
I do it the other way round. That's what this account is about.

#kadedunstone #interpretbeforeyouact #performancecoaching #systemsthinking$c$,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=ARRIVAL&text=I%27ve+spent+20+years+helping+people+understand+their+body.+Most+of+the+work+was+never+in+the+gym.$g$),

('2026-06-10', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$At 21, a doctor ended the only future I'd planned.$t$,
 $n$Identity · STORY (photo) · discharge at 21.$n$,
 $c$At 21 I was told my legs wouldn't take it. Both of them. Structural.
I'd built everything toward becoming a soldier. That assessment ended it.
I didn't have a backup identity ready. I had to work out who I was without the one thing I'd aimed at my whole life.
It was the first time I rebuilt from nothing. It wasn't the last.

#kadedunstone #interpretbeforeyouact #rebuild #identity #startingover$c$,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=2&label=REBUILD&text=At+21%2C+a+doctor+ended+the+only+future+I%27d+planned.$g$),

('2026-06-12', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$You can't out-train a nervous system in protection mode.$t$,
 $n$Body · CARD · punctuation.$n$,
 $c$More training. More restriction. More discipline.
Pile it onto a body already in protection mode and it holds tighter, not looser. The system reads the extra load as one more threat.
The answer was never more. It was different.
Read the state first. Then decide what the body can actually use.

#kadedunstone #interpretbeforeyouact #performancecoaching #nervoussystem #executivehealth$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&text=You+can%27t+out-train+a+nervous+system+in+protection+mode.$g$),

('2026-06-14', '07:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$Three times I've had to become someone new from scratch.$t$,
 $n$Identity · STORY (card).$n$,
 $c$Discharge at 21. Walking away from the fitness industry. The end of a 20 year relationship.
Three times I thought I was starting over. Three times I was actually going deeper.
Rebuilding isn't the thing that breaks you. Staying attached to a version of yourself that stopped fitting is.

#kadedunstone #interpretbeforeyouact #rebuild #identity #startingover$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=REBUILD&text=Three+times+I%27ve+had+to+become+someone+new+from+scratch.&sub=Each+time+I+thought+I+was+starting+over.+Each+time+I+was+going+deeper.$g$),

('2026-06-15', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$The reason most people stay stuck isn't discipline.$t$,
 $n$Thinking · CARD · teaser.$n$,
 $c$I've worked with high performers for two decades. Almost none of them had a discipline problem.
They were disciplined at the wrong thing. Pouring effort into a plan built on a bad read of the situation.
Discipline pointed in the wrong direction is just wasted effort with good posture.
Clarity comes first. Then the discipline has something worth aiming at.

#kadedunstone #interpretbeforeyouact #systemsthinking #clarity #decisionmaking$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&text=The+reason+most+people+stay+stuck+isn%27t+discipline.&sub=It+is+that+nobody+helped+them+read+the+situation+before+acting+on+it.$g$),

('2026-06-17', '12:00', 'personal_brand', 'instagram', 'pattern', 'scale',
 $t$Three states. One body. Completely different responses to the same training.$t$,
 $n$Body · CAROUSEL (5).$n$,
 $c$Same program. Same person. Completely different result depending on the state the body is in when they start.
Depleted, transitioning, ready. Most coaches never check. They write the plan and hope.
Swipe through the three. Then be honest about which one you're probably in right now.

#kadedunstone #interpretbeforeyouact #performancecoaching #nervoussystem #executivehealth$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&cue=swipe&text=Three+states.+One+body.+Completely+different+responses+to+the+same+training., /api/content/graphic?style=personal&theme=clay&num=01&text=Depleted.&sub=Protection+mode.+The+body+reads+more+load+as+threat%2C+so+adding+it+makes+things+worse., /api/content/graphic?style=personal&theme=clay&num=02&text=Transitioning.&sub=Mixed+signals.+Something+upstream+is+blocking+the+response+to+training., /api/content/graphic?style=personal&theme=clay&num=03&text=Ready.&sub=Biology+is+set+up+to+respond.+Now+effort+actually+converts., /api/content/graphic?style=personal&theme=clay-solid&text=Most+coaches+write+the+program+first.+I+read+the+state+first.&sub=That%27s+the+whole+difference.$g$),

('2026-06-19', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$Most people don't have a discipline problem. They have a clarity problem.$t$,
 $n$Thinking · CARD · punctuation.$n$,
 $c$Telling someone to try harder assumes the plan is right and they're the problem.
Usually it's the other way round. The effort is there. The direction is off.
Get the read right and the same effort finally lands somewhere.

#kadedunstone #interpretbeforeyouact #systemsthinking #clarity #decisionmaking$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&text=Most+people+don%27t+have+a+discipline+problem.+They+have+a+clarity+problem.$g$),

('2026-06-21', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I helped build gyms across the country. Then I walked away.$t$,
 $n$Identity · STORY (photo) · fitness exit.$n$,
 $c$I helped build gyms across the country. Good ones. Busy ones.
Then I walked away, because busy isn't the same as building something that holds.
Scale without systems is just noise at higher volume. I learned that standing inside it.
That lesson is in everything I build now.

#kadedunstone #interpretbeforeyouact #rebuild #identity #startingover$c$,
 $g$/api/content/graphic?style=personal-photo&layout=split&theme=clay&photo=1&label=REBUILD&text=I+helped+build+gyms+across+the+country.+Then+I+walked+away.&sub=Scale+without+systems+is+just+noise.+I+learned+that+from+the+inside.$g$),

('2026-06-22', '07:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I built my own coaching software. I'm not a developer.$t$,
 $n$AI · STORY (photo) · the build.$n$,
 $c$I'm not a developer. I built my own coaching platform anyway.
Client assessments, program generation, the business dashboard, all of it.
I didn't write the code. I knew exactly what I was building and why, and I treated AI like a co-founder instead of a vending machine.
That's the part most people get backwards.

#kadedunstone #interpretbeforeyouact #aicofounder #buildwithai #buildinpublic$c$,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=AI+%26+LEVERAGE&text=I+built+my+own+coaching+software.+I%27m+not+a+developer.$g$),

('2026-06-24', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$The body is not broken. It is being misread.$t$,
 $n$Body · CARD · punctuation.$n$,
 $c$Nobody walks in broken. They walk in misread.
The signals were always there. The fatigue, the stall, the weight that won't shift. Everyone treated the symptom and ignored the message.
A body that isn't responding isn't failing. It's telling you something. Most coaching just doesn't speak the language.

#kadedunstone #interpretbeforeyouact #performancecoaching #nervoussystem #executivehealth$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&text=The+body+is+not+broken.+It+is+being+misread.$g$),

('2026-06-26', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$AI doesn't make you smarter. It makes your current thinking louder.$t$,
 $n$AI · CARD · punctuation.$n$,
 $c$AI isn't a shortcut around thinking. It's an amplifier of the thinking you already have.
Structured input, structured output. Mess in, louder mess out.
If your thinking isn't clear, AI just helps you produce the confusion faster.

#kadedunstone #interpretbeforeyouact #aicofounder #buildwithai #buildinpublic$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=AI+%26+LEVERAGE&text=AI+doesn%27t+make+you+smarter.+It+makes+your+current+thinking+louder.$g$),

('2026-06-28', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I walked away from a 20-year relationship and didn't know who I was without it.$t$,
 $n$Identity · STORY (card) · separation. Restraint.$n$,
 $c$I walked away from a 20 year relationship and a shared life, and for a while I genuinely didn't know who I was without it.
I'd built my identity around the role. When the role ended, the map went with it.
That's when it landed. People don't lose performance first. They lose clarity, and the performance follows it down.
Clarity is upstream of everything. I learned that one the hard way.

#kadedunstone #interpretbeforeyouact #rebuild #identity #startingover$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=REBUILD&text=I+walked+away+from+a+20-year+relationship+and+didn%27t+know+who+I+was+without+it.&sub=That+is+when+I+understood%3A+people+do+not+lose+performance.+They+lose+clarity.$g$),

('2026-06-29', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$Most coaches rent their software. I built mine, from scratch.$t$,
 $n$AI · STORY (photo) · the build, deeper.$n$,
 $c$Most coaches rent their software and shape the business around someone else's tool.
I built mine from scratch instead. No code. Just a clear picture of what it needed to do, and AI to build it with me.
When you build the thing yourself, you understand your own business at a level renting never teaches you.

#kadedunstone #interpretbeforeyouact #aicofounder #buildwithai #buildinpublic$c$,
 $g$/api/content/graphic?style=personal-photo&layout=split&theme=clay&photo=2&label=AI+%26+LEVERAGE&text=Most+coaches+rent+their+software.+I+built+mine%2C+from+scratch.&sub=No+code.+I+knew+what+I+was+building+and+why.+AI+handled+the+rest.$g$),

('2026-07-01', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$Rebuilding is not failure. It's how you build better structure.$t$,
 $n$Identity · CARD · punctuation.$n$,
 $c$We treat rebuilding like proof something went wrong.
It's the opposite. It's the moment you stop defending a structure that stopped fitting and build one that does.
Every rebuild I've been through produced a framework I still use. None of them felt like progress at the time.

#kadedunstone #interpretbeforeyouact #rebuild #identity #startingover$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=REBUILD&text=Rebuilding+is+not+failure.+It%27s+how+you+build+better+structure.$g$),

('2026-07-03', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$For years I measured everything against one question: would he be proud?$t$,
 $n$Identity · STORY (photo) · the question. Reflective.$n$,
 $c$For years I measured almost everything against one question. Would he be proud.
It drove me and it quietly ran me at the same time.
The shift came when I stopped trying to answer it for him and started answering it for myself.
Some of the questions that shape you most are the ones you never say out loud.

#kadedunstone #interpretbeforeyouact #rebuild #identity #fatherhood$c$,
 $g$/api/content/graphic?style=personal-photo&layout=inset&theme=clay&photo=8&label=REBUILD&text=For+years+I+measured+everything+against+one+question%3A+would+he+be+proud%3F$g$),

('2026-07-05', '12:00', 'personal_brand', 'instagram', 'pattern', 'scale',
 $t$Interpretation vs prescription. The difference matters more than most people realise.$t$,
 $n$Thinking · CAROUSEL (5) · closes the launch.$n$,
 $c$Prescription says here's the plan, follow it.
Interpretation says here's what I see, here's what it means, here's what we do about it.
One adapts. One doesn't. Every coaching relationship I've watched fail came down to prescription without interpretation.
Swipe through the difference.

#kadedunstone #interpretbeforeyouact #systemsthinking #clarity #decisionmaking$c$,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&cue=swipe&text=Interpretation+vs+prescription.+The+difference+matters+more+than+most+people+realise., /api/content/graphic?style=personal&theme=clay&num=01&text=Prescription.&sub=Here%27s+the+plan.+Follow+it.+It+can%27t+adapt+to+what+it+never+read., /api/content/graphic?style=personal&theme=clay&num=02&text=Interpretation.&sub=Here%27s+what+I+see%2C+here%27s+what+it+means%2C+here%27s+what+we+do+about+it., /api/content/graphic?style=personal&theme=clay&num=03&text=Read+first.&sub=Every+failed+plan+I%27ve+seen+was+prescription+without+interpretation., /api/content/graphic?style=personal&theme=clay-solid&text=Interpret+before+you+act.&sub=That%27s+the+whole+method.$g$),

('2026-07-06', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$Why your body stopped responding - and it's not what most coaches say.$t$,
 $n$Body · REEL (HeyGen) · PENDING AVATAR. Photo cover.$n$,
 $c$Your body didn't stop responding because you got lazy.
It stopped because it's running in a state where more effort reads as more threat.
Short one on what's actually happening, and why the usual advice makes it worse.

#kadedunstone #interpretbeforeyouact #performancecoaching #nervoussystem #executivehealth$c$,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=BODY&text=Why+your+body+stopped+responding+-+and+it%27s+not+what+most+coaches+say.$g$),

('2026-07-13', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$The reason most people stay stuck isn't discipline. It's this.$t$,
 $n$Thinking · REEL (HeyGen) · PENDING AVATAR. Photo cover.$n$,
 $c$If you're disciplined and still stuck, the problem usually isn't you. It's the read underneath the plan.
Short one on why clarity has to come before effort, not after it.

#kadedunstone #interpretbeforeyouact #systemsthinking #clarity #decisionmaking$c$,
 $g$/api/content/graphic?style=personal-photo&layout=top&theme=clay&photo=2&label=THINKING&text=The+reason+most+people+stay+stuck+isn%27t+discipline.+It%27s+this.$g$),

('2026-07-20', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$I built my own coaching platform. No coding background.$t$,
 $n$AI · REEL (HeyGen) · PENDING AVATAR. Photo cover.$n$,
 $c$No dev background. I built the platform that runs my whole business anyway.
Here's how I used AI as a co-founder instead of a tool, and why that one distinction changes everything.

#kadedunstone #interpretbeforeyouact #aicofounder #buildwithai #buildinpublic$c$,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=AI+%26+LEVERAGE&text=I+built+my+own+coaching+platform.+No+coding+background.$g$),

('2026-07-27', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$I've rebuilt my identity three times. Each one produced a framework.$t$,
 $n$Identity · REEL (HeyGen) · PENDING AVATAR. Photo cover.$n$,
 $c$Three rebuilds. The discharge, the industry, the relationship. Each one produced a framework I still use today.
The short version of how losing the plan three times taught me to read people for a living.

#kadedunstone #interpretbeforeyouact #rebuild #identity #startingover$c$,
 $g$/api/content/graphic?style=personal-photo&layout=top&theme=clay&photo=8&label=REBUILD&text=I%27ve+rebuilt+my+identity+three+times.+Each+one+produced+a+framework.$g$);

commit;
