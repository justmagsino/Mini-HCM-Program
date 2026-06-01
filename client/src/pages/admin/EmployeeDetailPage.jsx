import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { Section } from '../../components/ui/Section.jsx';
import * as adminApi from '../../api/admin.api.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { editUserSchema } from '../../schemas/admin.schema.js';
import { DEFAULT_TIMEZONE } from '../../utils/dates.js';
import { formatDateLabel, formatTime } from '../../utils/format.js';

const DEFAULT_SHIFT = { start: '09:00', end: '18:00' };

export function EmployeeDetailPage() {
  const { uid } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editUserSchema),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getUser(uid);
      setDetail(data);
      const schedule = data.user.schedule ?? DEFAULT_SHIFT;
      reset({
        fullName: data.user.fullName ?? '',
        timezone: data.user.timezone ?? DEFAULT_TIMEZONE,
        scheduleStart: schedule.start ?? DEFAULT_SHIFT.start,
        scheduleEnd: schedule.end ?? DEFAULT_SHIFT.end,
      });
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? getApiErrorMessage(err)
          : (err?.message ?? 'Failed to load employee');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (values) => {
    setSaved(false);
    setError('');
    try {
      await adminApi.updateUser(uid, {
        fullName: values.fullName,
        timezone: values.timezone,
        schedule: { start: values.scheduleStart, end: values.scheduleEnd },
      });
      setSaved(true);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (loading && !detail) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading employee…" />
      </div>
    );
  }

  if (!detail) {
    return (
      <PageContainer narrow>
        <Alert variant="error">{error || 'Employee not found.'}</Alert>
      </PageContainer>
    );
  }

  const { user, recentAttendance = [] } = detail;
  const displayTimezone = user.timezone ?? DEFAULT_TIMEZONE;

  return (
    <PageContainer>
      <PageHeader
        title={user.fullName}
        description={user.email}
        actions={
          <Link to="/admin/employees" className="link-primary text-sm">
            ← Back to employees
          </Link>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Profile saved.</Alert>}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5" noValidate>
          <h2 className="section-title">Profile</h2>

          <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
            <Input id="fullName" error={Boolean(errors.fullName)} {...register('fullName')} />
          </FormField>

          <FormField label="Timezone" htmlFor="timezone" error={errors.timezone?.message} required>
            <Input id="timezone" error={Boolean(errors.timezone)} {...register('timezone')} />
          </FormField>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label="Shift start"
              htmlFor="scheduleStart"
              error={errors.scheduleStart?.message}
              required
            >
              <Input
                id="scheduleStart"
                error={Boolean(errors.scheduleStart)}
                {...register('scheduleStart')}
              />
            </FormField>
            <FormField
              label="Shift end"
              htmlFor="scheduleEnd"
              error={errors.scheduleEnd?.message}
              required
            >
              <Input
                id="scheduleEnd"
                error={Boolean(errors.scheduleEnd)}
                {...register('scheduleEnd')}
              />
            </FormField>
          </div>

          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </Card>

      <Section
        title="Recent attendance"
        actions={
          <Link to={`/admin/attendance/edit?userId=${uid}`} className="link-primary text-sm">
            Create attendance record
          </Link>
        }
      >
        <DataTable
          columns={[
            {
              key: 'date',
              label: 'Date',
              render: (row) => formatDateLabel(row.date),
            },
            {
              key: 'timeIn',
              label: 'In',
              render: (row) => formatTime(row.timeIn, displayTimezone),
            },
            {
              key: 'timeOut',
              label: 'Out',
              render: (row) => formatTime(row.timeOut, displayTimezone),
            },
            { key: 'status', label: 'Status' },
            {
              key: 'edit',
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
          rows={recentAttendance}
          rowKey={(row) => `${row.userId}_${row.date}`}
          emptyTitle="No recent attendance"
          emptyMessage="No recent attendance records."
        />
      </Section>
    </PageContainer>
  );
}
