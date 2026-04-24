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

He built things with his hands - sheds, fences, furniture. But he also built rhythm, reliability, and routine. He got up before the sun, drank his tea slowly, packed his lunch with the same quiet ritual. When he left for work, you could set your watch by him. When he came home, you felt safer just hearing the truck pull up.

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
  { slug: 'the-day-everything-shifted',  number: 2, part: 1, partLabel: 'The Father & The Fracture', title: 'The Day Everything Shifted',  summary: 'The moment I was pulled from class. Not attending the funeral. The internal rupture.' },
  { slug: 'what-grief-did-to-a-boy',     number: 3, part: 1, partLabel: 'The Father & The Fracture', title: 'What Grief Did to a Boy',     summary: 'Anger, defiance, and emotional contradictions. I became untouchable but still loving.' },
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
