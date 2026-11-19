import React from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, BellRing } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';

export const CallsPage: React.FC = () => {
  const { state, startCall, simulateIncomingCall } = useApp();

  const friends = Object.values(state.friends)
    .filter((f) => f.status === 'friend' && !state.blockedUserIds.includes(f.userId))
    .map((f) => state.users[f.userId])
    .filter(Boolean);

  const formatDur = (sec: number) => {
    if (!sec) return 'No answer';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Calls</h1>
          <p className="text-xs text-[#A1A1A1]">
            Audio &amp; video calls powered by WebRTC local media preview
          </p>
        </div>
        {friends[0] && (
          <button
            onClick={() => simulateIncomingCall(friends[0].id, 'video')}
            className="h-10 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-xs font-bold text-[#FFFC00] flex items-center gap-1.5 hover:border-[#FFFC00]"
          >
            <BellRing className="w-4 h-4" />
            Test Incoming Call
          </button>
        )}
      </div>

      {/* Quick Call Friends */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Start a Call</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {friends.map((f) => (
            <div
              key={f.id}
              className="p-3.5 rounded-2xl bg-[#101010] border border-[#292929] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BitmojiAvatar avatar={f.avatar} size={44} className="rounded-full" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{f.displayName}</p>
                  <p className="text-xs text-[#A1A1A1]">
                    {f.isOnline ? 'Available' : f.lastActive}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startCall(f.id, 'audio')}
                  className="w-10 h-10 rounded-xl bg-[#181818] border border-[#292929] text-emerald-400 flex items-center justify-center hover:border-[#FFFC00]"
                  aria-label={`Audio call ${f.displayName}`}
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCall(f.id, 'video')}
                  className="w-10 h-10 rounded-xl bg-[#FFFC00] text-black flex items-center justify-center hover:brightness-95"
                  aria-label={`Video call ${f.displayName}`}
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Call History */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Recent History</h2>
        <div className="divide-y divide-[#1F1F1F] bg-[#101010] border border-[#292929] rounded-3xl overflow-hidden">
          {state.callHistory.map((call) => {
            const u = state.users[call.participantId];
            if (!u) return null;
            return (
              <div key={call.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <BitmojiAvatar avatar={u.avatar} size={42} className="rounded-full" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.displayName}</p>
                    <p className="text-xs text-[#A1A1A1] flex items-center gap-1.5">
                      {call.status === 'missed' ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-red-400" />
                      ) : call.direction === 'incoming' ? (
                        <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-sky-400" />
                      )}
                      <span className="capitalize">{call.mode}</span>
                      <span>·</span>
                      <span className="tabular-nums">{formatDur(call.durationSec)}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => startCall(u.id, call.mode)}
                  className="h-9 px-3 rounded-xl bg-[#181818] border border-[#292929] text-xs font-bold text-white hover:border-[#FFFC00]"
                >
                  Call Again
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
