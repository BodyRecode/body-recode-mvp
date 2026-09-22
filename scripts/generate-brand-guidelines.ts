/**
 * The Body Recode brand guidelines, as a document.
 *
 * Run: npm run brand:guidelines
 *
 * 22 September 2026. Built to sit where the 2025 guideline sat, in the same
 * shape and to the same job, with the identity that replaced it. Kade: the
 * helix goes, and he wanted a document like the original rather than a rewrite
 * of the written brand book, which covers different ground.
 *
 * WHAT CHANGED FROM THE 2025 GUIDELINE, and why each one.
 *
 * The helix is gone. DNA means genetics, and Body Recode reads what somebody
 * reports about their sleep, stress, training and storage. It has never read a
 * gene. That was a claim sitting on the first thing anybody saw.
 *
 * Electric Teal is restored to the job the original gave it. The 2025 document
 * specified it as the primary "preferred for digital and accent use", and the
 * product had zero uses of it and 2,614 of Signal Blue, which that document
 * reserved for print. The two primaries had been swapped for a year.
 *
 * Montserrat stays. It was already specified and is already what the documents
 * are set in.
 *
 * Generated rather than designed by hand, so a change to the mark rebuilds the
 * document that describes it, instead of the two drifting apart.
 */

import { execFileSync } from 'child_process'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const OUT = join(homedir(), 'Dropbox', '01_BODY_RECODE', '00_Project_HQ', 'Logo', 'Brand Guide')
const FONT = join(homedir(), 'Dropbox', '01_BODY_RECODE', '06_SAAS_PLATFORM_BUILD', '_pdf_build', 'Montserrat.ttf')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// GRAPHITE AND PAPER. There is no brand colour, and that is the decision.
// This document is itself the argument: colour appears on exactly one page,
// 3.0, and every colour on it is carrying meaning rather than identity.
const INK = '#0F1115'      // graphite
const PAPER = '#FAFAF8'    // off-white, very slightly warm
const WHITE = '#FFFFFF'
const GREY = '#6E747D'
const WASH = '#F2F2EF'
const LINE = '#E4E4E0'
// The meaning colours, shown on 3.0 and used nowhere else in this document.
// Chosen by Kade on 22 Sep 2026 from six rendered directions, each shown on
// paper, on graphite, simulated for red-green colour blindness, and in the list
// a coach actually scans. The deep, saturated set.
const REM = '#B06E1F'
const OPT = '#2F6F7C'
const POST = '#2B5E45'
const ATT = '#8F2D2D'

const BOX = 200, RADIUS = 50, MARK = 108, WORD = 132, GAP = 58

function textToPath(text: string, size: number, weight: number, tracking: number) {
  const py = `
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
font = instantiateVariableFont(TTFont(${JSON.stringify(FONT)}), {"wght": ${weight}})
upem = font["head"].unitsPerEm
gs = font.getGlyphSet(); cmap = font.getBestCmap(); scale = ${size}/upem
pen = SVGPathPen(gs); x = 0.0
for ch in ${JSON.stringify(text)}:
    n = cmap.get(ord(ch))
    if n is None:
        x += ${size}*0.4; continue
    g = gs[n]
    g.draw(TransformPen(pen, Transform(scale,0,0,-scale,x,0)))
    x += g.width*scale + ${tracking}
print(json.dumps({"d": pen.getCommands(), "width": x - ${tracking}}))
`
  return JSON.parse(execFileSync('python3', ['-c', py], { encoding: 'utf8', maxBuffer: 32e6 }).trim()) as { d: string; width: number }
}

const BR = textToPath('BR', MARK, 800, -MARK * 0.04)
const WM = textToPath('Body Recode', WORD, 700, -WORD * 0.025)

function mark(sq: string, letter: string, size = 80) {
  const s = size / BOX
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${BOX} ${BOX}" style="display:block">
<rect width="${BOX}" height="${BOX}" rx="${RADIUS}" fill="${sq}"/>
<path transform="translate(${((BOX - BR.width) / 2).toFixed(1)} ${(BOX / 2 + MARK * 0.36).toFixed(1)})" d="${BR.d}" fill="${letter}"/></svg>`.replace('viewBox', `data-s="${s}" viewBox`)
}

function lock(sq: string, letter: string, word: string, h = 60) {
  const w = BOX + GAP + WM.width
  return `<svg height="${h}" viewBox="0 0 ${w.toFixed(1)} ${BOX}" style="display:block">
<rect width="${BOX}" height="${BOX}" rx="${RADIUS}" fill="${sq}"/>
<path transform="translate(${((BOX - BR.width) / 2).toFixed(1)} ${(BOX / 2 + MARK * 0.36).toFixed(1)})" d="${BR.d}" fill="${letter}"/>
<path transform="translate(${BOX + GAP} ${(BOX / 2 + WORD * 0.36).toFixed(1)})" d="${WM.d}" fill="${word}"/></svg>`
}

function wordOnly(fill: string, h = 40) {
  const hh = WORD * 1.34
  return `<svg height="${h}" viewBox="0 0 ${WM.width.toFixed(1)} ${hh.toFixed(1)}" style="display:block">
<path transform="translate(0 ${(hh * 0.78).toFixed(1)})" d="${WM.d}" fill="${fill}"/></svg>`
}

/* ── Page furniture ──────────────────────────────────────────────────── */
let pageNo = 0
function page(inner: string, opts: { bar?: boolean; side?: string } = {}) {
  pageNo++
  const bar = opts.bar === false ? '' : `<div class="bar"></div>`
  const side = opts.side === undefined
    ? `<div class="side">BODY RECODE<br>BRAND GUIDELINES</div>` : opts.side
  return `<section class="page">${bar}${side}<div class="body">${inner}</div><div class="pn">${pageNo}</div></section>`
}

function head(num: string, title: string, intro?: string) {
  return `<div class="hd"><div class="num">${num}</div><h2>${title}</h2></div>${intro ? `<p class="lede">${intro}</p>` : ''}`
}

/* ── Pages ───────────────────────────────────────────────────────────── */
const pages: string[] = []

// Cover
pageNo = -1
pages.push(`<section class="page cover"><div class="bar"></div><div class="coverwrap">
  <div class="ast">✳</div>
  <div style="margin-bottom:34px">${lock(INK, PAPER, INK, 62)}</div>
  <h1>BRAND<br>GUIDELINES</h1>
  <p class="cv">Version 2.0 &middot; September 2026</p>
</div></section>`)
pageNo = 0

pages.push(page(`${head('', 'WHAT THESE<br>GUIDELINES<br>ARE FOR')}
<div class="two">
  <div></div>
  <div>
    <p>This document covers the use and application of the <b>Body Recode</b> identity, so that it stays consistent wherever it appears.</p>
    <p>It replaces the 2025 guideline. The structure is the same because the structure was right. What changed is the mark and the palette.</p>
    <p><b>The helix has been retired.</b> DNA means genetics. Body Recode reads what somebody reports about their sleep, stress, training and storage. It has never read a gene, and a claim we do not make should not sit on the first thing anybody sees.</p>
    <p><b>There is no brand colour, and that is the decision rather than an omission.</b> The identity is graphite and paper. Colour is reserved for the things in this product that mean something, which is somebody's readiness and anything needing attention. Nothing is coloured to look nice, and that is exactly what makes a coloured thing read when it does appear.</p>
    <p>Voice, positioning and the line between Body Recode and Performance Coaching live in the Brand Book, which sits beside this document rather than inside it.</p>
  </div>
</div>`))

pages.push(page(`<h2 class="toc-h">TABLE OF CONTENTS</h2>
<div class="toc">
  <div class="tg">
    <div class="tr"><span>1.0</span><span>Brand Mark</span><span>03</span></div>
    <div class="tr"><span>1.1</span><span>The Key Elements</span><span>04</span></div>
    <div class="tr"><span>1.2</span><span>Structure &amp; Configuration</span><span>05</span></div>
    <div class="tr"><span>1.3</span><span>Clear Space</span><span>06</span></div>
    <div class="tr"><span>1.4</span><span>Minimum Size</span><span>07</span></div>
    <div class="tr"><span>1.5</span><span>Incorrect Usage</span><span>08</span></div>
    <div class="tr"><span>1.6</span><span>Alternative Usage</span><span>09</span></div>
  </div>
  <div class="tg">
    <div class="tr"><span>2.0</span><span>Typefaces &amp; Typesetting</span><span>10</span></div>
    <div class="tr"><span>2.1</span><span>Typography in Practice</span><span>11</span></div>
  </div>
  <div class="tg">
    <div class="tr"><span>3.0</span><span>Colour Palette &amp; Codes</span><span>12</span></div>
    <div class="tr"><span>3.1</span><span>Every Colour, and Where It Goes</span><span>13</span></div>
    <div class="tr"><span>3.2</span><span>Logo on a Coloured Ground</span><span>14</span></div>
    <div class="tr"><span>3.3</span><span>Positive &amp; Negative Space</span><span>15</span></div>
  </div>
  <div class="tg">
    <div class="tr"><span>4.0</span><span>Imagery</span><span>16</span></div>
  </div>
</div>`, { bar: false, side: '' }))

pages.push(page(`${head('1.0', 'BRAND MARK', 'The lockup is treated as one unit. The symbol may be used on its own. The logotype may not: the name without the symbol is just type.')}
<div class="panel center"><div style="display:flex;align-items:center;gap:74px">
  ${mark(INK, PAPER, 132)}
  <div style="width:1px;height:132px;background:#D6DAE0"></div>
  <div style="display:grid;gap:28px">${lock(INK, PAPER, INK, 54)}${lock(PAPER, INK, INK, 40)}</div>
</div></div>`))

pages.push(page(`${head('1.1', 'THE KEY ELEMENTS', 'Two elements. The symbol, and the logotype. Applied consistently they make one recognisable mark.')}
<div class="panel center" style="gap:0">
  <div style="display:flex;align-items:center;gap:26px">
    <div style="text-align:right"><div class="lbl">Symbol</div></div>
    <div style="width:44px;height:1px;background:#C8CDD4"></div>
    ${lock(INK, PAPER, INK, 78)}
  </div>
  <div style="margin-left:280px;margin-top:10px"><div style="height:16px;border-left:1px solid #C8CDD4;margin-left:190px"></div><div class="lbl" style="margin-left:120px">Logotype</div></div>
</div>`))

pages.push(page(`${head('1.2', 'STRUCTURE &amp;<br>CONFIGURATION', 'Three approved configurations. Choose the one that fits the space. Never rebuild, respace or redraw them.')}
<div class="grid3">
  <div class="cell"><div class="cap">Symbol only</div><div class="ctr">${mark(INK, PAPER, 92)}</div></div>
  <div class="cell"><div class="cap">Horizontal lockup</div><div class="ctr">${lock(INK, PAPER, INK, 44)}</div></div>
  <div class="cell"><div class="cap">Logotype (with symbol only)</div><div class="ctr">${wordOnly(INK, 30)}</div></div>
</div>
<p class="note">The horizontal lockup is the default. Use the symbol alone where the name is already present, such as an app icon, a profile picture or a favicon.</p>`))

pages.push(page(`${head('1.3', 'CLEAR SPACE', 'Keep the width of the symbol clear on every side. Nothing sits inside it: no text, no rule, no edge of a photograph.')}
<div class="panel center">
  <div style="position:relative;padding:74px;outline:1px dashed #B9BDC4;outline-offset:0">
    ${lock(INK, PAPER, INK, 56)}
    <div class="xdim" style="top:0;left:0;right:0;height:74px"><span>x</span></div>
    <div class="xdim" style="bottom:0;left:0;right:0;height:74px"><span>x</span></div>
  </div>
</div>
<p class="note"><b>x</b> equals the width of the symbol. It scales with the logo, so the rule holds at any size.</p>`))

pages.push(page(`${head('1.4', 'MINIMUM SIZE', 'Below these the logotype stops being legible. Use the symbol alone instead, which holds down to 16 pixels.')}
<div class="two">
  <div class="panel">
    <div class="cap">PRINT</div>
    <div style="display:flex;align-items:flex-end;gap:44px;margin-top:22px">
      <div>${mark(INK, PAPER, 30)}<div class="dim">Symbol<br>8 mm</div></div>
      <div>${lock(INK, PAPER, INK, 20)}<div class="dim">Lockup<br>42 mm wide</div></div>
    </div>
  </div>
  <div class="panel">
    <div class="cap">ON SCREEN</div>
    <div style="display:flex;align-items:flex-end;gap:44px;margin-top:22px">
      <div>${mark(INK, PAPER, 32)}<div class="dim">Symbol<br>32 px</div></div>
      <div>${lock(INK, PAPER, INK, 22)}<div class="dim">Lockup<br>160 px wide</div></div>
    </div>
  </div>
</div>`))

const dont = (label: string, inner: string) => `<div class="cell"><div class="ctr dontbox">${inner}</div><div class="cap2">${label}</div></div>`
pages.push(page(`${head('1.5', 'INCORRECT USAGE', 'The mark is one shape. Anything that changes that shape weakens it, and most of these happen by accident in a hurry.')}
<div class="grid3 tight">
  ${dont('Do not rotate it.', `<div style="transform:rotate(-12deg)">${lock(INK, PAPER, INK, 30)}</div>`)}
  ${dont('Do not stretch it.', `<div style="transform:scaleX(1.5)">${lock(INK, PAPER, INK, 21)}</div>`)}
  ${dont('Do not recolour it.', lock('#C86AD9', WHITE, '#C86AD9', 30))}
  ${dont('Do not fade it.', `<div style="opacity:.35">${lock(INK, PAPER, INK, 30)}</div>`)}
  ${dont('Do not outline or shadow it.', `<div style="filter:drop-shadow(0 4px 6px rgba(0,0,0,.45))">${lock(INK, PAPER, INK, 30)}</div>`)}
  ${dont('Do not separate the elements.', `<div style="display:flex;gap:46px;align-items:center">${mark(INK, PAPER, 30)}${wordOnly(INK, 18)}</div>`)}
</div>`))

pages.push(page(`${head('1.6', 'ALTERNATIVE USAGE', 'For a profile picture, an app icon or a favicon, use the symbol in a container. It holds contrast at small sizes where the lockup does not.')}
<div class="grid3">
  <div class="cell"><div class="ctr" style="background:${INK};border-radius:18px;padding:30px">${mark(PAPER, INK, 74)}</div><div class="cap2">Profile picture, the default</div></div>
  <div class="cell"><div class="ctr" style="background:${WASH};border-radius:18px;padding:30px">${mark(INK, PAPER, 74)}</div><div class="cap2">On a pale ground</div></div>
  <div class="cell"><div class="ctr" style="background:${WHITE};border-radius:18px;padding:30px;border:1px solid ${LINE}">${mark(INK, PAPER, 74)}</div><div class="cap2">On white</div></div>
</div>
<p class="note">Ready-made files for every platform, already at the right size, are in <b>01_BRAND_ASSETS / social</b>.</p>`))

pages.push(page(`${head('2.0', 'TYPEFACES &amp;<br>TYPESETTING', 'Montserrat throughout. It is what the logotype is drawn in, so everything set in it belongs to the same family as the mark.')}
<div class="panel" style="background:${INK};color:${WHITE}">
  <div class="tfrow"><div class="tf" style="font-weight:400">Aa</div><div><div class="tfn">Montserrat Regular</div><div class="tfs">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</div><div class="tfu">Body text. Everything somebody reads at length.</div></div></div>
  <div class="tfrow"><div class="tf" style="font-weight:700">Aa</div><div><div class="tfn">Montserrat Bold</div><div class="tfs">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</div><div class="tfu">Headings, subheadings, navigation, buttons.</div></div></div>
  <div class="tfrow" style="border-bottom:0"><div class="tf" style="font-weight:800">Aa</div><div><div class="tfn">Montserrat ExtraBold</div><div class="tfs">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789</div><div class="tfu">The logotype, and display headings only. Never body text.</div></div></div>
</div>`))

pages.push(page(`${head('2.1', 'TYPOGRAPHY IN PRACTICE', 'Weight and spacing carry the hierarchy, not size. Headings sit tight at minus two per cent tracking. Numbers are always tabular so a column lines up.')}
<div class="two">
  <div class="panel">
    <div style="margin-bottom:16px">${lock(INK, PAPER, INK, 26)}</div>
    <div class="ex-h">Where you are right now</div>
    <div class="ex-b">Your readiness is Remediation, which means the system is settling rather than building. It is a sensible allocation of resources, not a fault.</div>
    <div class="ex-n">298 <span>questions read</span></div>
  </div>
  <div class="panel">
    <div class="ex-eyebrow">SECTION LABEL</div>
    <div class="ex-h2">A heading, set in Bold</div>
    <div class="ex-b">Body text is Regular. It is set at a comfortable measure, because the product is read rather than scanned.</div>
    <div class="ex-b" style="color:${GREY}">A quieter line uses grey, never a lighter weight.</div>
  </div>
</div>`))

/** A compact row for the full system page: swatch, name, code, where it goes. */
const row = (name: string, hex: string, use: string) =>
  `<div class="crow"><span class="cchip" style="background:${hex};${['#FFFFFF','#FAFAF8','#F2F2EF','#EDEDEA','#FBF1F1'].includes(hex) ? 'box-shadow:inset 0 0 0 1px #DCDCD7' : ''}"></span><span class="cn">${name}</span><span class="ch">${hex}</span><span class="cu">${use}</span></div>`
const grp = (title: string, rows: string) => `<div class="cgrp"><div class="cap">${title}</div>${rows}</div>`

const sw = (name: string, hex: string, role: string, dark = false) =>
  `<div class="sw"><div class="chip" style="background:${hex};${hex === WHITE ? 'border:1px solid #E1E4E8' : ''}"></div>
  <div class="swn">${name}</div><div class="swh">${hex}</div><div class="swr">${role}</div></div>`
pages.push(page(`${head('3.0', 'COLOUR PALETTE &amp;<br>COLOUR CODES', 'Two colours are the brand. The other four are not decoration, they are vocabulary.')}
<div class="two" style="gap:34px">
  <div>
    <div class="cap">THE IDENTITY</div>
    <div class="grid2" style="margin-top:14px">
      ${sw('Graphite', INK, 'The ground, the mark, the type, and every button.')}
      ${sw('Paper', PAPER, 'Backgrounds, and the mark reversed out. Off-white on purpose: pure white is the default nobody chose.')}
    </div>
  </div>
  <div>
    <div class="cap">MEANING, AND NOTHING ELSE</div>
    <div class="grid2" style="margin-top:14px">
      ${sw('Remediation', REM, 'Being asked for less, which is not the same as being in trouble.')}
      ${sw('Optimisation', OPT, 'Building.')}
      ${sw('Post-Optimisation', POST, 'Established.')}
      ${sw('Attention', ATT, 'A safety gate has fired. Not a fourth level: a different axis.')}
    </div>
  </div>
</div>
<p class="note"><b>Colour only appears where it means something.</b> Structure, type, surfaces, the mark and every button are graphite or paper. The moment a colour appears on a screen it is carrying information about a person. Nothing is coloured to look nice, which is what makes a coloured thing read. <b>Remediation is never red</b>, because red would tell a coach the opposite of what the reading says. <b>And Attention is not a fourth readiness level</b>, it is a different axis: it means a safety gate has fired, not that somebody is worse than Post-Optimisation.</p>`))

pages.push(page(`${head('3.1', 'EVERY COLOUR,<br>AND WHERE IT GOES', 'The complete set. If a colour is not on this page it is not in the product, and the way to add one is to add it here first with a reason.')}
<div class="two" style="gap:38px">
  <div>
    ${grp('GROUNDS, DARK', [
      row('Well', '#0B0D10', 'The deepest ground. A full-bleed panel another surface sits against.'),
      row('Base', '#0F1115', 'The default dark page.'),
      row('Surface', '#14171D', 'A panel on the base.'),
      row('Panel', '#1A1E26', 'A card on a surface.'),
      row('Panel raised', '#21262F', 'A card on a card. Rare, and usually a sign of too many layers.'),
      row('Line', '#2A2F39', 'Hairlines and card edges.'),
      row('Line soft', '#1F242C', 'A divider inside a card.'),
    ].join(''))}
    ${grp('INK, ON DARK', [
      row('Ink', '#FAFAF8', 'Headings and anything that must be read.'),
      row('Muted', '#C2C6CC', 'Body text.'),
      row('Soft', '#8A9099', 'Labels, captions, secondary lines.'),
      row('Faint', '#676D76', 'Legal, help text, the quietest thing on a screen.'),
    ].join(''))}
    ${grp('ACTION', [
      row('Action', '#0F1115', 'A button on paper. On dark it is Paper instead: the thing you press is the highest contrast object, not a colour.'),
      row('Hover', '#242932', 'Pointer over a graphite button.'),
      row('Pressed', '#000000', 'Held down.'),
      row('Quiet', '#F2F2EF', 'A secondary button, which is a surface rather than a fill.'),
    ].join(''))}
  </div>
  <div>
    ${grp('GROUNDS, PAPER', [
      row('Surface', '#FFFFFF', 'A field or a card sitting on paper.'),
      row('Paper', '#FAFAF8', 'The default light page.'),
      row('Raised', '#F2F2EF', 'A panel on paper.'),
      row('Line', '#E4E4E0', 'Hairlines and card edges.'),
      row('Line strong', '#DCDCD7', 'The edge of something a person types into, where the ordinary line is too quiet.'),
      row('Line soft', '#EDEDEA', 'A divider inside a card.'),
    ].join(''))}
    ${grp('INK, ON PAPER', [
      row('Ink', '#0F1115', 'Headings and anything that must be read.'),
      row('Muted', '#4A4F57', 'Body text and field labels.'),
      row('Soft', '#6E747D', 'Captions and secondary lines.'),
      row('Faint', '#9CA2AB', 'Placeholders and the quietest thing on a screen.'),
    ].join(''))}
    ${grp('MEANING. PAPER VALUE, THEN DARK VALUE', [
      row('Remediation', '#B06E1F', 'Being asked for less. On dark: #E0A254'),
      row('Optimisation', '#2F6F7C', 'Building. On dark: #71ADB8'),
      row('Post-Optimisation', '#2B5E45', 'Established. On dark: #6FA98B'),
      row('Attention', '#8F2D2D', 'A gate has fired. A different axis, not a fourth level. On dark: #D4817E'),
      row('No reading', '#9CA2AB', 'Nothing read yet. Absence, not a verdict.'),
      row('Attention wash', '#FBF1F1', 'An error panel on paper, edged #E8C9C9. The only tinted surfaces in the product.'),
    ].join(''))}
  </div>
</div>
<p class="note" style="margin-bottom:10px"><b>The four meaning colours are the only part of this palette chosen rather than inherited.</b> Six directions were rendered on paper, on graphite, simulated for red-green colour blindness, and shown in the list a coach actually scans, before this one was picked. <b>One thing to watch:</b> under red-green colour blindness Remediation and Attention are both olive and separate mainly by lightness. The level is always named in words beside the dot, so nothing rests on colour alone, but on a list that is scanned rather than read those two are the pair to keep an eye on.</p>
<p class="note"><b>Retired, and being removed surface by surface:</b> Signal Blue #1B6DFC and Electric Teal #10E1C2, the two 2025 primaries. They remain in the palette file marked as legacy so the sweep is deliberate rather than a build breaking at an awkward moment. <b>Neither is the brand any more and neither goes on anything new.</b></p>`))

const bg = (c: string, light = true) =>
  `<div class="bgcell" style="background:${c}">${light ? lock(PAPER, c, PAPER, 26) : lock(INK, c, INK, 26)}</div>`
pages.push(page(`${head('3.2', 'LOGO ON A<br>COLOURED GROUND', 'It happens: a partner deck, a sponsor board, somebody else\u2019s brand. Reverse the mark out in paper and leave it alone. Never recolour the square to match.')}
<div class="grid3 tight">
  ${bg(INK)} ${bg('#1F3A5F')} ${bg('#0B7A66')}
  ${bg('#7A3FA8')} ${bg('#B0341F')} ${bg('#2B2B2B')}
</div>
<p class="note">Body Recode does not put its own logo on a colour. These exist so that when somebody else does, it is still the same mark.</p>`))

pages.push(page(`${head('3.3', 'POSITIVE &amp;<br>NEGATIVE SPACE', 'Positive on a pale ground, negative on graphite. The square inverts with the ground so the letters stay a shape rather than a hole. It is one mark, not two.')}
<div class="two">
  <div class="panel center" style="background:${PAPER};border:1px solid ${LINE}">${lock(INK, PAPER, INK, 50)}</div>
  <div class="panel center" style="background:${INK}">${lock(PAPER, INK, PAPER, 50)}</div>
</div>`))

pages.push(page(`${head('4.0', 'IMAGERY', 'Photographs of real people, doing ordinary things, lit plainly. No clinical renders, no gym heroics, no stock triumph.')}
<div class="two">
  <div>
    <div class="cap">THE TONE</div>
    <ul class="ul"><li>Considered</li><li>Honest</li><li>Unhurried</li><li>Capable</li><li>Ordinary, in a good way</li></ul>
  </div>
  <div>
    <div class="cap">NOT THIS</div>
    <ul class="ul"><li><b>No glowing anatomy renders.</b> They imply we see inside somebody. We read what they tell us.</li><li><b>No gym intensity.</b> Grimacing under a barbell is the market we are not in.</li><li><b>No before and afters.</b> The product is an explanation, not a transformation.</li><li><b>Not only women.</b> Most clients are women. Not all of them are.</li></ul>
  </div>
</div>
<p class="note">The 2025 guideline showed a red anatomical render and two men straining in a gym. Both are the opposite of this.</p>`))

pages.push(`<section class="page cover end"><div class="bar"></div><div class="coverwrap">
  <div class="ast">✳</div>
  <div>${lock(INK, PAPER, INK, 56)}</div>
  <p class="cv" style="margin-top:30px">Files: <b>01_BRAND_ASSETS</b><br>Voice and positioning: <b>00_PLAYBOOK / 02_BRAND_BOOK</b></p>
</div></section>`)

/* ── Document ────────────────────────────────────────────────────────── */
const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@font-face{font-family:Mont;src:url("file://${FONT}");font-weight:100 900;}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Mont,-apple-system,sans-serif;color:${INK};-webkit-font-smoothing:antialiased}
.page{width:1100px;height:850px;position:relative;background:${WHITE};page-break-after:always;overflow:hidden}
.bar{position:absolute;left:0;top:0;bottom:0;width:70px;background:${INK}}
.side{position:absolute;left:96px;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;font-size:9.5px;letter-spacing:.24em;color:#9AA1AA;line-height:1.9}
.body{position:absolute;left:170px;right:64px;top:74px;bottom:74px}
.pn{position:absolute;right:52px;bottom:40px;font-size:11px;color:#A8AEB6}
.cover .coverwrap{position:absolute;left:170px;top:200px}
.cover.end .coverwrap{top:255px}
.ast{font-size:40px;color:${GREY};margin-bottom:120px;line-height:1}
h1{font-size:62px;font-weight:800;letter-spacing:-.02em;line-height:1.02;color:${INK}}
.cv{margin-top:20px;font-size:12.5px;color:${GREY};letter-spacing:.04em;line-height:1.8}
.hd{display:flex;align-items:flex-start;gap:26px;margin-bottom:22px}
.num{font-size:64px;font-weight:800;color:${INK};line-height:.82;letter-spacing:-.03em}
h2{font-size:23px;font-weight:800;letter-spacing:.01em;line-height:1.22;padding-top:6px}
.lede{font-size:13.5px;line-height:1.72;color:${GREY};max-width:660px;margin-bottom:26px}
.toc-h{font-size:34px;font-weight:400;letter-spacing:.01em;margin-bottom:34px}
.toc{max-width:640px}
.tg{border-top:1px solid #DFE3E8;padding:14px 0}
.tr{display:grid;grid-template-columns:54px 1fr 40px;font-size:12.5px;padding:5px 0;color:${INK}}
.tr span:last-child{text-align:right;color:#A8AEB6}
.panel{background:${WASH};border-radius:14px;padding:30px}
.center{display:flex;align-items:center;justify-content:center;min-height:330px;flex-direction:column;gap:18px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.two p{font-size:13.5px;line-height:1.75;color:${GREY};margin-bottom:14px}
.two p b{color:${INK}}
.grid2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.cgrp{margin-bottom:16px}
.cgrp .cap{margin-bottom:6px}
.crow{display:grid;grid-template-columns:14px 74px 62px 1fr;align-items:center;gap:8px;padding:3.5px 0;font-size:9.5px;line-height:1.35}
.cchip{width:14px;height:14px;border-radius:4px;display:inline-block}
.cn{font-weight:700;color:#0F1115}
.ch{color:#8A929B;letter-spacing:.01em}
.cu{color:#6E747D}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.grid3.tight{gap:14px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.cell{background:${WASH};border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:12px}
.ctr{flex:1;display:flex;align-items:center;justify-content:center;min-height:110px}
.dontbox{background:${WHITE};border-radius:8px;padding:14px;overflow:hidden}
.cap{font-size:9.5px;letter-spacing:.14em;color:#8A929B;font-weight:700}
.cap2{font-size:11.5px;color:${GREY};line-height:1.5}
.lbl{font-size:11px;letter-spacing:.2em;color:#8A929B}
.note{margin-top:20px;font-size:12px;line-height:1.7;color:${GREY}}
.note b{color:${INK}}
.dim{font-size:10.5px;color:#8A929B;margin-top:10px;line-height:1.55}
.xdim{position:absolute;display:flex;align-items:center;justify-content:center}
.xdim span{font-size:10px;color:${GREY};letter-spacing:.1em}
.tfrow{display:grid;grid-template-columns:96px 1fr;gap:26px;padding:20px 0;border-bottom:1px solid #2E3339;align-items:start}
.tf{font-size:44px;line-height:1}
.tfn{font-size:13px;font-weight:700;margin-bottom:7px}
.tfs{font-size:10.5px;color:#9AA1AA;line-height:1.75;letter-spacing:.02em}
.tfu{font-size:11px;color:${GREY};margin-top:8px}
.ex-h{font-size:17px;font-weight:700;letter-spacing:-.02em;margin-bottom:9px}
.ex-h2{font-size:17px;font-weight:700;letter-spacing:-.02em;margin:6px 0 9px}
.ex-b{font-size:12.5px;line-height:1.72;color:${GREY};margin-bottom:10px}
.ex-n{font-size:30px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;margin-top:14px}
.ex-n span{font-size:11px;font-weight:400;color:${GREY};letter-spacing:0}
.ex-eyebrow{font-size:9.5px;letter-spacing:.14em;color:${GREY};font-weight:700}
.sw{display:flex;flex-direction:column}
.chip{height:150px;border-radius:12px;margin-bottom:14px}
.swn{font-size:13px;font-weight:700}
.swh{font-size:11px;color:#8A929B;margin:3px 0 8px;letter-spacing:.04em}
.swr{font-size:11.5px;line-height:1.6;color:${GREY}}
.bgcell{border-radius:10px;height:112px;display:flex;align-items:center;justify-content:center}
.ul{list-style:none;font-size:12.5px;line-height:1.85;color:${GREY}}
.ul li{padding-left:16px;position:relative;margin-bottom:9px}
.ul li:before{content:"";position:absolute;left:0;top:9px;width:5px;height:5px;border-radius:50%;background:${INK}}
.ul li b{color:${INK}}
@page{size:1100px 850px;margin:0}
</style></head><body>${pages.join('')}</body></html>`

mkdirSync(OUT, { recursive: true })
const htmlPath = join(OUT, '_guidelines.html')
writeFileSync(htmlPath, html)
const pdfPath = join(OUT, 'Body_Recode_Brand_Guidelines_v2.0.pdf')
execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, htmlPath], { stdio: 'ignore' })
rmSync(htmlPath, { force: true })
console.log(`\n${pages.length} pages written to\n${pdfPath}\n`)
