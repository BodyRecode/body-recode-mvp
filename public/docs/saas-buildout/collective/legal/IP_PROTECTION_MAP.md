# IP Protection Map

**Body Recode — what to register, what's automatic, what to keep secret**
**v0.1 — For the IP lawyer to confirm. Not legal advice; AU-general.**

The short version: **only one thing is actively registered — trade marks.** Everything else is either automatic (copyright) or protected by secrecy + contracts (trade secrets). The engine should **not** be patented.

Context: IP is owned by **Kade Robert Dunstone personally** (sole trader t/a Body Recode, ABN 90 535 525 708) and licensed down to the operating company / partners. **Trade marks not yet filed — the process has not started.** See the package cover note + `DECISIONS_NEEDED.md` (§2.3 lists what to file).

---

## The five buckets

| IP type | What it covers here | Register? | Action |
|---------|--------------------|-----------|--------|
| **Copyright** | Source code, doctrine documents, prompts (as written expression), website + PDF + email content, UI and graphics | **No — automatic** | No register exists in Australia. Protection is automatic on creation. Keep dated records of authorship + apply © notices. |
| **Trade marks** | "Body Recode" wordmark, BR logo, "Powered by Body Recode" lockup, and any product names to protect | **YES — the one active registration** | **Not started.** File these — marks + classes below / in `DECISIONS_NEEDED` §2.3. |
| **Trade secrets** | The engine algorithms, the Doctrine (rules, safety floors, decision trees, banned-term lists), prompt libraries | **No — never register** | Protect by secrecy + contracts. Already covered by the NDA + the Deed's perpetual confidentiality on trade secrets. Maintain need-to-know internal access. |
| **Patents** | Inventions | **No — deliberately avoid** | AU is hostile to software/algorithm patents, and patenting forces public disclosure that would destroy trade-secret protection. Keep the engine secret instead. |
| **Registered design** | The visual appearance of the product | Optional — likely skip | Rarely worth it for a web app. Revisit only if a distinctive UI needs protecting. |

---

## The two priorities

**1. Trade marks — the only active registration.**
Copyright already protects the code and content for free, but it does **not** protect the brand name. Only a registered trade mark stops a competitor calling their platform "Body Recode."
- **Classes to file:** **9** (software/apps), **42** (SaaS — core), **41** (coaching/education/fitness — core), consider **44** (health/nutrition/wellness). IP lawyer to confirm the exact spread.
- **What to file:** "Body Recode" **word mark first** (#1), then the **logo**; "Powered by Body Recode" is usually covered by the word mark. **Decision:** also protect product terms (e.g. "Fat Map")? — flag which.
- **How:** let the IP lawyer run a **clearance search** before filing (cheaper than a rejected application). Rough cost ~$250–330 per class per mark.

**2. Engine + Doctrine = trade secret, not patent.**
This is the secret sauce and its protection is already built: the **Mutual NDA** (discovery stage) + the **Partner IP Sublicence Deed** (perpetual confidentiality on trade secrets, no-reverse-engineer, no-training-corpus). Do **not** patent — it would publish the doctrine and is unlikely to be granted in AU anyway.

---

## Two gaps to close (flag for the lawyer)

- **Contractor IP assignment.** In Australia, a **contractor** (not employee) owns the copyright in what they create **by default — not the hirer** — unless there's a signed written assignment. If anyone other than Kade has touched the code, prompts, brand assets, or content, get **signed IP assignments** from them. Without this, the warranty to partners that "Body Recode owns the IP" (Deed cl 8.1) has a hole. → **A `CONTRACTOR_IP_ASSIGNMENT_v0.1` deed is now in the pack to close this** — each contributor signs one (covers past + future work). *(Action: list who has touched the code/content and get each to sign.)*
- **Business name.** Confirm "Body Recode" is an **ASIC-registered business name** (required to trade under it as a sole trader). Separate from a trade mark; a related box, not IP protection.

---

## Questions for the IP lawyer

1. Confirm trade-mark **classes** and the **spread of names** (wordmark, logo, "Powered by Body Recode", product terms).
2. Confirm the **no-patent / trade-secret** strategy for the engine + Doctrine.
3. Review **contractor IP assignment** status — is there exposure, and what assignment wording closes it?
4. Confirm **copyright ownership chain** flows cleanly to Kade personally (then licensed down), given the personal-ownership / licence-to-company structure.
5. Any **registered design** worth pursuing for the product UI? (Assume no unless flagged.)

---

**END — IP PROTECTION MAP v0.1**

Related: `COVER_NOTE_TO_LEGAL.md`, `DECISIONS_NEEDED.md`, `PARTNER_IP_SUBLICENCE_DEED_v0.1.md`, `MUTUAL_NDA_v0.1.md`
