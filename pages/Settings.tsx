import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Toggle from '../components/Toggle';
import { auth } from '../firebase';
import { updateProfile, updatePassword } from 'firebase/auth';

interface SettingsProps {
  addAlert: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Settings: React.FC<SettingsProps> = ({ addAlert }) => {
  const user = auth.currentUser;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState({ email: true, inApp: true });

  useEffect(() => {
    if (user) {
      setFullName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const commonInputClasses =
    'mt-1 w-full p-2.5 border border-light-border dark:border-dark-border rounded-lg ' +
    'focus:ring-2 focus:ring-brand-primary focus:outline-none ' +
    'bg-light-background dark:bg-black/20 text-light-text dark:text-white placeholder-gray-500';

  const commonLabelClasses =
    'text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary';

  /* --------------------- PROFILE SAVE --------------------- */
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return addAlert('User not found.', 'error');

    try {
      await updateProfile(user, { displayName: fullName });
      addAlert('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      addAlert('Failed to update profile.', 'error');
    }
  };

  /* --------------------- PASSWORD CHANGE --------------------- */
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return addAlert('User not found.', 'error');

    if (newPassword !== confirmPassword) {
      return addAlert('Passwords do not match.', 'error');
    }

    try {
      await updatePassword(user, newPassword);
      addAlert('Password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        addAlert('Please log in again to change your password.', 'error');
      } else {
        addAlert('Failed to update password.', 'error');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-4">

      {/* ----------------------- PROFILE ----------------------- */}
      <Card>
        <h3 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">
          Profile Information
        </h3>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className={commonLabelClasses}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={commonInputClasses}
              required
            />
          </div>

          <div>
            <label className={commonLabelClasses}>Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className={`${commonInputClasses} bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed`}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-hover transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Card>

      {/* ----------------------- PASSWORD CHANGE ----------------------- */}
      <Card>
        <h3 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">
          Change Password
        </h3>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className={commonLabelClasses}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={commonInputClasses}
              required
            />
          </div>

          <div>
            <label className={commonLabelClasses}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={commonInputClasses}
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-hover transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </Card>

      {/* ----------------------- NOTIFICATIONS ----------------------- */}
      <Card>
        <h3 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">
          Notifications
        </h3>

        <div className="space-y-4 max-w-sm">
          <Toggle
            label="Email Notifications"
            enabled={notifications.email}
            onToggle={() => setNotifications(n => ({ ...n, email: !n.email }))}
          />
          <Toggle
            label="In-App Notifications"
            enabled={notifications.inApp}
            onToggle={() => setNotifications(n => ({ ...n, inApp: !n.inApp }))}
          />
        </div>
      </Card>
    </div>
  );
};

export default Settings;
