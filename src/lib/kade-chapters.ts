export interface Chapter {
  slug: string
  number: number
  part: 1 | 2 | 3 | 4
  partLabel: string
  title: string
  summary: string
  publishedAt?: string // ISO date string when chapter goes live
  content?: string // markdown-style content. If absent, chapter shows as draft.
}

export const CHAPTERS: Chapter[] = [
  // PART I: THE FATHER & THE FRACTURE
  {
    slug: 'the-builder',
    number: 1,
    part: 1,
    partLabel: 'The Father & The Fracture',
    title: 'The Builder',
    summary: 'My father\'s presence, legacy, and the imprint of his one quiet moment with me.',
    publishedAt: '2026-04-25',
    content: `I don't remember my father in vivid scenes or flowing conversations. I remember his presence.

It sat in the room like gravity.

He wasn't loud. Didn't need to be. He wasn't the kind of man who announced himself - he just was. Steady. Calm. Respected. It wasn't what he said that left an imprint. It was how he held himself. How he moved with purpose, not performance. As a kid, I thought he was invincible.

There's one memory that hasn't faded - probably because it meant more than I could name at the time. We were in the shed. I must've been five or six. The air smelled like dust, oil, and sawdust. His tools were laid out the way only a man who understands order would lay them. I don't remember what he was building, just that I wanted to be near it. I hovered close, quiet, waiting to be useful. He paused for a second, looked over, and placed his hand on my shoulder.

That's it. That's the moment.

He didn't speak. But I heard everything I needed to hear. You're mine. I see you. You belong beside me.

There's something about being seen by your father - even for a second - that plants a seed. Not just of love, but of identity. In that moment, I wasn't just a boy. I was his boy. A builder-in-training. A shadow learning from substance.

But the shadow outlived the substance.

When he died, the whole axis of my world tilted. One phone call. One classroom door opening. One teacher's tight-lipped expression. And suddenly I was the boy whose father had just died. I was walked down a hallway but felt like I was walking off a cliff. No one told me I wouldn't be allowed to attend the funeral. They just said it was decided. Too young, they said. Too much.

But not seeing him in that coffin left a crack in my understanding of what had even happened. It was like he vanished - like someone had turned off a light and thrown away the switch.

After that, everything quiet inside me turned loud. I didn't cry, not in front of anyone, but I raged in other ways. I became wild and untouchable, hard to contain, harder to understand. And yet, even then, I was still tender underneath. Still the boy who just wanted his dad's hand on his shoulder again.

I started mimicking him. Not consciously. Just by instinct. I worked hard. Took on responsibility. Protected people. Fixed things. I wasn't trying to be a "good kid." I was trying to become the man who left - because becoming him was the only way I knew to bring him back.

My father was a builder.

A home builder. By trade and by blood. His whole family were builders. My grandmother used to say it like a punchline. "Gordon would build a house slanting to the left. Kenny would build a house slanting to the right. But Neil - Neil would build them dead straight."

That was him. Dead straight. In the work and in the man.

He didn't just build with his hands. He built rhythm, reliability, and routine. He got up before the sun, drank his tea slowly, packed his lunch with the same quiet ritual. When he left for work, you could set your watch by him. When he came home, you felt safer just hearing the truck pull up.

He didn't talk much about emotions. But you didn't need him to. He was present. In his presence, there was order. There was calm. And when that disappeared, so did my sense of safety.

I became addicted to control.

At first it looked like discipline. Responsibility. Good grades. Toughness. But underneath it was a boy desperately trying to stop the world from breaking again.

That pattern would follow me for years. Outworking my pain. Carrying others. Becoming the reliable one. The one you could lean on - even when I couldn't lean anywhere myself.

There's a strange ache in losing a parent young. You grieve the person and the future you never got to share. He never saw me join the military. Never saw me in uniform. Never saw the man I tried to become - or the years where I couldn't find that man at all.

He didn't see the businesses I built. The father I became. The love I gave. The mistakes I made. He never met my daughter. Never heard my voice crack when I told her stories about him. Never saw me cry in the dark after a hard day, wondering if I was doing enough - or if I'd failed the blueprint he left behind.

For years, I carried that question like a weight in my chest: Would he be proud of me?

Not because he ever demanded it. But because I needed it. I needed that nod again - the silent assurance that I was doing alright. That I'd turned out okay. That I had become the man I imagined he would have raised me to be.

And here's the truth I didn't want to admit until much later:

Trying to be him almost cost me being me.

I learned his strength, but I inherited his silence. I learned to build, but I didn't know how to rest. I became dependable, but I struggled to ask for help. And even now - years, decades later - there's a part of me still standing in that shed, waiting for a hand on the shoulder to say, You belong here. You're doing alright.

I've had to become that voice for myself.

Some days, I get it right. Other days, I fall into old echoes - over-functioning, over-working, disappearing into strength because it feels safer than being seen in need. But I'm learning now that building isn't just about creating things outside of yourself. It's also about rebuilding what got broken inside.

My father built homes.

I'm trying to build wholeness.

And maybe that's the deeper legacy. Not just picking up his tools - but learning which ones to put down. Choosing to speak what he never said. Choosing to feel what he tucked away. Choosing to be strong and soft. Reliable and real.

In that way, I'm still his son. Still tracing his imprint through my own hands, my own life, my own becoming.

And I like to think that, wherever he is, he still sees me.

Hand on shoulder. Quiet nod.

You're mine. I see you. You're safe here.`,
  },
  {
    slug: 'the-day-everything-shifted',
    number: 2,
    part: 1,
    partLabel: 'The Father & The Fracture',
    title: 'The Day Everything Shifted',
    summary: 'The moment I was pulled from class. Not attending the funeral. The internal rupture.',
    publishedAt: '2026-04-26',
    content: `I was deep in my work when she came for me.

I was eight years old and I was drawing. That's what I did. While other kids were playing or fighting or doing whatever eight year olds do, I was usually somewhere quiet with a pencil, copying X-Men and Spider-Man panels from comics I'd memorised. I was good at it. Not in a polite way. In a way that surprised adults. My hands moved and the characters appeared. It was the one thing I had that nobody could take away.

I was inside one of those drawings when the classroom door opened.

I remember the teacher who came to get me. She was a teacher I liked, and I think she liked me back. The kind of warmth that an eight year old can feel without being able to name it. Years later I'd wonder if she happened to be in the office when the call came through. If someone in the building heard what had happened and decided it had to be her. The one who knew me. The one who could walk in without spooking me.

She didn't tell me anything.

She said I'd be heading home for the day. That my aunty was here to collect me. Calm voice. Steady hands. She gave me nothing to worry about and everything to wonder about.

The car ride home was quiet.

My aunty drove and I sat there and the silence felt different to a normal silence. Adults have a particular kind of quiet when they're carrying something they aren't saying yet. I couldn't name it but I could feel it. Something was off and I didn't have the language for it. I just sat in the passenger seat and watched the road and waited for the car to stop.

When I walked through the front door, the first thing I saw was my older brother.

He was curled up on the couch.

Crying.

That's when I knew something had broken in the world.

My older brother was the kind of kid no one touched. He was naturally big and strong, and he could fight like a thrashing machine like he had some serious training behind him. He was the one I looked up to. The one I assumed was untouchable. To see him like that, balled up, undone, was a sight my eight year old mind could not reconcile. If he was that broken, this wasn't a normal day.

It was my favourite aunty who took me and my older sister into the master bedroom.

She sat us on the bed.

And she delivered the news.

I don't remember the exact words. I remember the room. The quiet. The weight of being eight years old and being told something that doesn't have a shape yet. I didn't know how to react. I didn't understand what I was being told. The information didn't fit anywhere in me.

So I turned and looked at my sister.

And her face broke open.

That's when I knew how I was supposed to feel.

I had to look at someone else's face to learn the appropriate response to my own father's death. That's what eight year olds do. They borrow reactions from the people around them because they don't have the equipment yet. I watched her cry, and only then did I understand that this was the kind of thing you cried about.

Later there was a funeral. I didn't go. The adults decided. Too young, they said. Too much.

But here's the strange part.

I don't remember not being allowed to go.

I don't remember being told.

I don't remember the day itself, what I did, where I was, who I was with while everyone else was at the service.

There's just a hole there.

I think the mind protects you when there's nothing to hold onto. No coffin. No goodbye. No body to confirm what had happened. Just a closed door and a decision made on my behalf and a day I have no record of in my memory.

It was like he vanished. Like someone turned off a light and threw away the switch.

And because there was no funeral for me, there was no ending. The grief didn't have a container. It didn't have a beginning or a moment or a ritual. It was just an absence that opened up that day in the master bedroom and never properly closed.

I went back to school.

Life kept going.

People stopped asking how I was doing because they thought it would be kinder to let me get on with things.

But I was eight and my father was gone and I had no proof of either fact except the way the air had changed in the house. The truck didn't pull up anymore. The morning ritual didn't happen anymore. The hand on the shoulder was never coming back.

And I didn't know what to do with any of it.

So I kept drawing.

Because at least when I was drawing, my hands knew what they were doing.`,
  },
  {
    slug: 'what-grief-did-to-a-boy',
    number: 3,
    part: 1,
    partLabel: 'The Father & The Fracture',
    title: 'What Grief Did to a Boy',
    summary: 'Anger, defiance, and emotional contradictions. I became untouchable but still loving.',
    publishedAt: '2026-04-27',
    content: `Everything quiet inside me turned loud.

I didn't cry. Not in front of anyone. Crying didn't feel like something I was allowed to do, even though no one had told me I wasn't. So instead I broke things.

Not metaphorically. Actual things.

I put the broom handle through the glass window beside our front door. I don't remember why. I don't remember what set me off. I remember the sound of it. I remember the way the air felt different after it happened. Like something had finally been answered.

I broke other things too. Furniture. Toys. Whatever was nearby when the wave came. The grief inside me didn't have a shape and I was too young to give it one, so I gave it to objects instead. The objects could carry what I couldn't.

At school I was the kid who brought a basketball ring down.

We had one out the back of the oval. I was a kid who could still play, even after everything. I dunked one day and the whole ring came down. Not just the rim. The frame. The backboard. The lot. I remember standing there, looking at the wreckage, half proud and half terrified.

The school's response was to start taking the ring off at the end of every day. So we couldn't come back after hours. Which felt like another thing being taken from me. So I went and scratched up the janitor's car. Long lines down the boot. Just because.

I got in trouble for that one.

I lit a paddock on fire once. Tall dead grass, a whole block of it. I just wanted to see it burn. The fire spread further than I expected. Two fire trucks came. Houses around the paddock could have gone up. Nothing did. But the fire trucks pulling up in our street to put out something I'd started is a memory I still carry.

The fighting was the constant.

I fought at school. I fought a lot. I was angry and I didn't keep it in. I'd swing at boys bigger than me. I'd take whatever came back. I wasn't trying to win. I was trying to feel something land. The chaos in my body wanted somewhere to go, and a fight was the most reliable way to get rid of it for an afternoon.

Looking back, those years are not all clean. There are things I did that I'm not proud of. The destruction. The damage. The cost of all of that to other people.

But there was another kid living inside the same body.

The kid who stuck up for the ones nobody else stuck up for.

The kids who didn't fit. The ones who ate lunch alone. The ones picked last for sports. The ones who'd been told quietly, in a hundred small ways, that they didn't belong. They figured out pretty quickly that I was someone they could come to. If a bigger kid was making their life hard, they'd find me. I'd put an end to it.

Some of those kids became my friends. They still are. Thirty something years later. Still in contact. Still in my life.

The people who didn't know me back then would look at the broken windows and the burnt paddock and the fights and the scratched car and conclude I was a bad kid. Plenty of adults did. I gave them every reason to.

But the kids I protected knew something different.

Because the same instinct that drove me to break things drove me to defend them.

And the truth is, I never thought of it as two different things. The destruction and the protection felt like the same impulse looking for different exits. The anger had to go somewhere. Sometimes it went into a basketball ring. Sometimes it went into a fight with a boy who deserved it. Sometimes it went into standing between a smaller kid and the one who was making him cry.

If you'd asked me at the time why I stuck up for them, I wouldn't have had an answer.

I do now.

It wasn't right. That's the first part.

The second part is harder to explain but it's the thing that actually drove me.

I felt like I could help them. So I had a duty to.

Not morality. Duty. If the strength was in my hands, then the responsibility came with it. That's how I read it. I was nine years old and I had no language for it, but the wiring was already there. If you have the capacity to help and you don't, you've chosen something. And whatever you've chosen, it isn't right.

That wiring came from my father.

He taught me right from wrong. He taught me to own my shit. He taught me to take responsibility for what I did. He didn't sit me down and lecture me. He just showed me what it looked like to be steady. To be fair. To stand for something. He lived that way every day, until he didn't anymore.

He died when I was eight.

And nearly everything I knew about myself came apart in the years that followed.

But the code he gave me didn't.

The code stayed.

Even when I was burning paddocks and scratching cars and putting broom handles through windows and getting into fights I had no business being in, the code stayed. Hidden somewhere I couldn't see it from the outside. Buried under everything else that was breaking.

But it was still there.

Because when I saw a kid getting picked on, my body moved before my mind did. Not because I was naturally good. Because my father had given me something before he left, and something in me refused to let that go.

He didn't see any of it.

He didn't see the broken windows. He didn't see the basketball ring come down. He didn't see the fights. And he didn't see the kids I protected.

But he was the reason for both.

The destruction was the grief.

The protection was him.

Years later, in a session with my psychologist, she asked me what grief meant to me.

I couldn't answer her.

Not because I didn't know. Because I knew it too well. The feeling was too big to compress into words. Anything I might have said would have made it smaller than it was, and it didn't deserve to be made smaller.

I sat there in that room as a grown man and realised something I hadn't seen before.

I had never actually let myself grieve.

Not as a kid. Not in the years that followed. Not through any of it.

The destruction was grief leaking out without permission. The fights were grief looking for somewhere to land. The protection was grief disguised as duty. The drawing was grief held in my hands so I didn't have to feel it anywhere else.

But none of it was actually grieving.

It was all just other things taking the shape grief should have taken.

And I think now, looking back, that the kid I was in those years was doing the only thing he knew how to do. He was carrying his father's voice through his hands, in whatever form he could find it. Sometimes it came out destructive. Sometimes it came out as defending the kid eating lunch alone.

Either way, it was the only thread of him I had left.

And I wasn't going to let it go.`,
  },
  { slug: 'too-much-and-not-enough',     number: 4, part: 1, partLabel: 'The Father & The Fracture', title: 'Too Much and Not Enough',     summary: 'Being the favourite and the hardest to handle. The birth of emotional duality.' },
  { slug: 'learning-the-mask',           number: 5, part: 1, partLabel: 'The Father & The Fracture', title: 'Learning the Mask',           summary: 'Early adolescence. People-pleasing, over-functioning, and managing other people\'s energy.' },

  // PART II: BUILDING MYSELF FROM SCRATCH
  { slug: 'running-on-empty',            number: 6,  part: 2, partLabel: 'Building Myself From Scratch', title: 'Running on Empty',            summary: 'Hustle as identity. Earning my place. Outperforming the pain.' },
  { slug: 'what-a-man-is-supposed-to-be',number: 7,  part: 2, partLabel: 'Building Myself From Scratch', title: 'What a Man Is Supposed to Be', summary: 'Masculinity, toughness, pride. Suppressing sensitivity. Outward strength, inward silence.' },
  { slug: 'becoming-a-soldier',          number: 8,  part: 2, partLabel: 'Building Myself From Scratch', title: 'Becoming a Soldier',          summary: 'Training, discipline, identity through proving myself. Belonging through structure.' },
  { slug: 'the-injury-that-undid-everything', number: 9, part: 2, partLabel: 'Building Myself From Scratch', title: 'The Injury That Undid Everything', summary: 'Bilateral compartment syndrome. Surgery. Discharge. Forced exit from who I was becoming.' },
  { slug: 'the-man-with-nowhere-to-go',  number: 10, part: 2, partLabel: 'Building Myself From Scratch', title: 'The Man With Nowhere to Go',  summary: 'The identity void post-discharge. Disorientation. Depression. Searching for new footing.' },

  // PART III: LOVE, LOSS, AND STARTING AGAIN
  { slug: 'building-a-new-life',         number: 11, part: 3, partLabel: 'Love, Loss, and Starting Again', title: 'Building a New Life',         summary: 'Relationship. Starting a business. Becoming a dad. Reconstructing for others.' },
  { slug: 'the-good-man-you-tried-to-be',number: 12, part: 3, partLabel: 'Love, Loss, and Starting Again', title: 'The Good Man I Tried to Be',  summary: 'Showing up. Sacrificing. Providing. Trying to be everything my father didn\'t get to.' },
  { slug: 'the-slow-burnout',            number: 13, part: 3, partLabel: 'Love, Loss, and Starting Again', title: 'The Slow Burnout',            summary: 'Emotional depletion, relationship strain, pressure from success. Losing myself again.' },
  { slug: 'the-separation',              number: 14, part: 3, partLabel: 'Love, Loss, and Starting Again', title: 'The Separation',              summary: 'Ending the relationship. Co-parenting. Guilt, grief, and trying to stay strong.' },
  { slug: 'wine-at-the-end-of-the-day',  number: 15, part: 3, partLabel: 'Love, Loss, and Starting Again', title: 'Wine at the End of the Day',  summary: 'The quiet introduction of drinking. Numbing. COVID years. Self-soothing without awareness.' },

  // PART IV: UNMASKING MYSELF
  { slug: 'the-mirror',                  number: 16, part: 4, partLabel: 'Unmasking Myself', title: 'The Mirror',                  summary: 'Journaling. Therapy. Ava. Gratitude practice. Seeing myself clearly for the first time.' },
  { slug: 'what-i-never-got-to-say',     number: 17, part: 4, partLabel: 'Unmasking Myself', title: 'What I Never Got to Say',     summary: 'Unspoken words to my father, younger self, and past relationships. The power of saying it now.' },
  { slug: 'would-he-be-proud',           number: 18, part: 4, partLabel: 'Unmasking Myself', title: 'Would He Be Proud?',          summary: 'The core question that shaped my life. Learning to answer it for myself.' },
  { slug: 'i-am-all-of-it',              number: 19, part: 4, partLabel: 'Unmasking Myself', title: 'I Am All of It',              summary: 'Integrating my full self. The sensitive and the strong. No longer splitting who I am.' },
  { slug: 'the-man-i-am-becoming',       number: 20, part: 4, partLabel: 'Unmasking Myself', title: 'The Man I Am Becoming',       summary: 'Not a finish line. Just an arrival. Legacy redefined. Tracing forward with truth.' },
]

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find(c => c.slug === slug)
}

export function getPublishedChapters(): Chapter[] {
  return CHAPTERS.filter(c => c.content)
}
