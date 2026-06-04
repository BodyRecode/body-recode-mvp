-- Seed the @kade_dunstone_ personal-brand 4-week launch calendar into calendar_posts
-- so it surfaces in /dashboard/business/strategy -> Content Calendar (brand = Personal Brand).
--
-- ONE calendar: the personal brand is NOT a separate calendar. These rows live in the
-- same calendar_posts table as Body Recode / AI Co-Founder / Studio of Ten, filtered by brand.
--
-- 16 posts, 4/week (Mon/Wed/Fri/Sun), 8 Jun - 5 Jul 2026, drawn from the Personal Brand
-- Script Library. Graphics use the editorial card: /api/content/graphic?style=personal.
-- Captions intentionally left null - Kade writes them in his own voice (no AI caption drafts).
--
-- Safe to re-run: clears the personal_brand IG rows in this window first, then re-inserts.
-- WON'T touch other brands / platforms / dates.

begin;

delete from calendar_posts
where date between '2026-06-08' and '2026-07-05'
  and coalesce(brand, 'body_recode') = 'personal_brand'
  and coalesce(platform, 'instagram') = 'instagram';

insert into calendar_posts (date, time, brand, platform, type, phase, title, notes, caption, graphic) values

('2026-06-08', '07:00', 'personal_brand', 'instagram', 'authority', 'scale',
 $t$I've spent 20 years helping people understand their body. Most of the work was never in the gym.$t$,
 $n$Launch · Arrival · Single · card eyebrow ARRIVAL$n$,
 null,
 $g$/api/content/graphic?style=personal&label=ARRIVAL&text=I%27ve+spent+20+years+helping+people+understand+their+body.+Most+of+the+work+was+never+in+the+gym.$g$),

('2026-06-10', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$The problem is not effort. Effort is everywhere.$t$,
 $n$Thinking · Contrarian · Single · card eyebrow THINKING$n$,
 null,
 $g$/api/content/graphic?style=personal&label=THINKING&text=The+problem+is+not+effort.+Effort+is+everywhere.&sub=Nobody+reads+the+situation+before+prescribing+to+it.+That+is+true+in+coaching%2C+and+in+most+areas+of+life.$g$),

('2026-06-12', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$I've rebuilt my identity three times. Each time I thought I was starting over. Each time I was going deeper.$t$,
 $n$Identity · Rebuild · Single · card eyebrow REBUILD$n$,
 null,
 $g$/api/content/graphic?style=personal&label=REBUILD&text=I%27ve+rebuilt+my+identity+three+times.+Each+time+I+thought+I+was+starting+over.+Each+time+I+was+going+deeper.$g$),

('2026-06-14', '07:00', 'personal_brand', 'instagram', 'authority', 'scale',
 $t$I stopped writing programs and started building systems.$t$,
 $n$Thinking · System · Single · card eyebrow SYSTEMS$n$,
 null,
 $g$/api/content/graphic?style=personal&label=SYSTEMS&text=I+stopped+writing+programs+and+started+building+systems.&sub=Programs+solve+yesterday%E2%80%99s+problem.+Systems+solve+the+pattern+underneath+it.$g$),

('2026-06-15', '07:00', 'personal_brand', 'instagram', 'authority', 'scale',
 $t$Body Recode is the result of every rebuild.$t$,
 $n$Launch · Connection · Single · card eyebrow BODY RECODE$n$,
 null,
 $g$/api/content/graphic?style=personal&label=BODY+RECODE&text=Body+Recode+is+the+result+of+every+rebuild.&sub=An+interpretive+system%3A+read+the+body+before+prescribing+to+it.$g$),

('2026-06-17', '12:00', 'personal_brand', 'instagram', 'pattern', 'scale',
 $t$Three states. One body. Completely different responses to the same training.$t$,
 $n$Body · Framework · Carousel · card eyebrow BODY$n$,
 null,
 $g$/api/content/graphic?style=personal&label=BODY&text=Three+states.+One+body.+Completely+different+responses+to+the+same+training.$g$),

('2026-06-19', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$AI doesn't make you smarter. It makes your current thinking louder.$t$,
 $n$AI · Contrarian · Single · card eyebrow AI & LEVERAGE$n$,
 null,
 $g$/api/content/graphic?style=personal&label=AI+%26+LEVERAGE&text=AI+doesn%27t+make+you+smarter.+It+makes+your+current+thinking+louder.$g$),

('2026-06-21', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$Most people don't have a discipline problem. They have a clarity problem.$t$,
 $n$Thinking · Contrarian · Single · card eyebrow THINKING$n$,
 null,
 $g$/api/content/graphic?style=personal&label=THINKING&text=Most+people+don%27t+have+a+discipline+problem.+They+have+a+clarity+problem.$g$),

('2026-06-22', '07:00', 'personal_brand', 'instagram', 'video', 'scale',
 $t$I've rebuilt my identity three times. Each one produced a framework.$t$,
 $n$Identity · Story / Reel · Reel · card eyebrow REBUILD$n$,
 null,
 $g$/api/content/graphic?style=personal&label=REBUILD&text=I%27ve+rebuilt+my+identity+three+times.+Each+one+produced+a+framework.$g$),

('2026-06-24', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$You can't out-train a nervous system in protection mode.$t$,
 $n$Body · Observation · Single · card eyebrow BODY$n$,
 null,
 $g$/api/content/graphic?style=personal&label=BODY&text=You+can%27t+out-train+a+nervous+system+in+protection+mode.$g$),

('2026-06-26', '18:00', 'personal_brand', 'instagram', 'coach', 'scale',
 $t$Most coaches rent software. I built mine.$t$,
 $n$AI · Story · Single · card eyebrow AI & LEVERAGE$n$,
 null,
 $g$/api/content/graphic?style=personal&label=AI+%26+LEVERAGE&text=Most+coaches+rent+software.+I+built+mine.&sub=A+full+coaching+and+CRM+platform%2C+built+with+AI+as+a+co-founder.$g$),

('2026-06-28', '07:00', 'personal_brand', 'instagram', 'authority', 'scale',
 $t$Clarity is upstream of everything.$t$,
 $n$Thinking · Observation · Single · card eyebrow THINKING$n$,
 null,
 $g$/api/content/graphic?style=personal&label=THINKING&text=Clarity+is+upstream+of+everything.$g$),

('2026-06-29', '18:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$Rebuilding is not failure. It is the process of building better structure.$t$,
 $n$Identity · Contrarian · Single · card eyebrow REBUILD$n$,
 null,
 $g$/api/content/graphic?style=personal&label=REBUILD&text=Rebuilding+is+not+failure.+It+is+the+process+of+building+better+structure.$g$),

('2026-07-01', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$The body is not broken. It is being misread.$t$,
 $n$Body · Contrarian · Single · card eyebrow BODY$n$,
 null,
 $g$/api/content/graphic?style=personal&label=BODY&text=The+body+is+not+broken.+It+is+being+misread.$g$),

('2026-07-03', '07:00', 'personal_brand', 'instagram', 'contrarian', 'scale',
 $t$You don't need to know how to code. You need to know what you're building and why.$t$,
 $n$AI · Contrarian · Single · card eyebrow AI & LEVERAGE$n$,
 null,
 $g$/api/content/graphic?style=personal&label=AI+%26+LEVERAGE&text=You+don%27t+need+to+know+how+to+code.+You+need+to+know+what+you%27re+building+and+why.$g$),

('2026-07-05', '12:00', 'personal_brand', 'instagram', 'pattern', 'scale',
 $t$Interpretation vs prescription. The difference matters more than most people realise.$t$,
 $n$Thinking · Framework · Carousel · card eyebrow THINKING$n$,
 null,
 $g$/api/content/graphic?style=personal&label=THINKING&text=Interpretation+vs+prescription.+The+difference+matters+more+than+most+people+realise.$g$);

commit;

-- Verify after running:
-- select date, type, title from calendar_posts
-- where brand = 'personal_brand' and date between '2026-06-08' and '2026-07-05'
-- order by date;
