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
    for comp in pathlib.Path('src/components').rglob('*.tsx'):
        token = "@/components/" + str(comp.relative_to("src/components").with_suffix(""))
        importers = [f for f, text in sources if token + "'" in text or token + '"' in text]
        if importers and all('src/app/dashboard/' in str(f) for f in importers):
            out.append(comp)
    return out

# --- colour + surface tokens -------------------------------------------
SUBS = [
    # --- buttons --------------------------------------------------------
    ('text-[12.5px] font-medium px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors', 'br-btn'),
    ('text-[12.5px] font-medium px-3 py-1.5 border border-[#E8EAEE] text-[#666D7A] rounded-lg hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors', 'br-btn'),
    ('inline-flex items-center gap-2 rounded-xl bg-[#1B6DFC] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#5390FF] transition-colors', 'br-btn br-btn-primary'),

    # --- amber ----------------------------------------------------------
    # Two amber vocabularies were running side by side - Tailwind's and the
    # kit's. The kit's is the one the pills and chips use.
    ('bg-amber-50 border border-amber-200', 'bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8]'),
    ('border border-amber-200 bg-amber-50', 'border border-[#F1DEB8] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)]'),
    ('border border-amber-300 bg-amber-50', 'border border-[#F1DEB8] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)]'),
    ('bg-amber-50 border border-amber-300', 'bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8]'),
    ('text-amber-700', 'text-[#A96A12]'),
    ('text-amber-800', 'text-[#A96A12]'),
    ('text-amber-900', 'text-[#8A5A14]'),
    ('bg-[#FEF6E7]', 'bg-[#FDF6E9]'),
    ('border-[#F0DCB4]', 'border-[#F1DEB8]'),

    # --- blue -----------------------------------------------------------
    # text-blue-500 and hover:bg-blue-50 predate Signal Blue.
    ('hover:bg-[#5390FF]', 'hover:bg-[#1560E0]'),
    ('text-blue-500', 'text-[#1B6DFC]'),
    ('text-blue-700', 'text-[#1056D6]'),
    ('hover:text-blue-700', 'hover:text-[#1056D6]'),
    ('hover:bg-blue-50', 'hover:bg-[rgba(27,109,252,0.06)]'),
    ('bg-blue-50', 'bg-[rgba(27,109,252,0.08)]'),
    ('border-blue-200', 'border-[#B5CFFC]'),

    # --- semantic ramps -------------------------------------------------
    # Mapped on the bare token so every prefix comes along (bg-, text-,
    # border-, hover:, from-). Safe now that apply_sub guards digit overlap.
    ('amber-50', '[#FDF6E9]'),
    ('amber-100', '[#FAEFD8]'),
    ('amber-200', '[#F1DEB8]'),
    ('amber-300', '[#E5C98F]'),
    ('amber-400', '[#C08A2D]'),
    ('amber-500', '[#B7791F]'),
    ('amber-600', '[#A96A12]'),
    ('amber-700', '[#A96A12]'),
    ('amber-800', '[#8A5A14]'),
    ('amber-900', '[#8A5A14]'),
    ('blue-50', '[#EFF5FE]'),
    ('blue-100', '[#DDE9FD]'),
    ('blue-200', '[#B5CFFC]'),
    ('blue-300', '[#9CC0FB]'),
    ('blue-400', '[#5390FF]'),
    ('blue-500', '[#1B6DFC]'),
    ('blue-600', '[#1560E0]'),
    ('blue-700', '[#1056D6]'),
    ('blue-800', '[#0B4FCB]'),
    ('blue-900', '[#0A46B2]'),
    ('red-50', '[#FDEDED]'),
    ('red-100', '[#FBDCDC]'),
    ('red-200', '[#F5C9C9]'),
    ('red-300', '[#EFAFAF]'),
    ('red-500', '[#DC2626]'),
    ('red-600', '[#C82626]'),
    ('red-700', '[#C82626]'),
    ('red-800', '[#A11D1D]'),
    ('red-900', '[#8A1919]'),
    ('emerald-50', '[#EDF8F1]'),
    ('emerald-100', '[#D8EFE1]'),
    ('emerald-200', '[#CAE7D5]'),
    ('emerald-500', '[#22A05A]'),
    ('emerald-600', '[#177245]'),
    ('emerald-700', '[#177245]'),
    ('green-50', '[#EDF8F1]'),
    ('green-100', '[#D8EFE1]'),
    ('green-200', '[#CAE7D5]'),
    ('green-500', '[#22A05A]'),
    ('green-600', '[#177245]'),
    ('green-700', '[#177245]'),
    ('green-800', '[#125C37]'),
    ('green-900', '[#0F4A2D]'),

    # --- surfaces -------------------------------------------------------
    # Longest first: the bare `border ... rounded-xl` form must not eat the
    # backgrounded ones before they are matched.
    ('bg-[#FFFFFF]/50 border border-[#E8EAEE] rounded-xl', 'br-card'),
    ('bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl', 'br-card'),
    ('border border-[#E8EAEE] bg-[#FFFFFF] rounded-xl', 'br-card'),
    ('bg-white border border-[#E8EAEE] rounded-xl', 'br-card'),
    ('border border-[#E8EAEE] rounded-xl', 'br-card'),
    ('bg-[#FFFFFF]/50 border border-[#E8EAEE] rounded-lg', 'br-card-inset'),
    ('bg-[#F3F7FF] border border-[rgba(27,109,252,0.25)] rounded-xl', 'br-card-flagged'),
    ('rounded-xl border border-[rgba(27,109,252,0.25)] bg-[#F3F7FF]', 'br-card-flagged'),
    # Left rails on ordinary cards: the rail means "this one needs you", so on
    # every card it means nothing.
    ('border-l-2 border-[#1B6DFC] br-card', 'br-card'),
    ('br-card border-l-2 border-[#1B6DFC]', 'br-card'),
    ('hover:border-[#CFD4DC] transition-colors', 'br-card-hover transition-shadow'),

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
    # One-off greys and blues that predate the palette. #F5F3EE and #FAFAF7 are
    # the old warm neutrals - they read yellow beside the cool ones.
    ('#999999', '#98A0AD'),
    ('#F5F3EE', '#F4F6F9'),
    ('#FAFAF7', '#FBFCFD'),
    ('#EDEDED', '#EFF1F4'),
    ('#9AA3AF', '#98A0AD'),
    ('#8A8A8E', '#666D7A'),
    ('#B5B5B5', '#98A0AD'),
    ('#4A4A4A', '#43474F'),
    ('#22A054', '#177245'),
    ('#1558d6', '#1560E0'),
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
    # Arbitrary tracking too. Stripping `uppercase` while leaving
    # `tracking-[0.12em]` behind is worse than either: a Title Case label
    # stretched to letter-spacing that only ever made sense in caps.
    cls = re.sub(r'\s*\btracking-\[0?\.\d+em\]', '', cls)
    cls = cls.replace('font-bold', 'font-medium')
    cls = re.sub(r'\btext-xs\b', 'text-[12.5px]', cls)
    return f'className="{cls}"'

MONO_LABEL = re.compile(
    r"\s*style=\{\{ fontFamily: MONO_FONT, letterSpacing: '[^']*' \}\}")
MONO_PARTIAL = re.compile(r"fontFamily: MONO_FONT, letterSpacing: '[^']*', ")

# Outermost page container: centring inside a left-aligned shell drifts away
# from the rail as the window widens.
CONTAINER = re.compile(r'(return \(\s*\n\s*<div className=")max-w-(?:3xl|4xl|5xl|6xl|7xl) mx-auto(")')

# A ramp token is a prefix of the next one up - stone-50 sits inside
# stone-500, blue-50 inside blue-500. Plain string replacement ate the longer
# one and left a stray digit welded to the replacement, producing a class name
# that silently does nothing. Anything ending in a digit is replaced with a
# "not followed by another digit" guard instead.
def apply_sub(text: str, a: str, b: str) -> str:
    if a and a[-1].isdigit():
        return re.sub(re.escape(a) + r'(?!\d)', b.replace('\\', '\\\\'), text)
    return text.replace(a, b)


def sweep(path: pathlib.Path) -> int:
    src = path.read_text()
    out = src
    for a, b in SUBS:
        out = apply_sub(out, a, b)
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
