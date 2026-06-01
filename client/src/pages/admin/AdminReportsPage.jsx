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
import { formatDateLabel, formatHours, formatMinutes } from '../../utils/format.js';
import { aggregateSummaryTotals } from '../../utils/summaryTotals.js';
import { Section } from '../../components/ui/Section.jsx';
import { FilterBar, FilterBarAction } from '../../components/ui/FilterBar.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { TableWithToolbar } from '../../components/ui/TableWithToolbar.jsx';
const DAILY_PAGE_SIZE = 10;
const RANGE_PAGE_SIZE = 10;

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

  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [dailyPage, setDailyPage] = useState(1);
  const [weeklyPage, setWeeklyPage] = useState(1);

  const [dailyLoading, setDailyLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  const [dailyError, setDailyError] = useState('');
  const [weeklyError, setWeeklyError] = useState('');

  const today = useMemo(
    () => getWorkDateForTimezone(new Date(), timezone),
    [timezone],
  );

  const thisWeekStart = useMemo(
    () => getCurrentWeekStart(timezone),
    [timezone],
  );

  const [rangeQ, setRangeQ] = useState('');
  const [rangeRole, setRangeRole] = useState('employee');
  const [rangeFrom, setRangeFrom] = useState(thisWeekStart);
  const [rangeTo, setRangeTo] = useState(today);
  const [appliedRange, setAppliedRange] = useState(() => ({
    q: '',
    role: 'employee',
    from: thisWeekStart,
    to: today,
  }));
  const [rangeReport, setRangeReport] = useState(null);
  const [rangePage, setRangePage] = useState(1);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [rangeError, setRangeError] = useState('');

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

  useEffect(() => {
    loadDaily();
  }, [loadDaily]);

  useEffect(() => {
    loadWeekly();
  }, [loadWeekly]);

  const loadRange = useCallback(async () => {
    setRangeLoading(true);
    setRangeError('');
    try {
      const data = await adminApi.getTeamRangeReport({
        from: appliedRange.from,
        to: appliedRange.to,
        role: appliedRange.role || undefined,
        q: appliedRange.q.trim() || undefined,
        page: rangePage,
        limit: RANGE_PAGE_SIZE,
      });
      setRangeReport(data);
    } catch (err) {
      setRangeError(getApiErrorMessage(err));
      setRangeReport(null);
    } finally {
      setRangeLoading(false);
    }
  }, [appliedRange, rangePage]);

  useEffect(() => {
    loadRange();
  }, [loadRange]);

  const onRoleChange = (nextRole) => {
    setRole(nextRole);
    setDailyPage(1);
    setWeeklyPage(1);
  };

  const goToToday = () => {
    setDate(today);
    setDailyPage(1);
  };

  const goToThisWeek = () => {
    setWeekStart(thisWeekStart);
    setWeeklyPage(1);
  };

  const applyRangeFilters = (event) => {
    event.preventDefault();
    const rangeCheck = historyDateRangeSchema.safeParse({ from: rangeFrom, to: rangeTo });
    if (!rangeCheck.success) {
      setRangeError(rangeCheck.error.errors[0]?.message ?? 'Invalid date range');
      return;
    }
    setRangeError('');
    setAppliedRange({
      q: rangeQ,
      role: rangeRole,
      from: rangeFrom,
      to: rangeTo,
    });
    setRangePage(1);
  };

  const filteredDailyItems = useMemo(
    () => filterByNameOrEmail(dailyReport?.items ?? [], dailyQ),
    [dailyReport, dailyQ],
  );

  const dailyDisplayTotals = useMemo(
    () => aggregateSummaryTotals(filteredDailyItems),
    [filteredDailyItems],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Daily & weekly reports"
        description="Summaries with regular, OT, night differential, late, and undertime."
      />

      <Section title="Daily summary">
        <ErrorBanner message={dailyError} onRetry={loadDaily} />
        <TableWithToolbar
          toolbar={
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
          }
        >
          {dailyReport ? (
            <div className="table-panel-body">
            <WeeklyAnalyticsCards totals={dailyDisplayTotals} />
              <SummaryTable
                items={filteredDailyItems}
                showEmployee
                loading={dailyLoading}
                emptyMessage="No summaries match your filters."
                page={dailyPage}
                limit={DAILY_PAGE_SIZE}
                onPageChange={setDailyPage}
              />
            </div>
          ) : dailyLoading ? (
            <div className="table-panel-body">
              <LoadingMessage message="Loading daily report…" inline />
            </div>
          ) : null}
        </TableWithToolbar>
      </Section>

      <Section title="Weekly Summary">
        <ErrorBanner message={weeklyError} onRetry={loadWeekly} />
        <TableWithToolbar
          toolbar={
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
          }
        >
          {weeklyReport ? (
            <div className="table-panel-body">
            <WeeklyAnalyticsCards totals={weeklyReport.totals} />
              <PaginatedTable
                columns={[
                  { key: 'fullName', label: 'Employee' },
                  { key: 'email', label: 'Email' },
                  {
                    key: 'reg',
                    label: 'Regular',
                    align: 'center',
                    render: (row) => formatHours(row.totals?.totalRegularHours),
                  },
                  {
                    key: 'ot',
                    label: 'OT',
                    align: 'center',
                    render: (row) => formatHours(row.totals?.totalOvertimeHours),
                  },
                  {
                    key: 'nd',
                    label: 'ND',
                    align: 'center',
                    render: (row) => formatHours(row.totals?.totalNightDifferentialHours),
                  },
                  {
                    key: 'late',
                    label: 'Late',
                    align: 'center',
                    render: (row) => formatMinutes(row.totals?.totalLateMinutes),
                  },
                  {
                    key: 'undertime',
                    label: 'Undertime',
                    align: 'center',
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
            </div>
          ) : weeklyLoading ? (
            <div className="table-panel-body">
              <LoadingMessage message="Loading weekly report…" inline />
            </div>
          ) : null}
        </TableWithToolbar>
      </Section>

      <Section
        title="Range summary"
        description={
          rangeReport
            ? `${formatDateLabel(rangeReport.from)} – ${formatDateLabel(rangeReport.to)} · totals for closed days in range`
            : 'Pick a date range and apply to see per-employee totals.'
        }
      >
        <ErrorBanner message={rangeError} onRetry={loadRange} />
        <TableWithToolbar
          toolbar={
            <FilterBar>
              <form onSubmit={applyRangeFilters}>
                <Input
                  type="search"
                  placeholder="Filter by name or email"
                  value={rangeQ}
                  onChange={(e) => setRangeQ(e.target.value)}
                  inputSize="sm"
                  className="min-w-[200px] flex-1"
                  aria-label="Filter range report"
                />
                <ReportRoleFilter value={rangeRole} onChange={setRangeRole} />
                <Input
                  type="date"
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  inputSize="sm"
                  className="w-auto shrink-0"
                  aria-label="Range start date"
                />
                <Input
                  type="date"
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                  inputSize="sm"
                  className="w-auto shrink-0"
                  aria-label="Range end date"
                />
                <FilterBarAction>
                  <Button type="submit" variant="primary" size="sm" loading={rangeLoading}>
                    Apply
                  </Button>
                </FilterBarAction>
              </form>
            </FilterBar>
          }
        >
          {rangeLoading && !rangeReport ? (
            <div className="table-panel-body">
              <LoadingMessage message="Loading range summary…" inline />
            </div>
          ) : rangeReport ? (
            <div className="table-panel-body">
              <WeeklyAnalyticsCards totals={rangeReport.totals} />
              {rangeReport.items.length ? (
                <PaginatedTable
                  columns={[
                    { key: 'fullName', label: 'Employee' },
                    { key: 'email', label: 'Email' },
                    {
                      key: 'reg',
                      label: 'Regular',
                      align: 'center',
                      render: (row) => formatHours(row.totals?.totalRegularHours),
                    },
                    {
                      key: 'ot',
                      label: 'OT',
                      align: 'center',
                      render: (row) => formatHours(row.totals?.totalOvertimeHours),
                    },
                    {
                      key: 'nd',
                      label: 'ND',
                      align: 'center',
                      render: (row) => formatHours(row.totals?.totalNightDifferentialHours),
                    },
                    {
                      key: 'late',
                      label: 'Late',
                      align: 'center',
                      render: (row) => formatMinutes(row.totals?.totalLateMinutes),
                    },
                    {
                      key: 'undertime',
                      label: 'Undertime',
                      align: 'center',
                      render: (row) => formatMinutes(row.totals?.totalUndertimeMinutes),
                    },
                  ]}
                  rows={rangeReport.items}
                  rowKey={(row) => row.userId}
                  loading={rangeLoading}
                  page={rangeReport.page}
                  limit={rangeReport.limit}
                  total={rangeReport.total}
                  onPageChange={setRangePage}
                  emptyTitle="No employees"
                  emptyMessage="No employees match your filters."
                />
              ) : (
                <EmptyState
                  title="No data in range"
                  description="No employees match your filters, or no closed attendance in this range."
                />
              )}
            </div>
          ) : null}
        </TableWithToolbar>
      </Section>
    </PageContainer>
  );
}
