import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebaseAdmin.js';
import { buildAttendanceId, buildDailySummaryId } from '../utils/dates.js';

const ATTENDANCE = 'attendance';
const DAILY_SUMMARY = 'dailySummary';

/**
 * @param {object} attendanceData
 * @param {boolean} hadExisting
 */
function mapAttendanceFromWrite(attendanceData, hadExisting) {
  return {
    userId: attendanceData.userId,
    date: attendanceData.date,
    timeIn: attendanceData.timeIn.toDate().toISOString(),
    timeOut: attendanceData.timeOut.toDate().toISOString(),
    status: attendanceData.status,
    regularHours: attendanceData.regularHours,
    overtimeHours: attendanceData.overtimeHours,
    nightDifferentialHours: attendanceData.nightDifferentialHours,
    lateMinutes: attendanceData.lateMinutes,
    undertimeMinutes: attendanceData.undertimeMinutes,
    createdAt: hadExisting ? null : new Date().toISOString(),
  };
}

/**
 * Atomically closes attendance and upserts dailySummary (punch-out / admin edit).
 * @param {string} userId
 * @param {string} date YYYY-MM-DD
 * @param {{
 *   timeIn: Date;
 *   timeOut: Date;
 *   regularHours: number;
 *   overtimeHours: number;
 *   nightDifferentialHours: number;
 *   lateMinutes: number;
 *   undertimeMinutes: number;
 * }} attendancePayload
 * @param {{
 *   totalRegularHours: number;
 *   totalOvertimeHours: number;
 *   totalNightDifferentialHours: number;
 *   totalLateMinutes: number;
 *   totalUndertimeMinutes: number;
 * }} summaryPayload
 */
export async function closeAttendanceWithSummary(
  userId,
  date,
  attendancePayload,
  summaryPayload,
) {
  const attRef = db.collection(ATTENDANCE).doc(buildAttendanceId(userId, date));
  const sumRef = db.collection(DAILY_SUMMARY).doc(buildDailySummaryId(userId, date));
  const existing = await attRef.get();

  const batch = db.batch();

  const attendanceData = {
    userId,
    date,
    timeIn: Timestamp.fromDate(attendancePayload.timeIn),
    timeOut: Timestamp.fromDate(attendancePayload.timeOut),
    status: 'closed',
    regularHours: attendancePayload.regularHours,
    overtimeHours: attendancePayload.overtimeHours,
    nightDifferentialHours: attendancePayload.nightDifferentialHours,
    lateMinutes: attendancePayload.lateMinutes,
    undertimeMinutes: attendancePayload.undertimeMinutes,
  };

  if (existing.exists) {
    batch.update(attRef, attendanceData);
  } else {
    batch.set(attRef, {
      ...attendanceData,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  batch.set(sumRef, {
    userId,
    date,
    ...summaryPayload,
  });

  await batch.commit();

  return {
    attendance: mapAttendanceFromWrite(attendanceData, existing.exists),
    dailySummary: {
      userId,
      date,
      ...summaryPayload,
    },
  };
}
