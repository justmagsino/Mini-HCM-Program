import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { SummaryTable } from '../../components/summary/SummaryTable.jsx';
import { WeeklyAnalyticsCards } from '../../components/summary/WeeklyAnalyticsCards.jsx';
import { useSummary } from '../../hooks/useSummary.js';
import { getCurrentWeekStart, getWeekStartForDate } from '../../utils/dates.js';
import { formatHours, formatMinutes } from '../../utils/format.js';
import { useAuth } from '../../hooks/useAuth.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { useProfileTimezone } from '../../hooks/useProfileTimezone.js';
import { Section } from '../../components/ui/Section.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { StatCardSkeleton } from '../../components/ui/LoadingSkeleton.jsx';
import { LoadingMessage } from '../../components/ui/LoadingMessage.jsx';

const REPORTS_PAGE_SIZE = 10;

export function ReportsPage() {
  const { profile } = useAuth();
  const timezone = useProfileTimezone();
  const {
    todaySummary,
    weekly,
    rangeItems,
    weekStart,
    loading,
    weeklyLoading,
    error,
    loadWeekly,
    refresh,
  } = useSummary();
  const [weekInput, setWeekInput] = useState('');
  const [weekError, setWeekError] = useState('');
  const [rangePage, setRangePage] = useState(1);

  useEffect(() => {
    setRangePage(1);
  }, [rangeItems]);

  const loadWeekForDate = async (pickedDate) => {
    if (!pickedDate || !profile) {
      return;
    }
    setWeekError('');
    const monday = getWeekStartForDate(pickedDate, timezone);
    setWeekInput(monday);
    if (monday !== pickedDate) {
      setWeekError(`Adjusted to week starting Monday: ${monday}`);
    }
    try {
      await loadWeekly(monday);
    } catch (err) {
      setWeekError(getApiErrorMessage(err));
    }
  };

  const goToThisWeek = async () => {
    const monday = getCurrentWeekStart(timezone);
    setWeekError('');
    setWeekInput(monday);
    try {
      await loadWeekly(monday);
    } catch (err) {
      setWeekError(getApiErrorMessage(err));
    }
  };

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Reports"
        description="Daily and weekly summary from your closed attendance."
      />

      <ErrorBanner message={error} onRetry={refresh} />

      <Section title="Today">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : todaySummary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Regular"
              value={formatHours(todaySummary.totalRegularHours)}
              variant="accent"
            />
            <StatCard label="OT" value={formatHours(todaySummary.totalOvertimeHours)} />
            <StatCard label="ND" value={formatHours(todaySummary.totalNightDifferentialHours)} />
            <StatCard label="Late" value={formatMinutes(todaySummary.totalLateMinutes)} />
            <StatCard
              label="Undertime"
              value={formatMinutes(todaySummary.totalUndertimeMinutes)}
            />
          </div>
        ) : (
          <EmptyState
            title="No summary for today"
            description="No closed attendance for today yet. Punch out to generate totals."
          />
        )}
      </Section>

      <Section title="Weekly">
        {weekly && !weeklyLoading && (
          <div className="mb-4">
            <WeeklyAnalyticsCards totals={weekly.totals} />
          </div>
        )}

        <div className="flex flex-wrap items-end justify-start gap-3">
          {weekly && !weeklyLoading && (
            <p className="text-sm font-medium text-navy">
              {weekly.weekStart} – {weekly.weekEnd}
            </p>
          )}
          <FormField label="Week (pick any day)" htmlFor="weekStart" className="min-w-[160px]">
            <Input
              id="weekStart"
              type="date"
              inputSize="sm"
              value={weekInput || weekStart}
              disabled={weeklyLoading}
              onChange={(e) => loadWeekForDate(e.target.value)}
            />
          </FormField>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={weeklyLoading}
            onClick={goToThisWeek}
          >
            This week
          </Button>
        </div>

        {weekError && (
          <Alert variant={weekError.startsWith('Adjusted') ? 'warning' : 'error'}>{weekError}</Alert>
        )}

        {weeklyLoading && <LoadingMessage message="Loading weekly report…" inline />}

        {weekly && !weeklyLoading && <SummaryTable items={weekly.days} />}
      </Section>

      <Section title="Last 31 days">
        <SummaryTable
          items={rangeItems}
          loading={loading}
          page={rangePage}
          limit={REPORTS_PAGE_SIZE}
          onPageChange={setRangePage}
        />
      </Section>
    </PageContainer>
  );
}
