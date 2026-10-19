/**
 * ARBA Context OS — ingestion scaffold.
 *
 * Takes a context_item, splits its body into chunks, embeds each chunk, and
 * stores the vectors in context_chunks for semantic search.
 *
 * Run server-side with the SERVICE ROLE key (ingestion writes bypass RLS).
 *
 * Embeddings: Anthropic recommends Voyage AI. Plug your provider into embed().
 * Keep the output dimension in sync with the vector(N) column in migration
 * 0002 (default 1024 = voyage-3). If you change models, re-ingest everything.
 */

import { createServiceClient } from '../src/db/client';

/** Must equal the vector(N) dimension in migration 0002. */
export const EMBEDDING_DIM = 1024;

/** Simple character-based chunker with overlap. Swap for a token-aware one later. */
export function chunkText(text: string, maxChars = 1200, overlap = 150): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) {
    return clean.length ? [clean] : [];
  }
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + maxChars, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = end - overlap;
  }
  return chunks;
}

/**
 * Embed a batch of texts. REPLACE the body with a real call to your provider
 * (Voyage AI / OpenAI / etc). Must return one vector of length EMBEDDING_DIM
 * per input text, in order.
 */
async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  // Example shape (Voyage AI):
  //   const res = await fetch('https://api.voyageai.com/v1/embeddings', {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       model: process.env.EMBEDDING_MODEL ?? 'voyage-3',
  //       input: texts,
  //     }),
  //   });
  //   if (!res.ok) throw new Error(`embedding request failed: ${res.status}`);
  //   const json = (await res.json()) as { data: { embedding: number[] }[] };
  //   return json.data.map((d) => d.embedding);
  throw new Error('embed() not implemented — plug in your embedding provider');
}

/** Re-chunk, re-embed, and replace the chunks for one context item. */
export async function ingestItem(itemId: string): Promise<number> {
  const db = createServiceClient();

  const { data: item, error } = await db
    .from('context_items')
    .select('id, body')
    .eq('id', itemId)
    .single();
  if (error || !item) {
    throw new Error(`ingestItem: context item not found (${itemId})`);
  }

  const chunks = chunkText((item as { body: string }).body);
  const vectors = await embed(chunks);
  if (vectors.length !== chunks.length) {
    throw new Error('ingestItem: embedding count does not match chunk count');
  }

  const { error: delErr } = await db
    .from('context_chunks')
    .delete()
    .eq('context_item_id', itemId);
  if (delErr) {
    throw new Error(`ingestItem: clearing old chunks failed: ${delErr.message}`);
  }

  if (chunks.length === 0) return 0;

  const rows = chunks.map((content, i) => ({
    context_item_id: itemId,
    chunk_index: i,
    content,
    embedding: vectors[i],
  }));

  const { error: insErr } = await db.from('context_chunks').insert(rows);
  if (insErr) {
    throw new Error(`ingestItem: chunk insert failed: ${insErr.message}`);
  }
  return rows.length;
}
