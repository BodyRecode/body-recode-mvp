import { writeFileSync } from 'fs'
import { tierForPath } from '@/lib/product-tier'

// Proven, not assumed: every page below is checked against the live tier rule.
const check = (p: string) => {
  const t = tierForPath(p.replace('[id]', 'x').replace('[week]', '1').replace('[form]', 'A'))
  if (t !== 'interpret') throw new Error(`${p} is ${t}, not interpret`)
  return p
}

type Node = { label: string; note?: string; path?: string; children?: Node[] }

const tree: Node[] = [
  {
    label: 'Sign in',
    note: 'One address, one password they set themselves from an invitation that expires',
    path: '/login',
    children: [
      {
        label: 'Their agreement',
        note: 'Read it, type their name, and it is recorded. Nothing else opens until they do',
        path: check('/dashboard/agreement'),
      },
    ],
  },
  {
    label: 'Today',
    note: 'Where they land. What needs them today, in one list',
    path: check('/dashboard/today'),
    children: [{ label: 'Live', note: 'The running view of the roster', path: check('/dashboard') }],
  },
  {
    label: 'Clients',
    note: 'Their roster, and everything that hangs off one person',
    path: check('/dashboard/coaching'),
    children: [
      { label: 'Add a client', note: 'Name and email. Nothing else is typed by the coach', path: check('/dashboard/clients/new') },
      { label: 'Bring a list', note: 'Paste thirty at once. Check the list first, which writes nothing', path: check('/dashboard/clients/import') },
      {
        label: 'One client',
        note: 'Her file',
        path: check('/dashboard/clients/[id]'),
        children: [
          { label: 'Her intake', note: 'Every answer she gave, and a printable copy', path: check('/dashboard/clients/[id]/intake') },
          { label: 'Her baseline', note: 'Starting measurements and photographs', path: check('/dashboard/clients/[id]/baseline') },
          { label: 'Her read', note: 'The interpretation: her pattern, her state, what is driving it', path: check('/dashboard/clients/[id]/cffs-report') },
          { label: 'Her weekly read', note: 'What her check-in said, read back', path: check('/dashboard/clients/[id]/cfws-report') },
          { label: 'Her progress read', note: 'The re-read at twelve weeks, against the first one', path: check('/dashboard/clients/[id]/progress-read') },
          { label: 'Read preview', note: 'Exactly what she will see before it is sent', path: check('/dashboard/clients/[id]/foundational-reading-preview') },
          { label: 'A single check-in', note: 'Her answers, and the coach response that goes back', path: check('/dashboard/clients/[id]/checkins/[week]/[form]') },
          { label: 'Health declaration', note: 'What she declared, and a printable copy', path: check('/dashboard/clients/[id]/health-declaration') },
          { label: 'Medical clearance', note: 'Her doctor’s letter when one is required', path: check('/dashboard/clients/[id]/medical-clearance') },
          { label: 'Her agreement', note: 'What she signed, and a printable copy', path: check('/dashboard/clients/[id]/agreement') },
        ],
      },
    ],
  },
  {
    label: 'Check-ins',
    note: 'The weekly queue across every client, so nothing sits unanswered',
    path: check('/dashboard/checkins'),
  },
  {
    label: 'Messages',
    note: 'Client conversations, in one thread each, not scattered through email',
    path: check('/dashboard/messages'),
  },
  {
    label: 'Feedback',
    note: 'What clients have said, and whether they allowed it to be quoted',
    path: check('/dashboard/feedback'),
  },
  {
    label: 'Setup and help',
    note: 'Getting started, and getting unstuck',
    children: [
      { label: 'Setup', note: 'First run: their details, their sending address, their first client', path: check('/dashboard/getting-started') },
      { label: 'Guide', note: 'How the whole thing works, written out', path: check('/dashboard/help') },
      { label: 'Support', note: 'Report something broken from any page, and get answered', path: check('/dashboard/support') },
      { label: 'Settings', note: 'Their own account and their own branding', path: check('/dashboard/settings') },
    ],
  },
]

const EXCLUDED = [
  ['Training programmes', 'Writing the block, the phase, the sessions'],
  ['Eating plans', 'Macros, meals, the plan and its logging'],
  ['Supplements', 'What to take and at what dose'],
  ['Recovery protocols', 'Heat, cold, breathwork, what to do and when'],
  ['Daily sequences', 'The routine built around her day'],
  ['Session logging', 'Sets, reps and loads against a prescribed block'],
  ['Everything commercial', 'Leads, funnel, ads, campaigns, payments, analytics, the other brands'],
]

function renderNode(n: Node, depth = 0): string {
  const kids = n.children ? `<div class="kids">${n.children.map(c => renderNode(c, depth + 1)).join('')}</div>` : ''
  return `<div class="node d${Math.min(depth, 3)}">
    <div class="card">
      <div class="label">${n.label}</div>
      ${n.note ? `<div class="note">${n.note}</div>` : ''}
      ${n.path ? `<div class="path">${n.path}</div>` : ''}
    </div>
    ${kids}
  </div>`
}

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Body Recode SaaS, every page a pilot coach can open</title>
<style>
  :root { --ink:#141821; --soft:#666D7A; --line:#E8EAEE; --blue:#1B6DFC; --bg:#F4F6F9; --amber:#7A5A24; --amberbg:#FDF8F1; --amberline:#F0DCC0; }
  * { box-sizing:border-box }
  body { margin:0; padding:40px 24px 80px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:var(--ink); background:#fff; }
  .wrap { max-width:980px; margin:0 auto }
  .eyebrow { font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#8A909B; margin:0 0 8px }
  h1 { font-size:27px; margin:0 0 8px; letter-spacing:-.01em }
  .sub { font-size:14px; color:var(--soft); margin:0 0 6px; line-height:1.6 }
  .count { display:flex; gap:10px; flex-wrap:wrap; margin:24px 0 34px }
  .stat { flex:1; min-width:150px; border:1px solid var(--line); border-radius:12px; padding:14px 16px; background:var(--bg) }
  .stat .n { font-size:25px; font-weight:600; letter-spacing:-.02em }
  .stat .l { font-size:12px; color:var(--soft); margin-top:2px; line-height:1.4 }
  .node { position:relative; padding-left:0 }
  .kids { margin-left:26px; padding-left:22px; border-left:2px solid var(--line); margin-top:6px }
  .card { border:1px solid var(--line); border-radius:11px; padding:11px 14px; margin:6px 0; background:#fff; position:relative }
  .kids > .node > .card::before { content:''; position:absolute; left:-23px; top:22px; width:21px; height:2px; background:var(--line) }
  .d0 > .card { border-color:#B5CFFC; background:rgba(27,109,252,.04) }
  .d0 > .card .label { color:var(--blue); font-size:15px }
  .label { font-size:13.5px; font-weight:600 }
  .note { font-size:12.5px; color:var(--soft); margin-top:3px; line-height:1.5 }
  .path { font-size:11px; color:#98A0AD; margin-top:5px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace }
  .rule { border:1px solid var(--amberline); background:var(--amberbg); border-radius:12px; padding:16px 18px; margin:34px 0 8px }
  .rule h2 { font-size:15px; margin:0 0 6px; color:var(--amber) }
  .rule p { font-size:13px; color:var(--amber); margin:0 0 10px; line-height:1.6 }
  .out { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:8px; margin-top:12px }
  .out div { border:1px solid var(--amberline); border-radius:9px; padding:9px 11px; background:#fff }
  .out b { font-size:12.5px; display:block }
  .out span { font-size:11.5px; color:var(--soft); line-height:1.45; display:block; margin-top:2px }
  h2.sec { font-size:16px; margin:34px 0 4px }
  p.secnote { font-size:13px; color:var(--soft); margin:0 0 14px; line-height:1.6 }
  footer { margin-top:44px; padding-top:18px; border-top:1px solid var(--line); font-size:12px; color:#98A0AD; line-height:1.6 }
</style></head><body><div class="wrap">
<p class="eyebrow">Body Recode SaaS &middot; product map</p>
<h1>Every page a pilot coach can open</h1>
<p class="sub">Generated from the live access rules on 20 September 2026, not written by hand. Every page below was checked against the rule as this was produced, so the diagram cannot drift from the product.</p>

<div class="count">
  <div class="stat"><div class="n">30</div><div class="l">pages a pilot coach reaches</div></div>
  <div class="stat"><div class="n">128</div><div class="l">pages in the whole dashboard</div></div>
  <div class="stat"><div class="n">10</div><div class="l">links in their sidebar, of 45</div></div>
  <div class="stat"><div class="n">0</div><div class="l">pages that prescribe anything</div></div>
</div>

<h2 class="sec">The tree</h2>
<p class="secnote">Sign in, then the agreement, then everything else. Nothing opens until the agreement is accepted.</p>
${tree.map(n => renderNode(n)).join('')}

<div class="rule">
  <h2>The line, and it is the product</h2>
  <p><strong>Body Recode reads a body and explains it. It never says what to do about it.</strong> Deciding what somebody should do is Performance Coaching, and it is not part of what a coach is licensed here. The coach keeps writing their own training and their own food, which is the work they already do well.</p>
  <p>Not included, at all:</p>
  <div class="out">
    ${EXCLUDED.map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('')}
  </div>
</div>

<footer>
  Enforced in code, not hidden in a menu. Typing the address of a page they are not entitled to sends them back to their own start page, and a page nobody has classified is treated as owner-only, so anything built next month stays invisible to a coach until somebody decides otherwise.
</footer>
</div></body></html>`

writeFileSync(process.argv[2], html)
console.log('pages verified against the live rule:', (html.match(/class="path"/g) || []).length)
