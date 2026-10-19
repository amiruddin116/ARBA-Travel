// Typed query functions for context_items and semantic search.
// All of these must be called with a USER-scoped client (createUserClient)
// so Row-Level Security filters results to what the user is allowed to see.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ContextItem,
  ContextSensitivity,
  ContextStatus,
  MatchedContext,
} from '../../types/context';

interface ContextItemRow {
  id: string;
  title: string;
  body: string;
  summary: string | null;
  source: string;
  source_ref: string | null;
  owner_department_id: string;
  sensitivity: ContextSensitivity;
  status: ContextStatus;
  tags: string[];
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface MatchRow {
  context_item_id: string;
  chunk_id: string;
  title: string;
  content: string;
  owner_department_id: string;
  similarity: number;
}

function mapItem(row: ContextItemRow): ContextItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    summary: row.summary,
    source: row.source,
    sourceRef: row.source_ref,
    ownerDepartmentId: row.owner_department_id,
    sensitivity: row.sensitivity,
    status: row.status,
    tags: row.tags,
    version: row.version,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMatch(row: MatchRow): MatchedContext {
  return {
    contextItemId: row.context_item_id,
    chunkId: row.chunk_id,
    title: row.title,
    content: row.content,
    ownerDepartmentId: row.owner_department_id,
    similarity: row.similarity,
  };
}

export interface SearchOptions {
  matchCount?: number;
  minSimilarity?: number;
  departmentId?: string;
}

/**
 * Permission-aware semantic search. The caller passes a query embedding
 * (same model/dimension as ingestion). RLS on the underlying tables limits
 * results to context this user may read — including for AI agents.
 */
export async function searchContext(
  client: SupabaseClient,
  queryEmbedding: number[],
  opts: SearchOptions = {},
): Promise<MatchedContext[]> {
  const { data, error } = await client.rpc('match_context', {
    query_embedding: queryEmbedding,
    match_count: opts.matchCount ?? 8,
    min_similarity: opts.minSimilarity ?? 0,
    filter_department: opts.departmentId ?? null,
  });
  if (error) {
    throw new Error(`searchContext failed: ${error.message}`);
  }
  return ((data as MatchRow[]) ?? []).map(mapMatch);
}

export interface CreateContextInput {
  title: string;
  body: string;
  ownerDepartmentId: string;
  sensitivity?: ContextSensitivity;
  tags?: string[];
  source?: string;
  sourceRef?: string;
}

/** Create a context item. RLS enforces that the caller may write to this dept. */
export async function createContextItem(
  client: SupabaseClient,
  input: CreateContextInput,
): Promise<ContextItem> {
  const { data, error } = await client
    .from('context_items')
    .insert({
      title: input.title,
      body: input.body,
      owner_department_id: input.ownerDepartmentId,
      sensitivity: input.sensitivity ?? 'shared',
      tags: input.tags ?? [],
      source: input.source ?? 'manual',
      source_ref: input.sourceRef ?? null,
    })
    .select()
    .single();
  if (error) {
    throw new Error(`createContextItem failed: ${error.message}`);
  }
  return mapItem(data as ContextItemRow);
}

/** List context items the caller may read, newest first. RLS applies. */
export async function listContextItems(
  client: SupabaseClient,
  opts: { departmentId?: string; limit?: number } = {},
): Promise<ContextItem[]> {
  let query = client
    .from('context_items')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.departmentId) {
    query = query.eq('owner_department_id', opts.departmentId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`listContextItems failed: ${error.message}`);
  }
  return ((data as ContextItemRow[]) ?? []).map(mapItem);
}
