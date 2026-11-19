import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Trash2, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';

export const NotificationsPage: React.FC = () => {
  const { state, markNotificationRead, markAllNotificationsRead, clearNotifications } = useApp();
  const navigate = useNavigate();

  const unreadCount = state.notifications.filter((n) => !n.isRead).length;

  const formatTime = (ts: number) => {
    const min = Math.max(1, Math.floor((Date.now() - ts) / 60000));
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Notifications</h1>
          <p className="text-xs text-[#A1A1A1] tabular-nums">
            {unreadCount} unread updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsRead}
            className="h-9 px-3 rounded-xl bg-[#181818] border border-[#292929] text-xs font-semibold text-white flex items-center gap-1.5 hover:border-[#FFFC00]"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#FFFC00]" />
            Mark all read
          </button>
          <button
            onClick={clearNotifications}
            className="h-9 px-3 rounded-xl bg-[#181818] border border-[#292929] text-xs font-semibold text-[#A1A1A1] flex items-center gap-1.5 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {state.notifications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#101010] border border-[#292929] text-center space-y-2">
          <Bell className="w-8 h-8 text-[#A1A1A1] mx-auto opacity-60" />
          <p className="text-sm font-bold text-white">All caught up</p>
          <p className="text-xs text-[#A1A1A1]">New snaps, streak alerts, and replies will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#1F1F1F] bg-[#101010] border border-[#292929] rounded-3xl overflow-hidden">
          {state.notifications.map((n) => {
            const fromUser = state.users[n.fromUserId];
            return (
              <button
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  navigate(n.link);
                }}
                className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left transition hover:bg-[#161616] ${
                  !n.isRead ? 'bg-[#141414]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {fromUser && (
                    <BitmojiAvatar avatar={fromUser.avatar} size={44} className="rounded-full shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{n.title}</p>
                    <p className="text-xs text-[#A1A1A1] truncate">{n.body}</p>
                    <p className="text-[11px] text-[#71717A] mt-0.5 tabular-nums">
                      {formatTime(n.createdAt)}
                    </p>
                  </div>
                </div>

                {!n.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFFC00] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
