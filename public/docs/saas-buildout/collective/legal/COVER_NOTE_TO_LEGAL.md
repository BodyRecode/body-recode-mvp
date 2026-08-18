# Cover note to legal reviewer

**From:** Kade Dunstone, founder, Body Recode
**Re:** the Collective legal package v0.1
**Documents (9):** Collective Partner Agreement · Partner IP Sublicence Deed · Head Licence Deed · Contractor IP Assignment · Mutual NDA · IP Protection Map · Decisions Needed · this Cover Note · README
**Prepared:** July 2026

## What Body Recode is doing

Body Recode is licensing a proprietary interpretation engine + platform ("the Platform") to allied coaches under **The Body Recode Collective** under a subscription + per-active-client model. Each partner runs their own coaching business on the Platform, branded as theirs, powered by Body Recode's engine and doctrine.

**Important — there is no cap on partner numbers.** The Collective is open to allied coaches, and Body Recode intends to keep licensing the Platform to further partners. Early partners receive a locked-for-life founding rate, which is a pricing term and nothing more. **Please make sure nothing in the drafting grants a partner permanent exclusivity, market or territorial exclusivity, or any status that would prevent Body Recode licensing to any number of further partners.** An early partner's locked-for-life pricing must survive; any implied scarcity or exclusivity must not.

The commercial relationship has three moving parts:

1. **The Platform** (Layer 2): a coaching web application, tenant-scoped per partner
2. **The Engine** (Layer 1): interpretation algorithms + doctrine rules that read a client's state and produce coaching direction
3. **The Brand**: partner uses their own brand primarily, with a **mandatory but subtle** "Powered by Body Recode" acknowledgement (required in the footer of client-facing pages + emails; never above the fold)

The commercial arrangement is Partner pays Body Recode:
- One-time setup fee, paid 50% on signing and 50% on setup completion (go-live/handover), unless otherwise agreed
- Monthly platform subscription (locked for life at the Collective rate)
- Ongoing per-active-client fee, billed monthly in arrears

The Partner's clients pay the Partner directly (Stripe Connect). Partner keeps 100% of client revenue.

## What we need from you

### Threshold structural question (please address first — it gates the rest)

0. **Entity + incorporation.** Body Recode currently operates as **Kade Dunstone, sole trader, trading as Body Recode** — there is no "Body Recode Pty Ltd" yet, despite the placeholder party blocks. Please advise whether Body Recode should **incorporate a proprietary company to hold the IP and enter these agreements before signing any Collective Partner**, given: (a) the unlimited personal liability a sole trader carries under the indemnities, IP warranties, and health-data processing obligations in this package; (b) the "locked for life" commitments to ten partners; and (c) that the Engine/Doctrine IP is presently owned by Kade personally and would need to be assigned into any licensing company. If incorporation is recommended, the party blocks, execution clauses (currently drafted for s127 companies), and the IP-ownership chain all change. Many partners will also be sole traders or trusts, not companies — alternate party/execution blocks needed.

**Intended IP structure (per Kade's prior companies):** Kade Dunstone **retains ownership of the IP personally**. The operating company (once incorporated) takes a **head licence from Kade with the right to sublicense**, and it is the operating company that **sublicenses** Layer 2 + engine API access to partners under the Partner IP Sublicence Deed. IP is NOT assigned into the operating company — it stays with Kade and is ring-fenced from the company's operating liabilities. A **v0.1 skeleton head licence is included** (`HEAD_LICENCE_DEED_v0.1`) — please review and tune it (especially exclusivity, the royalty/consideration structure, and improvements consolidation), and confirm the partner deed reads correctly as a sublicence beneath it (its warranty already says "owns or has the right to license").

**Trade mark status:** trade marks are **not yet filed — the process has not started.** The marks to file (Body Recode word mark + logo; classes 9/42/41, consider 44) are listed in `DECISIONS_NEEDED` §2.3. The marks + goodwill provisions (Deed cl 5, Schedule 2) currently assume held rights. Please advise how to draft these to work on **unregistered/common-law** marks (passing-off + ACL in the interim), run a **clearance search**, confirm the right classes, and advise what changes once registration is granted.

### High-priority review areas

1. **IP scope** (Licence Deed sections 3-4, 6-8). We are licensing Layer 2 but keeping Layer 1 (the engine + doctrine) as ours. The line between what a partner can use, modify, and extend versus what stays proprietary needs to be watertight. Please tune the "Excluded IP" schedule so the engine cannot be reverse-engineered, sublicensed, or wrapped by the partner.

2. **Termination + wind-down** (Agreement sections 14, 15). What happens when a partner leaves or is terminated for cause? Client data, client relationships, tenant config, ongoing subscriptions their clients have with the partner — all need clear post-termination pathways. Draft handles data return + client handover; please pressure test.

3. **Doctrine compliance + hard safety floors** (Agreement section 7, Schedule 3). The engine's safety limits (RRS clamps, Fat Map limits, injury contraindications, eligibility floors) MUST bind the partner. This is our public liability shield. Please make sure the drafting is enforceable.

4. **Data + privacy** (Agreement section 9). Partner is the primary data controller for their clients. Body Recode is a data processor. Please align with Australian Privacy Principles + Privacy Act 1988. Client data does not cross tenants and cannot be exported for other purposes.

5. **Australian Consumer Law implications** (Agreement sections 12, 13). Please advise whether the ACL consumer guarantees apply here. We had assumed founding partners are businesses buying a business service and so fall outside the ACL — but we understand the "consumer" threshold is acquisitions up to **$100,000**, which a Launch-tier partner (setup + subscription) is likely under, so the guarantees may apply despite the business context. Please confirm, and review the warranties, disclaimers, and liability caps for enforceability on that footing.

6. **the Collective discount lock-in** (Agreement section 6, Schedule 1). Setup discount + subscription rate is "locked for life." We want this to bind Body Recode even under change of control. Please make sure the drafting achieves that.

### Standard review areas

7. **GST + tax treatment**. Body Recode is GST-registered. Fees quoted are ex-GST. Please confirm GST + withholding treatment for the three fee lines.

8. **Force majeure, assignment, entire agreement, notices**. Standard boilerplate but review as usual.

9. **Governing law + jurisdiction**. Queensland Courts. Confirm any conflicts.

10. **Execution formalities**. Should the IP Licence be executed as a deed (recommended, gives 12-year limitation period) or by simple contract?

### Low-priority

11. Wordsmithing throughout — read for clarity and internal consistency.

## What is deliberately out of scope for v0.1

- **The Powered Partner tier** (Tiers 1 + 2 in `OFFER_ARCHITECTURE.md`) — referral + funnel-attribution partners get a lighter one-page terms document. Not drafted yet.
- **Method-injection ("Mode B")** — reserved for post-Founding-Ten. All Collective Partners run Doctrine Mode A (BR doctrine branded as theirs). No IP contribution from partner in Mode A, so no reverse licence needed.
- **Reseller / white-label of the platform to third parties** — expressly prohibited in the Licence.

## Timelines

- Legal review by legal reviewer: ideal turnaround 5 business days
- Kade to review redline: 2 business days
- Final v1.0: within 2 weeks of legal receiving these drafts
- First partner ready to sign: no committed date but we have a pilot lined up who could go as early as August 2026

## Contact

**Kade Dunstone**
Founder, Body Recode
kade@bodyrecode.au
bodyrecode.au
