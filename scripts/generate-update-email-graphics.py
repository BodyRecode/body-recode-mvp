#!/usr/bin/env python3
"""
Light-themed brand graphics for the client product-update email.

Matches the platform email palette (Pure White / Graphite Black / Signal Blue
#1B6DFC), NOT the old dark+mint marketing graphics. Three inline images that
carry the email's story:

  email-hero.png            1200x500   "What's new in your portal" banner
  email-health-markers.png  1200x720   blood-panel marker rows w/ range bars
  email-trajectory.png      1200x720   signal-over-the-block line chart

Outputs to:
  ~/body-recode-mvp/public/email/   (served at https://app.bodyrecode.au/email/*)
  ~/Public/                          (local copy per feedback_post_graphics)

Rendered at 2x for retina, downscaled on save.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

# ---- Light palette (email canvas) ----
BG        = '#FFFFFF'
SURFACE   = '#F7F7F7'
INK       = '#1A1A1A'
BODY      = '#4A4A4A'
MUTED     = '#6B6B6B'
SUBTLE    = '#999999'
HAIRLINE  = '#E5E5E5'
BLUE      = '#1B6DFC'
BLUE_DK   = '#1559D6'
BLUE_BG   = '#EAF1FE'
AMBER     = '#B7791F'
AMBER_BG  = '#FBF3E3'
GREEN     = '#1F9D6B'

SCALE = 2
OUT_DIRS = [
    Path.home() / 'body-recode-mvp' / 'public' / 'email',
    Path.home() / 'Public',
]
for d in OUT_DIRS:
    d.mkdir(parents=True, exist_ok=True)

HELV      = '/System/Library/Fonts/Helvetica.ttc'
HELV_NEUE = '/System/Library/Fonts/HelveticaNeue.ttc'
SF_MONO   = '/System/Library/Fonts/SFNSMono.ttf'


def font(size, weight='regular'):
    size *= SCALE
    if weight in ('bold', 'black'):
        return ImageFont.truetype(HELV, size, index=1)  # Helvetica Bold (upright)
    if weight == 'medium':
        return ImageFont.truetype(HELV_NEUE, size, index=1)
    return ImageFont.truetype(HELV, size, index=0)


def mono(size):
    try:
        return ImageFont.truetype(SF_MONO, size * SCALE)
    except Exception:
        return ImageFont.truetype(HELV, size * SCALE, index=0)


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def rgba(h, a=255):
    return (*rgb(h), a)


def text_w(d, t, f):
    b = d.textbbox((0, 0), t, font=f)
    return b[2] - b[0]


def tracked(d, xy, text, f, fill, tracking):
    """Draw text with letter-spacing (for uppercase eyebrows)."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += text_w(d, ch, f) + tracking * SCALE


def new_canvas(w, h):
    return Image.new('RGBA', (w * SCALE, h * SCALE), rgba(BG))


def dotted_grid(img, x0, y0, x1, y1, gap=22, colour=HAIRLINE, alpha=130):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    yy = y0
    while yy <= y1:
        xx = x0
        while xx <= x1:
            d.ellipse((xx, yy, xx + SCALE, yy + SCALE), fill=(*rgb(colour), alpha))
            xx += gap * SCALE
        yy += gap * SCALE
    img.alpha_composite(layer)


def soft_shadow(img, xy, radius, blur=18, alpha=22):
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(xy, radius=radius, fill=(15, 23, 42, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    img.alpha_composite(layer)


def save(img, name):
    flat = Image.new('RGB', img.size, rgb(BG))
    flat.paste(img, mask=img.split()[3])
    out = flat.resize((img.width // SCALE, img.height // SCALE), Image.LANCZOS)
    for d in OUT_DIRS:
        out.save(d / name, 'PNG')
    print(f'Wrote {name}  ({out.width}x{out.height})')


# ============================================================
# 1. HERO  "What's new in your portal"
# ============================================================
def render_hero():
    W, H = 1200, 500
    img = new_canvas(W, H)
    d = ImageDraw.Draw(img)
    s = SCALE

    # faint dotted grid in the right third
    dotted_grid(img, int(W*0.58)*s, 40*s, (W-40)*s, (H-40)*s, gap=26, alpha=90)

    # soft blue glow top-right
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse(((W-260)*s, -160*s, (W+160)*s, 260*s), fill=(*rgb(BLUE), 26))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img.alpha_composite(glow)

    pad = 84 * s
    # eyebrow
    tracked(d, (pad, 150*s), 'BODY RECODE  ·  PRODUCT UPDATE', font(13, 'bold'), rgb(BLUE), 3)
    # accent bar
    d.rounded_rectangle((pad, 182*s, pad + 54*s, 186*s), radius=2*s, fill=rgb(BLUE))
    # headline (two lines)
    d.text((pad, 206*s), 'A few new things', font=font(52, 'black'), fill=rgb(INK))
    d.text((pad, 272*s), 'inside your portal', font=font(52, 'black'), fill=rgb(INK))
    # subline
    d.text((pad, 356*s), 'More signal to work with. More to see.',
           font=font(20, 'regular'), fill=rgb(MUTED))

    save(img, 'email-hero.png')


# ============================================================
# 2. HEALTH MARKERS  blood-panel rows with range bars
# ============================================================
def render_health_markers():
    W, H = 1200, 720
    img = new_canvas(W, H)
    d = ImageDraw.Draw(img)
    s = SCALE
    pad = 84 * s

    tracked(d, (pad, 70*s), 'NEW  ·  HEALTH MARKERS', font(13, 'bold'), rgb(BLUE), 3)
    d.text((pad, 100*s), 'Your blood work, read as a signal.',
           font=font(40, 'black'), fill=rgb(INK))
    d.text((pad, 162*s), 'Every marker checked against your lab’s own range.',
           font=font(19, 'regular'), fill=rgb(MUTED))

    # card
    cx0, cy0, cx1, cy1 = pad, 226*s, (W-84)*s, (H-70)*s
    soft_shadow(img, (cx0, cy0+8*s, cx1, cy1+8*s), 26*s)
    d.rounded_rectangle((cx0, cy0, cx1, cy1), radius=26*s, fill=rgb(BG), outline=rgb(HAIRLINE), width=1*s)

    # rows: (label, position 0..1 along range, status)
    rows = [
        ('Ferritin',        0.46, 'in'),
        ('Vitamin D',       0.28, 'in'),
        ('Thyroid (TSH)',   0.83, 'flag'),
        ('HbA1c',           0.40, 'in'),
        ('Cholesterol',     0.58, 'in'),
    ]
    n = len(rows)
    inner_top = cy0 + 44*s
    inner_bot = cy1 - 44*s
    row_h = (inner_bot - inner_top) / n
    label_x = cx0 + 44*s
    bar_x0 = cx0 + 360*s
    bar_x1 = cx1 - 150*s
    f_label = font(20, 'medium')
    f_tag = font(12, 'bold')

    for i, (label, pos, status) in enumerate(rows):
        ry = inner_top + row_h * i + row_h/2
        # label
        d.text((label_x, ry - text_w(d, 'X', f_label)*0 - 14*s), label, font=f_label, fill=rgb(INK))
        # range track
        track_y = int(ry)
        d.rounded_rectangle((bar_x0, track_y-4*s, bar_x1, track_y+4*s), radius=4*s, fill=rgb(SURFACE))
        # "normal band" lighter blue segment in the middle
        band0 = bar_x0 + (bar_x1-bar_x0)*0.18
        band1 = bar_x0 + (bar_x1-bar_x0)*0.78
        d.rounded_rectangle((band0, track_y-4*s, band1, track_y+4*s), radius=4*s, fill=rgb(BLUE_BG))
        # dot
        dot_x = bar_x0 + (bar_x1-bar_x0)*pos
        col = AMBER if status == 'flag' else BLUE
        ring = AMBER_BG if status == 'flag' else BLUE_BG
        d.ellipse((dot_x-13*s, track_y-13*s, dot_x+13*s, track_y+13*s), fill=rgb(ring))
        d.ellipse((dot_x-8*s, track_y-8*s, dot_x+8*s, track_y+8*s), fill=rgb(col))
        # status tag on the right
        if status == 'flag':
            tag = 'REVIEW W/ GP'
            tw = text_w(d, tag, f_tag)
            tagx = cx1 - 44*s - tw - 24*s
            d.rounded_rectangle((tagx, track_y-15*s, tagx+tw+24*s, track_y+15*s), radius=15*s, fill=rgb(AMBER_BG))
            d.text((tagx+12*s, track_y-9*s), tag, font=f_tag, fill=rgb(AMBER))
        else:
            tag = 'IN RANGE'
            tw = text_w(d, tag, f_tag)
            tagx = cx1 - 44*s - tw - 24*s
            d.rounded_rectangle((tagx, track_y-15*s, tagx+tw+24*s, track_y+15*s), radius=15*s, fill=rgb(BLUE_BG))
            d.text((tagx+12*s, track_y-9*s), tag, font=f_tag, fill=rgb(BLUE_DK))
        # row divider
        if i < n-1:
            dy = inner_top + row_h*(i+1)
            d.line((cx0+44*s, dy, cx1-44*s, dy), fill=rgb(HAIRLINE), width=1*s)

    save(img, 'email-health-markers.png')


# ============================================================
# 3. TRAJECTORY  signal-over-the-block line chart
# ============================================================
def render_trajectory():
    W, H = 1200, 720
    img = new_canvas(W, H)
    d = ImageDraw.Draw(img)
    s = SCALE
    pad = 84 * s

    tracked(d, (pad, 70*s), 'NEW  ·  BLOCK-END READING', font(13, 'bold'), rgb(BLUE), 3)
    d.text((pad, 100*s), 'The trend, not the snapshot.',
           font=font(40, 'black'), fill=rgb(INK))
    d.text((pad, 162*s), 'How your signal moved across the whole block.',
           font=font(19, 'regular'), fill=rgb(MUTED))

    # plot area
    px0, py0, px1, py1 = pad, 250*s, (W-84)*s, (H-96)*s
    # gridlines
    for gi in range(1, 4):
        gy = py0 + (py1-py0)*gi/4
        d.line((px0, gy, px1, gy), fill=rgb(HAIRLINE), width=1*s)

    # weekly signal values (0..1), a dip then recovery and climb
    vals = [0.30, 0.38, 0.34, 0.52, 0.66, 0.82]
    n = len(vals)
    def X(i): return px0 + (px1-px0) * i/(n-1)
    def Y(v): return py1 - (py1-py0) * v
    pts = [(X(i), Y(v)) for i, v in enumerate(vals)]

    # area fill under the line
    area = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ad = ImageDraw.Draw(area)
    poly = pts + [(px1, py1), (px0, py1)]
    ad.polygon(poly, fill=(*rgb(BLUE), 28))
    img.alpha_composite(area)

    # the line
    d.line(pts, fill=rgb(BLUE), width=5*s, joint='curve')

    # week labels + points
    f_wk = mono(12)
    for i, (x, y) in enumerate(pts):
        last = (i == n-1)
        r = 11*s if last else 7*s
        d.ellipse((x-r-4*s, y-r-4*s, x+r+4*s, y+r+4*s), fill=rgb(BLUE_BG))
        d.ellipse((x-r, y-r, x+r, y+r), fill=rgb(BLUE) if last else rgb(BG), outline=rgb(BLUE), width=3*s)
        lbl = f'W{i+1}'
        d.text((x - text_w(d, lbl, f_wk)/2, py1 + 14*s), lbl, font=f_wk, fill=rgb(SUBTLE))

    # annotations: start + now
    f_an = font(14, 'bold')
    # start
    sx, sy = pts[0]
    d.text((sx + 14*s, sy - 6*s), 'where you started', font=f_an, fill=rgb(MUTED))
    # now
    nx, ny = pts[-1]
    txt = 'where you are now'
    d.text((nx - text_w(d, txt, f_an) - 16*s, ny - 34*s), txt, font=f_an, fill=rgb(BLUE_DK))

    save(img, 'email-trajectory.png')


if __name__ == '__main__':
    render_hero()
    render_health_markers()
    render_trajectory()
    print('\nDone. Hosted at https://app.bodyrecode.au/email/<name>.png after deploy.')
