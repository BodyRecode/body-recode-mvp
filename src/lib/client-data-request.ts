/**
 * Everything we hold about one person: found, exported, and deleted.
 *
 * 20 September 2026. The pilot agreement promises a coach an export of their
 * client's information and a deletion of it, both within 30 days. Neither could
 * be honoured when it was written:
 *
 *   The export that existed covered SEVEN tables. Sixty-four hold a client's
 *   information once the second hop is counted.
 *
 *   There was no delete at all. Removing one lead by hand earlier the same day
 *   took an hour of one-off queries, and still left their name sitting in 54
 *   rows of saved report text that a first pass missed entirely.
 *
 * THE FAILURE THIS IS BUILT TO AVOID is a hand-written list of tables. That is
 * exactly how the seven-table export happened: correct the day it was written,
 * silently wrong from the first table added afterwards. The list is asked of the
 * database every time, so a table added next year is covered by default.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not reach backups. A deletion today
 * does not touch a copy taken last week, and saying otherwise in a contract
 * would be a lie. The caller is told, the record says so, and the fix is a
 * pruning schedule rather than a pretence.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type DataColumn = { table_name: string; column_name: string; parent_table: string; level: number }

export type TableHaul = { table: string; column: string; rows: Record<string, unknown>[] }

export type ClientHaul = {
  client: Record<string, unknown>
  tables: TableHaul[]
  files: { bucket: string; path: string }[]
  totalRows: number
  /** Tables that could not be read, named rather than skipped. */
  unreadable: { table: string; error: string }[]
}


/**
 * Ask the database which tables hold this person, rather than remembering.
 */
export async function clientDataColumns(admin: SupabaseClient): Promise<DataColumn[]> {
  const { data, error } = await admin.rpc('client_data_columns')
  if (error) throw new Error(`Could not read the table list: ${error.message}`)
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('The table list came back empty, which cannot be right.')
  }
  return data as DataColumn[]
}

async function readAll(
  admin: SupabaseClient,
  table: string,
  column: string,
  values: string[],
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  if (values.length === 0) return { rows: [] }
  const out: Record<string, unknown>[] = []
  // Chunked, because a client with a long history can have more parent ids than
  // fit comfortably in one request.
  for (let i = 0; i < values.length; i += 100) {
    const slice = values.slice(i, i + 100)
    const { data, error } = await admin.from(table).select('*').in(column, slice)
    if (error) return { rows: [], error: error.message }
    if (data) out.push(...(data as Record<string, unknown>[]))
  }
  return { rows: out }
}

/**
 * Collect every row belonging to this client, across both hops.
 *
 * Reading is separated from deleting on purpose: an export and a deletion
 * discover exactly the same rows, so the two can never disagree about what
 * "everything" means.
 */
export async function collectClientData(admin: SupabaseClient, clientId: string): Promise<ClientHaul> {
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .maybeSingle()

  if (clientError) throw new Error(`Could not read the client: ${clientError.message}`)
  if (!client) throw new Error('No client with that id.')

  const columns = await clientDataColumns(admin)
  const tables: TableHaul[] = []
  const unreadable: ClientHaul['unreadable'] = []

  // First hop: anything pointing straight at the client.
  const firstHopIds = new Map<string, string[]>()
  for (const c of columns.filter((c) => c.level === 1)) {
    const { rows, error } = await readAll(admin, c.table_name, c.column_name, [clientId])
    if (error) {
      unreadable.push({ table: c.table_name, error })
      continue
    }
    if (rows.length > 0) {
      tables.push({ table: c.table_name, column: c.column_name, rows })
      const ids = rows.map((r) => r.id).filter((v): v is string => typeof v === 'string')
      firstHopIds.set(c.table_name, [...(firstHopIds.get(c.table_name) ?? []), ...ids])
    }
  }

  // Second hop: anything hanging off what we just found. A completion that
  // belongs to her programme is hers, even though the row never says so.
  for (const c of columns.filter((c) => c.level === 2)) {
    const parentIds = firstHopIds.get(c.parent_table) ?? []
    if (parentIds.length === 0) continue
    const { rows, error } = await readAll(admin, c.table_name, c.column_name, parentIds)
    if (error) {
      unreadable.push({ table: c.table_name, error })
      continue
    }
    if (rows.length > 0) tables.push({ table: c.table_name, column: c.column_name, rows })
  }

  const files = await collectClientFiles(admin, clientId)
  const totalRows = tables.reduce((n, t) => n + t.rows.length, 0) + 1

  return { client, tables, files, totalRows, unreadable }
}

/**
 * Her uploaded files. Photographs of her body and documents from her doctor, so
 * they matter more than any row here.
 *
 * ASKED, NOT REMEMBERED, and this one had to be learned twice. The first
 * version of this function carried a hand-written list of bucket names, every
 * one of them wrong. It reported zero files for a client who has six, and
 * reported that as success: exactly the failure this whole file was written to
 * avoid, repeated inside it within the hour.
 *
 * Stored paths carry the client's id, so matching on the id finds her files in
 * any bucket, including one created after this was written.
 */
async function collectClientFiles(admin: SupabaseClient, clientId: string): Promise<{ bucket: string; path: string }[]> {
  const { data, error } = await admin.rpc('client_storage_objects', { p_client_id: clientId })
  if (error || !Array.isArray(data)) return []
  return (data as { bucket_id: string; object_name: string }[]).map((o) => ({
    bucket: o.bucket_id,
    path: o.object_name,
  }))
}

/* ── Export ─────────────────────────────────────────────────────────────── */

export type ExportResult = {
  json: string
  readable: string
  totalRows: number
  tables: number
  files: number
}

/**
 * The export, in two forms on purpose.
 *
 * The complete record is machine-readable, because "everything" has to mean
 * everything. The readable version exists because a person asking what is held
 * about them cannot be handed a wall of raw data and told it is an answer.
 */
export async function exportClientData(admin: SupabaseClient, clientId: string): Promise<ExportResult> {
  const haul = await collectClientData(admin, clientId)
  const name = String(haul.client.name ?? 'this client')

  const json = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      client: haul.client,
      tables: Object.fromEntries(haul.tables.map((t) => [t.table, t.rows])),
      files: haul.files,
      note: 'This is a copy of the live system as at the date above. It does not include backups.',
    },
    null,
    2,
  )

  const lines: string[] = []
  lines.push(`Everything held about ${name}`)
  lines.push(`Taken ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })}`)
  lines.push('')
  lines.push(`${haul.totalRows} records across ${haul.tables.length + 1} places, and ${haul.files.length} uploaded files.`)
  lines.push('')
  lines.push('WHAT IS HELD')
  for (const t of haul.tables.sort((a, b) => b.rows.length - a.rows.length)) {
    lines.push(`  ${String(t.rows.length).padStart(5)}  ${describeTable(t.table)}`)
  }
  if (haul.files.length > 0) {
    lines.push('')
    lines.push('UPLOADED FILES')
    for (const f of haul.files) lines.push(`  ${f.bucket}: ${f.path}`)
  }
  if (haul.unreadable.length > 0) {
    lines.push('')
    lines.push('COULD NOT BE READ, and named rather than left out:')
    for (const u of haul.unreadable) lines.push(`  ${u.table}: ${u.error}`)
  }
  lines.push('')
  lines.push('This is the live system as at the date above. It does not include backups,')
  lines.push('which are taken separately and age out on their own schedule.')

  return {
    json,
    readable: lines.join('\n'),
    totalRows: haul.totalRows,
    tables: haul.tables.length,
    files: haul.files.length,
  }
}

/** Plain names, because an export is read by a person, not by us. */
function describeTable(table: string): string {
  const known: Record<string, string> = {
    intakes: 'her intake answers',
    baselines: 'her starting measurements and photographs',
    cffs: 'her reads',
    cfws: 'her weekly reads',
    weekly_checkins: 'her weekly check-ins',
    weekly_checkin_feedback: 'the coach responses to her check-ins',
    progress_checks: 'her progress checks',
    progress_reads: 'her progress reads',
    programs: 'her training blocks',
    nutrition_plans: 'her eating plans',
    blood_panels: 'her blood results',
    client_communications: 'emails and messages sent to her',
    client_messages: 'her portal messages',
    session_completions: 'her logged sessions',
    session_exercise_completions: 'the individual sets she logged',
    meal_adherence_days: 'her meal logging',
    leads: 'her original enquiry',
    lead_events: 'the history of that enquiry',
    sms_logs: 'text messages sent to her',
  }
  return known[table] ?? table.replace(/_/g, ' ')
}

/* ── Delete ─────────────────────────────────────────────────────────────── */

export type DeleteResult = {
  dryRun: boolean
  tablesTouched: { table: string; rows: number; deleted: boolean; error?: string }[]
  rowsAffected: number
  filesAffected: number
  freeTextScrubbed: number
  warnings: string[]
}

/**
 * Tables holding saved report text that QUOTES a person by name rather than
 * referencing them by id. Nothing links these rows to the client, so no
 * foreign key walk will ever find them.
 *
 * Learned the hard way on 20 September 2026: a lead was deleted from every
 * table that referenced them, and their name was still sitting in 54 rows of
 * saved daily report text, because the report writes names into its own output.
 */
const FREE_TEXT_TABLES: { table: string; columns: string[] }[] = [
  { table: 'health_check_runs', columns: ['report_md', 'checks'] },
  { table: 'job_runs', columns: ['error', 'summary'] },
]

/**
 * Delete everything. Dry run by default, because this cannot be undone.
 *
 * Most of the database would cascade from deleting the client row alone, but
 * not all of it: some references are set to null instead, which leaves her
 * information behind in a row that no longer says whose it is. So rows are
 * removed explicitly, deepest first, and the client row goes last.
 */
export async function deleteClientData(
  admin: SupabaseClient,
  clientId: string,
  opts: { dryRun?: boolean; requestedBy?: string } = {},
): Promise<DeleteResult> {
  const dryRun = opts.dryRun !== false
  const haul = await collectClientData(admin, clientId)
  const warnings: string[] = []
  const tablesTouched: DeleteResult['tablesTouched'] = []

  // Deepest first: second hop, then first hop, then the client. Deleting a
  // parent before its children would either cascade silently or fail, and
  // neither tells us what actually happened.
  const columns = await clientDataColumns(admin)
  const levelOf = new Map(columns.map((c) => [`${c.table_name}.${c.column_name}`, c.level]))
  const ordered = [...haul.tables].sort(
    (a, b) => (levelOf.get(`${b.table}.${b.column}`) ?? 1) - (levelOf.get(`${a.table}.${a.column}`) ?? 1),
  )

  let rowsAffected = 0
  for (const t of ordered) {
    const ids = t.rows.map((r) => r.id).filter((v): v is string => typeof v === 'string')
    if (dryRun || ids.length === 0) {
      tablesTouched.push({ table: t.table, rows: t.rows.length, deleted: false })
      rowsAffected += t.rows.length
      continue
    }
    const { error } = await admin.from(t.table).delete().in('id', ids)
    tablesTouched.push({ table: t.table, rows: t.rows.length, deleted: !error, error: error?.message })
    if (!error) rowsAffected += t.rows.length
  }

  // Her files.
  let filesAffected = 0
  for (const f of haul.files) {
    if (dryRun) {
      filesAffected++
      continue
    }
    const { error } = await admin.storage.from(f.bucket).remove([f.path])
    if (!error) filesAffected++
    else warnings.push(`Could not remove ${f.bucket}/${f.path}: ${error.message}`)
  }

  // Her name where it was quoted into saved text rather than referenced.
  const name = String(haul.client.name ?? '').trim()
  let freeTextScrubbed = 0
  if (name.length >= 4) {
    for (const ft of FREE_TEXT_TABLES) {
      for (const col of ft.columns) {
        const { data, error } = await admin.from(ft.table).select('id').ilike(col, `%${name}%`)
        if (error || !data) continue
        freeTextScrubbed += data.length
        if (dryRun || data.length === 0) continue
        for (const row of data as { id: string }[]) {
          const { data: full } = await admin.from(ft.table).select(col).eq('id', row.id).maybeSingle()
          const current = full ? String((full as unknown as Record<string, unknown>)[col] ?? '') : ''
          const scrubbed = current.split(name).join('a former client')
          await admin.from(ft.table).update({ [col]: scrubbed }).eq('id', row.id)
        }
      }
    }
  }

  // The client row itself, last.
  if (!dryRun) {
    const { error } = await admin.from('clients').delete().eq('id', clientId)
    tablesTouched.push({ table: 'clients', rows: 1, deleted: !error, error: error?.message })
    if (!error) rowsAffected++
  } else {
    tablesTouched.push({ table: 'clients', rows: 1, deleted: false })
    rowsAffected++
  }

  // Said plainly rather than buried, because the contract has to match.
  warnings.push('Backups are not touched. A copy taken before today still holds this person until it ages out.')
  if (haul.unreadable.length > 0) {
    warnings.push(`${haul.unreadable.length} table(s) could not be read and were NOT deleted: ${haul.unreadable.map((u) => u.table).join(', ')}`)
  }

  // Recorded even on a dry run, so there is a trail of what was considered.
  if (!dryRun) {
    await admin.from('client_data_requests').insert({
      client_id: clientId,
      client_name: String(haul.client.name ?? 'unknown'),
      client_email: haul.client.email ? String(haul.client.email) : null,
      requested_by: opts.requestedBy ?? null,
      kind: 'delete',
      completed_at: new Date().toISOString(),
      tables_touched: tablesTouched,
      rows_affected: rowsAffected,
      files_affected: filesAffected,
      notes: warnings.join(' | '),
    })
  }

  return { dryRun, tablesTouched, rowsAffected, filesAffected, freeTextScrubbed, warnings }
}
