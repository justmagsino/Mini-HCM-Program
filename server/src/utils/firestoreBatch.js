/** Firestore `getAll` accepts at most 10 document references per call. */
export const FIRESTORE_GET_ALL_LIMIT = 10;

/**
 * @param {string[]} ids Document IDs
 * @param {(chunkIds: string[]) => Promise<object[]>} fetchChunk
 */
export async function fetchByIdChunks(ids, fetchChunk) {
  if (!ids.length) {
    return [];
  }

  const unique = [...new Set(ids)];
  const results = [];

  for (let i = 0; i < unique.length; i += FIRESTORE_GET_ALL_LIMIT) {
    const chunk = unique.slice(i, i + FIRESTORE_GET_ALL_LIMIT);
    const rows = await fetchChunk(chunk);
    results.push(...rows);
  }

  return results;
}
