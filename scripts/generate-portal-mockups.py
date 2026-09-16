#!/usr/bin/env python3
"""
The three mockups embedded in the Portal Orientation email.

    python3 scripts/generate-portal-mockups.py

WHY THIS WAS REWRITTEN, 16 Sep 2026. Kim Hamilton received the orientation
email and the pictures in it were of a portal that no longer exists. They were
drawn on 7 May in the dark palette with a teal accent, which was retired on
21 May for Pure White / Graphite Black / Signal Blue, and they showed a card
stack and labels the portal has since replaced twice. One of them also greeted
the reader as "Samantha", a real client, in an email sent to everyone else.

The rule the old file set itself still holds and is worth keeping: these are
evocative, not pixel-perfect. They communicate WHAT IS IN THERE, so they do not
need redrawing every time a margin moves. They DO need redrawing when the
palette changes or the sections are renamed, which is what happened here.

No client names, no real data. Output lands in public/email-assets/ and is
inlined as base64 by src/lib/portal-orientation-email.ts, so a regenerated PNG
reaches clients on the next deploy with no other step.
"""

from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# The locked platform palette. Same values as the portal and the emails.
WHITE = '#FFFFFF'
GROUND = '#F5F7FA'
INK = '#141821'
BODY = '#43474F'
MUTED = '#666D7A'
FAINT = '#98A0AD'
HAIRLINE = '#E8EAEE'
BLUE = '#1B6DFC'
BLUE_TINT = '#EFF5FE'
BLUE_EDGE = '#B5CFFC'
# The reading document keeps its dark hero (reading-hero-shell.tsx).
HERO = '#17191F'
HERO_SUB = '#8FB4F5'

# Helvetica.ttc rendered oblique at every index Pillow exposes on this machine,
# which is how the first regenerated set came out italic. Arial ships as plain
# single-face files, so the weight asked for is the weight drawn.
REGULAR = '/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'


def font(size, weight='regular'):
    return ImageFont.truetype(BOLD if weight == 'bold' else REGULAR, size)


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def box(draw, xy, radius=16, fill=None, outline=None, width=2):
    draw.rounded_rectangle(xy, radius=radius, fill=rgb(fill) if fill else None,
                           outline=rgb(outline) if outline else None, width=width)


def text(draw, xy, s, size=20, weight='regular', colour=INK):
    draw.text(xy, s, fill=rgb(colour), font=font(size, weight))


def label(draw, xy, s, colour=FAINT, size=15):
    """The small uppercase micro-label the portal uses above a section."""
    draw.text(xy, s.upper(), fill=rgb(colour), font=font(size, 'bold'))


def line(draw, x, y, w, colour=HAIRLINE, h=2):
    draw.rectangle((x, y, x + w, y + h), fill=rgb(colour))


def chrome(draw, x, y, w):
    """Blue BR mark and Sign out, as the portal header carries them."""
    box(draw, (x, y, x + 74, y + 36), radius=9, fill=BLUE)
    b = draw.textbbox((0, 0), 'BR', font=font(19, 'bold'))
    draw.text((x + (74 - (b[2] - b[0])) / 2, y + 7), 'BR', fill=rgb(WHITE), font=font(19, 'bold'))
    s = 'Sign out'
    b = draw.textbbox((0, 0), s, font=font(15))
    draw.text((x + w - (b[2] - b[0]), y + 11), s, fill=rgb(FAINT), font=font(15))


# The card is sized to what it holds. A fixed 900px canvas left the first two
# mockups with dead space under the last card and pushed the reading's fifth
# section off the bottom edge.
PAD = 50      # ground showing around the card
INSET = 38    # card padding
CARD_W = 760


def frame(content_h):
    """A page card on the portal's ground, 2x density for retina email."""
    H = content_h + (PAD + INSET) * 2
    img = Image.new('RGB', (1200, H), rgb(GROUND))
    d = ImageDraw.Draw(img)
    fx = (1200 - CARD_W) // 2
    box(d, (fx, PAD, fx + CARD_W, H - PAD), radius=28, fill=WHITE, outline=HAIRLINE)
    return img, d, fx + INSET, PAD + INSET, CARD_W - INSET * 2


def render_landing(out):
    """1. Portal home: the sections the client lands on."""
    rows_h = 152 + 116 * 3
    img, d, x, y, w = frame(176 + rows_h - 20)
    chrome(d, x, y, w)

    text(d, (x, y + 74), 'Welcome back', 34, 'bold')
    text(d, (x, y + 118), 'Everything current, in one place.', 19, colour=MUTED)

    rows = [
        ('This week', 'Your weekly check-in, when the window is open', True),
        ('Your Read', 'Your Foundational Read, once it is ready', False),
        ('Your portal', 'Progress, reads, guides, glossary, messages', False),
        ('From your coach', 'Notes and replies from Kade', False),
    ]
    cy = y + 176
    for name, sub, active in rows:
        box(d, (x, cy, x + w, cy + (132 if active else 96)), radius=16,
            fill=BLUE_TINT if active else WHITE, outline=BLUE_EDGE if active else HAIRLINE)
        label(d, (x + 26, cy + 24), name, BLUE if active else FAINT)
        text(d, (x + 26, cy + 52), sub, 19, colour=BODY)
        if active:
            box(d, (x + 26, cy + 86, x + 232, cy + 122), radius=9, fill=BLUE)
            text(d, (x + 52, cy + 95), 'Start check-in', 17, 'bold', WHITE)
        cy += (152 if active else 116)

    img.save(out / 'portal-landing.png')


def render_resources(out):
    """2. The six cards under Your portal."""
    img, d, x, y, w = frame(176 + 168 * 2 + 148)
    chrome(d, x, y, w)

    text(d, (x, y + 74), 'Your portal', 34, 'bold')
    text(d, (x, y + 118), 'Six places, one for each thing you might need.', 19, colour=MUTED)

    cards = [
        ('Your progress', 'Measurements over time'),
        ('Your reads', 'Current and archived'),
        ('Glossary', 'Every term, in plain words'),
        ('Practical guides', 'Sleep, stress, recovery'),
        ('Messages', 'Message your coach'),
        ('Account and service', 'Details, pause, your data'),
    ]
    cw = (w - 24) // 2
    cy = y + 176
    for i, (name, sub) in enumerate(cards):
        cx = x + (i % 2) * (cw + 24)
        row_y = cy + (i // 2) * 168
        box(d, (cx, row_y, cx + cw, row_y + 148), radius=16, fill=WHITE, outline=HAIRLINE)
        box(d, (cx + 24, row_y + 24, cx + 68, row_y + 68), radius=11, fill=BLUE_TINT, outline=BLUE_EDGE)
        text(d, (cx + 24, row_y + 86), name, 21, 'bold')
        text(d, (cx + 24, row_y + 114), sub, 17, colour=MUTED)

    img.save(out / 'portal-resources.png')


def render_reading(out):
    """3. The Foundational Read: dark hero, white cards, as it renders now."""
    img, d, x, y, w = frame(240 + 116 * 5 - 12)

    # Hero
    box(d, (x, y, x + w, y + 210), radius=18, fill=HERO)
    label(d, (x + 30, y + 30), 'Foundational Read', HERO_SUB, 14)
    text(d, (x + 30, y + 62), 'Where your body is', 33, 'bold', WHITE)
    text(d, (x + 30, y + 104), 'right now', 33, 'bold', WHITE)
    box(d, (x + 30, y + 154, x + 214, y + 186), radius=16, fill='#243049', outline='#35507F')
    text(d, (x + 48, y + 161), 'Prepared for you', 15, colour=HERO_SUB)

    sections = [
        'Where you are right now',
        'What your body is telling us',
        'What we are focusing on first',
        'What we are not doing yet',
        'A note from Kade',
    ]
    cy = y + 240
    for i, name in enumerate(sections):
        box(d, (x, cy, x + w, cy + 104), radius=14, fill=WHITE, outline=HAIRLINE)
        label(d, (x + 26, cy + 22), f'0{i + 1}', BLUE, 14)
        text(d, (x + 64, cy + 18), name, 20, 'bold')
        line(d, x + 64, cy + 58, w - 128)
        line(d, x + 64, cy + 74, int((w - 128) * 0.72))
        cy += 116

    img.save(out / 'portal-reading.png')


def main():
    out = Path(__file__).resolve().parent.parent / 'public' / 'email-assets'
    out.mkdir(parents=True, exist_ok=True)
    render_landing(out)
    render_resources(out)
    render_reading(out)
    for f in sorted(out.glob('portal-*.png')):
        print(f'{f.name:24s} {f.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
