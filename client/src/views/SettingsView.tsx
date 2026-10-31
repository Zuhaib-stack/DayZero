import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Globe,
  Lock,
  Bell,
  Trash2,
  Check,
  History,
  AlertTriangle,
  Volume2,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { StreakAttempt } from '../types/index.js';
import { COMMON_TIMEZONES } from '../utils/time.js';
import { soundEffects } from '../utils/sound.js';

export const SettingsView: React.FC = () => {
  const { user, updateUserInState, logout } = useAuth();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  // Notifications
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [soundOn, setSoundOn] = useState(soundEffects.isSoundEnabled());

  // Streak attempts history
  const [attempts, setAttempts] = useState<StreakAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);

  // Delete account confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTimezone(user.timezone || 'UTC');
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }
    loadAttempts();
  }, [user]);

  const loadAttempts = async () => {
    try {
      setLoadingAttempts(true);
      const res = await api.getStreakAttempts();
      setAttempts(res.attempts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      setProfileMsg('');
      setProfileErr('');
      const res = await api.updateProfile({ name: name.trim(), timezone });
      updateUserInState({ name: res.user.name, timezone: res.user.timezone });
      setProfileMsg('Profile and timezone successfully updated.');
    } catch (err: any) {
      setProfileErr(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAutoDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
        setProfileMsg(`Auto-detected timezone: ${detected}. Click Save to apply.`);
      }
    } catch {
      // Ignore
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwErr('New passwords do not match');
      return;
    }
    try {
      setPwLoading(true);
      setPwMsg('');
      setPwErr('');
      const res = await api.changePassword({ currentPassword, newPassword });
      setPwMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwErr(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsAllowed(permission === 'granted');
    if (permission === 'granted') {
      new Notification('DayZero Notifications Enabled', {
        body: 'You will receive daily reminders and midnight warnings to protect your streaks.',
        icon: '/favicon.ico'
      });
    }
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundEffects.toggleSound(next);
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await api.deleteAccount();
      logout();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Account & Settings</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Manage your personal details, timezone deadline evaluation, preferences, and streak history.
        </p>
      </div>

      {/* Profile & Timezone Settings */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
        <h2 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
          <UserIcon className="w-4 h-4 text-purple-400" />
          <span>Profile Information</span>
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Your configured IANA timezone controls midnight deadline evaluations strictly on the server.
        </p>

        {profileMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            {profileMsg}
          </div>
        )}
        {profileErr && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {profileErr}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-lighter/50 border border-surface-border text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Daily Deadline Timezone (IANA)
              </label>
              <button
                type="button"
                onClick={handleAutoDetectTimezone}
                className="text-[11px] text-cyan-400 hover:text-cyan-300"
              >
                Auto-Detect Timezone
              </button>
            </div>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-white text-xs focus:outline-none focus:border-purple-500"
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Checkpoints for every calendar day must be completed before 11:59:59 PM in this timezone.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98]"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications & Audio Preferences */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
        <h2 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span>Notifications & Preferences</span>
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Configure audio cues and browser alerts to stay ahead of midnight deadlines.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-lighter border border-surface-border">
            <div>
              <h4 className="text-xs font-bold text-white">Browser Desktop Notifications</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Receive warnings before midnight if checkpoints are still incomplete.
              </p>
            </div>
            {notificationsAllowed ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Enabled</span>
              </span>
            ) : (
              <button
                onClick={handleRequestNotificationPermission}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
              >
                Enable Notifications
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-lighter border border-surface-border">
            <div>
              <h4 className="text-xs font-bold text-white">Audio Feedback & Victory Chimes</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Play click tones on task completion and celebration fanfare on checkpoint completion.
              </p>
            </div>
            <button
              onClick={handleToggleSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                soundOn
                  ? 'bg-purple-600 text-white'
                  : 'bg-surface-border text-gray-400 hover:text-white'
              }`}
            >
              {soundOn ? 'Sound On' : 'Sound Muted'}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-xl">
        <h2 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Change Password</span>
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Update your secure password to keep your habit records safe.
        </p>

        {pwMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            {pwMsg}
          </div>
        )}
        {pwErr && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {pwErr}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pwLoading}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98]"
            >
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 shadow-xl">
        <h2 className="text-base font-bold text-rose-300 mb-1 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Danger Zone: Delete Account</span>
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Permanently deletes your user account, habits, daily checkpoints, streak attempts, and unlocked achievements.
          This action is irreversible.
        </p>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-3">
            <p className="text-xs text-rose-200 font-semibold">
              Are you absolutely certain? All your historical progress will be permanently erased.
            </p>
            <div className="flex items-center space-x-3">
              <button
                disabled={deleteLoading}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Permanently Delete My Account'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-surface-lighter text-gray-300 text-xs font-medium hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

