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

# Plus the shared components that only the dashboard uses. src/components is
# mixed - the same folder holds client-portal and public-page components, which
# have their own design language and must never be swept. A component is fair
# game only when every file importing it lives under src/app/dashboard.
def dashboard_only_components():
    app = list(pathlib.Path('src/app').rglob('*.tsx'))
    sources = [(f, f.read_text()) for f in app]
    out = []
    for comp in pathlib.Path('src/components').glob('*.tsx'):
        token = "@/components/" + comp.stem
        importers = [f for f, text in sources if token + "'" in text or token + '"' in text]
        if importers and all('src/app/dashboard/' in str(f) for f in importers):
            out.append(comp)
    return out

# --- colour + surface tokens -------------------------------------------
SUBS = [
    # The stone ramp -> the dashboard neutrals. Mapped on the bare token so it
    # catches every prefix: bg-, text-, border-, divide-, ring-, placeholder-,
    # hover:, focus:, disabled:, from-, to-. 50-300 are surfaces and hairlines,
    # 400 and up are text.
    ('stone-50', '[#FBFCFD]'),
    ('stone-100', '[#F4F6F9]'),
    ('stone-200', '[#EFF1F4]'),
    ('stone-300', '[#E8EAEE]'),
    ('stone-400', '[#98A0AD]'),
    ('stone-500', '[#666D7A]'),
    ('stone-600', '[#666D7A]'),
    ('stone-700', '[#43474F]'),
    ('stone-800', '[#141821]'),
    ('stone-900', '[#141821]'),
    # old dashboard greys -> new
    ('border-[#E5E5E5]', 'border-[#E8EAEE]'),
    ('divide-[#E5E5E5]', 'divide-[#EFF1F4]'),
    ('bg-[#E5E5E5]', 'bg-[#EFF1F4]'),
    ('#999999', '#98A0AD'),
    ('#E5E5E5', '#E8EAEE'),
    ('#6B6B6B', '#666D7A'),
    ('#1A1A1A', '#141821'),
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
    targets = [p for root in ROOTS for p in pathlib.Path(root).rglob('*.tsx')]
    targets += dashboard_only_components()
    for path in targets:
        scanned += 1
        changed += sweep(path)
    print(f'scanned {scanned} files, rewrote {changed}')

if __name__ == '__main__':
    main()
