#!/usr/bin/env python3
"""
Sweep the dashboard onto the new design tokens.

Hand-fixing 100+ pages guarantees drift: the ones nobody opened that week
keep the old greys. This is the builder, so re-running it after any page is
added re-normalises everything. Scope is the coach dashboard only - the
client portal is a different design language and is never touched.
"""
import re, sys, pathlib

ROOTS = ['src/app/dashboard', 'src/components/dashboard']

# --- colour + surface tokens -------------------------------------------
SUBS = [
    # stone palette -> the dashboard neutrals
    ('text-stone-400', 'text-[#98A0AD]'),
    ('text-stone-500', 'text-[#666D7A]'),
    ('text-stone-600', 'text-[#666D7A]'),
    ('text-stone-700', 'text-[#141821]'),
    ('text-stone-800', 'text-[#141821]'),
    ('text-stone-900', 'text-[#141821]'),
    ('border-stone-200', 'border-[#E8EAEE]'),
    ('border-stone-300', 'border-[#E8EAEE]'),
    ('border-stone-400', 'border-[#CFD4DC]'),
    ('border-stone-500', 'border-[#CFD4DC]'),
    ('bg-stone-50', 'bg-[#FBFCFD]'),
    ('bg-stone-100', 'bg-[#F4F6F9]'),
    ('bg-stone-200', 'bg-[#EFF1F4]'),
    ('divide-stone-200', 'divide-[#EFF1F4]'),
    ('ring-stone-200', 'ring-[#E8EAEE]'),
    # old dashboard greys -> new
    ('border-[#E5E5E5]', 'border-[#E8EAEE]'),
    ('divide-[#E5E5E5]', 'divide-[#EFF1F4]'),
    ('bg-[#E5E5E5]', 'bg-[#EFF1F4]'),
    ('text-[#999999]', 'text-[#98A0AD]'),
    ('text-[#6B6B6B]', 'text-[#666D7A]'),
    ('text-[#1A1A1A]', 'text-[#141821]'),
    ('text-[#3A3A3A]', 'text-[#43474F]'),
    ('bg-[#F8F8F8]', 'bg-[#FAFBFC]'),
    ('bg-[#F4F4F4]', 'bg-[#F4F6F9]'),
    ('bg-[#F0F0F0]', 'bg-[#EFF1F4]'),
    ('hover:border-[#D4D4D4]', 'hover:border-[#CFD4DC]'),
    ('border-[#D4D4D4]', 'border-[#CFD4DC]'),
    # radius: 16px reads bubbly on dense data
    ('rounded-2xl', 'rounded-xl'),
    # micro-labels: uppercase mono was the terminal look
    ('text-[10px] font-bold uppercase tracking-widest', 'text-[11.5px] font-medium'),
    ('text-[11px] font-bold uppercase tracking-widest', 'text-[12px] font-medium'),
    ('text-[10px] font-bold uppercase tracking-wide', 'text-[11.5px] font-medium'),
    ('text-[11px] font-bold uppercase tracking-wide', 'text-[12px] font-medium'),
    ('text-xs font-bold uppercase tracking-widest', 'text-[12px] font-medium'),
    ('text-xs font-bold uppercase tracking-wide', 'text-[12px] font-medium'),
    ('text-[10px] font-semibold uppercase tracking-widest', 'text-[11.5px] font-medium'),
    ('text-[11px] font-semibold uppercase tracking-widest', 'text-[12px] font-medium'),
    ('text-[10px] font-bold uppercase', 'text-[11.5px] font-medium'),
    ('text-[11px] font-bold uppercase', 'text-[12px] font-medium'),
    # page titles
    ('text-2xl font-semibold text-[#141821]', 'text-[22px] font-semibold text-[#141821] tracking-[-0.025em]'),
    ('text-2xl font-bold text-[#141821]', 'text-[22px] font-semibold text-[#141821] tracking-[-0.025em]'),
    # Section headings that shout at 13-14px - all in dashboard tools, none
    # in the document-style strategy pages where uppercase is deliberate.
    ('text-[13px] font-bold text-[#141821] uppercase tracking-widest', 'text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]'),
    ('text-sm font-semibold text-[#43474F] uppercase tracking-wider', 'text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]'),
    ('text-sm font-bold text-[#141821] mb-3 uppercase tracking-wide', 'text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em] mb-3'),
    ('text-2xl font-semibold mb-1', 'text-[22px] font-semibold tracking-[-0.025em] mb-1'),
    ('text-3xl font-bold text-[#141821]', 'text-[26px] font-semibold text-[#141821] tracking-[-0.035em]'),
    ('text-3xl font-bold', 'text-[26px] font-semibold tracking-[-0.035em]'),
]

# Micro-labels the literal list above misses: any small-text className that
# still shouts. Verified first that no label in the dashboard is written
# lowercase in source and relies on CSS to capitalise it - removing the
# transform would have silently lowercased those.
SHOUT = re.compile(r'className="([^"]*(?:\btext-xs\b|text-\[(?:9|1[0-2])(?:\.5)?px\])[^"]*)"')

def calm(m):
    cls = m.group(1)
    cls = re.sub(r'\s*\buppercase\b', '', cls)
    cls = re.sub(r'\s*\btracking-(?:wider|widest|wide)\b', '', cls)
    cls = cls.replace('font-bold', 'font-medium')
    cls = re.sub(r'\btext-xs\b', 'text-[12.5px]', cls)
    return f'className="{cls}"'

MONO_LABEL = re.compile(
    r"\s*style=\{\{ fontFamily: MONO_FONT, letterSpacing: '[^']*' \}\}")
MONO_PARTIAL = re.compile(r"fontFamily: MONO_FONT, letterSpacing: '[^']*', ")

# Outermost page container: centring inside a left-aligned shell drifts away
# from the rail as the window widens.
CONTAINER = re.compile(r'(return \(\s*\n\s*<div className=")max-w-(?:3xl|4xl|5xl|6xl|7xl) mx-auto(")')

def sweep(path: pathlib.Path) -> int:
    src = path.read_text()
    out = src
    for a, b in SUBS:
        out = out.replace(a, b)
    out = SHOUT.sub(calm, out)
    out = MONO_LABEL.sub('', out)
    out = MONO_PARTIAL.sub('', out)
    out = CONTAINER.sub(lambda m: m.group(1) + 'max-w-[980px]' + m.group(2), out)
    if out != src:
        path.write_text(out)
        return 1
    return 0

def main():
    changed = 0
    scanned = 0
    for root in ROOTS:
        for path in pathlib.Path(root).rglob('*.tsx'):
            scanned += 1
            changed += sweep(path)
    print(f'scanned {scanned} files, rewrote {changed}')

if __name__ == '__main__':
    main()
