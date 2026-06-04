-- Seed the @kade_dunstone_ personal-brand 4-week launch calendar into calendar_posts.
-- ONE calendar: these rows live in the shared calendar_posts table, brand = personal_brand,
-- filtered on Strategy -> Content Calendar. Not a separate calendar.
--
-- Brand colour: CLAY (the approved single @kade_dunstone_ theme). Graphics use the editorial
-- card system: style=personal (clay cards + carousels w/ clay-solid close) and
-- style=personal-photo (clay photo cards, overlay/top/split). Carousels store comma-separated
-- slide URLs in the graphic field. Captions null - Kade writes them in his own voice.
--
-- 16 posts, 4/week (Mon/Wed/Fri/Sun), 8 Jun - 5 Jul 2026. ~1 in 4 carries a photo;
-- the two framework posts are 5-slide carousels; the rest are clay colour cards.
--
-- Safe to re-run: clears personal_brand IG rows in this window first, then re-inserts.

begin;

delete from calendar_posts
where date between '2026-06-08' and '2026-07-05'
  and coalesce(brand, 'body_recode') = 'personal_brand'
  and coalesce(platform, 'instagram') = 'instagram';

insert into calendar_posts (date, time, brand, platform, type, phase, title, notes, caption, graphic) values

('2026-06-08', '07:00', 'personal_brand', 'instagram', 'authority', 'scale',
 $t$I've spent 20 years helping people understand their body. Most of the work was never in the gym.$t$,
 $n$Launch · Arrival · PHOTO overlay$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=8&label=ARRIVAL&text=I%27ve+spent+20+years+helping+people+understand+their+body.+Most+of+the+work+was+never+in+the+gym.$g$),

('2026-06-10', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$The problem is not effort. Effort is everywhere.$t$,
 $n$Thinking · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&text=The+problem+is+not+effort.+Effort+is+everywhere.&sub=Nobody+reads+the+situation+before+prescribing+to+it.+That+is+true+in+coaching%2C+and+in+most+areas+of+life.$g$),

('2026-06-12', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I've rebuilt my identity three times. Each time I thought I was starting over.$t$,
 $n$Identity · Rebuild · PHOTO overlay$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=overlay&theme=clay&photo=2&label=REBUILD&text=I%27ve+rebuilt+my+identity+three+times.+Each+time+I+thought+I+was+starting+over.$g$),

('2026-06-14', '07:00', 'personal_brand', 'instagram', 'authority', 'scale',
 $t$I stopped writing programs and started building systems.$t$,
 $n$Thinking · System · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=SYSTEMS&text=I+stopped+writing+programs+and+started+building+systems.&sub=Programs+solve+yesterday%E2%80%99s+problem.+Systems+solve+the+pattern+underneath+it.$g$),

('2026-06-15', '07:00', 'personal_brand', 'instagram', 'authority', 'scale',
 $t$Body Recode is the result of every rebuild.$t$,
 $n$Launch · Connection · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY+RECODE&text=Body+Recode+is+the+result+of+every+rebuild.&sub=An+interpretive+system%3A+read+the+body+before+prescribing+to+it.$g$),

('2026-06-17', '12:00', 'personal_brand', 'instagram', 'pattern', 'scale',
 $t$Three states. One body. Completely different responses to the same training.$t$,
 $n$Body · Framework · CAROUSEL (5)$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&cue=swipe&text=Three+states.+One+body.+Completely+different+responses+to+the+same+training., /api/content/graphic?style=personal&theme=clay&num=01&text=Depleted.&sub=Protection+mode.+The+body+reads+more+load+as+threat%2C+so+adding+it+makes+things+worse., /api/content/graphic?style=personal&theme=clay&num=02&text=Transitioning.&sub=Mixed+signals.+Something+upstream+is+blocking+the+response+to+training., /api/content/graphic?style=personal&theme=clay&num=03&text=Ready.&sub=Biology+is+set+up+to+respond.+Now+effort+actually+converts., /api/content/graphic?style=personal&theme=clay-solid&text=Most+coaches+write+the+program+first.+I+read+the+state+first.&sub=That%27s+the+whole+difference.$g$),

('2026-06-19', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$AI doesn't make you smarter. It makes your current thinking louder.$t$,
 $n$AI · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=AI+%26+LEVERAGE&text=AI+doesn%27t+make+you+smarter.+It+makes+your+current+thinking+louder.$g$),

('2026-06-21', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$Most people don't have a discipline problem. They have a clarity problem.$t$,
 $n$Thinking · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&text=Most+people+don%27t+have+a+discipline+problem.+They+have+a+clarity+problem.$g$),

('2026-06-22', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$I've rebuilt my identity three times. Each one produced a framework.$t$,
 $n$Identity · Reel · PHOTO cover$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=top&theme=clay&photo=8&label=REBUILD&text=I%27ve+rebuilt+my+identity+three+times.+Each+one+produced+a+framework.$g$),

('2026-06-24', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$You can't out-train a nervous system in protection mode.$t$,
 $n$Body · Observation · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&text=You+can%27t+out-train+a+nervous+system+in+protection+mode.$g$),

('2026-06-26', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$Most coaches rent software. I built mine.$t$,
 $n$AI · Story · PHOTO split$n$,
 null,
 $g$/api/content/graphic?style=personal-photo&layout=split&theme=clay&photo=2&label=AI+%26+LEVERAGE&text=Most+coaches+rent+software.+I+built+mine.&sub=A+full+coaching+and+CRM+platform%2C+built+with+AI+as+a+co-founder.$g$),

('2026-06-28', '07:00', 'personal_brand', 'instagram', 'authority', 'scale',
 $t$Clarity is upstream of everything.$t$,
 $n$Thinking · Observation · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&text=Clarity+is+upstream+of+everything.$g$),

('2026-06-29', '18:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$Rebuilding is not failure. It is the process of building better structure.$t$,
 $n$Identity · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=REBUILD&text=Rebuilding+is+not+failure.+It+is+the+process+of+building+better+structure.$g$),

('2026-07-01', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$The body is not broken. It is being misread.$t$,
 $n$Body · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=BODY&text=The+body+is+not+broken.+It+is+being+misread.$g$),

('2026-07-03', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$You don't need to know how to code. You need to know what you're building and why.$t$,
 $n$AI · Card$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=AI+%26+LEVERAGE&text=You+don%27t+need+to+know+how+to+code.+You+need+to+know+what+you%27re+building+and+why.$g$),

('2026-07-05', '12:00', 'personal_brand', 'instagram', 'pattern', 'scale',
 $t$Interpretation vs prescription. The difference matters more than most people realise.$t$,
 $n$Thinking · Framework · CAROUSEL (5)$n$,
 null,
 $g$/api/content/graphic?style=personal&theme=clay&label=THINKING&cue=swipe&text=Interpretation+vs+prescription.+The+difference+matters+more+than+most+people+realise., /api/content/graphic?style=personal&theme=clay&num=01&text=Prescription.&sub=Here%27s+the+plan.+Follow+it.+It+can%27t+adapt+to+what+it+never+read., /api/content/graphic?style=personal&theme=clay&num=02&text=Interpretation.&sub=Here%27s+what+I+see%2C+here%27s+what+it+means%2C+here%27s+what+we+do+about+it., /api/content/graphic?style=personal&theme=clay&num=03&text=Read+first.&sub=Every+failed+plan+I%27ve+seen+was+prescription+without+interpretation., /api/content/graphic?style=personal&theme=clay-solid&text=Interpret+before+you+act.&sub=That%27s+the+whole+method.$g$);

commit;

-- Verify:
-- select date, type, title from calendar_posts
-- where brand = 'personal_brand' and date between '2026-06-08' and '2026-07-05' order by date;
