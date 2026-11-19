import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Pin,
  VolumeX,
  Camera,
  Flame,
  Hourglass,
  MessageSquarePlus,
  Phone,
  Video,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';
import { getStreakStatusInfo } from '../utils/streaks';

export const ChatListPage: React.FC = () => {
  const { state, currentUser, togglePinChat, toggleMuteChat, startCall } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const conversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.conversations]
      .filter((c) => !state.blockedUserIds.includes(c.participantId))
      .filter((c) => {
        const u = state.users[c.participantId];
        if (!u) return false;
        if (!q) return true;
        return (
          u.displayName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.lastMessageAt - a.lastMessageAt;
      });
  }, [state.conversations, state.users, state.blockedUserIds, query]);

  const friendsWithoutChat = useMemo(() => {
    return Object.values(state.friends)
      .filter((f) => f.status === 'friend' && !state.blockedUserIds.includes(f.userId))
      .map((f) => state.users[f.userId])
      .filter(Boolean);
  }, [state.friends, state.users, state.blockedUserIds]);

  const formatRelTime = (ts: number) => {
    const diffMin = Math.max(1, Math.floor((Date.now() - ts) / 60000));
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return `${Math.floor(diffHr / 24)}d`;
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Chats</h1>
          <p className="text-xs text-[#A1A1A1]">Tap to chat, view snaps, or keep your streaks alive</p>
        </div>
        <button
          onClick={() => setShowNewChat((v) => !v)}
          className="h-10 px-3.5 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1.5 hover:brightness-95"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#A1A1A1] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-[#101010] border border-[#292929] text-sm text-white placeholder:text-[#A1A1A1] focus:outline-none focus:border-[#FFFC00]"
        />
      </div>

      {/* Quick Friend Launcher */}
      {showNewChat && (
        <div className="p-3 rounded-2xl bg-[#101010] border border-[#292929] space-y-2">
          <p className="text-xs font-semibold text-[#A1A1A1]">Start a conversation</p>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {friendsWithoutChat.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setShowNewChat(false);
                  navigate(`/chat/${u.username}`);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16"
              >
                <BitmojiAvatar avatar={u.avatar} size={46} className="rounded-full border border-[#292929]" />
                <span className="text-[11px] font-semibold text-white truncate w-full text-center">
                  {u.displayName.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Rows */}
      <div className="divide-y divide-[#1F1F1F] bg-[#101010] border border-[#292929] rounded-3xl overflow-hidden">
        {conversations.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-white">No conversations found</p>
            <p className="text-xs text-[#A1A1A1] mt-1">Start a new chat or send a snap from the camera.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const friend = state.users[conv.participantId];
            if (!friend) return null;
            const rel = state.friends[conv.participantId];
            const streakInfo = rel ? getStreakStatusInfo(rel) : null;
            const convMsgs = state.messages.filter((m) => m.conversationId === conv.id && !m.isDeleted);
            const lastMsg = convMsgs[convMsgs.length - 1];

            const isUnreadPhotoSnap =
              lastMsg &&
              lastMsg.senderId !== currentUser?.id &&
              lastMsg.type === 'snap_photo' &&
              !lastMsg.snapOpened;
            const isUnreadVideoSnap =
              lastMsg &&
              lastMsg.senderId !== currentUser?.id &&
              lastMsg.type === 'snap_video' &&
              !lastMsg.snapOpened;
            const isUnreadChat = conv.unreadCount > 0 && !isUnreadPhotoSnap && !isUnreadVideoSnap;

            let statusColor = 'border-[#A1A1A1]';
            let statusFilled = false;
            let statusText = 'Tap to chat';

            if (isUnreadPhotoSnap) {
              statusColor = 'bg-red-500 border-red-500';
              statusFilled = true;
              statusText = 'New Snap';
            } else if (isUnreadVideoSnap) {
              statusColor = 'bg-purple-500 border-purple-500';
              statusFilled = true;
              statusText = 'New Snap';
            } else if (isUnreadChat) {
              statusColor = 'bg-sky-400 border-sky-400';
              statusFilled = true;
              statusText = lastMsg?.text || 'New Chat';
            } else if (lastMsg?.senderId === currentUser?.id) {
              statusColor = lastMsg.type.startsWith('snap_') ? 'border-red-500' : 'border-sky-400';
              statusText = lastMsg.status === 'opened' ? 'Opened' : 'Delivered';
            } else if (lastMsg) {
              statusColor = 'border-sky-400';
              statusText = lastMsg.type === 'voice' ? 'Voice Note' : 'Received';
            }

            return (
              <div
                key={conv.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#161616] transition group"
              >
                <button
                  onClick={() => navigate(`/chat/${friend.username}`)}
                  className="flex items-center gap-3.5 flex-1 min-w-0 text-left"
                >
                  <div className="relative shrink-0">
                    <BitmojiAvatar
                      avatar={friend.avatar}
                      size={48}
                      className="rounded-full border border-[#292929]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white truncate">{friend.displayName}</p>
                      {conv.isPinned && <Pin className="w-3 h-3 text-[#FFFC00] shrink-0" />}
                      {conv.isMuted && <VolumeX className="w-3 h-3 text-[#A1A1A1] shrink-0" />}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <span
                        className={`w-3 h-3 rounded-[3px] border-2 shrink-0 ${
                          statusFilled ? statusColor : `${statusColor} bg-transparent`
                        }`}
                      />
                      <span
                        className={`truncate ${
                          isUnreadPhotoSnap
                            ? 'text-red-400 font-bold'
                            : isUnreadVideoSnap
                              ? 'text-purple-400 font-bold'
                              : isUnreadChat
                                ? 'text-sky-400 font-bold'
                                : 'text-[#A1A1A1]'
                        }`}
                      >
                        {conv.isTyping ? 'Typing...' : statusText}
                      </span>
                      {lastMsg && (
                        <>
                          <span className="text-[#52525B]">·</span>
                          <span className="text-[#A1A1A1] tabular-nums shrink-0">
                            {formatRelTime(lastMsg.createdAt)}
                          </span>
                        </>
                      )}
                      {rel && rel.streakCount > 0 && (
                        <>
                          <span className="text-[#52525B]">·</span>
                          <span className="inline-flex items-center gap-0.5 font-bold text-white tabular-nums shrink-0">
                            {rel.streakCount}
                            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                            {streakInfo?.isExpiringSoon && (
                              <Hourglass className="w-3 h-3 text-[#FFFC00] ml-0.5" />
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePinChat(conv.id)}
                    title={conv.isPinned ? 'Unpin' : 'Pin'}
                    className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center hover:bg-[#222222] ${
                      conv.isPinned ? 'text-[#FFFC00]' : 'text-[#A1A1A1]'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleMuteChat(conv.id)}
                    title={conv.isMuted ? 'Unmute' : 'Mute'}
                    className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center hover:bg-[#222222] ${
                      conv.isMuted ? 'text-red-400' : 'text-[#A1A1A1]'
                    }`}
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startCall(friend.id, 'audio')}
                    title="Audio Call"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#A1A1A1] hover:text-white hover:bg-[#222222]"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startCall(friend.id, 'video')}
                    title="Video Call"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#A1A1A1] hover:text-white hover:bg-[#222222]"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate('/camera')}
                    title="Send Snap"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#FFFC00] hover:bg-[#222222]"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
