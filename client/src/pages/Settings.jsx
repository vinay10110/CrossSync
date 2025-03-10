import { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Title,
  Grid,
  TextInput,
  PasswordInput,
  Switch,
  Button,
  Text,
  Group,
  Divider,
  ActionIcon,
  Modal,
  Select,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  IconAt,
  IconPhone,
  IconLock,
  IconShield,
  IconUserCircle,
  IconTrash,
  IconAlertCircle,
  IconEdit,
} from '@tabler/icons-react';

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Account Settings States
  const [accountSettings, setAccountSettings] = useState({
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: user?.phoneNumbers[0]?.phoneNumber || '',
    visibility: 'public',
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  // Password Change States
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      // Update email
      if (accountSettings.email !== user?.emailAddresses[0]?.emailAddress) {
        const emailResult = await user.createEmailAddress({
          emailAddress: accountSettings.email
        });
        
        // Verify the email if required by your Clerk configuration
        if (emailResult.verification) {
          await emailResult.prepareVerification({
            strategy: "email_code"
          });
        }
      }

      // Update phone
      if (accountSettings.phone !== user?.phoneNumbers[0]?.phoneNumber) {
        const phoneResult = await user.createPhoneNumber({
          phoneNumber: accountSettings.phone
        });
        
        // Verify the phone if required by your Clerk configuration
        if (phoneResult.verification) {
          await phoneResult.prepareVerification({
            strategy: "phone_code"
          });
        }
      }

      // Update user metadata
      await user.update({
        firstName: accountSettings.firstName,
        lastName: accountSettings.lastName,
        // Add any other fields you want to update in Clerk
      });

      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully. Please verify any new contact information.',
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update profile',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Verify current password first
      await user.verifyPassword(passwordData.currentPassword);

      // Update password using Clerk
      await user.updatePassword({
        newPassword: passwordData.newPassword,
        signOutOfOtherSessions: true // Optional: signs out other sessions
      });

      setPasswordModalOpen(false);
      notifications.show({
        title: 'Success',
        message: 'Password updated successfully',
        color: 'green',
      });
      
      // Clear password data
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update password',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    try {
      setLoading(true);
      
      if (!accountSettings.twoFactorEnabled) {
        // Enable 2FA
        const factor = await user.createTOTP();
        
        // Show QR code to user (you'll need to add UI for this)
        const { uri } = factor.totp;
        
        // Update state after verification
        setAccountSettings(prev => ({
          ...prev,
          twoFactorEnabled: true,
          totpSecret: uri
        }));
      } else {
        // Disable 2FA
        await user.disableTOTP();
        
        setAccountSettings(prev => ({
          ...prev,
          twoFactorEnabled: false,
          totpSecret: null
        }));
      }

      notifications.show({
        title: 'Success',
        message: `Two-factor authentication ${accountSettings.twoFactorEnabled ? 'disabled' : 'enabled'}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to toggle two-factor authentication',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      
      // Delete user account using Clerk
      await user.delete();
      
      // Sign out after successful deletion
      await signOut();
      
      notifications.show({
        title: 'Success',
        message: 'Account deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete account',
        color: 'red',
      });
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };

  // Add this function to handle email verification
  const handleVerifyEmail = async (emailId) => {
    try {
      const email = user.emailAddresses.find(e => e.id === emailId);
      if (email) {
        await email.prepareVerification({
          strategy: "email_code"
        });
        notifications.show({
          title: 'Success',
          message: 'Verification email sent',
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send verification email',
        color: 'red',
      });
    }
  };

  // Add this function to handle phone verification
  const handleVerifyPhone = async (phoneId) => {
    try {
      const phone = user.phoneNumbers.find(p => p.id === phoneId);
      if (phone) {
        await phone.prepareVerification({
          strategy: "phone_code"
        });
        notifications.show({
          title: 'Success',
          message: 'Verification code sent',
          color: 'green',
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send verification code',
        color: 'red',
      });
    }
  };

  return (
    <Box p="md">
      <Paper shadow="sm" p="md">
        <Stack spacing="xl">
          {/* Account Settings */}
          <div>
            <Title order={2} mb="md">Account Settings</Title>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  icon={<IconUserCircle size={16} />}
                  label="First Name"
                  value={accountSettings.firstName}
                  onChange={(e) => setAccountSettings({ ...accountSettings, firstName: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  icon={<IconUserCircle size={16} />}
                  label="Last Name"
                  value={accountSettings.lastName}
                  onChange={(e) => setAccountSettings({ ...accountSettings, lastName: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  icon={<IconAt size={16} />}
                  label="Email Address"
                  value={accountSettings.email}
                  onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  icon={<IconPhone size={16} />}
                  label="Phone Number"
                  value={accountSettings.phone}
                  onChange={(e) => setAccountSettings({ ...accountSettings, phone: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Profile Visibility"
                  value={accountSettings.visibility}
                  onChange={(value) => setAccountSettings({ ...accountSettings, visibility: value })}
                  data={[
                    { value: 'public', label: 'Public' },
                    { value: 'private', label: 'Private' },
                    { value: 'contacts', label: 'Contacts Only' },
                  ]}
                />
              </Grid.Col>
            </Grid>
            <Button mt="md" onClick={handleUpdateProfile} loading={loading}>
              Save Changes
            </Button>
          </div>

          <Divider />

          {/* Security Settings */}
          <div>
            <Title order={2} mb="md">Security</Title>
            <Stack spacing="md">
              <Group position="apart">
                <div>
                  <Text>Password</Text>
                  <Text size="sm" color="dimmed">Change your account password</Text>
                </div>
                <Button
                  leftIcon={<IconLock size={16} />}
                  variant="light"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  Change Password
                </Button>
              </Group>

              <Group position="apart">
                <div>
                  <Text>Two-Factor Authentication</Text>
                  <Text size="sm" color="dimmed">Add an extra layer of security to your account</Text>
                </div>
                <Switch
                  checked={accountSettings.twoFactorEnabled}
                  onChange={handleToggleTwoFactor}
                  disabled={loading}
                />
              </Group>
            </Stack>
          </div>

          <Divider />

          {/* Notification Settings */}
          <div>
            <Title order={2} mb="md">Notifications</Title>
            <Stack spacing="md">
              <Group position="apart">
                <div>
                  <Text>Email Notifications</Text>
                  <Text size="sm" color="dimmed">Receive updates and alerts via email</Text>
                </div>
                <Switch
                  checked={accountSettings.emailNotifications}
                  onChange={(event) => setAccountSettings({
                    ...accountSettings,
                    emailNotifications: event.currentTarget.checked,
                  })}
                />
              </Group>

              <Group position="apart">
                <div>
                  <Text>SMS Notifications</Text>
                  <Text size="sm" color="dimmed">Receive updates and alerts via SMS</Text>
                </div>
                <Switch
                  checked={accountSettings.smsNotifications}
                  onChange={(event) => setAccountSettings({
                    ...accountSettings,
                    smsNotifications: event.currentTarget.checked,
                  })}
                />
              </Group>
            </Stack>
          </div>

          <Divider />

          {/* Danger Zone */}
          <div>
            <Title order={2} mb="md" color="red">Danger Zone</Title>
            <Alert icon={<IconAlertCircle size={16} />} title="Delete Account" color="red" variant="outline">
              <Text size="sm" mb="md">
                Once you delete your account, there is no going back. Please be certain.
              </Text>
              <Button color="red" onClick={() => setDeleteModalOpen(true)}>
                Delete Account
              </Button>
            </Alert>
          </div>
        </Stack>
      </Paper>

      {/* Password Change Modal */}
      <Modal
        opened={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change Password"
      >
        <Stack>
          <PasswordInput
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          />
          <PasswordInput
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />
          <PasswordInput
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          />
          <Button onClick={handlePasswordChange} loading={loading}>
            Update Password
          </Button>
        </Stack>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account"
      >
        <Stack>
          <Text>Are you sure you want to delete your account? This action cannot be undone.</Text>
          <Group position="apart">
            <Button variant="light" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteAccount} loading={loading}>
              Delete Account
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
} 