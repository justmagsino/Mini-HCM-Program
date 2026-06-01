import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebaseAdmin.js';
import { buildAttendanceId } from '../utils/dates.js';

const COLLECTION = 'attendance';

/**
 * @param {FirebaseFirestore.DocumentSnapshot} doc
 */
export function mapAttendanceDocToDto(doc) {
  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  const timeIn = data.timeIn?.toDate?.();
  const timeOut = data.timeOut?.toDate?.();
  const createdAt = data.createdAt?.toDate?.();
  const isOpen = data.status === 'open';

  const dto = {
    userId: data.userId,
    date: data.date,
    timeIn: timeIn ? timeIn.toISOString() : null,
    timeOut: timeOut ? timeOut.toISOString() : null,
    status: data.status,
    createdAt: createdAt ? createdAt.toISOString() : null,
  };

  if (isOpen) {
    dto.regularHours = null;
    dto.overtimeHours = null;
    dto.nightDifferentialHours = null;
    dto.lateMinutes = null;
    dto.undertimeMinutes = null;
  } else {
    dto.regularHours = data.regularHours ?? 0;
    dto.overtimeHours = data.overtimeHours ?? 0;
    dto.nightDifferentialHours = data.nightDifferentialHours ?? 0;
    dto.lateMinutes = data.lateMinutes ?? 0;
    dto.undertimeMinutes = data.undertimeMinutes ?? 0;
  }

  return dto;
}

/**
 * @param {string} userId
 * @param {string} date YYYY-MM-DD
 */
export async function getById(userId, date) {
  const id = buildAttendanceId(userId, date);
  const doc = await db.collection(COLLECTION).doc(id).get();
  return mapAttendanceDocToDto(doc);
}

/**
 * @param {string} userId
 * @param {string} date
 * @param {Date} timeIn
 */
export async function createOpen(userId, date, timeIn) {
  const id = buildAttendanceId(userId, date);
  const ref = db.collection(COLLECTION).doc(id);

  await ref.set({
    userId,
    date,
    timeIn: Timestamp.fromDate(timeIn),
    timeOut: null,
    status: 'open',
    createdAt: FieldValue.serverTimestamp(),
  });

  const doc = await ref.get();
  return mapAttendanceDocToDto(doc);
}

/**
 * @param {string} userId
 * @param {string} date
 * @param {{
 *   timeOut: Date;
 *   regularHours: number;
 *   overtimeHours: number;
 *   nightDifferentialHours: number;
 *   lateMinutes: number;
 *   undertimeMinutes: number;
 * }} payload
 */
export async function closeAttendance(userId, date, payload) {
  const id = buildAttendanceId(userId, date);
  const ref = db.collection(COLLECTION).doc(id);

  await ref.update({
    timeOut: Timestamp.fromDate(payload.timeOut),
    status: 'closed',
    regularHours: payload.regularHours,
    overtimeHours: payload.overtimeHours,
    nightDifferentialHours: payload.nightDifferentialHours,
    lateMinutes: payload.lateMinutes,
    undertimeMinutes: payload.undertimeMinutes,
  });

  const doc = await ref.get();
  return mapAttendanceDocToDto(doc);
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
    .orderBy('date', 'desc')
    .get();

  return snapshot.docs.map((doc) => mapAttendanceDocToDto(doc));
}

/**
 * @param {string} date YYYY-MM-DD
 */
export async function queryByDate(date) {
  const snapshot = await db
    .collection(COLLECTION)
    .where('date', '==', date)
    .limit(1000)
    .get();
  return snapshot.docs.map((doc) => mapAttendanceDocToDto(doc));
}

/**
 * @param {string} userId
 * @param {string} date
 * @param {{
 *   timeIn: Date;
 *   timeOut: Date;
 *   regularHours: number;
 *   overtimeHours: number;
 *   nightDifferentialHours: number;
 *   lateMinutes: number;
 *   undertimeMinutes: number;
 * }} payload
 */
export async function upsertClosed(userId, date, payload) {
  const id = buildAttendanceId(userId, date);
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();

  const data = {
    userId,
    date,
    timeIn: Timestamp.fromDate(payload.timeIn),
    timeOut: Timestamp.fromDate(payload.timeOut),
    status: 'closed',
    regularHours: payload.regularHours,
    overtimeHours: payload.overtimeHours,
    nightDifferentialHours: payload.nightDifferentialHours,
    lateMinutes: payload.lateMinutes,
    undertimeMinutes: payload.undertimeMinutes,
  };

  if (existing.exists) {
    await ref.update(data);
  } else {
    await ref.set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  const doc = await ref.get();
  return mapAttendanceDocToDto(doc);
}
