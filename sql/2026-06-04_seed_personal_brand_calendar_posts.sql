-- Seed the @kade_dunstone_ personal-brand calendar into calendar_posts (shared, brand=personal_brand).
-- Brand colour: CLAY. LAUNCH MONTH (8 Jun - 5 Jul) has NO reels — the HeyGen avatar isn't ready yet —
-- so it leads with the human via STORY + photo posts, 2 framework carousels, and punctuation cards.
-- REELS start as a Phase-2 block from w/c 6 Jul (4 Mondays), seeded as PENDING-AVATAR with photo covers.
-- Captions null - Kade writes the story detail. Carousels = comma-separated slide URLs.
-- Safe to re-run: clears personal_brand IG rows in the whole window first, then re-inserts.

begin;

delete from calendar_posts
where date between '2026-06-08' and '2026-07-27'
  and coalesce(brand, 'body_recode') = 'personal_brand'
  and coalesce(platform, 'instagram') = 'instagram';

insert into calendar_posts (date, time, brand, platform, type, phase, title, notes, caption, graphic) values

('2026-06-08', '07:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I've spent 20 years helping people understand their body. Most of the work was never in the gym.$t$,
 $n$Launch · STORY (photo) · arrival / who I am.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=ARRIVAL&text=I%27ve+spent+20+years+helping+people+understand+their+body.+Most+of+the+work+was+never+in+the+gym.$g$),

('2026-06-10', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$At 21, a doctor ended the only future I'd planned.$t$,
 $n$Identity · STORY (photo) · military discharge at 21 — vulnerable scene.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=2&label=REBUILD&text=At+21%2C+a+doctor+ended+the+only+future+I%27d+planned.$g$),

('2026-06-12', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$You can't out-train a nervous system in protection mode.$t$,
 $n$Body · CARD · punctuation.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&text=You+can%27t+out-train+a+nervous+system+in+protection+mode.$g$),

('2026-06-14', '07:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$Three times I've had to become someone new from scratch.$t$,
 $n$Identity · STORY (card) · the three rebuilds.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=REBUILD&text=Three+times+I%27ve+had+to+become+someone+new+from+scratch.&sub=Each+time+I+thought+I+was+starting+over.+Each+time+I+was+going+deeper.$g$),

('2026-06-15', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$The reason most people stay stuck isn't discipline.$t$,
 $n$Thinking · CARD · teaser (caption carries the answer).$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&text=The+reason+most+people+stay+stuck+isn%27t+discipline.&sub=It+is+that+nobody+helped+them+read+the+situation+before+acting+on+it.$g$),

('2026-06-17', '12:00', 'personal_brand', 'instagram', 'pattern', 'scale',
 $t$Three states. One body. Completely different responses to the same training.$t$,
 $n$Body · CAROUSEL (5) · framework.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&cue=swipe&text=Three+states.+One+body.+Completely+different+responses+to+the+same+training., /api/content/graphic?style=personal&theme=clay&num=01&text=Depleted.&sub=Protection+mode.+The+body+reads+more+load+as+threat%2C+so+adding+it+makes+things+worse., /api/content/graphic?style=personal&theme=clay&num=02&text=Transitioning.&sub=Mixed+signals.+Something+upstream+is+blocking+the+response+to+training., /api/content/graphic?style=personal&theme=clay&num=03&text=Ready.&sub=Biology+is+set+up+to+respond.+Now+effort+actually+converts., /api/content/graphic?style=personal&theme=clay-solid&text=Most+coaches+write+the+program+first.+I+read+the+state+first.&sub=That%27s+the+whole+difference.$g$),

('2026-06-19', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$Most people don't have a discipline problem. They have a clarity problem.$t$,
 $n$Thinking · CARD · punctuation.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&text=Most+people+don%27t+have+a+discipline+problem.+They+have+a+clarity+problem.$g$),

('2026-06-21', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I helped build gyms across the country. Then I walked away.$t$,
 $n$Identity · STORY (photo) · commercial fitness exit.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=split&theme=clay&photo=1&label=REBUILD&text=I+helped+build+gyms+across+the+country.+Then+I+walked+away.&sub=Scale+without+systems+is+just+noise.+I+learned+that+from+the+inside.$g$),

('2026-06-22', '07:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I built my own coaching software. I'm not a developer.$t$,
 $n$AI · STORY (photo) · building the platform.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=AI+%26+LEVERAGE&text=I+built+my+own+coaching+software.+I%27m+not+a+developer.$g$),

('2026-06-24', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$The body is not broken. It is being misread.$t$,
 $n$Body · CARD · punctuation.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&text=The+body+is+not+broken.+It+is+being+misread.$g$),

('2026-06-26', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$AI doesn't make you smarter. It makes your current thinking louder.$t$,
 $n$AI · CARD · punctuation.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=AI+%26+LEVERAGE&text=AI+doesn%27t+make+you+smarter.+It+makes+your+current+thinking+louder.$g$),

('2026-06-28', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I walked away from a 20-year relationship and didn't know who I was without it.$t$,
 $n$Identity · STORY (card) · the separation — most vulnerable, restraint.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=REBUILD&text=I+walked+away+from+a+20-year+relationship+and+didn%27t+know+who+I+was+without+it.&sub=That+is+when+I+understood%3A+people+do+not+lose+performance.+They+lose+clarity.$g$),

('2026-06-29', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$Most coaches rent their software. I built mine, from scratch.$t$,
 $n$AI · STORY (photo) · the build, deeper.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=split&theme=clay&photo=2&label=AI+%26+LEVERAGE&text=Most+coaches+rent+their+software.+I+built+mine%2C+from+scratch.&sub=No+code.+I+knew+what+I+was+building+and+why.+AI+handled+the+rest.$g$),

('2026-07-01', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$Rebuilding is not failure. It's how you build better structure.$t$,
 $n$Identity · CARD · punctuation.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=REBUILD&text=Rebuilding+is+not+failure.+It%27s+how+you+build+better+structure.$g$),

('2026-07-03', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$For years I measured everything against one question: would he be proud?$t$,
 $n$Identity · STORY (photo) · the question that shaped me. Reflective.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=inset&theme=clay&photo=8&label=REBUILD&text=For+years+I+measured+everything+against+one+question%3A+would+he+be+proud%3F$g$),

('2026-07-05', '12:00', 'personal_brand', 'instagram', 'pattern', 'scale',
 $t$Interpretation vs prescription. The difference matters more than most people realise.$t$,
 $n$Thinking · CAROUSEL (5) · framework, closes the launch.$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&cue=swipe&text=Interpretation+vs+prescription.+The+difference+matters+more+than+most+people+realise., /api/content/graphic?style=personal&theme=clay&num=01&text=Prescription.&sub=Here%27s+the+plan.+Follow+it.+It+can%27t+adapt+to+what+it+never+read., /api/content/graphic?style=personal&theme=clay&num=02&text=Interpretation.&sub=Here%27s+what+I+see%2C+here%27s+what+it+means%2C+here%27s+what+we+do+about+it., /api/content/graphic?style=personal&theme=clay&num=03&text=Read+first.&sub=Every+failed+plan+I%27ve+seen+was+prescription+without+interpretation., /api/content/graphic?style=personal&theme=clay-solid&text=Interpret+before+you+act.&sub=That%27s+the+whole+method.$g$),

('2026-07-06', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$Why your body stopped responding - and it's not what most coaches say.$t$,
 $n$Body · REEL (HeyGen, talking head) · PENDING AVATAR. Photo cover.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=BODY&text=Why+your+body+stopped+responding+-+and+it%27s+not+what+most+coaches+say.$g$),

('2026-07-13', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$The reason most people stay stuck isn't discipline. It's this.$t$,
 $n$Thinking · REEL (HeyGen, talking head) · PENDING AVATAR. Photo cover.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=top&theme=clay&photo=2&label=THINKING&text=The+reason+most+people+stay+stuck+isn%27t+discipline.+It%27s+this.$g$),

('2026-07-20', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$I built my own coaching platform. No coding background.$t$,
 $n$AI · REEL (HeyGen, talking head) · PENDING AVATAR. Photo cover.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=AI+%26+LEVERAGE&text=I+built+my+own+coaching+platform.+No+coding+background.$g$),

('2026-07-27', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$I've rebuilt my identity three times. Each one produced a framework.$t$,
 $n$Identity · REEL (HeyGen, talking head) · PENDING AVATAR. Photo cover.$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=top&theme=clay&photo=8&label=REBUILD&text=I%27ve+rebuilt+my+identity+three+times.+Each+one+produced+a+framework.$g$);

commit;

-- Verify:
-- select date, type, title from calendar_posts
-- where brand = 'personal_brand' and date between '2026-06-08' and '2026-07-27' order by date;
