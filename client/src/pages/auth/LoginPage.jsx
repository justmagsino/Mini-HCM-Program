import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../../schemas/auth.schema.js';
import { useAuth } from '../../hooks/useAuth.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { getFirebaseAuthErrorMessage } from '../../utils/firebaseAuthErrors.js';
import { AuthLayout } from '../../components/ui/AuthLayout.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';

export function LoginPage() {
  const { login, isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated && profile) {
    const redirectTo = location.state?.from?.pathname ?? '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      await login(values.email, values.password);
      const redirectTo = location.state?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err?.code === 'PROFILE_NOT_FOUND') {
        navigate('/register', { state: { completeProfile: true, email: values.email } });
        return;
      }
      setSubmitError(getFirebaseAuthErrorMessage(err) || getApiErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Track attendance and view your time summaries."
      footer={
        <>
          No account?{' '}
          <Link to="/register" className="link-primary">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            error={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            error={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>

        {submitError && <Alert variant="error">{submitError}</Alert>}

        <Button type="submit" fullWidth loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
