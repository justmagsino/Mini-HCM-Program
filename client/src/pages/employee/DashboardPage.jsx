import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ChartSkeleton, StatCardSkeleton } from '../../components/ui/LoadingSkeleton.jsx';
import { StatusBanner } from '../../components/dashboard/StatusBanner.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { Section } from '../../components/ui/Section.jsx';
import { LinkCard } from '../../components/ui/LinkCard.jsx';
import { useEmployeeDashboard } from '../../hooks/useEmployeeDashboard.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatHours, formatMinutes } from '../../utils/format.js';

const WeeklyHoursChart = lazy(() =>
  import('../../components/charts/WeeklyHoursChart.jsx').then((m) => ({
    default: m.WeeklyHoursChart,
  })),
);

export function DashboardPage() {
  const { profile } = useAuth();
  const { attendanceToday, dailySummary, weekly, timezone, loading, error, retry } =
    useEmployeeDashboard();

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${profile?.fullName ?? 'there'}`}
        description="Your attendance status and weekly summary at a glance."
        actions={
          <Link to="/attendance" className="btn-primary btn-md">
            Punch in / out
          </Link>
        }
      />

      <ErrorBanner message={error} onRetry={retry} />

      {loading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <ChartSkeleton />
        </>
      ) : (
        <>
          <StatusBanner attendance={attendanceToday} timezone={timezone} />

          <Section title="Today's totals">
            {dailySummary ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard
                  label="Regular"
                  value={formatHours(dailySummary.totalRegularHours)}
                  variant="accent"
                />
                <StatCard label="Overtime" value={formatHours(dailySummary.totalOvertimeHours)} />
                <StatCard
                  label="Night diff."
                  value={formatHours(dailySummary.totalNightDifferentialHours)}
                />
                <StatCard label="Late" value={formatMinutes(dailySummary.totalLateMinutes)} />
                <StatCard
                  label="Undertime"
                  value={formatMinutes(dailySummary.totalUndertimeMinutes)}
                />
              </div>
            ) : (
              <EmptyState
                title="No summary for today"
                description="Totals appear after you punch out and close today's attendance."
                action={
                  <Link to="/attendance" className="link-primary text-sm">
                    Open attendance
                  </Link>
                }
              />
            )}
          </Section>

          <Section title="Weekly hours">
            {weekly?.days?.length ? (
              <Suspense fallback={<ChartSkeleton />}>
                <WeeklyHoursChart days={weekly.days} />
              </Suspense>
            ) : (
              <EmptyState
                title="No weekly data"
                description="Your week chart will populate as you complete attendance days."
              />
            )}
          </Section>

          <Section title="Quick links">
            <div className="grid gap-4 sm:grid-cols-2">
              <LinkCard
                to="/attendance"
                title="Attendance"
                description="Punch in, punch out, and view history"
              />
              <LinkCard
                to="/reports"
                title="Reports"
                description="Daily and weekly summary tables"
              />
            </div>
          </Section>
        </>
      )}
    </PageContainer>
  );
}
