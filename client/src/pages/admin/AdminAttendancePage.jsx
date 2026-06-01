import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { PaginatedTable } from '../../components/ui/PaginatedTable.jsx';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FilterBar } from '../../components/ui/FilterBar.jsx';
import { TableWithToolbar } from '../../components/ui/TableWithToolbar.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import * as adminApi from '../../api/admin.api.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { getWorkDateForTimezone } from '../../utils/dates.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { useProfileTimezone } from '../../hooks/useProfileTimezone.js';
import { formatDateLabel, formatTime } from '../../utils/format.js';

const PAGE_SIZE = 10;

export function AdminAttendancePage() {
  const timezone = useProfileTimezone();

  const [date, setDate] = useState(() => getWorkDateForTimezone(new Date(), timezone));
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('employee');
  const [qInput, setQInput] = useState('');
  const q = useDebouncedValue(qInput);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.searchAttendance({
        date,
        status: status || undefined,
        role: role || undefined,
        q: q || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date, status, role, q, page]);

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
        title="Punch corrections"
        description="View, edit, or create attendance punches for any employee."
        actions={
          <Link to="/admin/attendance/edit" className="btn-primary btn-md">
            Create record
          </Link>
        }
      />

      <ErrorBanner message={error} onRetry={load} />

      <TableWithToolbar
        toolbar={
          <FilterBar>
            <Input
              type="search"
              placeholder="Filter by name or email"
              value={qInput}
              onChange={(e) => {
                setPage(1);
                setQInput(e.target.value);
              }}
              inputSize="sm"
              className="min-w-[180px] flex-1"
              aria-label="Search attendance"
            />
            <Select
              value={role}
              onChange={(e) => {
                setPage(1);
                setRole(e.target.value);
              }}
              inputSize="sm"
              className="w-auto min-w-[9rem] shrink-0"
              aria-label="Filter by role"
            >
              <option value="">All</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </Select>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setPage(1);
                setDate(e.target.value);
              }}
              inputSize="sm"
              className="w-auto shrink-0"
              aria-label="Filter by date"
            />
            <Select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              inputSize="sm"
              className="w-auto min-w-[10rem] shrink-0"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </Select>
          </FilterBar>
        }
      >
        <PaginatedTable
          columns={[
            { key: 'fullName', label: 'Employee' },
            {
              key: 'date',
              label: 'Date',
              render: (row) => formatDateLabel(row.date),
            },
          {
            key: 'timeIn',
            label: 'In',
            align: 'center',
            render: (row) => formatTime(row.timeIn, timezone),
          },
          {
            key: 'timeOut',
            label: 'Out',
            align: 'center',
            render: (row) => formatTime(row.timeOut, timezone),
          },
          {
            key: 'status',
            label: 'Status',
            align: 'center',
            render: (row) => (
              <div className="flex justify-center">
                <AttendanceStatusBadge status={row.status} showAbsentLabel={false} />
              </div>
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'center',
            render: (row) => (
              <div className="flex justify-center">
                <Link
                  to={`/admin/attendance/${row.userId}/${row.date}`}
                  className="link-primary text-sm"
                >
                  Edit
                </Link>
              </div>
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
      </TableWithToolbar>
    </PageContainer>
  );
}
