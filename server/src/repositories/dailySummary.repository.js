import { db } from '../config/firebaseAdmin.js';
import { buildDailySummaryId } from '../utils/dates.js';
import { fetchByIdChunks } from '../utils/firestoreBatch.js';

const COLLECTION = 'dailySummary';

/**
 * @param {FirebaseFirestore.DocumentSnapshot} doc
 */
export function mapDailySummaryDocToDto(doc) {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();

  return {
    userId: data.userId,
    date: data.date,
    totalRegularHours: data.totalRegularHours ?? 0,
    totalOvertimeHours: data.totalOvertimeHours ?? 0,
    totalNightDifferentialHours: data.totalNightDifferentialHours ?? 0,
    totalLateMinutes: data.totalLateMinutes ?? 0,
    totalUndertimeMinutes: data.totalUndertimeMinutes ?? 0,
  };
}

/**
 * @param {{
 *   userId: string;
 *   date: string;
 *   totalRegularHours: number;
 *   totalOvertimeHours: number;
 *   totalNightDifferentialHours: number;
 *   totalLateMinutes: number;
 *   totalUndertimeMinutes: number;
 * }} data
 */
export async function upsert(data) {
  const id = buildDailySummaryId(data.userId, data.date);
  const ref = db.collection(COLLECTION).doc(id);

  await ref.set({
    userId: data.userId,
    date: data.date,
    totalRegularHours: data.totalRegularHours,
    totalOvertimeHours: data.totalOvertimeHours,
    totalNightDifferentialHours: data.totalNightDifferentialHours,
    totalLateMinutes: data.totalLateMinutes,
    totalUndertimeMinutes: data.totalUndertimeMinutes,
  });

  const doc = await ref.get();
  return mapDailySummaryDocToDto(doc);
}

/**
 * @param {string} userId
 * @param {string} date YYYY-MM-DD
 */
export async function getByUserAndDate(userId, date) {
  const id = buildDailySummaryId(userId, date);
  const doc = await db.collection(COLLECTION).doc(id).get();
  return mapDailySummaryDocToDto(doc);
}

/**
 * @param {string} userId
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 */
export async function queryByUserAndDateRange(userId, from, to) {
  const snapshot = await db
    .collection(COLLECTION)
    .where('userId', '==', userId)
    .where('date', '>=', from)
    .where('date', '<=', to)
    .orderBy('date', 'asc')
    .get();

  return snapshot.docs.map((doc) => mapDailySummaryDocToDto(doc));
}

/**
 * All summaries on a single calendar date (admin team daily report).
 * @param {string} date YYYY-MM-DD
 */
export async function queryByDate(date) {
  const snapshot = await db
    .collection(COLLECTION)
    .where('date', '==', date)
    .limit(1000)
    .get();
  return snapshot.docs.map((doc) => mapDailySummaryDocToDto(doc));
}

/**
 * Direct document lookups by composite id (userId_date).
 * @param {string[]} ids
 */
export async function getByIds(ids) {
  if (!ids.length) {
    return [];
  }

  return fetchByIdChunks(ids, async (chunk) => {
    const refs = chunk.map((id) => db.collection(COLLECTION).doc(id));
    const docs = await db.getAll(...refs);
    return docs.map((doc) => mapDailySummaryDocToDto(doc)).filter(Boolean);
  });
}

/**
 * Summaries in an inclusive date range (admin weekly batch query).
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 */
export async function queryByDateRange(from, to) {
  const snapshot = await db
    .collection(COLLECTION)
    .where('date', '>=', from)
    .where('date', '<=', to)
    .orderBy('date', 'asc')
    .get();

  return snapshot.docs.map((doc) => mapDailySummaryDocToDto(doc));
}
