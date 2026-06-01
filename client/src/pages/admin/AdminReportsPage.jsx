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
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { LoadingMessage } from '../../components/ui/LoadingMessage.jsx';
import { formatHours, formatMinutes } from '../../utils/format.js';
import { aggregateSummaryTotals } from '../../utils/summaryTotals.js';
import { Section } from '../../components/ui/Section.jsx';
import { FilterBar } from '../../components/ui/FilterBar.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ReportExportBar } from '../../components/admin/ReportExportBar.jsx';

const DAILY_PAGE_SIZE = 10;
const EXCEPTIONS_PAGE_SIZE = 10;

/** @param {{ value: string; onChange: (value: string) => void }} props */
function ReportRoleFilter({ value, onChange }) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputSize="sm"
      className="w-auto min-w-[9rem] shrink-0"
      aria-label="Filter by role"
    >
      <option value="">All</option>
      <option value="employee">Employee</option>
      <option value="admin">Admin</option>
    </Select>
  );
}

function filterByNameOrEmail(items, query) {
  if (!query?.trim()) {
    return items;
  }
  const needle = query.trim().toLowerCase();
  return items.filter(
    (row) =>
      row.fullName?.toLowerCase().includes(needle) ||
      row.email?.toLowerCase().includes(needle),
  );
}

export function AdminReportsPage() {
  const timezone = useProfileTimezone();

  const [date, setDate] = useState(() => getWorkDateForTimezone(new Date(), timezone));
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekStart(timezone));
  const [role, setRole] = useState('employee');
  const [dailyQ, setDailyQ] = useState('');
  const [weeklyQInput, setWeeklyQInput] = useState('');
  const weeklyQ = useDebouncedValue(weeklyQInput);
  const [excQ, setExcQ] = useState('');
  const [excFrom, setExcFrom] = useState(() => getCurrentWeekStart(timezone));
  const [excTo, setExcTo] = useState(() => getWorkDateForTimezone(new Date(), timezone));

  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [dailyPage, setDailyPage] = useState(1);
  const [weeklyPage, setWeeklyPage] = useState(1);
  const [excPage, setExcPage] = useState(1);

  const [dailyLoading, setDailyLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [exceptionsLoading, setExceptionsLoading] = useState(true);

  const [dailyError, setDailyError] = useState('');
  const [weeklyError, setWeeklyError] = useState('');
  const [exceptionsError, setExceptionsError] = useState('');

  const loadDaily = useCallback(async () => {
    setDailyLoading(true);
    setDailyError('');
    try {
      const daily = await adminApi.getTeamDailyReport({
        date,
        role: role || undefined,
      });
      setDailyReport(daily);
    } catch (err) {
      setDailyError(getApiErrorMessage(err));
    } finally {
      setDailyLoading(false);
    }
  }, [date, role]);

  const loadWeekly = useCallback(async () => {
    setWeeklyLoading(true);
    setWeeklyError('');
    try {
      const weekly = await adminApi.getTeamWeeklyReport({
        weekStart,
        page: weeklyPage,
        limit: 10,
        q: weeklyQ || undefined,
        role: role || undefined,
      });
      setWeeklyReport(weekly);
    } catch (err) {
      setWeeklyError(getApiErrorMessage(err));
    } finally {
      setWeeklyLoading(false);
    }
  }, [weekStart, weeklyPage, weeklyQ, role]);

  const loadExceptions = useCallback(async () => {
    const rangeCheck = historyDateRangeSchema.safeParse({ from: excFrom, to: excTo });
    if (!rangeCheck.success) {
      setExceptionsError(rangeCheck.error.errors[0]?.message ?? 'Invalid date range');
      return;
    }

    setExceptionsLoading(true);
    setExceptionsError('');
    try {
      const exc = await adminApi.getExceptionsReport({
        from: excFrom,
        to: excTo,
        role: role || undefined,
      });
      setExceptions(exc);
    } catch (err) {
      setExceptionsError(getApiErrorMessage(err));
    } finally {
      setExceptionsLoading(false);
    }
  }, [excFrom, excTo, role]);

  useEffect(() => {
    loadDaily();
  }, [loadDaily]);

  useEffect(() => {
    loadWeekly();
  }, [loadWeekly]);

  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  const today = useMemo(
    () => getWorkDateForTimezone(new Date(), timezone),
    [timezone],
  );

  const thisWeekStart = useMemo(
    () => getCurrentWeekStart(timezone),
    [timezone],
  );

  const onRoleChange = (nextRole) => {
    setRole(nextRole);
    setDailyPage(1);
    setWeeklyPage(1);
    setExcPage(1);
  };

  const goToToday = () => {
    setDate(today);
    setDailyPage(1);
  };

  const goToThisWeek = () => {
    setWeekStart(thisWeekStart);
    setWeeklyPage(1);
  };

  const goToExceptionsThisWeek = () => {
    setExcFrom(thisWeekStart);
    setExcTo(today);
    setExcPage(1);
  };

  const filteredDailyItems = useMemo(
    () => filterByNameOrEmail(dailyReport?.items ?? [], dailyQ),
    [dailyReport, dailyQ],
  );

  const dailyDisplayTotals = useMemo(
    () => aggregateSummaryTotals(filteredDailyItems),
    [filteredDailyItems],
  );

  const filteredExceptions = useMemo(
    () => filterByNameOrEmail(exceptions, excQ),
    [exceptions, excQ],
  );

  const paginatedExceptions = useMemo(() => {
    const start = (excPage - 1) * EXCEPTIONS_PAGE_SIZE;
    return filteredExceptions.slice(start, start + EXCEPTIONS_PAGE_SIZE);
  }, [filteredExceptions, excPage]);

  return (
    <PageContainer>
      <PageHeader
        title="Daily & weekly reports"
        description="Summaries with regular, OT, night differential, late, and undertime."
      />

      <ReportExportBar defaultRole={role} />

      <Section title="Daily summary">
        <ErrorBanner message={dailyError} onRetry={loadDaily} />
        <FilterBar>
          <Input
            type="search"
            placeholder="Filter by name or email"
            value={dailyQ}
            onChange={(e) => {
              setDailyQ(e.target.value);
              setDailyPage(1);
            }}
            inputSize="sm"
            className="min-w-[200px] flex-1"
            aria-label="Filter daily report"
          />
          <ReportRoleFilter value={role} onChange={onRoleChange} />
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setDailyPage(1);
            }}
            inputSize="sm"
            className="w-auto shrink-0"
            aria-label="Report date"
          />
          <Button type="button" variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
        </FilterBar>
        {dailyReport && (
          <>
            <WeeklyAnalyticsCards
              totals={dailyDisplayTotals}
              title={
                dailyQ.trim()
                  ? 'Day totals (filtered employees)'
                  : 'Day totals (all employees on this date)'
              }
            />
            <SummaryTable
              items={filteredDailyItems}
              showEmployee
              loading={dailyLoading}
              emptyMessage="No summaries match your filters."
              page={dailyPage}
              limit={DAILY_PAGE_SIZE}
              onPageChange={setDailyPage}
            />
          </>
        )}
        {!dailyReport && dailyLoading && (
          <LoadingMessage message="Loading daily report…" inline />
        )}
      </Section>

      <Section title="Weekly by employee">
        <ErrorBanner message={weeklyError} onRetry={loadWeekly} />
        <FilterBar>
          <Input
            type="search"
            placeholder="Filter by name or email"
            value={weeklyQInput}
            onChange={(e) => {
              setWeeklyQInput(e.target.value);
              setWeeklyPage(1);
            }}
            inputSize="sm"
            className="min-w-[200px] flex-1"
            aria-label="Filter weekly report"
          />
          <ReportRoleFilter value={role} onChange={onRoleChange} />
          <Input
            type="date"
            value={weekStart}
            onChange={(e) => {
              setWeeklyPage(1);
              setWeekStart(getWeekStartForDate(e.target.value, timezone));
            }}
            inputSize="sm"
            className="w-auto shrink-0"
            aria-label="Week start"
          />
          <Button type="button" variant="secondary" size="sm" onClick={goToThisWeek}>
            This week
          </Button>
        </FilterBar>

        {weeklyReport && (
          <>
            <WeeklyAnalyticsCards
              totals={weeklyReport.totals}
              title="Week totals (all employees in range)"
            />
            <PaginatedTable
              columns={[
                { key: 'fullName', label: 'Employee' },
                { key: 'email', label: 'Email' },
                {
                  key: 'reg',
                  label: 'Regular',
                  render: (row) => formatHours(row.totals?.totalRegularHours),
                },
                {
                  key: 'ot',
                  label: 'OT',
                  render: (row) => formatHours(row.totals?.totalOvertimeHours),
                },
                {
                  key: 'nd',
                  label: 'ND',
                  render: (row) => formatHours(row.totals?.totalNightDifferentialHours),
                },
                {
                  key: 'late',
                  label: 'Late',
                  render: (row) => formatMinutes(row.totals?.totalLateMinutes),
                },
                {
                  key: 'undertime',
                  label: 'Undertime',
                  render: (row) => formatMinutes(row.totals?.totalUndertimeMinutes),
                },
              ]}
              rows={weeklyReport.items}
              rowKey={(row) => row.userId}
              loading={weeklyLoading}
              page={weeklyReport.page}
              limit={weeklyReport.limit}
              total={weeklyReport.total}
              onPageChange={setWeeklyPage}
              emptyTitle="No employees"
              emptyMessage="No employees match your filters."
            />
          </>
        )}
        {!weeklyReport && weeklyLoading && (
          <LoadingMessage message="Loading weekly report…" inline />
        )}
      </Section>

      <Section title="Tardiness">
        <ErrorBanner message={exceptionsError} onRetry={loadExceptions} />
        <FilterBar>
          <Input
            type="search"
            placeholder="Filter by name or email"
            value={excQ}
            onChange={(e) => {
              setExcQ(e.target.value);
              setExcPage(1);
            }}
            inputSize="sm"
            className="min-w-[200px] flex-1"
            aria-label="Filter tardiness"
          />
          <ReportRoleFilter value={role} onChange={onRoleChange} />
          <Input
            type="date"
            value={excFrom}
            onChange={(e) => {
              setExcFrom(e.target.value);
              setExcPage(1);
            }}
            inputSize="sm"
            className="w-auto shrink-0"
            aria-label="Tardiness from date"
          />
          <Input
            type="date"
            value={excTo}
            onChange={(e) => {
              setExcTo(e.target.value);
              setExcPage(1);
            }}
            inputSize="sm"
            className="w-auto shrink-0"
            aria-label="Tardiness to date"
          />
          <Button type="button" variant="secondary" size="sm" onClick={goToExceptionsThisWeek}>
            This week
          </Button>
        </FilterBar>

        {exceptionsLoading ? (
          <LoadingMessage message="Loading tardiness…" inline />
        ) : filteredExceptions.length ? (
          <PaginatedTable
            columns={[
              { key: 'fullName', label: 'Employee' },
              { key: 'date', label: 'Date' },
              {
                key: 'late',
                label: 'Late',
                render: (row) => formatMinutes(row.totalLateMinutes),
              },
              {
                key: 'ut',
                label: 'Undertime',
                render: (row) => formatMinutes(row.totalUndertimeMinutes),
              },
            ]}
            rows={paginatedExceptions}
            rowKey={(row) => `${row.userId}_${row.date}`}
            page={excPage}
            limit={EXCEPTIONS_PAGE_SIZE}
            total={filteredExceptions.length}
            onPageChange={setExcPage}
          />
        ) : (
          <EmptyState title="No tardiness" description="No late or undertime alerts in range." />
        )}
      </Section>
    </PageContainer>
  );
}
