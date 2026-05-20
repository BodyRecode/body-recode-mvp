import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/nav'
import MarketingFooter from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Online Fat Loss Coaching | Body Recode™',
  description: 'Body Recode™ online fat loss coaching. A biology-first approach that addresses the underlying system driving body composition, not just calories and cardio. Available worldwide.',
}

export default function OnlineFatLossCoachingPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="bg-black pt-44 pb-28 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-4">Online · 1:1 Fat Loss Coaching</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] leading-tight tracking-tight mb-12">
            Online Fat Loss Coaching
          </h1>
          <p className="text-xl text-stone-400 leading-relaxed max-w-2xl mb-12">
            Fat loss isn&apos;t a willpower problem. It&apos;s a biological one. Body Recode™ addresses the system driving your body composition, not just the calories in and out. Delivered 1:1, fully online.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#1B6DFC] text-[#1A1A1A] font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors"
          >
            Start your free performance check-in
          </Link>
        </div>
      </section>

      {/* Why fat loss is harder than it should be */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">Why fat loss is harder than it should be</h2>
          <p className="text-stone-400 text-lg leading-relaxed mb-4">
            Most fat loss programs are built on two assumptions: eat less, move more. This works up to a point. The problem is that the body is not a simple calculator. When stress is high, sleep is poor, or the regulatory system is under load, the body actively resists fat loss regardless of caloric deficit.
          </p>
          <p className="text-stone-400 text-lg leading-relaxed mb-4">
            Cortisol elevates. Insulin sensitivity drops. Muscle is broken down for energy while fat storage is preserved. This is not a failure of effort. It is a predictable biological response to a system under strain.
          </p>
          <p className="text-stone-400 text-lg leading-relaxed">
            Body Recode™ starts by identifying whether your system is in a state where fat loss is biologically viable, and if not, what needs to change first.
          </p>
        </div>
      </section>

      {/* What actually drives fat loss */}
      <section className="bg-black py-32 px-5 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">What actually drives fat loss</h2>
          <p className="text-stone-400 text-lg leading-relaxed mb-12">
            Sustainable fat loss depends on the interplay of several biological systems. Understanding which of these is limiting your progress is the starting point for everything.
          </p>
          <div className="grid md:grid-cols-2 gap-10 mb-12">
            {[
              { title: 'Stress and cortisol regulation', desc: 'Chronically elevated cortisol directly inhibits fat oxidation and promotes fat storage, particularly around the abdomen. No amount of extra cardio overcomes this.' },
              { title: 'Sleep quality and depth', desc: 'Poor sleep disrupts leptin and ghrelin, the hormones that regulate hunger and satiety. One week of poor sleep measurably increases caloric intake and fat storage.' },
              { title: 'Training load matching', desc: 'Training too hard in a depleted state elevates cortisol further and drives muscle breakdown. The right training load is one your system can actually recover from.' },
              { title: 'Nutrition pattern, not just calories', desc: 'Meal timing, protein adequacy, and eating behaviour patterns all affect how your body partitions energy. A caloric deficit built on the wrong foods at the wrong times produces poor results.' },
              { title: 'Hormonal environment', desc: 'Testosterone, oestrogen, thyroid function, and insulin sensitivity all influence how and where your body stores and releases fat. These cannot be ignored.' },
              { title: 'Body pattern recognition', desc: 'Where your body distributes fat tells a story about your underlying biology. Body Recode™ uses this as a diagnostic signal, not just an aesthetic concern.' },
            ].map((item, i) => (
              <div key={i} className="border border-stone-800 rounded-xl p-5">
                <p className="text-base font-bold text-[#1A1A1A] mb-1">{item.title}</p>
                <p className="text-base text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Body Recode approach */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-12">The Body Recode™ approach to fat loss</h2>
          <p className="text-stone-400 text-lg leading-relaxed mb-4">
            Before any fat loss prescription is made, Body Recode™ builds a complete picture of your biological state using a structured eight-domain intake. This tells us whether fat loss is viable right now, what is currently working against it, and what needs to change first.
          </p>
          <p className="text-stone-400 text-lg leading-relaxed mb-4">
            For clients whose regulatory system is under stress, attempting aggressive fat loss is counterproductive. The body fights back. The first phase is stabilisation, not restriction.
          </p>
          <p className="text-stone-400 text-lg leading-relaxed mb-12">
            Once the system is stable, fat loss becomes realistic and sustainable. Training load, nutrition structure, and lifestyle adjustments are all calibrated to the individual, not applied from a template.
          </p>
          <Link href="/performance-coaching/online" className="text-[#1B6DFC] text-sm font-semibold hover:underline">
            Learn about the full Body Recode™ system →
          </Link>
        </div>
      </section>

      {/* Client portal */}
      <section className="bg-black py-32 px-5 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-6">Client Portal</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-6">
            Your program, your data,<br />all in one place.
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed max-w-2xl mb-12">
            Every client gets a dedicated portal from day one. Your training program, nutrition guidelines, synthesis documents, weekly check-ins, and progress data, all updated continuously as you move through coaching.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Training Program', desc: 'Your structured training plan, designed around your biological profile and calibrated to your real recovery capacity.' },
              { title: 'Nutrition Guidelines', desc: 'Nutrition structure built around your current body state. Not a generic meal plan, a framework built for your biology specifically.' },
              { title: 'Weekly Check-Ins', desc: 'Structured weekly reporting that keeps your coaching current and ensures adjustments are made based on how your body is actually responding.' },
              { title: 'Foundation Synthesis', desc: 'The complete biological read of your system. The document that determines whether fat loss is viable and what approach makes sense for you right now.' },
            ].map((item, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-6">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-3">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#FFFFFF] py-32 px-5 border-t border-stone-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-14">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              { q: 'Is fat loss coaching just about diet?', a: 'No. Diet is one input in a larger biological system. Body Recode™ looks at stress, sleep, training load, hormonal patterns, and body composition signals, and builds a program around all of them.' },
              { q: 'I\'ve tried cutting calories before and it stopped working. Why?', a: 'When the body is under stress or in a state of chronic sleep deprivation, it actively resists fat loss regardless of caloric deficit. The intake process identifies what is working against your progress and addresses it directly.' },
              { q: 'Will I need to follow a strict diet?', a: 'Not necessarily. Body Recode™ works with your current eating behaviour and builds structure around it. Extreme restriction is rarely the right answer, especially in the early phases.' },
              { q: 'How long before I see results?', a: 'It depends on where your biology is starting from. If your system is under stress, the first phase focuses on stabilisation before fat loss becomes the primary goal. Once the system is stable, measurable changes typically show within the first 4–6 weeks. Everything is built to be sustainable, not fast and short-lived.' },
              { q: 'How does online coaching actually work?', a: 'Your full intake is completed through a structured online assessment. Everything else, your program, nutrition guidelines, synthesis documents, weekly check-ins, and progress data, is delivered through your dedicated client portal. Coaching communication happens directly with Kade throughout.' },
              { q: 'How do I get started?', a: 'The starting point is the free Performance Check-In. It takes a few minutes and gives you a clear picture of where your body is right now and what approach makes sense for you.' },
            ].map((item, i) => (
              <div key={i} className="border-b border-stone-800 pb-6">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{item.q}</h3>
                <p className="text-stone-500 text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-32 px-5 border-t border-stone-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] tracking-tight mb-4">
            Find out what&apos;s actually holding your progress back
          </h2>
          <p className="text-stone-500 text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            The free Performance Check-In takes a few minutes and gives you a real picture of your current body state and what it means for your fat loss approach.
          </p>
          <Link
            href="/performance-check-in"
            className="inline-block bg-[#1B6DFC] text-[#1A1A1A] font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors"
          >
            Start your free check-in →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </>
  )
}
