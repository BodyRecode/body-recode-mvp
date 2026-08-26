#!/usr/bin/env python3
"""
Give hand-rolled dashboard page headers the same treatment PageHeader gets.

45 dashboard pages use the kit's <PageHeader>; the rest hand-rolled a header
before it existed, in a dozen slightly different shapes. Converting them all
to the component means restructuring JSX around variable-length action rows -
fragile, and the win is visual, not structural. So this walks up from each
page's <h1> to its enclosing wrapper div and gives that div the header's own
styling: sticky to the top, a hairline under it, the same rhythm. The page
keeps its markup; it stops looking like a different product.

Idempotent - a wrapper already carrying the marker class is left alone.
Skips preview/ (email previews), print/ (print layouts stay plain), the
report documents and the automation detail page (printable artefacts built
with inline styles), and the document-style strategy, brand and collective
pages, whose editorial design is deliberately not the dashboard's.
"""
import re
import pathlib

SKIP = (
    '/preview/', '/print/', '/help/',
    '/business/strategy/', '/business/personal-brand/', '/business/collective/',
    '/cffs-report/', '/cfws-report/', '/automations/system/',
    # The lead record's title sits inside its command-bar card, so the nearest
    # wrapper is not a page header. Styled by hand.
    '/leads/[id]/',
)
MARKER = 'br-page-header'
HEADER_CLASSES = (
    MARKER + ' sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] '
    'bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent'
)
WRAPPER = re.compile(r'^(\s*)<div className="([^"]*)">\s*$')

# A column inside a header row is never the header itself - styling it strands
# the back arrow or the action buttons outside the band.
INNER_ONLY = {'flex-1', 'min-w-0', 'flex-1 min-w-0'}


def restyle(path):
    src = path.read_text()
    if 'PageHeader' in src:
        return 'uses PageHeader'
    lines = src.split('\n')
    # Every <h1>, not just the first: a page with an early return for its
    # empty state has two headers and both need the treatment.
    titles = [i for i, line in enumerate(lines) if '<h1' in line]
    if not titles:
        return 'no <h1>'

    changed = False
    for title in titles:
        for i in range(title, max(title - 12, -1), -1):
            m = WRAPPER.match(lines[i])
            if not m:
                continue
            indent, cls = m.groups()
            if MARKER in cls:
                break
            if cls.strip() in INNER_ONLY:
                continue
            cls = ' '.join(re.sub(r'\bmb-\d+(?:\.\d+)?\b', '', cls).split())
            prefix = cls + ' ' if cls else ''
            lines[i] = indent + '<div className="' + prefix + HEADER_CLASSES + '">'
            changed = True
            break

    if changed:
        path.write_text('\n'.join(lines))
        return None
    return 'nothing to do'


def main():
    done, problems = 0, []
    for path in sorted(pathlib.Path('src/app/dashboard').rglob('page.tsx')):
        if any(s in str(path) for s in SKIP):
            continue
        why = restyle(path)
        if why is None:
            done += 1
        elif why not in ('no <h1>', 'uses PageHeader', 'nothing to do'):
            problems.append((str(path), why))
    print('restyled %d page headers' % done)
    for p, why in problems:
        print('  UNHANDLED %s: %s' % (p, why))


if __name__ == '__main__':
    main()
