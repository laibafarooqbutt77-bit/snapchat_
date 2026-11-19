import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Sparkles,
  Ghost,
  Bell,
  Camera,
  Shield,
  Trash2,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { state, currentUser, updateSettings, unblockUser, resetAllData, logout } = useApp();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);

  const s = state.settings;
  const blockedUsers = state.blockedUserIds.map((id) => state.users[id]).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-[#A1A1A1]">Account, privacy, camera defaults &amp; local storage</p>
      </div>

      {/* Account */}
      <section className="bg-[#101010] border border-[#292929] rounded-3xl overflow-hidden divide-y divide-[#1F1F1F]">
        <button
          onClick={() => navigate('/profile')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#161616]"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-white">
            <User className="w-4 h-4 text-[#FFFC00]" />
            Profile ({currentUser?.displayName})
          </span>
          <ChevronRight className="w-4 h-4 text-[#A1A1A1]" />
        </button>
        <button
          onClick={() => navigate('/avatar')}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#161616]"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-white">
            <Sparkles className="w-4 h-4 text-[#FFFC00]" />
            Bitmoji Avatar Studio
          </span>
          <ChevronRight className="w-4 h-4 text-[#A1A1A1]" />
        </button>
      </section>

      {/* Privacy & Map */}
      <section className="bg-[#101010] border border-[#292929] rounded-3xl p-4 space-y-4">
        <h2 className="text-xs font-bold text-[#A1A1A1] flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#FFFC00]" />
          Privacy Controls
        </h2>

        <ToggleRow
          icon={<Ghost className="w-4 h-4 text-emerald-400" />}
          label="Ghost Mode"
          desc="Hide your pin on Snap Map from all friends"
          checked={s.ghostMode}
          onChange={(ghostMode) => updateSettings({ ghostMode })}
        />

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Who Can Contact Me</p>
            <p className="text-xs text-[#A1A1A1]">Control incoming chats and calls</p>
          </div>
          <select
            value={s.whoCanContact}
            onChange={(e) =>
              updateSettings({ whoCanContact: e.target.value as 'friends' | 'everyone' })
            }
            className="h-9 px-3 rounded-xl bg-[#181818] border border-[#292929] text-xs font-semibold text-white"
          >
            <option value="friends">My Friends</option>
            <option value="everyone">Everyone</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Who Can View My Story</p>
            <p className="text-xs text-[#A1A1A1]">Visibility for 24-hour story posts</p>
          </div>
          <select
            value={s.whoCanViewStory}
            onChange={(e) =>
              updateSettings({
                whoCanViewStory: e.target.value as 'friends' | 'everyone' | 'custom',
              })
            }
            className="h-9 px-3 rounded-xl bg-[#181818] border border-[#292929] text-xs font-semibold text-white"
          >
            <option value="friends">Friends Only</option>
            <option value="everyone">Everyone</option>
            <option value="custom">Close Friends</option>
          </select>
        </div>
      </section>

      {/* Camera & Notifications */}
      <section className="bg-[#101010] border border-[#292929] rounded-3xl p-4 space-y-4">
        <h2 className="text-xs font-bold text-[#A1A1A1] flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-[#FFFC00]" />
          Camera &amp; Alerts
        </h2>

        <ToggleRow
          icon={<Bell className="w-4 h-4 text-[#FFFC00]" />}
          label="Push & In-App Notifications"
          desc="Alerts for snaps, streaks & replies"
          checked={s.notificationsEnabled}
          onChange={(notificationsEnabled) => updateSettings({ notificationsEnabled })}
        />

        <ToggleRow
          icon={<Camera className="w-4 h-4 text-sky-400" />}
          label="Camera Grid Lines"
          desc="Show 3x3 framing grid in Camera"
          checked={s.cameraGrid}
          onChange={(cameraGrid) => updateSettings({ cameraGrid })}
        />

        <ToggleRow
          icon={<Camera className="w-4 h-4 text-purple-400" />}
          label="Mirror Front Camera"
          desc="Flip selfie preview horizontally"
          checked={s.mirrorFrontCam}
          onChange={(mirrorFrontCam) => updateSettings({ mirrorFrontCam })}
        />
      </section>

      {/* Blocked Users */}
      {blockedUsers.length > 0 && (
        <section className="bg-[#101010] border border-[#292929] rounded-3xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-[#A1A1A1]">Blocked Users</h2>
          {blockedUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                {u.displayName} (@{u.username})
              </span>
              <button
                onClick={() => unblockUser(u.id)}
                className="px-3 py-1 rounded-xl bg-[#181818] border border-[#292929] text-xs font-bold text-white"
              >
                Unblock
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Data & Logout */}
      <section className="space-y-3">
        <button
          onClick={() => setConfirmReset(true)}
          className="w-full h-12 rounded-2xl bg-[#101010] border border-[#292929] text-sm font-bold text-red-400 flex items-center justify-center gap-2 hover:border-red-500"
        >
          <Trash2 className="w-4 h-4" />
          Clear Local Data &amp; Reset Demo
        </button>

        <button
          onClick={logout}
          className="w-full h-12 rounded-2xl bg-[#181818] border border-[#292929] text-sm font-bold text-white flex items-center justify-center gap-2 hover:border-[#FFFC00]"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </section>

      {confirmReset && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#101010] border border-[#292929] rounded-3xl p-6 space-y-4 text-center">
            <h3 className="text-base font-bold text-white">Reset All Local Data?</h3>
            <p className="text-xs text-[#A1A1A1]">
              This clears saved chats, snaps, stories, and custom Bitmoji changes from LocalStorage and IndexedDB.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="h-10 rounded-xl bg-[#181818] text-xs font-bold text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await resetAllData();
                  setConfirmReset(false);
                }}
                className="h-10 rounded-xl bg-red-500 text-white text-xs font-bold"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToggleRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ icon, label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-[#181818] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{label}</p>
        <p className="text-xs text-[#A1A1A1] truncate">{desc}</p>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
        checked ? 'bg-[#FFFC00]' : 'bg-[#292929]'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-black transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
