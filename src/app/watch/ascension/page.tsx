'use client'

// Branded watch page for the Day 14 ascension reel.
//
// The Day 14 email cannot play video inline (Gmail and Outlook strip players),
// so it links here instead of at the raw storage file. Two reasons the link
// must not go straight to Supabase: the address bar would show the project
// URL, which reads as an untrusted link to a lead and exposes backend infra;
// and a bare mp4 leaves the viewer on a black page with no next step right
// after a 72-second pitch. Here the offer sits directly under the video.
//
// Reel is 9:16 vertical - see project_video_hosting_supabase_storage.

import { ArrowRight, ShieldCheck } from 'lucide-react'
import { coach, logoUrl, brand } from '@/config/tenant'
import { LandingRoot, Nav, Section, Eyebrow, Heading, Lead, Footer, BLUE } from '@/components/landing/kit'
import { DAY_14_ASCENSION_REEL, DAY_14_ASCENSION_POSTER } from '@/lib/video-urls'

const BLUEPRINT_HREF = '/blueprint?source=challenge_day14_watch'

export default function AscensionWatchPage() {
  return (
    <LandingRoot>
      <Nav logo={logoUrl()} brandName={brand().name} />

      <Section pad="40px 24px 64px" glow>
        <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
          <Eyebrow>Day 14 · What comes next</Eyebrow>
          <Heading muted="Here is what the next six weeks would do about it.">
            You finished the 14 days.
          </Heading>

          {/* 9:16 vertical reel, capped so it never dominates a desktop screen */}
          <div style={{ maxWidth: 380, margin: '28px auto 0' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '9 / 16',
                background: '#1A1A1A',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid #2C2C2C',
                boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              }}
            >
              <video
                src={DAY_14_ASCENSION_REEL}
                poster={DAY_14_ASCENSION_POSTER}
                controls
                autoPlay
                playsInline
                preload="auto"
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 34 }}>
            <Lead>
              The 14 days gave you a reading. The Blueprint is the six weeks that acts on it,
              built around the pattern your results named.
            </Lead>
          </div>

          <a
            href={BLUEPRINT_HREF}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 26,
              padding: '16px 30px',
              borderRadius: 12,
              background: BLUE,
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 8px 24px -6px rgba(27,109,252,0.5)',
            }}
          >
            See the 6-Week Body Rewire Blueprint
            <ArrowRight size={18} />
          </a>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 18,
              color: '#6B6B6B',
              fontSize: 13,
            }}
          >
            <ShieldCheck size={15} color={BLUE} />
            <span>Built by {coach().fullName}. No lock-in.</span>
          </div>
        </div>
      </Section>

      <Footer brandName={brand().name} supportEmail={brand().supportEmail} />
    </LandingRoot>
  )
}
