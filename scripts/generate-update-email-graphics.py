#!/usr/bin/env python3
"""
Light UI-card mockups for the client product-update email.

Matches the ESTABLISHED email-image language from the 2026-05-12 broadcast
(render_images.py): literal, evocative mockups of the actual portal cards, NOT
abstract infographics. Same card grammar (accent bar + mono caps header,
"view as document" pill, numbered section label, body, toggle row) but ported
to the current LIGHT palette (Pure White card on a light backdrop, Signal Blue
#1B6DFC accent) since the platform flipped from dark+teal to light.

Cards (the two features that are NEW since the last email):
  email-health-markers.png    blood-panel markers card
  email-block-end-reading.png  the Block-End Trajectory Reading inline card

Outputs to:
  ~/body-recode-mvp/public/email/   (served at https://app.bodyrecode.au/email/*)
  ~/Public/                          (local copy per feedback_post_graphics)

W=1040 @ 2x retina; the email references them at width=480 (logical).
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W = 1040
SCALE = 2

# ---- Light palette (mirrors the live portal cards) ----
PAGE_BG    = (244, 246, 248)   # #F4F6F8 light backdrop so the white card reads
CARD_BG    = (255, 255, 255)   # #FFFFFF
SURFACE    = (247, 247, 247)   # #F7F7F7 range track
BORDER     = (229, 229, 229)   # #E5E5E5
BLUE       = (27, 109, 252)    # #1B6DFC
BLUE_DK    = (21, 89, 214)     # #1559D6
BLUE_BG    = (234, 241, 254)   # #EAF1FE
INK        = (26, 26, 26)      # #1A1A1A
TEXT_BODY  = (43, 43, 43)      # #2B2B2B
TEXT_DIM   = (107, 107, 107)   # #6B6B6B
TEXT_MUTED = (153, 153, 153)   # #999999
AMBER      = (183, 121, 31)    # #B7791F
AMBER_BG   = (251, 243, 227)   # #FBF3E3

OUT_DIRS = [
    Path.home() / 'body-recode-mvp' / 'public' / 'email',
    Path.home() / 'Public',
]
for d in OUT_DIRS:
    d.mkdir(parents=True, exist_ok=True)


def font(size, *, mono=False, bold=False):
    if mono:
        try:
            return ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', size * SCALE, index=1 if bold else 0)
        except Exception:
            return ImageFont.load_default()
    path = ('/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold
            else '/System/Library/Fonts/Supplemental/Arial.ttf')
    try:
        return ImageFont.truetype(path, size * SCALE)
    except Exception:
        return ImageFont.load_default()


def unicode_font(size):
    try:
        return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Unicode.ttf', size * SCALE)
    except Exception:
        return font(size)


F_HEADER_CAPS = font(11, mono=True, bold=True)
F_LABEL       = font(10, mono=True)
F_LABEL_B     = font(10, mono=True, bold=True)
F_SECTION     = font(11, mono=True, bold=True)
F_TITLE_LG    = font(18, bold=True)
F_TITLE_SM    = font(13, bold=True)
F_BODY        = font(13)
F_BODY_SM     = font(12)
F_TAG         = font(9, mono=True, bold=True)
F_CHEV        = unicode_font(12)


def rrect(d, xy, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = [c * SCALE for c in xy]
    d.rounded_rectangle((x0, y0, x1, y1), radius=radius * SCALE,
                        fill=fill, outline=outline, width=width * SCALE if outline else 0)


def text(d, xy, s, fnt, fill):
    d.text((xy[0] * SCALE, xy[1] * SCALE), s, font=fnt, fill=fill)


def measure(d, s, fnt):
    b = d.textbbox((0, 0), s, font=fnt)
    return ((b[2] - b[0]) // SCALE, (b[3] - b[1]) // SCALE)


def wrap(d, s, fnt, max_px):
    words, lines, cur = s.split(), [], []
    for w in words:
        if measure(d, ' '.join(cur + [w]), fnt)[0] <= max_px:
            cur.append(w)
        else:
            if cur:
                lines.append(' '.join(cur))
            cur = [w]
    if cur:
        lines.append(' '.join(cur))
    return lines


def accent_bar(d, x, y, w=28, h=3):
    rrect(d, (x, y, x + w, y + h), 2, fill=BLUE)


def new_canvas(height):
    img = Image.new('RGB', (W, height * SCALE), color=PAGE_BG)
    return img, ImageDraw.Draw(img, 'RGBA')


def hairline(d, x0, x1, y):
    d.line([(x0 * SCALE, y * SCALE), (x1 * SCALE, y * SCALE)], fill=BORDER, width=1 * SCALE)


def save(img, name):
    for dd in OUT_DIRS:
        img.save(dd / name, optimize=True)
    print(f'  ✓ {name}  ({img.size[0]}x{img.size[1]}px)')


# ============================================================
# Block-End Trajectory Reading card (mirrors trajectory-reading-inline.tsx)
# ============================================================
def render_block_end_reading():
    H = 392
    img, d = new_canvas(H)
    PAD = 28
    inner = W // SCALE - PAD
    rrect(d, (PAD, PAD, inner, H - PAD), 18, fill=CARD_BG, outline=BORDER)

    y = PAD + 22
    accent_bar(d, PAD + 22, y + 4)
    text(d, (PAD + 22 + 36, y), 'BLOCK-END READING', F_HEADER_CAPS, INK)

    doc = 'VIEW AS DOCUMENT'
    dw, _ = measure(d, doc, F_LABEL)
    pill_w = dw + 28
    pill_x = inner - 22 - pill_w
    rrect(d, (pill_x, y - 4, pill_x + pill_w, y + 18), 6, outline=BORDER)
    text(d, (pill_x + 14, y), doc, F_LABEL, TEXT_DIM)

    y += 34
    hairline(d, PAD + 22, inner - 22, y)

    y += 24
    text(d, (PAD + 22, y), '01 · Where this block started', F_SECTION, BLUE)

    y += 24
    body = ("You opened this block under-recovered, with energy that dipped through "
            "the middle of each week. Across the six weeks that steadied: the recovery "
            "between your sessions came back first, then your energy began to hold "
            "flatter day to day.")
    for line in wrap(d, body, F_BODY, inner - 22 - (PAD + 22)):
        text(d, (PAD + 22, y), line, F_BODY, TEXT_BODY)
        y += 25

    y = H - PAD - 36
    hairline(d, PAD + 22, inner - 22, y)
    label, chev = 'Read the full arc', '▾'
    lw, _ = measure(d, label, F_BODY_SM)
    cw, _ = measure(d, chev, F_CHEV)
    sx = (W // SCALE - (lw + 8 + cw)) // 2
    text(d, (sx, y + 12), label, F_BODY_SM, TEXT_DIM)
    text(d, (sx + lw + 8, y + 12), chev, F_CHEV, TEXT_DIM)

    save(img, 'email-block-end-reading.png')


# ============================================================
# Health Markers card (evocative of /portal/[token]/bloods + reading)
# ============================================================
def render_health_markers():
    H = 372
    img, d = new_canvas(H)
    PAD = 28
    inner = W // SCALE - PAD
    rrect(d, (PAD, PAD, inner, H - PAD), 18, fill=CARD_BG, outline=BORDER)

    y = PAD + 22
    accent_bar(d, PAD + 22, y + 4)
    text(d, (PAD + 22 + 36, y), 'HEALTH MARKERS', F_HEADER_CAPS, INK)

    tag = '12 MARKERS READ'
    tw, _ = measure(d, tag, F_LABEL)
    pill_w = tw + 28
    pill_x = inner - 22 - pill_w
    rrect(d, (pill_x, y - 4, pill_x + pill_w, y + 18), 6, outline=BORDER)
    text(d, (pill_x + 14, y), tag, F_LABEL, TEXT_DIM)

    y += 34
    hairline(d, PAD + 22, inner - 22, y)

    rows = [
        ('Ferritin',      0.46, 'in'),
        ('Vitamin D',     0.28, 'in'),
        ('Thyroid (TSH)', 0.84, 'flag'),
        ('HbA1c',         0.40, 'in'),
    ]
    label_x = PAD + 22
    bar_x0 = PAD + 220
    bar_x1 = inner - 168
    row_top = y + 30
    row_h = 64
    for i, (label, pos, status) in enumerate(rows):
        ry = row_top + row_h * i
        text(d, (label_x, ry - 7), label, F_TITLE_SM, INK)
        # range track
        rrect(d, (bar_x0, ry - 3, bar_x1, ry + 3), 3, fill=SURFACE)
        b0 = bar_x0 + (bar_x1 - bar_x0) * 0.18
        b1 = bar_x0 + (bar_x1 - bar_x0) * 0.80
        rrect(d, (b0, ry - 3, b1, ry + 3), 3, fill=BLUE_BG)
        dx = bar_x0 + (bar_x1 - bar_x0) * pos
        col = AMBER if status == 'flag' else BLUE
        ring = AMBER_BG if status == 'flag' else BLUE_BG
        d.ellipse(((dx - 11) * SCALE, (ry - 11) * SCALE, (dx + 11) * SCALE, (ry + 11) * SCALE), fill=ring)
        d.ellipse(((dx - 6) * SCALE, (ry - 6) * SCALE, (dx + 6) * SCALE, (ry + 6) * SCALE), fill=col)
        # status tag
        tl = 'REVIEW W/ GP' if status == 'flag' else 'IN RANGE'
        tcol = AMBER if status == 'flag' else BLUE_DK
        tbg = AMBER_BG if status == 'flag' else BLUE_BG
        tlw, _ = measure(d, tl, F_TAG)
        tagx = inner - 22 - tlw - 22
        rrect(d, (tagx, ry - 11, tagx + tlw + 22, ry + 11), 11, fill=tbg)
        text(d, (tagx + 11, ry - 6), tl, F_TAG, tcol)
        if i < len(rows) - 1:
            hairline(d, PAD + 22, inner - 22, ry + row_h // 2)

    save(img, 'email-health-markers.png')


if __name__ == '__main__':
    render_health_markers()
    render_block_end_reading()
    print('\nDone. Hosted at https://app.bodyrecode.au/email/<name>.png after deploy.')
