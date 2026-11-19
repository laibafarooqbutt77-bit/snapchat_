import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Check,
  X,
  MessageCircle,
  Flame,
  ShieldBan,
  UserMinus,
  Phone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';
import { getStreakStatusInfo } from '../utils/streaks';

export const FriendsPage: React.FC = () => {
  const {
    state,
    currentUser,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    startCall,
  } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'friends' | 'requests' | 'suggested' | 'blocked'>('friends');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const { friends, incoming, suggested, blocked } = useMemo(() => {
    const allUsers = Object.values(state.users).filter((u) => u.id !== currentUser?.id);
    const filterByQ = (name: string, uname: string) =>
      !q || name.toLowerCase().includes(q) || uname.toLowerCase().includes(q);

    const friendsList = allUsers
      .filter(
        (u) =>
          state.friends[u.id]?.status === 'friend' &&
          !state.blockedUserIds.includes(u.id) &&
          filterByQ(u.displayName, u.username)
      )
      .map((u) => ({ user: u, rel: state.friends[u.id] }));

    const incomingList = allUsers
      .filter(
        (u) =>
          state.friends[u.id]?.status === 'pending_incoming' &&
          !state.blockedUserIds.includes(u.id) &&
          filterByQ(u.displayName, u.username)
      )
      .map((u) => ({ user: u, rel: state.friends[u.id] }));

    const suggestedList = allUsers.filter(
      (u) =>
        (!state.friends[u.id] || state.friends[u.id]?.status === 'pending_outgoing') &&
        !state.blockedUserIds.includes(u.id) &&
        filterByQ(u.displayName, u.username)
    );

    const blockedList = allUsers.filter((u) => state.blockedUserIds.includes(u.id));

    return {
      friends: friendsList,
      incoming: incomingList,
      suggested: suggestedList,
      blocked: blockedList,
    };
  }, [state.users, state.friends, state.blockedUserIds, currentUser?.id, q]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Friends</h1>
        <p className="text-xs text-[#A1A1A1]">Manage friends, requests, streaks &amp; suggestions</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#A1A1A1] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or @username..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#101010] border border-[#292929] text-sm text-white placeholder:text-[#A1A1A1] focus:outline-none focus:border-[#FFFC00]"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {(
          [
            ['friends', `My Friends (${friends.length})`],
            ['requests', `Requests (${incoming.length})`],
            ['suggested', `Suggested (${suggested.length})`],
            ['blocked', `Blocked (${blocked.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              tab === id
                ? 'bg-[#FFFC00] text-black'
                : 'bg-[#101010] border border-[#292929] text-[#A1A1A1] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lists */}
      <div className="space-y-2.5">
        {tab === 'friends' &&
          (friends.length === 0 ? (
            <EmptyCard text="No matching friends found." />
          ) : (
            friends.map(({ user, rel }) => {
              const info = getStreakStatusInfo(rel);
              return (
                <div
                  key={user.id}
                  className="p-3.5 rounded-2xl bg-[#101010] border border-[#292929] flex items-center justify-between gap-3"
                >
                  <button
                    onClick={() => navigate(`/profile/${user.username}`)}
                    className="flex items-center gap-3 min-w-0 text-left flex-1"
                  >
                    <BitmojiAvatar avatar={user.avatar} size={46} className="rounded-full" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                        {rel.streakCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#FFFC00] tabular-nums">
                            {rel.streakCount}
                            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A1A1A1] truncate">
                        @{user.username} · {user.isOnline ? 'Online' : user.lastActive}
                        {info.milestoneLabel ? ` · ${info.milestoneLabel}` : ''}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => navigate(`/chat/${user.username}`)}
                      className="w-9 h-9 rounded-xl bg-[#181818] border border-[#292929] text-sky-400 flex items-center justify-center hover:border-[#FFFC00]"
                      title="Chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startCall(user.id, 'audio')}
                      className="w-9 h-9 rounded-xl bg-[#181818] border border-[#292929] text-emerald-400 flex items-center justify-center hover:border-[#FFFC00]"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFriend(user.id)}
                      className="w-9 h-9 rounded-xl bg-[#181818] border border-[#292929] text-[#A1A1A1] hover:text-white flex items-center justify-center"
                      title="Remove Friend"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => blockUser(user.id)}
                      className="w-9 h-9 rounded-xl bg-[#181818] border border-[#292929] text-[#A1A1A1] hover:text-red-400 flex items-center justify-center"
                      title="Block User"
                    >
                      <ShieldBan className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ))}

        {tab === 'requests' &&
          (incoming.length === 0 ? (
            <EmptyCard text="No pending friend requests right now." />
          ) : (
            incoming.map(({ user, rel }) => (
              <div
                key={user.id}
                className="p-3.5 rounded-2xl bg-[#101010] border border-[#292929] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BitmojiAvatar avatar={user.avatar} size={46} className="rounded-full" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-xs text-[#A1A1A1]">
                      @{user.username} · {rel.mutualFriendsCount} mutual friends
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => acceptFriendRequest(user.id)}
                    className="h-9 px-3.5 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={() => declineFriendRequest(user.id)}
                    className="w-9 h-9 rounded-xl bg-[#181818] border border-[#292929] text-[#A1A1A1] flex items-center justify-center"
                    aria-label="Decline"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ))}

        {tab === 'suggested' &&
          (suggested.length === 0 ? (
            <EmptyCard text="You are connected with everyone in this directory!" />
          ) : (
            suggested.map((user) => {
              const isSent = state.friends[user.id]?.status === 'pending_outgoing';
              return (
                <div
                  key={user.id}
                  className="p-3.5 rounded-2xl bg-[#101010] border border-[#292929] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BitmojiAvatar avatar={user.avatar} size={46} className="rounded-full" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-[#A1A1A1] truncate">
                        @{user.username} · {user.bio}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={isSent}
                    onClick={() => sendFriendRequest(user.id)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                      isSent
                        ? 'bg-[#181818] text-[#A1A1A1] border border-[#292929]'
                        : 'bg-[#FFFC00] text-black'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {isSent ? 'Added' : 'Add'}
                  </button>
                </div>
              );
            })
          ))}

        {tab === 'blocked' &&
          (blocked.length === 0 ? (
            <EmptyCard text="No blocked users." />
          ) : (
            blocked.map((user) => (
              <div
                key={user.id}
                className="p-3.5 rounded-2xl bg-[#101010] border border-[#292929] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <BitmojiAvatar avatar={user.avatar} size={42} className="rounded-full opacity-50" />
                  <div>
                    <p className="text-sm font-bold text-white">{user.displayName}</p>
                    <p className="text-xs text-[#A1A1A1]">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => unblockUser(user.id)}
                  className="h-9 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-xs font-bold text-white hover:border-[#FFFC00]"
                >
                  Unblock
                </button>
              </div>
            ))
          ))}
      </div>
    </div>
  );
};

const EmptyCard: React.FC<{ text: string }> = ({ text }) => (
  <div className="p-8 rounded-3xl bg-[#101010] border border-[#292929] text-center text-xs text-[#A1A1A1]">
    {text}
  </div>
);
