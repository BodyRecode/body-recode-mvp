import { brand } from "@/config/tenant";

export default function OrientationPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141821]">
      <div className="max-w-2xl mx-auto px-8 py-16">

        {/* Header */}
        <div className="mb-16">
          <p className="text-[10px] text-[#98A0AD] tracking-[0.25em] font-semibold mb-10">{brand().name}&trade; &middot; Performance Coaching</p>
          <div className="w-8 h-px bg-blue-500/60 mb-8" />
          <h1 className="text-4xl font-light text-[#141821] mb-4 leading-tight tracking-tight">Performance Coaching<br />Orientation</h1>
          <p className="text-[#666D7A] text-base leading-relaxed">How this works. What to expect. How we begin.</p>
        </div>

        {/* Intro note */}
        <div className="border-l-2 border-blue-200 pl-6 mb-16">
          <p className="text-[#666D7A] text-sm leading-relaxed italic">A calm introduction to the structure, pacing, and the philosophy behind {brand().name} Performance Coaching.</p>
        </div>

        <div className="space-y-14 text-[#141821] text-[15px] leading-relaxed">

          <OrientationSection title="A Note on How to Read This">
            <p>This orientation is not something to get through quickly. It is designed to be read slowly, in your own time, without needing to take notes, make decisions, or figure anything out as you go. You don&apos;t need to agree with everything you read, and you don&apos;t need to be certain about anything by the end.</p>
            <p>Nothing in this guide is asking you to prepare, perform, or commit. Its purpose is simply to offer clarity about how {brand().name} Performance Coaching works, what the relationship looks like, and how pacing and boundaries are held.</p>
            <p>If anything feels unfamiliar or different to what you&apos;ve experienced before, that&apos;s okay. Orientation exists to support understanding, not momentum.</p>
          </OrientationSection>

          <OrientationSection title="What This Is (and What It Isn&apos;t)">
            <p>{brand().name} Performance Coaching is built on the {brand().name} framework - a considered system for understanding how the body responds to stress, load, recovery, and time.</p>
            <p>Rather than chasing outcomes or pushing effort, {brand().name} focuses on creating conditions the body can reliably hold, and allowing progress to emerge from stability rather than force.</p>
            <p>This work isn&apos;t about fixing yourself. It doesn&apos;t assume that something is broken or failing. Instead, {brand().name} treats the body as a responsive system that adapts continuously to load and context.</p>
            <p>What {brand().name} offers is structure, containment, and perspective. It reduces noise, lowers reactivity, and makes it easier to understand what actually matters - without relying on motivation, willpower, or constant self-monitoring.</p>
            <p>Orientation is not a deep dive into the specifics of your coaching plan. That conversation happens next. Its purpose here is simply to give you enough context to arrive at that conversation informed rather than uncertain.</p>
          </OrientationSection>

          <OrientationSection title="How Body Recode Performance Coaching Works">
            <p>At its core, {brand().name} is an interpretive framework. It is designed to make sense of how the body responds to load, recovery, stress, and time. Rather than prescribing actions, it creates context. Rather than chasing outcomes, it clarifies conditions.</p>
            <p>This framework takes a long arc view of performance. Progress is built deliberately, layer by layer, with priority given to stability before intensity, tolerance before demand, and consistency before complexity.</p>
            <p>Early phases of coaching commonly focus on reducing background stress, improving recovery and regulation, and establishing a baseline that the system can reliably hold. This creates the conditions for lasting progress, rather than short surges followed by withdrawal.</p>
            <p>Change within this system is not expected to be linear. Plateaus, pauses, and even temporary regressions are treated as information rather than failure. The aim is not constant escalation, but steady forward motion that the system can sustain.</p>
            <p>{brand().name} recognises that motivation is unreliable. Structure, however, holds when motivation does not. Coaching is built around clear phases, predictable rhythms, and defined decision points - reducing emotional effort and removing the need to rely on willpower.</p>
            <p>Within the {brand().name} framework, it is common to see that when load is applied appropriately, recovery is protected, and the body is no longer operating under constant stress, people achieve better results while doing less - because the system is finally working with the body rather than against it.</p>
          </OrientationSection>

          <OrientationSection title="The Coaching Relationship">
            <p>This relationship is designed to feel steady, respectful, and well defined - rather than intense, dependent, or constantly reactive. Its purpose is to support progress over time, not to create pressure or urgency.</p>
            <p>Your coach&apos;s role is to hold the structure, interpret information, and guide decisions based on how your system is responding. This includes helping to pace progress, identify when restraint is needed, and recognise when capacity is available to develop further.</p>
            <p>Your role within the relationship is not to perform, impress, or push beyond what feels sustainable. It is to engage honestly with the process, communicate clearly where needed, and allow the structure to do its work over time.</p>
            <p>When the coaching relationship is working well, it tends to feel quieter rather than louder. There is less urgency, fewer abrupt changes, and a growing sense that progress is unfolding in a way your system can actually hold.</p>
          </OrientationSection>

          <OrientationSection title="Roles and Responsibilities">
            <p>Clear roles and responsibilities are essential to how {brand().name} Performance Coaching works. They create predictability, reduce confusion, and protect the relationship from unnecessary pressure or emotional load.</p>
            <p>The coach&apos;s responsibility is to hold the structure of the framework - interpreting information, guiding decisions, and pacing progress in a way that reflects how your system is responding over time. The coach is responsible for maintaining perspective, especially when frustration, urgency, or comparison arise.</p>
            <p>Your responsibility within the coaching relationship is to engage honestly and realistically with the process. This includes communicating relevant information when asked, and allowing the structure to do its work rather than trying to accelerate it.</p>
            <p>You are not expected to be perfect, disciplined, or constantly on track. There is no requirement to perform, impress, or justify yourself. What matters is staying connected to the process in a way that feels sustainable and honest.</p>
          </OrientationSection>

          <OrientationSection title="Expectations and Boundaries">
            <p>Clear expectations and boundaries are essential to how {brand().name} Performance Coaching is held. They are not restrictions or rules for compliance - they exist to protect the work, reduce unnecessary pressure, and create a coaching environment that feels steady, respectful, and sustainable.</p>
            <p>There is no expectation to be constantly motivated, positive, or progressing at all times. Fluctuations in energy, confidence, and capacity are expected and accounted for within the framework.</p>
            <p>You are not required to justify every choice or seek permission for how you live outside of coaching. The role of the framework is to support clearer decision-making, not to control behaviour or impose rules.</p>
            <p>When expectations and boundaries are respected, coaching tends to feel calmer and more contained. There is less emotional load, fewer reactive decisions, and a stronger sense of trust in the process over time.</p>
          </OrientationSection>

          <OrientationSection title="Pacing, Communication, and Rhythm">
            <p>Pacing is a central principle in {brand().name} Performance Coaching. Rather than moving as fast as possible, progress is shaped by what your system can reliably hold.</p>
            <p>Communication is designed to support clarity, not constant engagement. Check-ins, conversations, and updates occur within agreed rhythms so that information is shared when it is useful, rather than in response to momentary emotion or reactive urgency.</p>
            <p>You are not expected to track everything, report continuously, or stay focused on your body at all times. The structure exists to hold the work, so you do not have to carry it on your own.</p>
            <p>This approach often feels quieter than more intensive coaching models. There is less urgency to change course quickly and more confidence in staying with a direction long enough to see how the system responds.</p>
          </OrientationSection>

          <OrientationSection title="Before Our Next Conversation">
            <p>When we speak next, the focus will be on what the report is showing us, what it means for how you&apos;ve been responding, and what a structured coaching approach could look like for you specifically.</p>
            <p>You don&apos;t need to have prepared anything. You don&apos;t need to have formed opinions or made decisions. What helps is arriving with a clearer sense of what this framework is - which is what this guide is for.</p>
            <p>If anything in here stands out, prompts a question, or doesn&apos;t sit right - bring it. That&apos;s exactly the kind of conversation worth having before anything moves forward.</p>
          </OrientationSection>

          {/* Closing */}
          <div className="pt-2">
            <div className="w-8 h-px bg-blue-500/30 mb-8" />
            <p className="text-[#666D7A] text-sm italic leading-relaxed">{brand().name} doesn&apos;t ask for blind commitment. It asks for clarity. Take what resonates. Leave what doesn&apos;t. Move forward in a way that feels deliberate, grounded, and aligned with what your system can truly hold.</p>
          </div>

        </div>

        <p className="text-[10px] text-[#141821] tracking-[0.25em] mt-20">{brand().name}&trade;</p>

      </div>
    </div>
  )
}

function OrientationSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-1 h-4 bg-blue-500/50 rounded-full shrink-0" />
        <h2 className="text-[12.5px] font-semibold text-blue-500/70 tracking-[0.15em]"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      <div className="space-y-4 pl-5">
        {children}
      </div>
    </section>
  )
}
