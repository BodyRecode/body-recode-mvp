#!/usr/bin/env python3
"""
Bring the client-facing surfaces onto the same palette as the dashboard,
without bringing them onto the same DESIGN.

The portal is not a denser dashboard. It is opened on a phone a couple of
times a week by someone who wants to know what she is doing today, so its 14px
card corners, generous type, single 720px column and tinted grounds are all
correct and are deliberately left alone. What is wrong is one layer down: it
is still on the greys the dashboard retired, so the two halves of the product
disagree about what "grey" means while agreeing about everything else.

So this maps COLOUR ONLY. It does not touch radius, type scale, spacing, or
uppercase labels - all the things the dashboard sweep changed and the portal
should keep.

Scope is the client's surfaces: portal, baseline, progress-check. The
dashboard has its own script; running this over it would be a no-op anyway,
since it is already on these values.
"""
import re
import pathlib

ROOTS = [
    'src/app/portal',
    'src/app/baseline',
    'src/app/progress-check',
    # The weekly check-in form lives outside /portal but is the same client
    # doing the same thing, and was missed by the first pass because of it.
    'src/app/checkin',
]

SUBS = [
    # The old greys -> the shared neutrals.
    ('#1A1A1A', '#141821'),
    ('#3A3A3A', '#43474F'),
    ('#4A4A4A', '#43474F'),
    ('#6B6B6B', '#666D7A'),
    ('#999999', '#98A0AD'),
    ('#E5E5E5', '#E8EAEE'),
    ('#ECEEF2', '#E8EAEE'),
    ('#D4D4D4', '#CFD4DC'),
    ('#F8F8F8', '#FAFBFC'),
    ('#F4F4F4', '#F4F6F9'),
    # Tailwind ramps -> the same semantic vocabulary the dashboard uses, so a
    # warning is one amber across the whole product.
    ('stone-50', '[#FBFCFD]'), ('stone-100', '[#F4F6F9]'), ('stone-200', '[#EFF1F4]'),
    ('stone-300', '[#E8EAEE]'), ('stone-400', '[#98A0AD]'), ('stone-500', '[#666D7A]'),
    ('stone-600', '[#666D7A]'), ('stone-700', '[#43474F]'), ('stone-800', '[#141821]'),
    ('stone-900', '[#141821]'),
    ('amber-50', '[#FDF6E9]'), ('amber-100', '[#FAEFD8]'), ('amber-200', '[#F1DEB8]'),
    ('amber-300', '[#E5C98F]'), ('amber-400', '[#C08A2D]'), ('amber-500', '[#B7791F]'),
    ('amber-600', '[#A96A12]'), ('amber-700', '[#A96A12]'), ('amber-800', '[#8A5A14]'),
    ('amber-900', '[#8A5A14]'),
    ('blue-50', '[#EFF5FE]'), ('blue-100', '[#DDE9FD]'), ('blue-200', '[#B5CFFC]'),
    ('blue-300', '[#9CC0FB]'), ('blue-400', '[#5390FF]'), ('blue-500', '[#1B6DFC]'),
    ('blue-600', '[#1560E0]'), ('blue-700', '[#1056D6]'), ('blue-800', '[#0B4FCB]'),
    ('blue-900', '[#0A46B2]'),
    ('red-50', '[#FDEDED]'), ('red-100', '[#FBDCDC]'), ('red-200', '[#F5C9C9]'),
    ('red-300', '[#EFAFAF]'), ('red-500', '[#DC2626]'), ('red-600', '[#C82626]'),
    ('red-700', '[#C82626]'), ('red-800', '[#A11D1D]'), ('red-900', '[#8A1919]'),
    ('emerald-50', '[#EDF8F1]'), ('emerald-100', '[#D8EFE1]'), ('emerald-200', '[#CAE7D5]'),
    ('emerald-500', '[#22A05A]'), ('emerald-600', '[#177245]'), ('emerald-700', '[#177245]'),
    ('green-50', '[#EDF8F1]'), ('green-100', '[#D8EFE1]'), ('green-200', '[#CAE7D5]'),
    ('green-500', '[#22A05A]'), ('green-600', '[#177245]'), ('green-700', '[#177245]'),
    ('green-800', '[#125C37]'), ('green-900', '[#0F4A2D]'),
    # Black on Signal Blue was a dark-theme leftover; keep it from creeping back.
    ('text-black bg-[#1B6DFC]', 'text-white bg-[#1B6DFC]'),
    ('hover:bg-[#5390FF]', 'hover:bg-[#1560E0]'),
    ('hover:bg-[#1558d6]', 'hover:bg-[#1056D6]'),
]

# A ramp token is a prefix of the next one up - stone-50 sits inside
# stone-500. Plain replacement eats the longer one and welds the leftover
# digit onto the replacement, producing a class that silently does nothing.
def apply_sub(text: str, a: str, b: str) -> str:
    if a and a[-1].isdigit():
        return re.sub(re.escape(a) + r'(?!\d)', b, text)
    return text.replace(a, b)


def main():
    scanned = changed = 0
    for root in ROOTS:
        for path in pathlib.Path(root).rglob('*.tsx'):
            # Print layouts are black on white on purpose.
            if '/print/' in str(path):
                continue
            scanned += 1
            src = path.read_text()
            out = src
            for a, b in SUBS:
                out = apply_sub(out, a, b)
            if out != src:
                path.write_text(out)
                changed += 1
    print(f'scanned {scanned} files, rewrote {changed}')


if __name__ == '__main__':
    main()
