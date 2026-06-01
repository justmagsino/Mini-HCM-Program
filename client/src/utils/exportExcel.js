import * as XLSX from 'xlsx';
import { formatUserRole } from './format.js';

/**
 * @param {Array<{
 *   date: string;
 *   fullName: string;
 *   email: string;
 *   role: string;
 *   totalRegularHours?: number;
 *   totalOvertimeHours?: number;
 *   totalNightDifferentialHours?: number;
 *   totalLateMinutes?: number;
 *   totalUndertimeMinutes?: number;
 * }>} items
 * @param {{ from: string; to: string }} range
 */
export function downloadAttendanceExportExcel(items, { from, to }) {
  const header = [
    'Date',
    'Employee',
    'Email',
    'Role',
    'Regular (h)',
    'OT (h)',
    'ND (h)',
    'Late (m)',
    'Undertime (m)',
  ];

  const rows = items.map((row) => [
    row.date,
    row.fullName,
    row.email,
    formatUserRole(row.role),
    row.totalRegularHours ?? 0,
    row.totalOvertimeHours ?? 0,
    row.totalNightDifferentialHours ?? 0,
    row.totalLateMinutes ?? 0,
    row.totalUndertimeMinutes ?? 0,
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Attendance');

  const filename = `mini-hcm-attendance_${from}_to_${to}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
