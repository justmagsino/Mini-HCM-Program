import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { completeProfileSchema, registerSchema } from '../../schemas/auth.schema.js';
import { useAuth } from '../../hooks/useAuth.js';
import { getAuthFlowErrorMessage } from '../../utils/firebaseAuthErrors.js';
import { AuthLayout } from '../../components/ui/AuthLayout.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';

export function RegisterPage() {
  const { register: registerUser, completeRegistration, isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState('');

  const completeProfile = Boolean(location.state?.completeProfile);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(completeProfile ? completeProfileSchema : registerSchema),
    defaultValues: {
      fullName: '',
      email: location.state?.email ?? '',
      password: '',
    },
  });

  if (isAuthenticated && profile) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      if (completeProfile) {
        await completeRegistration(values.fullName);
      } else {
        await registerUser(values);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setSubmitError(getAuthFlowErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title={completeProfile ? 'Complete your profile' : 'Create account'}
      subtitle={
        completeProfile
          ? 'Your sign-in succeeded but your profile is missing. Finish setup to continue.'
          : 'Set up your employee account to start tracking time.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            error={Boolean(errors.fullName)}
            {...register('fullName')}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={completeProfile}
            error={Boolean(errors.email)}
            {...register('email')}
          />
        </FormField>

        {!completeProfile && (
          <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              error={Boolean(errors.password)}
              {...register('password')}
            />
          </FormField>
        )}

        {submitError && <Alert variant="error">{submitError}</Alert>}

        <Button type="submit" fullWidth loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : completeProfile ? 'Complete profile' : 'Register'}
        </Button>
      </form>
    </AuthLayout>
  );
}
