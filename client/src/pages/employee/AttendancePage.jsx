import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { Section } from '../../components/ui/Section.jsx';
import { PunchControls } from '../../components/attendance/PunchControls.jsx';
import { AttendanceTable } from '../../components/attendance/AttendanceTable.jsx';
import { useAttendance } from '../../hooks/useAttendance.js';
import { historyFilterSchema } from '../../schemas/attendance.schema.js';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { FilterBar, FilterBarAction } from '../../components/ui/FilterBar.jsx';
import { getCurrentWeekStart, getWorkDateForTimezone } from '../../utils/dates.js';

export function AttendancePage() {
  const {
    today,
    history,
    historyRange,
    timezone,
    loading,
    historyLoading,
    actionLoading,
    error,
    isPunchedIn,
    isDayClosed,
    punchIn,
    punchOut,
    applyHistoryFilter,
    changeHistoryPage,
    historyPageSize,
  } = useAttendance();

  const [filterError, setFilterError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(historyFilterSchema),
    defaultValues: historyRange,
    values: historyRange,
  });

  const onFilterSubmit = async (values) => {
    setFilterError('');
    try {
      await applyHistoryFilter(values);
    } catch {
      setFilterError('Could not load history for the selected range.');
    }
  };

  const goToThisWeek = async () => {
    setFilterError('');
    const from = getCurrentWeekStart(timezone);
    const to = getWorkDateForTimezone(new Date(), timezone);
    setValue('from', from);
    setValue('to', to);
    try {
      await applyHistoryFilter({ from, to });
    } catch {
      setFilterError('Could not load history for this week.');
    }
  };

  const handlePunchIn = async () => {
    try {
      await punchIn();
    } catch {
      // error surfaced via hook
    }
  };

  const handlePunchOut = async () => {
    try {
      await punchOut();
    } catch {
      // error surfaced via hook
    }
  };

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Attendance"
        description="Punch in and out, then review your history."
      />

      {error && <Alert variant="error">{error}</Alert>}

      <PunchControls
        today={today}
        timezone={timezone}
        isPunchedIn={isPunchedIn}
        isDayClosed={isDayClosed}
        actionLoading={actionLoading}
        loading={loading}
        onPunchIn={handlePunchIn}
        onPunchOut={handlePunchOut}
      />

      <Section title="History">
        <FilterBar>
          <form onSubmit={handleSubmit(onFilterSubmit)}>
            <FormField label="From" htmlFor="from" error={errors.from?.message} className="filter-field">
              <Input
                id="from"
                type="date"
                inputSize="sm"
                error={Boolean(errors.from)}
                {...register('from')}
              />
            </FormField>
            <FormField label="To" htmlFor="to" error={errors.to?.message} className="filter-field">
              <Input
                id="to"
                type="date"
                inputSize="sm"
                error={Boolean(errors.to)}
                {...register('to')}
              />
            </FormField>
            <FilterBarAction>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={historyLoading}
                onClick={goToThisWeek}
              >
                This week
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isSubmitting || historyLoading}
                disabled={isSubmitting || historyLoading}
              >
                Apply
              </Button>
            </FilterBarAction>
          </form>
        </FilterBar>

        {filterError && <Alert variant="error">{filterError}</Alert>}

        <AttendanceTable
          items={history.items}
          timezone={timezone}
          loading={historyLoading && !loading}
          page={history.page}
          limit={historyPageSize}
          total={history.total}
          onPageChange={changeHistoryPage}
        />
      </Section>
    </PageContainer>
  );
}
