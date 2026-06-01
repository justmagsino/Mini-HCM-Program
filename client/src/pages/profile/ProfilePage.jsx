import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Section } from '../../components/ui/Section.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useLogoutWithConfirm } from '../../hooks/useLogoutWithConfirm.js';
import * as authApi from '../../api/auth.api.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { changePasswordSchema, profileNameSchema } from '../../schemas/profile.schema.js';
import { changePasswordWithReauth } from '../../utils/changePassword.js';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const handleLogout = useLogoutWithConfirm();
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const nameForm = useForm({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { fullName: '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (profile?.fullName) {
      nameForm.reset({ fullName: profile.fullName });
    }
  }, [profile?.fullName]);

  const onSaveName = async (values) => {
    setProfileSaved(false);
    setProfileError('');
    try {
      await authApi.updateProfile({ fullName: values.fullName });
      await refreshProfile();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(getApiErrorMessage(err));
    }
  };

  const onChangePassword = async (values) => {
    setPasswordSaved(false);
    setPasswordError('');
    try {
      await changePasswordWithReauth(values.currentPassword, values.newPassword);
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err?.message ?? 'Could not update password.');
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <PageContainer narrow>
      <PageHeader
        title="Profile"
        description="Update how your name appears in the app and manage your sign-in password."
      />

      <Section title="Account">
        <Card>
          <div className="card-body space-y-5">
            <FormField label="Email" htmlFor="profile-email">
              <Input id="profile-email" type="email" value={profile.email} readOnly disabled />
            </FormField>
            <p className="text-xs text-ink-muted">
              Email is tied to your login and cannot be changed here.
            </p>

            {profileError && <Alert variant="error">{profileError}</Alert>}
            {profileSaved && <Alert variant="success">Display name saved.</Alert>}

            <form onSubmit={nameForm.handleSubmit(onSaveName)} className="space-y-5" noValidate>
              <FormField
                label="Display name"
                htmlFor="fullName"
                error={nameForm.formState.errors.fullName?.message}
                required
              >
                <Input
                  id="fullName"
                  error={Boolean(nameForm.formState.errors.fullName)}
                  {...nameForm.register('fullName')}
                />
              </FormField>
              <Button type="submit" loading={nameForm.formState.isSubmitting}>
                {nameForm.formState.isSubmitting ? 'Saving…' : 'Save name'}
              </Button>
            </form>
          </div>
        </Card>
      </Section>

      <Section title="Password">
        <Card>
          <div className="card-body">
            {passwordError && <Alert variant="error">{passwordError}</Alert>}
            {passwordSaved && (
              <Alert variant="success">Password updated. Use it the next time you sign in.</Alert>
            )}

            <form
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
              className="mt-4 space-y-5"
              noValidate
            >
              <FormField
                label="Current password"
                htmlFor="currentPassword"
                error={passwordForm.formState.errors.currentPassword?.message}
                required
              >
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  error={Boolean(passwordForm.formState.errors.currentPassword)}
                  {...passwordForm.register('currentPassword')}
                />
              </FormField>
              <FormField
                label="New password"
                htmlFor="newPassword"
                error={passwordForm.formState.errors.newPassword?.message}
                required
              >
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  error={Boolean(passwordForm.formState.errors.newPassword)}
                  {...passwordForm.register('newPassword')}
                />
              </FormField>
              <FormField
                label="Confirm new password"
                htmlFor="confirmPassword"
                error={passwordForm.formState.errors.confirmPassword?.message}
                required
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  error={Boolean(passwordForm.formState.errors.confirmPassword)}
                  {...passwordForm.register('confirmPassword')}
                />
              </FormField>
              <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? 'Updating…' : 'Change password'}
              </Button>
            </form>

            <div className="mt-8 border-t border-line pt-6">
              <p className="text-sm text-ink-muted">Sign out of Mini HCM on this device.</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </Card>
      </Section>
    </PageContainer>
  );
}
