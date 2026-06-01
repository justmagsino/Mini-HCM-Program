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
import { useProfileTimezone } from '../../hooks/useProfileTimezone.js';
export function AttendanceEditPage() {
  const { userId: routeUserId, date: routeDate } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profileTimezone = useProfileTimezone();

  const isCreate = !(routeUserId && routeDate);
  const presetUserId = searchParams.get('userId') ?? '';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const schema = isCreate ? createAttendanceSchema : attendanceEditSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
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

  const employeeTimezone = useMemo(() => {
    if (!isCreate && routeUserId) {
      const match = employees.find((e) => e.uid === routeUserId);
      return match?.timezone ?? DEFAULT_TIMEZONE;
    }
    if (selectedUserId) {
      const match = employees.find((e) => e.uid === selectedUserId);
      return match?.timezone ?? DEFAULT_TIMEZONE;
    }
    return profileTimezone;
  }, [isCreate, routeUserId, selectedUserId, employees, profileTimezone]);

  const loadExisting = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isCreate) {
        const list = await adminApi.listUsers({ role: 'employee', limit: 100 });
        setEmployees(list.items);
        return;
      }

      const result = await adminApi.searchAttendance({
        userId: routeUserId,
        date: routeDate,
        limit: 1,
      });
      const row = result.items[0]?.attendance;
      if (!row) {
        setError('Attendance record not found.');
        return;
      }

      const list = await adminApi.listUsers({ role: 'employee', limit: 100 });
      setEmployees(list.items);
      const employee = list.items.find((e) => e.uid === routeUserId);
      const tz = employee?.timezone ?? DEFAULT_TIMEZONE;

      reset({
        timeIn: toDatetimeLocalValue(row.timeIn, tz),
        timeOut: toDatetimeLocalValue(row.timeOut, tz),
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
        description={
          isCreate
            ? 'Add a closed attendance record when punches were missed.'
            : `Record ${routeUserId} · ${routeDate}`
        }
        actions={
          <Link to="/admin/attendance" className="link-primary text-sm">
            ← Back
          </Link>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <p className="text-xs text-slate-500">Times are interpreted in {employeeTimezone}.</p>

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
            hint="Minimum 10 characters. Describe why this correction is needed."
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

          <Button type="submit" fullWidth loading={isSubmitting} disabled={isSubmitting}>
            {isCreate ? 'Create record' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
