import { useState } from 'react';
import * as adminApi from '../../api/admin.api.js';
import { getApiErrorMessage } from '../../api/axios.js';
import {
  getCurrentWeekStart,
  getWorkDateForTimezone,
} from '../../utils/dates.js';
import { historyDateRangeSchema } from '../../schemas/common.schema.js';
import { downloadAttendanceExportExcel } from '../../utils/exportExcel.js';
import { useProfileTimezone } from '../../hooks/useProfileTimezone.js';
import { FilterBar } from '../ui/FilterBar.jsx';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { Alert } from '../ui/Alert.jsx';
import { Section } from '../ui/Section.jsx';

/**
 * @param {{ defaultRole?: string }} props
 */
export function ReportExportBar({ defaultRole = 'employee' }) {
  const timezone = useProfileTimezone();
  const [exportFrom, setExportFrom] = useState(() => getCurrentWeekStart(timezone));
  const [exportTo, setExportTo] = useState(() => getWorkDateForTimezone(new Date(), timezone));
  const [exportRole, setExportRole] = useState(defaultRole);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');

  const goToThisWeek = () => {
    setExportFrom(getCurrentWeekStart(timezone));
    setExportTo(getWorkDateForTimezone(new Date(), timezone));
    setExportError('');
    setExportSuccess('');
  };

  const handleExport = async () => {
    const rangeCheck = historyDateRangeSchema.safeParse({ from: exportFrom, to: exportTo });
    if (!rangeCheck.success) {
      setExportError(rangeCheck.error.errors[0]?.message ?? 'Invalid date range');
      setExportSuccess('');
      return;
    }

    setExporting(true);
    setExportError('');
    setExportSuccess('');

    try {
      const result = await adminApi.getAttendanceExportReport({
        from: exportFrom,
        to: exportTo,
        role: exportRole || undefined,
      });

      if (!result.items.length) {
        setExportError('No attendance summaries in this date range for the selected role.');
        return;
      }

      downloadAttendanceExportExcel(result.items, { from: result.from, to: result.to });
      setExportSuccess(
        `Downloaded ${result.items.length} row(s) for ${result.from} through ${result.to}.`,
      );
    } catch (err) {
      setExportError(getApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Section title="Export to Excel">
      <FilterBar>
        <Input
          type="date"
          value={exportFrom}
          onChange={(e) => {
            setExportFrom(e.target.value);
            setExportError('');
            setExportSuccess('');
          }}
          inputSize="sm"
          className="w-auto shrink-0"
          aria-label="Export from date"
        />
        <Input
          type="date"
          value={exportTo}
          onChange={(e) => {
            setExportTo(e.target.value);
            setExportError('');
            setExportSuccess('');
          }}
          inputSize="sm"
          className="w-auto shrink-0"
          aria-label="Export to date"
        />
        <Button type="button" variant="secondary" size="sm" onClick={goToThisWeek}>
          This week
        </Button>
        <Select
          value={exportRole}
          onChange={(e) => {
            setExportRole(e.target.value);
            setExportError('');
            setExportSuccess('');
          }}
          inputSize="sm"
          className="w-auto min-w-[9rem] shrink-0"
          aria-label="Export role filter"
        >
          <option value="">All</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </Select>
        <Button type="button" size="sm" loading={exporting} disabled={exporting} onClick={handleExport}>
          Export Excel
        </Button>
      </FilterBar>
      <p className="text-xs text-ink-muted">
        Exports closed daily summaries (regular, OT, ND, late, undertime) for each employee per day.
        Maximum range: 93 days.
      </p>
      {exportError && <Alert variant="error">{exportError}</Alert>}
      {exportSuccess && <Alert variant="success">{exportSuccess}</Alert>}
    </Section>
  );
}
