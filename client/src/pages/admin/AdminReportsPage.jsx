import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { SummaryTable } from '../../components/summary/SummaryTable.jsx';
import { WeeklyAnalyticsCards } from '../../components/summary/WeeklyAnalyticsCards.jsx';
import { PaginatedTable } from '../../components/ui/PaginatedTable.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import * as adminApi from '../../api/admin.api.js';
import { getApiErrorMessage } from '../../api/axios.js';
import {
  getCurrentWeekStart,
  getWorkDateForTimezone,
  getWeekStartForDate,
} from '../../utils/dates.js';
import { historyDateRangeSchema } from '../../schemas/common.schema.js';
import { useProfileTimezone } from '../../hooks/useProfileTimezone.js';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { LoadingMessage } from '../../components/ui/LoadingMessage.jsx';
import { formatHours, formatMinutes } from '../../utils/format.js';
import { Section } from '../../components/ui/Section.jsx';
import { FilterBar } from '../../components/ui/FilterBar.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function AdminReportsPage() {
  const timezone = useProfileTimezone();

  const [date, setDate] = useState(() => getWorkDateForTimezone(new Date(), timezone));
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekStart(timezone));
  const [q, setQ] = useState('');
  const [excFrom, setExcFrom] = useState(() => getCurrentWeekStart(timezone));
  const [excTo, setExcTo] = useState(() => getWorkDateForTimezone(new Date(), timezone));

  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    const rangeCheck = historyDateRangeSchema.safeParse({ from: excFrom, to: excTo });
    if (!rangeCheck.success) {
      setError(rangeCheck.error.errors[0]?.message ?? 'Invalid date range');
      return;
    }

    setLoading(true);
    setError('');
    setDailyReport(null);
    setWeeklyReport(null);
    setExceptions([]);
    try {
      const [daily, weekly, exc] = await Promise.all([
        adminApi.getTeamDailyReport(date),
        adminApi.getTeamWeeklyReport({ weekStart, page, limit: 20 }),
        adminApi.getExceptionsReport({ from: excFrom, to: excTo }),
      ]);
      setDailyReport(daily);
      setWeeklyReport(weekly);
      setExceptions(exc);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [date, weekStart, page, excFrom, excTo]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredDailyItems = useMemo(() => {
    if (!dailyReport?.items) {
      return [];
    }
    if (!q.trim()) {
      return dailyReport.items;
    }
    const needle = q.trim().toLowerCase();
    return dailyReport.items.filter(
      (row) =>
        row.fullName?.toLowerCase().includes(needle) ||
        row.email?.toLowerCase().includes(needle),
    );
  }, [dailyReport, q]);

  return (
    <PageContainer>
      <PageHeader
        title="Daily & weekly reports"
        description="Team summaries with regular, OT, night differential, late, and undertime."
      />

      <ErrorBanner message={error} onRetry={loadReports} />

      <Section title="Daily team summary">
        <FilterBar>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            inputSize="sm"
            className="w-auto"
            aria-label="Report date"
          />
          <Input
            type="search"
            placeholder="Filter by name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-[200px] flex-1"
            aria-label="Filter daily report"
          />
          <Button type="button" size="sm" onClick={loadReports}>
            Apply
          </Button>
        </FilterBar>
        {dailyReport && (
          <>
            <WeeklyAnalyticsCards totals={dailyReport.totals} title="Team totals (day)" />
            <SummaryTable
              items={filteredDailyItems}
              showEmployee
              loading={loading}
              emptyMessage="No summaries match your filters."
            />
          </>
        )}
      </Section>

      <Section title="Weekly by employee">
        <FilterBar>
          <Input
            type="date"
            value={weekStart}
            onChange={(e) => {
              setPage(1);
              setWeekStart(getWeekStartForDate(e.target.value, timezone));
            }}
            inputSize="sm"
            className="w-auto"
            aria-label="Week start"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setPage(1);
              loadReports();
            }}
          >
            Load week
          </Button>
        </FilterBar>

        {weeklyReport && (
          <>
            <WeeklyAnalyticsCards totals={weeklyReport.totals} title="Team totals (week)" />
            <PaginatedTable
              columns={[
                { key: 'fullName', label: 'Employee' },
                { key: 'email', label: 'Email' },
                {
                  key: 'reg',
                  label: 'Regular',
                  align: 'right',
                  render: (row) => formatHours(row.totals?.totalRegularHours),
                },
                {
                  key: 'ot',
                  label: 'OT',
                  align: 'right',
                  render: (row) => formatHours(row.totals?.totalOvertimeHours),
                },
                {
                  key: 'nd',
                  label: 'ND',
                  align: 'right',
                  render: (row) => formatHours(row.totals?.totalNightDifferentialHours),
                },
                {
                  key: 'late',
                  label: 'Late',
                  align: 'right',
                  render: (row) => formatMinutes(row.totals?.totalLateMinutes),
                },
                {
                  key: 'undertime',
                  label: 'Undertime',
                  align: 'right',
                  render: (row) => formatMinutes(row.totals?.totalUndertimeMinutes),
                },
              ]}
              rows={weeklyReport.items}
              rowKey={(row) => row.userId}
              loading={loading}
              page={weeklyReport.page}
              limit={weeklyReport.limit}
              total={weeklyReport.total}
              onPageChange={setPage}
              emptyTitle="No employees"
              emptyMessage="No employees on this page."
            />
          </>
        )}
      </Section>

      <Section title="Exceptions">
        <FilterBar>
          <Input
            type="date"
            value={excFrom}
            onChange={(e) => setExcFrom(e.target.value)}
            inputSize="sm"
            className="w-auto"
            aria-label="Exceptions from date"
          />
          <Input
            type="date"
            value={excTo}
            onChange={(e) => setExcTo(e.target.value)}
            inputSize="sm"
            className="w-auto"
            aria-label="Exceptions to date"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setExcFrom(getCurrentWeekStart(timezone));
              setExcTo(getWorkDateForTimezone(new Date(), timezone));
            }}
          >
            This week
          </Button>
          <Button type="button" size="sm" onClick={loadReports}>
            Load
          </Button>
        </FilterBar>

        {loading ? (
          <LoadingMessage message="Loading exceptions…" inline />
        ) : exceptions.length ? (
          <PaginatedTable
            columns={[
              { key: 'fullName', label: 'Employee' },
              { key: 'date', label: 'Date' },
              {
                key: 'late',
                label: 'Late',
                align: 'right',
                render: (row) => formatMinutes(row.totalLateMinutes),
              },
              {
                key: 'ut',
                label: 'Undertime',
                align: 'right',
                render: (row) => formatMinutes(row.totalUndertimeMinutes),
              },
            ]}
            rows={exceptions}
            rowKey={(row) => `${row.userId}_${row.date}`}
            page={1}
            limit={exceptions.length}
            total={exceptions.length}
            onPageChange={() => {}}
          />
        ) : (
          <EmptyState title="No exceptions" description="No late or undertime alerts in range." />
        )}
      </Section>
    </PageContainer>
  );
}
