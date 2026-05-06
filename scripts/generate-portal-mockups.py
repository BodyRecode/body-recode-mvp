#!/usr/bin/env python3
"""
Generates the 3 mockup images embedded in the Portal Orientation email.

Style brief: phone-frame silhouettes against the locked palette, evocative not
literal. No real client data. Don't need regenerating when the portal UI changes
because they don't claim pixel-perfect accuracy, they communicate WHAT IS THERE.

Outputs to ~/body-recode-mvp/public/email-assets/
  portal-landing.png
  portal-resources.png
  portal-reading.png

Each rendered at 2x density (e.g. 1200x900) so it looks sharp on retina email
clients. Email HTML references at width=600 (logical width) for half-density.
"""

from PIL import Image, ImageDraw, ImageFont
import os
from pathlib import Path

# Locked palette
INK = '#0c0a09'
SURFACE = '#111110'
BORDER = '#1c1917'
BORDER_2 = '#292524'
MUTED = '#57534e'
SOFT = '#a8a29e'
BODY = '#d4cfc9'
WHITE = '#ffffff'
TEAL = '#14b8a6'
TEAL_HOVER = '#5eead4'
AMBER = '#f59e0b'
RED = '#ef4444'

# Cream layout palette (for foundational reading mockup)
PAPER = '#fafaf7'
PAPER_BORDER = '#e7e5e0'
PAPER_SOFT = '#f5f3ee'
PAPER_INK = '#0f0f0f'

OUT_DIR = Path.home() / 'body-recode-mvp' / 'public' / 'email-assets'
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Fonts (macOS system fonts that ship with every Mac)
HELV = '/System/Library/Fonts/Helvetica.ttc'
HELV_NEUE = '/System/Library/Fonts/HelveticaNeue.ttc'

def font(size, weight='regular'):
    """weight: regular | medium | bold | black"""
    # Helvetica.ttc indices (macOS): 0 light, 1 regular-italic, 2 bold, 3 bold-italic
    if weight == 'bold' or weight == 'black':
        return ImageFont.truetype(HELV, size, index=2)
    if weight == 'medium':
        return ImageFont.truetype(HELV_NEUE, size, index=1)
    return ImageFont.truetype(HELV, size, index=0)

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    """Wrapper because Pillow's API is a little awkward."""
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def render_landing():
    """Mockup 1: portal landing showing the card stack."""
    W, H = 1200, 900
    img = Image.new('RGB', (W, H), hex_to_rgb(INK))
    draw = ImageDraw.Draw(img)

    # Phone frame - tall card centred horizontally
    frame_w = 720
    frame_x = (W - frame_w) // 2
    frame_y = 60
    frame_h = H - 120
    rounded_rect(draw, (frame_x, frame_y, frame_x + frame_w, frame_y + frame_h),
                 radius=32, fill=hex_to_rgb('#0a0a0a'),
                 outline=hex_to_rgb(BORDER), width=2)

    # Top sticky chrome (BR mark + sign out)
    inner_x = frame_x + 32
    inner_w = frame_w - 64
    chrome_y = frame_y + 32
    # BR teal pill
    pill_x = inner_x
    pill_y = chrome_y
    pill_w = 80
    pill_h = 38
    rounded_rect(draw, (pill_x, pill_y, pill_x + pill_w, pill_y + pill_h),
                 radius=8, fill=hex_to_rgb(TEAL))
    # Centre "BR" text vertically and horizontally inside the pill
    br_font = font(20, 'bold')
    bbox = draw.textbbox((0, 0), 'BR', font=br_font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    draw.text((pill_x + (pill_w - text_w) / 2, pill_y + (pill_h - text_h) / 2 - 3),
              'BR', fill=hex_to_rgb(INK), font=br_font)
    # Sign out (right)
    so_text = 'Sign out'
    so_font = font(16)
    bbox = draw.textbbox((0, 0), so_text, font=so_font)
    so_w = bbox[2] - bbox[0]
    draw.text((inner_x + inner_w - so_w, pill_y + 12), so_text,
              fill=hex_to_rgb(MUTED), font=so_font)

    # Welcome heading
    head_y = chrome_y + 80
    draw.text((inner_x, head_y), 'Welcome, Samantha',
              fill=hex_to_rgb(WHITE), font=font(38, 'bold'))
    draw.text((inner_x, head_y + 56), 'Your coaching portal, everything in one place.',
              fill=hex_to_rgb(SOFT), font=font(18))

    # "This week" section
    sec_y = head_y + 110
    # accent bar
    draw.rounded_rectangle((inner_x, sec_y, inner_x + 36, sec_y + 4),
                           radius=2, fill=hex_to_rgb(TEAL))
    draw.text((inner_x + 48, sec_y - 6), 'THIS WEEK',
              fill=hex_to_rgb(WHITE), font=font(13, 'bold'))

    # Weekly check-in card
    card_y = sec_y + 24
    card_h = 90
    rounded_rect(draw, (inner_x, card_y, inner_x + inner_w, card_y + card_h),
                 radius=20, fill=hex_to_rgb(SURFACE),
                 outline=hex_to_rgb(BORDER), width=2)
    draw.text((inner_x + 24, card_y + 22),
              'Weekly check-in, Form A', fill=hex_to_rgb(WHITE), font=font(20, 'bold'))
    draw.text((inner_x + 24, card_y + 50),
              'Week 3 - Closes Sunday at 6:30pm', fill=hex_to_rgb(SOFT), font=font(15))
    # Start arrow
    arrow_text = 'Start ->'
    bbox = draw.textbbox((0, 0), arrow_text, font=font(15, 'bold'))
    aw = bbox[2] - bbox[0]
    draw.text((inner_x + inner_w - aw - 24, card_y + 36),
              arrow_text, fill=hex_to_rgb(TEAL), font=font(15, 'bold'))

    # "Your reading" section
    sec_y = card_y + card_h + 32
    draw.rounded_rectangle((inner_x, sec_y, inner_x + 36, sec_y + 4),
                           radius=2, fill=hex_to_rgb(TEAL))
    draw.text((inner_x + 48, sec_y - 6), 'YOUR READING',
              fill=hex_to_rgb(WHITE), font=font(13, 'bold'))

    card_y = sec_y + 24
    rounded_rect(draw, (inner_x, card_y, inner_x + inner_w, card_y + card_h),
                 radius=20, fill=hex_to_rgb(SURFACE),
                 outline=hex_to_rgb(BORDER), width=2)
    draw.text((inner_x + 24, card_y + 22),
              'Foundational Reading', fill=hex_to_rgb(WHITE), font=font(20, 'bold'))
    draw.text((inner_x + 24, card_y + 50),
              'A read of how your body is currently organising itself',
              fill=hex_to_rgb(SOFT), font=font(15))
    bbox = draw.textbbox((0, 0), 'View ->', font=font(15, 'bold'))
    aw = bbox[2] - bbox[0]
    draw.text((inner_x + inner_w - aw - 24, card_y + 36),
              'View ->', fill=hex_to_rgb(TEAL), font=font(15, 'bold'))

    # "Resources" section
    sec_y = card_y + card_h + 32
    draw.rounded_rectangle((inner_x, sec_y, inner_x + 36, sec_y + 4),
                           radius=2, fill=hex_to_rgb(TEAL))
    draw.text((inner_x + 48, sec_y - 6), 'RESOURCES',
              fill=hex_to_rgb(WHITE), font=font(13, 'bold'))

    card_y = sec_y + 24
    rounded_rect(draw, (inner_x, card_y, inner_x + inner_w, card_y + card_h),
                 radius=20, fill=hex_to_rgb(SURFACE),
                 outline=hex_to_rgb(BORDER), width=2)
    draw.text((inner_x + 24, card_y + 22),
              'All resources', fill=hex_to_rgb(WHITE), font=font(20, 'bold'))
    draw.text((inner_x + 24, card_y + 50),
              'Progress, glossary, guides, message your coach...',
              fill=hex_to_rgb(SOFT), font=font(15))
    bbox = draw.textbbox((0, 0), 'View ->', font=font(15, 'bold'))
    aw = bbox[2] - bbox[0]
    draw.text((inner_x + inner_w - aw - 24, card_y + 36),
              'View ->', fill=hex_to_rgb(TEAL), font=font(15, 'bold'))

    out = OUT_DIR / 'portal-landing.png'
    img.save(out, 'PNG', optimize=True)
    print(f'  wrote {out}')


def render_resources():
    """Mockup 2: Resources hub - 6 cards in a grid."""
    W, H = 1200, 900
    img = Image.new('RGB', (W, H), hex_to_rgb(INK))
    draw = ImageDraw.Draw(img)

    frame_w = 720
    frame_x = (W - frame_w) // 2
    frame_y = 60
    frame_h = H - 120
    rounded_rect(draw, (frame_x, frame_y, frame_x + frame_w, frame_y + frame_h),
                 radius=32, fill=hex_to_rgb('#0a0a0a'),
                 outline=hex_to_rgb(BORDER), width=2)

    inner_x = frame_x + 40
    inner_w = frame_w - 80

    # Heading
    head_y = frame_y + 60
    draw.text((inner_x, head_y), '< Back to portal',
              fill=hex_to_rgb(MUTED), font=font(14))
    draw.text((inner_x, head_y + 32), 'Resources',
              fill=hex_to_rgb(WHITE), font=font(38, 'bold'))
    draw.text((inner_x, head_y + 88),
              'Everything you need beyond your weekly check-ins.',
              fill=hex_to_rgb(SOFT), font=font(16))

    # 6 cards stacked
    cards = [
        ('Your progress', 'Measurements over time, side by side with your starting point.'),
        ('Your readings', 'Foundational Reading and any future weekly readings.'),
        ('Glossary', 'Plain-language definitions of every term you hear.'),
        ('Practical guides', 'Sleep, stress, pre-session, post-session, weekly structure.'),
        ('Message your coach', 'Send a non-urgent question. Reply by email.'),
        ('Account and service', 'Update details, pause, refer a friend, download data.'),
    ]

    card_y = head_y + 140
    card_h = 78
    gap = 12
    for title, desc in cards:
        rounded_rect(draw, (inner_x, card_y, inner_x + inner_w, card_y + card_h),
                     radius=18, fill=hex_to_rgb(SURFACE),
                     outline=hex_to_rgb(BORDER), width=2)
        # Icon square (teal accent)
        icon_x = inner_x + 18
        icon_y = card_y + 17
        rounded_rect(draw, (icon_x, icon_y, icon_x + 44, icon_y + 44),
                     radius=10, fill=hex_to_rgb(INK),
                     outline=hex_to_rgb(BORDER), width=1)
        # Tiny teal accent inside the icon square
        draw.rounded_rectangle((icon_x + 14, icon_y + 18, icon_x + 30, icon_y + 22),
                               radius=2, fill=hex_to_rgb(TEAL))

        text_x = icon_x + 60
        draw.text((text_x, card_y + 14), title,
                  fill=hex_to_rgb(WHITE), font=font(18, 'bold'))
        draw.text((text_x, card_y + 42), desc,
                  fill=hex_to_rgb(SOFT), font=font(13))
        card_y += card_h + gap

    out = OUT_DIR / 'portal-resources.png'
    img.save(out, 'PNG', optimize=True)
    print(f'  wrote {out}')


def render_reading():
    """Mockup 3: Foundational Reading - cream/black premium layout."""
    W, H = 1200, 900
    img = Image.new('RGB', (W, H), hex_to_rgb(INK))
    draw = ImageDraw.Draw(img)

    frame_w = 720
    frame_x = (W - frame_w) // 2
    frame_y = 60
    frame_h = H - 120
    rounded_rect(draw, (frame_x, frame_y, frame_x + frame_w, frame_y + frame_h),
                 radius=24, fill=hex_to_rgb(PAPER),
                 outline=hex_to_rgb(BORDER), width=2)

    # Black header band
    bx0 = frame_x
    by0 = frame_y
    bx1 = frame_x + frame_w
    by1 = frame_y + 220
    # Render solid black header with rounded top
    draw.rounded_rectangle((bx0, by0, bx1, by1 + 30), radius=24,
                           fill=(0, 0, 0))
    # Cover bottom of rounded so the band ends square
    draw.rectangle((bx0, by1 - 1, bx1, by1 + 30), fill=(0, 0, 0))
    # Re-render cream shape to mask the bottom corners
    draw.rectangle((bx0, by1, bx1, by1 + 4), fill=hex_to_rgb(TEAL))

    pad_x = frame_x + 40
    head_y = by0 + 28
    # BR pill in white
    pill_w = 70
    pill_h = 32
    rounded_rect(draw, (pad_x, head_y, pad_x + pill_w, head_y + pill_h),
                 radius=8, fill=hex_to_rgb(TEAL))
    br_font = font(16, 'bold')
    bbox = draw.textbbox((0, 0), 'BR', font=br_font)
    tw = bbox[2] - bbox[0]
    draw.text((pad_x + (pill_w - tw) / 2, head_y + 7),
              'BR', fill=(0, 0, 0), font=br_font)

    # Eyebrow
    eb_y = head_y + 52
    draw.text((pad_x, eb_y), 'FOUNDATIONAL READING',
              fill=hex_to_rgb(TEAL), font=font(13, 'bold'))
    # Headline
    draw.text((pad_x, eb_y + 24), 'Your Starting Position',
              fill=(255, 255, 255), font=font(36, 'bold'))
    # Subhead
    draw.text((pad_x, eb_y + 78),
              'A read of how your body is currently organising itself',
              fill=(140, 140, 140), font=font(14))

    # Cream body
    body_y = by1 + 30 + 28
    # About card (black inset)
    card_h = 130
    rounded_rect(draw, (pad_x, body_y, pad_x + frame_w - 80, body_y + card_h),
                 radius=10, fill=(15, 15, 15))
    draw.text((pad_x + 24, body_y + 20), 'ABOUT THIS READING',
              fill=hex_to_rgb(TEAL), font=font(11, 'bold'))
    draw.text((pad_x + 24, body_y + 44),
              'This is not a verdict. It is a read of what your',
              fill=hex_to_rgb(WHITE), font=font(15, 'bold'))
    draw.text((pad_x + 24, body_y + 66),
              'body is currently doing and why we will move',
              fill=hex_to_rgb(WHITE), font=font(15, 'bold'))
    draw.text((pad_x + 24, body_y + 88),
              'the way we are about to.',
              fill=hex_to_rgb(WHITE), font=font(15, 'bold'))

    # Reading section preview (cream card)
    body_y += card_h + 28
    card_h = 110
    rounded_rect(draw, (pad_x, body_y, pad_x + frame_w - 80, body_y + card_h),
                 radius=8, fill=(255, 255, 255),
                 outline=hex_to_rgb(PAPER_BORDER), width=2)
    # Section header strip
    draw.rounded_rectangle((pad_x + 1, body_y + 1, pad_x + frame_w - 80 - 1, body_y + 36),
                           radius=8, fill=hex_to_rgb(PAPER_SOFT))
    draw.rectangle((pad_x + 1, body_y + 30, pad_x + frame_w - 80 - 1, body_y + 36),
                   fill=hex_to_rgb(PAPER_SOFT))
    draw.text((pad_x + 18, body_y + 12), '01',
              fill=hex_to_rgb(TEAL), font=font(14, 'bold'))
    draw.text((pad_x + 50, body_y + 12), 'WHERE YOU ARE RIGHT NOW',
              fill=hex_to_rgb(PAPER_INK), font=font(13, 'bold'))
    # Section body excerpt
    draw.text((pad_x + 18, body_y + 50),
              'Your body is in what we call a Remediation state...',
              fill=(42, 42, 42), font=font(13))
    draw.text((pad_x + 18, body_y + 72),
              'managing competing demands while storing energy in...',
              fill=(42, 42, 42), font=font(13))

    out = OUT_DIR / 'portal-reading.png'
    img.save(out, 'PNG', optimize=True)
    print(f'  wrote {out}')


if __name__ == '__main__':
    print(f'Rendering portal mockups to {OUT_DIR}')
    render_landing()
    render_resources()
    render_reading()
    print('Done.')
