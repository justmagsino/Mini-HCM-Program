import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ChartSkeleton, StatCardSkeleton, TableSkeleton } from '../../components/ui/LoadingSkeleton.jsx';
import { AttendanceStatusBadge } from '../../components/attendance/AttendanceStatusBadge.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { Section } from '../../components/ui/Section.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAdminDashboard } from '../../hooks/useAdminDashboard.js';
import { formatHours, formatMinutes, formatTime } from '../../utils/format.js';

const TeamOvertimeChart = lazy(() =>
  import('../../components/charts/TeamOvertimeChart.jsx').then((m) => ({
    default: m.TeamOvertimeChart,
  })),
);

export function AdminDashboardPage() {
  const { date, setDate, kpis, roster, exceptions, otChartData, timezone, loading, error, retry } =
    useAdminDashboard();

  const hasOtData = otChartData.some((d) => d.overtime > 0);

  return (
    <PageContainer>
      <PageHeader
        title="Admin dashboard"
        description="Team KPIs, today's roster, and weekly overtime."
        actions={
          <>
            <FormField htmlFor="dashboard-date" className="mb-0">
              <Input
                id="dashboard-date"
                type="date"
                inputSize="sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Dashboard date"
              />
            </FormField>
            <Button variant="secondary" size="sm" onClick={retry}>
              Refresh
            </Button>
          </>
        }
      />

      <ErrorBanner message={error} onRetry={retry} />

      {loading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Active employees"
                value={String(kpis.activeEmployees)}
                variant="accent"
              />
              <StatCard label="Punched in now" value={String(kpis.punchedInNow)} />
              <StatCard label="Absent today" value={String(kpis.absentToday)} />
              <StatCard label="Team OT (today)" value={formatHours(kpis.totalOvertimeHours)} />
              <StatCard label="Team late (today)" value={formatMinutes(kpis.totalLateMinutes)} />
            </div>
          )}

          {hasOtData ? (
            <Suspense fallback={<ChartSkeleton />}>
              <TeamOvertimeChart data={otChartData} />
            </Suspense>
          ) : (
            <EmptyState
              title="No team overtime this week"
              description="OT chart fills as hours are logged."
            />
          )}

          <Section
            title="Today's roster"
            actions={
              <Link to="/admin/attendance" className="link-primary text-sm">
                Manage attendance →
              </Link>
            }
          >
            <DataTable
              columns={[
                { key: 'fullName', label: 'Employee' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <AttendanceStatusBadge status={row.status} />,
                },
                {
                  key: 'timeIn',
                  label: 'In',
                  render: (row) =>
                    row.attendance ? formatTime(row.attendance.timeIn, timezone) : '—',
                },
                {
                  key: 'timeOut',
                  label: 'Out',
                  render: (row) =>
                    row.attendance ? formatTime(row.attendance.timeOut, timezone) : '—',
                },
                {
                  key: 'edit',
                  label: 'Actions',
                  render: (row) =>
                    row.status === 'absent' ? (
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
                    ),
                },
              ]}
              rows={roster}
              rowKey={(row) => row.userId}
              emptyTitle="No employees"
              emptyMessage="No employees found."
            />
          </Section>

          <Section
            title="Exceptions this week"
            actions={
              <Link to="/admin/reports" className="link-primary text-sm">
                Reports →
              </Link>
            }
          >
            {exceptions.length ? (
              <DataTable
                columns={[
                  { key: 'fullName', label: 'Employee' },
                  { key: 'date', label: 'Date' },
                  {
                    key: 'totalLateMinutes',
                    label: 'Late',
                    align: 'right',
                    render: (row) => formatMinutes(row.totalLateMinutes),
                  },
                  {
                    key: 'totalUndertimeMinutes',
                    label: 'Undertime',
                    align: 'right',
                    render: (row) => formatMinutes(row.totalUndertimeMinutes),
                  },
                ]}
                rows={exceptions}
                rowKey={(row) => `${row.userId}_${row.date}`}
                emptyTitle="No exceptions"
                emptyMessage="No late/undertime alerts this week."
              />
            ) : (
              <EmptyState
                title="No exceptions"
                description="No late/undertime alerts this week."
              />
            )}
          </Section>
        </>
      )}
    </PageContainer>
  );
}
