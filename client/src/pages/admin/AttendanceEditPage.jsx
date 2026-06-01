import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import * as adminApi from '../../api/admin.api.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { attendanceEditSchema, createAttendanceSchema } from '../../schemas/admin.schema.js';
import { toDatetimeLocalValue, toIsoFromDatetimeLocal } from '../../utils/datetime.js';
import { DEFAULT_TIMEZONE, getWorkDateForTimezone } from '../../utils/dates.js';
import { formatDateLabel, formatTime } from '../../utils/format.js';
import { useProfileTimezone } from '../../hooks/useProfileTimezone.js';
import { useConfirm } from '../../hooks/useConfirm.js';

export function AttendanceEditPage() {
  const { userId: routeUserId, date: routeDate } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const profileTimezone = useProfileTimezone();

  const isCreate = !(routeUserId && routeDate);
  const presetUserId = searchParams.get('userId') ?? '';

  const [employees, setEmployees] = useState([]);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const schema = isCreate ? createAttendanceSchema : attendanceEditSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      userId: presetUserId || routeUserId || '',
      date: routeDate || getWorkDateForTimezone(new Date(), profileTimezone),
      timeIn: '',
      timeOut: '',
      reason: '',
    },
  });

  const selectedUserId = watch('userId');

  const employee = useMemo(() => {
    const uid = isCreate ? selectedUserId : routeUserId;
    return employees.find((e) => e.uid === uid) ?? null;
  }, [employees, isCreate, selectedUserId, routeUserId]);

  const employeeTimezone = employee?.timezone ?? profileTimezone ?? DEFAULT_TIMEZONE;

  const loadExisting = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isCreate) {
        const list = await adminApi.listUsers({ role: 'employee', limit: 100 });
        setEmployees(list.items);
        setRecord(null);
        return;
      }

      const result = await adminApi.searchAttendance({
        userId: routeUserId,
        date: routeDate,
        limit: 1,
      });
      const row = result.items[0];
      const attendance = row?.attendance;
      if (!attendance) {
        setError('Attendance record not found.');
        return;
      }

      const list = await adminApi.listUsers({ role: 'employee', limit: 100 });
      setEmployees(list.items);
      const match = list.items.find((e) => e.uid === routeUserId);
      const tz = match?.timezone ?? DEFAULT_TIMEZONE;

      setRecord({ ...attendance, fullName: row.fullName, email: row.email });
      reset({
        timeIn: toDatetimeLocalValue(attendance.timeIn, tz),
        timeOut: toDatetimeLocalValue(attendance.timeOut, tz),
        reason: '',
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isCreate, routeUserId, routeDate, reset]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const onSubmit = async (values) => {
    setError('');
    try {
      const body = {
        timeIn: toIsoFromDatetimeLocal(values.timeIn, employeeTimezone),
        timeOut: toIsoFromDatetimeLocal(values.timeOut, employeeTimezone),
        reason: values.reason,
      };

      if (isCreate) {
        await adminApi.createAttendance({
          userId: values.userId,
          date: values.date,
          ...body,
        });
      } else {
        await adminApi.patchAttendance(routeUserId, routeDate, body);
      }

      navigate('/admin/attendance');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    const reason = getValues('reason')?.trim() ?? '';
    if (reason.length < 10) {
      setError('Enter a reason (at least 10 characters) before deleting this record.');
      return;
    }

    const label = employee?.fullName ?? 'this employee';
    const dateLabel = routeDate ? formatDateLabel(routeDate) : routeDate;

    const confirmed = await confirm({
      title: 'Delete attendance record',
      message: (
        <>
          Delete attendance for <strong>{label}</strong> on <strong>{dateLabel}</strong>? This removes
          the punch record and that day&apos;s summary totals. This cannot be undone.
        </>
      ),
      confirmLabel: 'Delete record',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await adminApi.deleteAttendance(routeUserId, routeDate, { reason });
      navigate('/admin/attendance');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const pageDescription = isCreate
    ? 'Add a closed attendance record when punches were missed.'
    : employee
      ? `${employee.fullName} · ${formatDateLabel(routeDate)}`
      : formatDateLabel(routeDate);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading attendance form…" />
      </div>
    );
  }

  return (
    <PageContainer narrow>
      <PageHeader
        title={isCreate ? 'Create attendance' : 'Edit attendance'}
        description={pageDescription}
        actions={
          <Link to="/admin/attendance" className="link-primary text-sm">
            ← Back
          </Link>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!isCreate && record?.lastCorrectionReason && (
        <Alert variant="info">
          <p className="font-medium text-navy">Saved correction note</p>
          <p className="mt-1 text-sm text-ink-muted">{record.lastCorrectionReason}</p>
          {record.lastCorrectedAt && (
            <p className="mt-1 text-xs text-ink-muted">
              Saved {formatTime(record.lastCorrectedAt, employeeTimezone)} (
              {employeeTimezone})
            </p>
          )}
        </Alert>
      )}

      <p className="text-xs text-ink-muted">Times are interpreted in {employeeTimezone}.</p>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {isCreate && (
            <>
              <FormField label="Employee" htmlFor="userId" error={errors.userId?.message} required>
                <Select id="userId" error={Boolean(errors.userId)} {...register('userId')}>
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.uid} value={e.uid}>
                      {e.fullName} ({e.email})
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Date" htmlFor="date" error={errors.date?.message} required>
                <Input id="date" type="date" error={Boolean(errors.date)} {...register('date')} />
              </FormField>
            </>
          )}

          <FormField label="Time in" htmlFor="timeIn" error={errors.timeIn?.message} required>
            <Input
              id="timeIn"
              type="datetime-local"
              error={Boolean(errors.timeIn)}
              {...register('timeIn')}
            />
          </FormField>

          <FormField label="Time out" htmlFor="timeOut" error={errors.timeOut?.message} required>
            <Input
              id="timeOut"
              type="datetime-local"
              error={Boolean(errors.timeOut)}
              {...register('timeOut')}
            />
          </FormField>

          <FormField
            label="Reason"
            htmlFor="reason"
            error={errors.reason?.message}
            hint={
              isCreate
                ? 'Required audit note (min. 10 characters). Shown here if you edit this record again.'
                : 'Required for each save or delete (min. 10 characters). Updates the note shown above on this page.'
            }
            required
          >
            <Textarea
              id="reason"
              rows={3}
              placeholder="Verified with supervisor; correction reason..."
              error={Boolean(errors.reason)}
              {...register('reason')}
            />
          </FormField>

          <Button type="submit" fullWidth loading={isSubmitting} disabled={isSubmitting || deleting}>
            {isCreate ? 'Create record' : 'Save changes'}
          </Button>

          {!isCreate && (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="border-red-300 text-red-700 hover:bg-red-50"
              loading={deleting}
              disabled={isSubmitting || deleting}
              onClick={handleDelete}
            >
              Delete record
            </Button>
          )}
        </form>
      </Card>
    </PageContainer>
  );
}
