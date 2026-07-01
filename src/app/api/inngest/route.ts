import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { executeWorkflowFunction, challengeSequenceFunction, challengeSmsFunction, blueprintWeekAdvanceFunction, blueprintEmailSequenceFunction, membershipWeekAdvanceFunction, extensionWeekAdvanceFunction, reengagementSequenceFunction, digitalAssetEngineFulfilmentFunction, weeklyCheckinAutoResponseFunction, weeklyPatternReportSequenceFunction, igPublisherCron } from '@/lib/inngest-functions'
import { appUrl } from "@/lib/app-url";

// Pin the serve host to the canonical production URL so Inngest registers
// against the stable domain instead of the per-deploy Vercel preview URL
// (which is password-protected and unreachable from Inngest cloud).
//
// Without this, every Vercel deploy sends Inngest a "register" call from
// the ephemeral `body-recode-<hash>-...vercel.app` URL. Inngest tries to
// validate it, gets a 401 from Vercel auth, and the sync lands in
// "Unattached syncs / Error" — leaving the OLD app entry (whatever URL
// it had at first sync) as the only thing Inngest knows about.
//
// Symptom this fixed (2026-06-23): 39 error-state syncs going back to
// 20 June. The only function Inngest still knew about was
// `execute-workflow` from a successful 7 April sync. Every weekly
// check-in submission since 9 June silently dropped because the worker
// wasn't registered.
//
// In dev (npm run dev) the env var isn't set; serveHost falls through
// to the SDK default (host from request headers), which is correct.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeWorkflowFunction, challengeSequenceFunction, challengeSmsFunction, blueprintWeekAdvanceFunction, blueprintEmailSequenceFunction, membershipWeekAdvanceFunction, extensionWeekAdvanceFunction, reengagementSequenceFunction, digitalAssetEngineFulfilmentFunction, weeklyCheckinAutoResponseFunction, weeklyPatternReportSequenceFunction, igPublisherCron],
  serveOrigin: process.env.VERCEL_ENV === 'production' ? appUrl() : undefined,
})
