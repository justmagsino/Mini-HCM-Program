import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { PaginatedTable } from '../../components/ui/PaginatedTable.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ChartSkeleton, StatCardSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton.jsx';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { Section } from '../../components/ui/Section.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAdminDashboard } from '../../hooks/useAdminDashboard.js';
import { getWorkDateForTimezone } from '../../utils/dates.js';
import { formatHours, formatMinutes, formatTime } from '../../utils/format.js';

const TeamOvertimeChart = lazy(() =>
  import('../../components/charts/TeamOvertimeChart.jsx').then((m) => ({
    default: m.TeamOvertimeChart,
  })),
);

const OVERVIEW_PAGE_SIZE = 10;

export function AdminDashboardPage() {
  const { date, setDate, kpis, roster, otChartData, timezone, loading, error, retry } =
    useAdminDashboard();

  const [rosterPage, setRosterPage] = useState(1);

  useEffect(() => {
    setRosterPage(1);
  }, [date]);

  const rosterRows = useMemo(() => {
    const start = (rosterPage - 1) * OVERVIEW_PAGE_SIZE;
    return roster.slice(start, start + OVERVIEW_PAGE_SIZE);
  }, [roster, rosterPage]);

  const hasOtData = otChartData.some((d) => d.overtime > 0);

  return (
    <PageContainer>
      <PageHeader
        title="Admin dashboard"
        description="KPIs, today attendance, and weekly overtime."
        actions={
          <>
            <FormField htmlFor="dashboard-date" className="mb-0 shrink-0">
              <Input
                id="dashboard-date"
                type="date"
                inputSize="sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Dashboard date"
              />
            </FormField>
            <Button
              variant="secondary"
              size="sm"
              className="self-center"
              onClick={() => setDate(getWorkDateForTimezone(new Date(), timezone))}
            >
              Today
            </Button>
            <Button variant="secondary" size="sm" className="self-center" onClick={retry}>
              Refresh
            </Button>
          </>
        }
      />

      <ErrorBanner message={error} onRetry={retry} />

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <ChartSkeleton />
          <TableSkeleton />
        </>
      ) : (
        <>
          {kpis && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
              <StatCard
                label="Active employees"
                value={String(kpis.activeEmployees)}
                variant="accent"
              />
              <StatCard label="Punched in now" value={String(kpis.punchedInNow)} />
              <StatCard label="Absent today" value={String(kpis.absentToday)} />
              <StatCard label="OT (today)" value={formatHours(kpis.totalOvertimeHours)} />
              <StatCard label="Late (today)" value={formatMinutes(kpis.totalLateMinutes)} />
            </div>
          )}

          {hasOtData ? (
            <Suspense fallback={<ChartSkeleton />}>
              <TeamOvertimeChart data={otChartData} />
            </Suspense>
          ) : (
            <EmptyState
              title="No overtime this week"
              description="OT chart fills as hours are logged."
            />
          )}

          <Section title="Today attendance">
            <PaginatedTable
              columns={[
                { key: 'fullName', label: 'Employee' },
                {
                  key: 'status',
                  label: 'Status',
                  align: 'center',
                  render: (row) => (
                    <div className="flex justify-center">
                      <AttendanceStatusBadge status={row.status} />
                    </div>
                  ),
                },
                {
                  key: 'timeIn',
                  label: 'In',
                  align: 'center',
                  render: (row) =>
                    row.attendance ? formatTime(row.attendance.timeIn, timezone) : '—',
                },
                {
                  key: 'timeOut',
                  label: 'Out',
                  align: 'center',
                  render: (row) =>
                    row.attendance ? formatTime(row.attendance.timeOut, timezone) : '—',
                },
                {
                  key: 'edit',
                  label: 'Actions',
                  align: 'center',
                  render: (row) => (
                    <div className="flex justify-center">
                      {row.status === 'absent' ? (
                        <Link
                          to={`/admin/attendance/edit?userId=${row.userId}`}
                          className="link-primary text-sm"
                        >
                          Add
                        </Link>
                      ) : (
                        <Link
                          to={`/admin/attendance/${row.userId}/${date}`}
                          className="link-primary text-sm"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  ),
                },
              ]}
              rows={rosterRows}
              rowKey={(row) => row.userId}
              page={rosterPage}
              limit={OVERVIEW_PAGE_SIZE}
              total={roster.length}
              onPageChange={setRosterPage}
              emptyTitle="No employees"
              emptyMessage="No employees found."
            />
          </Section>
        </>
      )}
    </PageContainer>
  );
}
