import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { PaginatedTable } from '../../components/ui/PaginatedTable.jsx';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FilterBar } from '../../components/ui/FilterBar.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import * as adminApi from '../../api/admin.api.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { getWorkDateForTimezone } from '../../utils/dates.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { useProfileTimezone } from '../../hooks/useProfileTimezone.js';
import { formatTime } from '../../utils/format.js';

export function AdminAttendancePage() {
  const timezone = useProfileTimezone();

  const [date, setDate] = useState(() => getWorkDateForTimezone(new Date(), timezone));
  const [status, setStatus] = useState('');
  const [qInput, setQInput] = useState('');
  const q = useDebouncedValue(qInput);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.searchAttendance({
        date,
        status: status || undefined,
        q: q || undefined,
        page,
        limit: 50,
      });
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date, status, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data.items.map((item) => ({
    ...item.attendance,
    fullName: item.fullName,
    email: item.email,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Attendance management"
        description="Search and filter attendance records. Edit or create corrections."
        actions={
          <Link to="/admin/attendance/edit" className="btn-primary btn-md">
            Create record
          </Link>
        }
      />

      <ErrorBanner message={error} onRetry={load} />

      <FilterBar>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setPage(1);
            setDate(e.target.value);
          }}
          inputSize="sm"
          className="w-auto"
          aria-label="Filter by date"
        />
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          inputSize="sm"
          className="w-auto min-w-[10rem]"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </Select>
        <Input
          type="search"
          placeholder="Filter by name or email"
          value={qInput}
          onChange={(e) => {
            setPage(1);
            setQInput(e.target.value);
          }}
          className="min-w-[180px] flex-1"
          aria-label="Search attendance"
        />
        <Button type="button" variant="secondary" size="sm" onClick={load}>
          Apply
        </Button>
      </FilterBar>

      <PaginatedTable
        columns={[
          { key: 'fullName', label: 'Employee' },
          { key: 'date', label: 'Date' },
          {
            key: 'timeIn',
            label: 'In',
            render: (row) => formatTime(row.timeIn, timezone),
          },
          {
            key: 'timeOut',
            label: 'Out',
            render: (row) => formatTime(row.timeOut, timezone),
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => (
              <AttendanceStatusBadge status={row.status} showAbsentLabel={false} />
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <Link
                to={`/admin/attendance/${row.userId}/${row.date}`}
                className="link-primary text-sm"
              >
                Edit
              </Link>
            ),
          },
        ]}
        rows={rows}
        rowKey={(row) => `${row.userId}_${row.date}`}
        loading={loading}
        page={page}
        limit={data.limit}
        total={data.total}
        onPageChange={setPage}
        emptyTitle="No records"
        emptyMessage="No attendance records for these filters."
      />
    </PageContainer>
  );
}
