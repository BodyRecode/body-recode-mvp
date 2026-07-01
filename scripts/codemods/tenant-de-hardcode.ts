/**
 * Codemod: replace hardcoded Body Recode string literals with tenant-config
 * helper calls. AST-aware, handles JSX + template literals + import injection.
 *
 * Usage: `npx tsx scripts/codemods/tenant-de-hardcode.ts` (dry-run report)
 *        `npx tsx scripts/codemods/tenant-de-hardcode.ts --write` (mutate files)
 *
 * Excludes: src/config/tenant.ts (source of truth), src/lib/tenant-resolver.ts
 * (scaffold), scripts/, node_modules/, .next/.
 *
 * Patterns handled:
 *   Email addresses:
 *     'kade@bodyrecode.au'                → coach().email
 *     'info@bodyrecode.au'                → brand().supportEmail
 *     'kade@send.bodyrecode.au'           → brand().fromEmail
 *     'kade@replies.bodyrecode.au'        → brand().replyToEmail
 *   Domain URLs:
 *     'https://performance.bodyrecode.au' → brand().performanceDomain
 *     'https://bodyrecode.au'             → brand().marketingDomain
 *     'https://app.bodyrecode.au'         → appUrl()
 *   Domain URLs with paths:
 *     'https://performance.bodyrecode.au/X' → `${brand().performanceDomain}/X`
 *     'https://bodyrecode.au/X'             → `${brand().marketingDomain}/X`
 *     'https://app.bodyrecode.au/X'         → `${appUrl()}/X`
 *   Template-literal substrings (inside `...`):
 *     kade@bodyrecode.au                  → ${coach().email}
 *     etc. for each pattern above
 *
 * Also adds required imports (coach/brand from @/config/tenant, appUrl from
 * @/lib/app-url) when a file uses a symbol without importing it.
 */

import { Project, SyntaxKind, Node, SourceFile, ImportDeclaration } from 'ts-morph'
import * as path from 'path'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const DRY_RUN = !process.argv.includes('--write')

type Replacement = {
  literal: string           // e.g. 'kade@bodyrecode.au'
  expression: string        // e.g. 'coach().email'
  importFrom: '@/config/tenant' | '@/lib/app-url'
  importName: 'coach' | 'brand' | 'appUrl'
}

// Note: order matters. Longer patterns first so we don't accidentally
// match kade@bodyrecode.au inside kade@send.bodyrecode.au.
const REPLACEMENTS: Replacement[] = [
  {
    literal: 'kade@send.bodyrecode.au',
    expression: 'brand().fromEmail',
    importFrom: '@/config/tenant',
    importName: 'brand',
  },
  {
    literal: 'kade@replies.bodyrecode.au',
    expression: 'brand().replyToEmail',
    importFrom: '@/config/tenant',
    importName: 'brand',
  },
  {
    literal: 'kade@bodyrecode.au',
    expression: 'coach().email',
    importFrom: '@/config/tenant',
    importName: 'coach',
  },
  {
    literal: 'info@bodyrecode.au',
    expression: 'brand().supportEmail',
    importFrom: '@/config/tenant',
    importName: 'brand',
  },
  {
    literal: 'https://performance.bodyrecode.au',
    expression: 'brand().performanceDomain',
    importFrom: '@/config/tenant',
    importName: 'brand',
  },
  {
    literal: 'https://app.bodyrecode.au',
    expression: 'appUrl()',
    importFrom: '@/lib/app-url',
    importName: 'appUrl',
  },
  {
    literal: 'https://bodyrecode.au',
    expression: 'brand().marketingDomain',
    importFrom: '@/config/tenant',
    importName: 'brand',
  },
]

// Files to skip
const SKIP_FILES = [
  'src/config/tenant.ts',
  'src/lib/tenant-resolver.ts',
  'src/lib/app-url.ts',
  'src/middleware.ts',        // hardcoded host constants for redirect logic
]

function shouldSkip(filePath: string): boolean {
  const rel = path.relative(REPO_ROOT, filePath)
  if (rel.startsWith('node_modules/') || rel.startsWith('.next/') || rel.startsWith('scripts/')) return true
  return SKIP_FILES.some((skip) => rel === skip || rel.endsWith('/' + skip))
}

// Track what imports each file needs
const neededImports = new Map<string, Set<{from: string; name: string}>>()

function markImportNeeded(filePath: string, from: string, name: string) {
  if (!neededImports.has(filePath)) neededImports.set(filePath, new Set())
  const set = neededImports.get(filePath)!
  // Deduplicate by string key
  const key = `${from}::${name}`
  const exists = Array.from(set).some((e) => `${e.from}::${e.name}` === key)
  if (!exists) set.add({from, name})
}

function transformStringLiteral(node: Node, filePath: string): boolean {
  if (!Node.isStringLiteral(node) && !Node.isNoSubstitutionTemplateLiteral(node)) return false
  const value = node.getLiteralValue()

  // Detect JSX attribute context — parent is JsxAttribute or is inside JsxAttribute Initializer.
  // In JSX, replacing "foo" with an expression needs {expression} wrapping.
  const parent = node.getParent()
  const isJsxAttribute = parent?.getKind() === SyntaxKind.JsxAttribute

  for (const r of REPLACEMENTS) {
    // Exact match → naked expression (JSX: wrap in {...})
    if (value === r.literal) {
      const replacement = isJsxAttribute ? `{${r.expression}}` : r.expression
      node.replaceWithText(replacement)
      markImportNeeded(filePath, r.importFrom, r.importName)
      return true
    }
    // Starts-with match with path → template literal with expression + path
    if (value.startsWith(r.literal + '/')) {
      const tail = value.slice(r.literal.length)  // includes leading /
      // Escape backticks and ${ in tail
      const safeTail = tail.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
      const templateStr = `\`\${${r.expression}}${safeTail}\``
      const replacement = isJsxAttribute ? `{${templateStr}}` : templateStr
      node.replaceWithText(replacement)
      markImportNeeded(filePath, r.importFrom, r.importName)
      return true
    }
  }
  return false
}

function transformTemplateLiteral(node: Node, filePath: string): boolean {
  if (!Node.isTemplateExpression(node)) return false
  let changed = false

  // Get the full template as a source string, then check each replacement
  const fullText = node.getText()
  let newText = fullText

  for (const r of REPLACEMENTS) {
    // Replace occurrences of the literal INSIDE the template (not already interpolated)
    // Simple substring check — the template already has ${...} for existing interpolations
    if (newText.includes(r.literal)) {
      const escaped = r.literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(escaped, 'g')
      newText = newText.replace(re, `\${${r.expression}}`)
      markImportNeeded(filePath, r.importFrom, r.importName)
      changed = true
    }
  }

  if (changed && newText !== fullText) {
    node.replaceWithText(newText)
  }
  return changed
}

function processFile(sf: SourceFile): number {
  const filePath = sf.getFilePath()
  if (shouldSkip(filePath)) return 0

  let mutations = 0

  // Two passes to avoid iterator invalidation:
  // 1. Collect all target nodes
  // 2. Transform each

  // Pass 1: string literals (single/double quotes, backtick-no-sub)
  const stringNodes: Node[] = []
  sf.forEachDescendant((n) => {
    if (Node.isStringLiteral(n) || Node.isNoSubstitutionTemplateLiteral(n)) {
      const value = (n as any).getLiteralValue?.() as string | undefined
      if (typeof value !== 'string') return
      if (REPLACEMENTS.some((r) => value === r.literal || value.startsWith(r.literal + '/'))) {
        stringNodes.push(n)
      }
    }
  })

  // Pass 2: template expressions (backticks with ${...})
  const templateNodes: Node[] = []
  sf.forEachDescendant((n) => {
    if (Node.isTemplateExpression(n)) {
      const text = n.getText()
      if (REPLACEMENTS.some((r) => text.includes(r.literal))) {
        templateNodes.push(n)
      }
    }
  })

  // Transform (reverse order preserves positions)
  for (const n of [...stringNodes].reverse()) {
    if (transformStringLiteral(n, filePath)) mutations++
  }
  for (const n of [...templateNodes].reverse()) {
    if (transformTemplateLiteral(n, filePath)) mutations++
  }

  return mutations
}

function addNeededImports(project: Project) {
  for (const [filePath, imports] of neededImports.entries()) {
    const sf = project.getSourceFile(filePath)
    if (!sf) continue

    // Group by "from" path
    const byFrom = new Map<string, Set<string>>()
    for (const imp of imports) {
      if (!byFrom.has(imp.from)) byFrom.set(imp.from, new Set())
      byFrom.get(imp.from)!.add(imp.name)
    }

    for (const [from, names] of byFrom.entries()) {
      // Check existing imports from this module
      const existing = sf.getImportDeclarations().find((d) => d.getModuleSpecifierValue() === from)
      if (existing) {
        // Add missing named imports
        const currentNamed = new Set(existing.getNamedImports().map((n) => n.getName()))
        const toAdd = Array.from(names).filter((n) => !currentNamed.has(n))
        if (toAdd.length > 0) {
          existing.addNamedImports(toAdd)
        }
      } else {
        // Insert new import at the top (after existing imports)
        const allImports = sf.getImportDeclarations()
        const insertIdx = allImports.length > 0
          ? allImports[allImports.length - 1].getChildIndex() + 1
          : 0
        sf.insertImportDeclaration(insertIdx, {
          moduleSpecifier: from,
          namedImports: Array.from(names),
        })
      }
    }
  }
}

async function main() {
  console.log(`Loading project from ${REPO_ROOT}...`)
  const project = new Project({
    tsConfigFilePath: path.join(REPO_ROOT, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  })

  // Get all source files under src/
  const sourceFiles = project.getSourceFiles().filter((sf) => {
    const filePath = sf.getFilePath()
    return filePath.includes('/src/') && !shouldSkip(filePath)
  })

  console.log(`Analyzing ${sourceFiles.length} source files...`)

  let totalMutations = 0
  let filesChanged = 0
  for (const sf of sourceFiles) {
    const before = neededImports.size
    const mutations = processFile(sf)
    if (mutations > 0) {
      totalMutations += mutations
      filesChanged++
    }
  }

  console.log(`\nMutations: ${totalMutations} across ${filesChanged} files`)

  if (DRY_RUN) {
    console.log(`\nDRY RUN — no files changed. Re-run with --write to apply.`)
    return
  }

  console.log(`\nAdding required imports...`)
  addNeededImports(project)

  console.log(`Saving...`)
  await project.save()
  console.log(`Done.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
