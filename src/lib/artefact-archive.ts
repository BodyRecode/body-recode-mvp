/**
 * Artefact version archive helper.
 *
 * Called by each regenerate route BEFORE the new version overwrites the
 * live row. Snapshots the current state of the artefact into
 * artefact_version_archive so the coach can later see a per-client change
 * log + diff one version against another.
 *
 * Added 2026-06-09 (item I — versioned change log per client).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type ArtefactType = 'fr' | 'pr' | 'nr' | 'tr' | 'mr' | 'wccf'

export interface ArchiveArtefactArgs {
  admin: SupabaseClient
  clientId: string
  artefactType: ArtefactType
  sourceRowId: string
  doctrineVersion: string | null
  content: Record<string, unknown>
  generatedAt: string | null
  archivedBy?: string | null
  archiveReason?: string | null
}

/**
 * Archive the OLD content of an artefact before regenerate overwrites it.
 *
 * Safe to call even if content is empty or doctrine version missing —
 * those edge cases just produce a slightly less informative archive row
 * but don't fail the regenerate.
 *
 * Fire-and-forget at the call site (errors are logged, never thrown back)
 * so a transient archive failure can't block a regenerate.
 */
export async function archiveArtefactVersion(args: ArchiveArtefactArgs): Promise<void> {
  try {
    await args.admin.from('artefact_version_archive').insert({
      client_id: args.clientId,
      artefact_type: args.artefactType,
      source_row_id: args.sourceRowId,
      doctrine_version: args.doctrineVersion,
      content: args.content,
      generated_at: args.generatedAt,
      archived_by: args.archivedBy ?? null,
      archive_reason: args.archiveReason ?? null,
    })
  } catch (err) {
    // Log but never throw — archive is best-effort, must never block a
    // regenerate.
    console.error('[artefact-archive] insert failed:', err)
  }
}

export interface ArchiveListEntry {
  id: string
  archivedAt: string
  generatedAt: string | null
  doctrineVersion: string | null
  archiveReason: string | null
  content: Record<string, unknown>
}

/**
 * List archive entries for a single artefact (by source row id). Newest first.
 */
export async function listArtefactArchive(
  admin: SupabaseClient,
  sourceRowId: string,
): Promise<ArchiveListEntry[]> {
  const { data } = await admin
    .from('artefact_version_archive')
    .select('id, archived_at, generated_at, doctrine_version, archive_reason, content')
    .eq('source_row_id', sourceRowId)
    .order('archived_at', { ascending: false })
  return (data ?? []).map(d => ({
    id: d.id,
    archivedAt: d.archived_at,
    generatedAt: d.generated_at,
    doctrineVersion: d.doctrine_version,
    archiveReason: d.archive_reason,
    content: (d.content as Record<string, unknown>) ?? {},
  }))
}
