#!/usr/bin/env python3
"""Convert personal-brand photo cards to greyscale, in place.

Kade, 20 Aug 2026: "dont use colour images of me either." The Body Recode photo
doctrine has been greyscale since June; it just never reached the personal cards,
because Satori (which renders /api/content/graphic) does not support CSS filters,
so `filter: grayscale()` silently does nothing and the photo goes out in colour.

Safe to convert the WHOLE card: on a photo card the eyebrow label renders white
(rgba(255,255,255,0.85)), not terracotta, so there is no accent colour to lose.
Checked before converting - any card carrying terracotta is skipped and reported
rather than flattened.

Run: python3 scripts/greyscale-photo-cards.py [--dry]
"""
import json, sys
from PIL import Image, ImageStat

DRY = '--dry' in sys.argv
AUDIT = json.load(open('scripts/personal-card-audit.json'))
TERRA = (181, 85, 47)

converted, skipped, already = 0, 0, 0
for path, meta in AUDIT.items():
    if not meta['photo']:
        continue
    p = 'public' + path
    im = Image.open(p).convert('RGB')
    px = list(im.getdata())

    # Already grey? Then leave it alone.
    if max(abs(r - g) + abs(g - b) for (r, g, b) in px[::97]) < 12:
        already += 1
        continue

    # Any real terracotta would be destroyed by flattening, so refuse.
    terra = sum(1 for (r, g, b) in px
                if abs(r - TERRA[0]) < 30 and abs(g - TERRA[1]) < 30 and abs(b - TERRA[2]) < 30)
    if terra > 4000:
        print(f'  SKIP (carries terracotta, would be flattened): {path}')
        skipped += 1
        continue

    if not DRY:
        im.convert('L').convert('RGB').save(p)
    converted += 1

print(f'{"would convert" if DRY else "converted"}: {converted}   already grey: {already}   skipped: {skipped}')
