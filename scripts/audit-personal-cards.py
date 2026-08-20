#!/usr/bin/env python3
"""Classify every personal-brand card so the scheduler can refuse the bad ones.

Two rules from Kade, 20 Aug 2026, both spotted by eye the moment he saw a sheet:

  "dont use colour images of me either"   -> photo cards are out
  "i dont like the card used on the 15th" -> the bare variant is out

The bare variant is a rule and a headline with no eyebrow label and no subline.
It reads unfinished next to the labelled cards, and it is also where the weakest
copy lives, because a line with no label has to carry the whole post alone.
"I'm not sure you ever fully arrive" fails that test cold.

Detection, measured rather than guessed:
  photo   = >25% of pixels near-black. The clay cards sit at ~1.5%, the photo
            cards at 45-93%, so there is no grey area.
  labelled= >300 terracotta pixels. The rule alone gives 156; a rule plus a
            label gives 600+.

Writes scripts/personal-card-audit.json for the TS scheduler to read.

Run: python3 scripts/audit-personal-cards.py
"""
import json, glob, os
from PIL import Image

OUT = 'scripts/personal-card-audit.json'
TERRA = (181, 85, 47)

def classify(path):
    im = Image.open(path).convert('RGB')
    px = list(im.getdata())
    n = len(px)
    terra = sum(1 for (r, g, b) in px
                if abs(r - TERRA[0]) < 40 and abs(g - TERRA[1]) < 40 and abs(b - TERRA[2]) < 40)
    dark = sum(1 for (r, g, b) in px if r < 90 and g < 90 and b < 90) / n
    return {'photo': dark > 0.25, 'labelled': terra >= 300}

result = {}
for p in sorted(glob.glob('public/calendar/pb-*.png') + glob.glob('public/calendar/kade-*.png')):
    try:
        result['/' + os.path.relpath(p, 'public')] = classify(p)
    except Exception as e:
        print(f'  skip {p}: {e}')

json.dump(result, open(OUT, 'w'), indent=0)
photo = sum(1 for v in result.values() if v['photo'])
bare = sum(1 for v in result.values() if not v['labelled'] and not v['photo'])
print(f'{len(result)} cards audited -> {OUT}')
print(f'  photo cards (excluded):  {photo}')
print(f'  bare, no label (excluded): {bare}')
print(f'  usable labelled cards:   {len(result) - photo - bare}')
