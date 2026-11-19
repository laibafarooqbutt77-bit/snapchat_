import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Video,
  Camera,
  Mic,
  Send,
  Image as ImageIcon,
  Smile,
  Search,
  Pin,
  VolumeX,
  Reply,
  Trash2,
  X,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';
import { VoiceRecorderBar } from '../components/chat/VoiceRecorderBar';
import { VoiceMessagePlayer } from '../components/chat/VoiceMessagePlayer';
import { MediaPreview } from '../components/common/MediaPreview';
import { ChatMessage } from '../types';
import { saveMediaBlob } from '../utils/idb';

const REACTION_EMOJIS = ['🔥', '😂', '❤️', '😮', '👍', '🙌'];
const STICKER_PACK = [
  { emoji: '🔥', label: 'Lit' },
  { emoji: '⚡', label: 'Snap!' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '🫶', label: 'Love' },
  { emoji: '💀', label: 'Dead' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🚀', label: 'Send It' },
  { emoji: '🙌', label: 'Cheers' },
];

export const ChatDetailPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const {
    state,
    currentUser,
    sendMessage,
    openSnap,
    deleteMessage,
    reactToMessage,
    togglePinChat,
    toggleMuteChat,
    markChatRead,
    startCall,
    showToast,
  } = useApp();

  const friend = useMemo(
    () =>
      Object.values(state.users).find(
        (u) => u.username.toLowerCase() === (username || '').toLowerCase()
      ),
    [state.users, username]
  );

  const conv = useMemo(
    () => state.conversations.find((c) => c.participantId === friend?.id),
    [state.conversations, friend?.id]
  );

  const rel = friend ? state.friends[friend.id] : undefined;

  const [text, setText] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [activeSnapModal, setActiveSnapModal] = useState<ChatMessage | null>(null);
  const [snapCountdown, setSnapCountdown] = useState(5);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (conv && conv.unreadCount > 0) {
      markChatRead(conv.id);
    }
  }, [conv, markChatRead]);

  const messages = useMemo(() => {
    if (!conv) return [];
    const q = msgSearch.trim().toLowerCase();
    return state.messages
      .filter((m) => m.conversationId === conv.id)
      .filter((m) => (!q ? true : (m.text || '').toLowerCase().includes(q)));
  }, [state.messages, conv, msgSearch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conv?.isTyping]);

  // Ephemeral Snap Viewer Countdown
  useEffect(() => {
    if (!activeSnapModal) return;
    setSnapCountdown(activeSnapModal.duration || 5);
    const timer = setInterval(() => {
      setSnapCountdown((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setActiveSnapModal(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSnapModal]);

  if (!friend) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-bold text-white">User not found</p>
        <button
          onClick={() => navigate('/chat')}
          className="mt-4 px-4 py-2 rounded-xl bg-[#FFFC00] text-black text-xs font-bold"
        >
          Back to Chats
        </button>
      </div>
    );
  }

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(friend.id, {
      type: 'text',
      text: text.trim(),
      replyToId: replyTo?.id,
    });
    setText('');
    setReplyTo(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      showToast('Please select an image or video file.', 'error');
      return;
    }
    const mediaId = `chat_media_${Date.now()}`;
    await saveMediaBlob(mediaId, file);
    sendMessage(friend.id, {
      type: isVideo ? 'video' : 'photo',
      mediaId,
      text: isVideo ? 'Sent a video' : 'Sent a photo',
      replyToId: replyTo?.id,
    });
    setReplyTo(null);
    e.target.value = '';
  };

  const handleOpenSnap = (msg: ChatMessage) => {
    openSnap(msg.id);
    setActiveSnapModal(msg);
  };

  return (
    <div className="h-full flex flex-col bg-black max-w-4xl mx-auto lg:border-x lg:border-[#292929]">
      {/* Chat Header */}
      <header className="h-16 px-3 sm:px-5 bg-[#0A0A0A] border-b border-[#292929] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate('/chat')}
            className="min-w-[40px] min-h-[40px] rounded-full hover:bg-[#181818] flex items-center justify-center text-white"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate(`/profile/${friend.username}`)}
            className="flex items-center gap-2.5 text-left min-w-0"
          >
            <BitmojiAvatar avatar={friend.avatar} size={40} className="rounded-full border border-[#292929]" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white truncate">{friend.displayName}</p>
                {rel && rel.streakCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#FFFC00] tabular-nums">
                    {rel.streakCount}
                    <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A1A1A1] truncate">
                {conv?.isTyping ? 'Typing...' : friend.isOnline ? 'Online' : friend.lastActive}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowMsgSearch((v) => !v)}
            className="w-10 h-10 rounded-full hover:bg-[#181818] flex items-center justify-center text-[#A1A1A1] hover:text-white"
            aria-label="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>
          {conv && (
            <>
              <button
                onClick={() => togglePinChat(conv.id)}
                className={`hidden sm:flex w-10 h-10 rounded-full hover:bg-[#181818] items-center justify-center ${
                  conv.isPinned ? 'text-[#FFFC00]' : 'text-[#A1A1A1]'
                }`}
                aria-label="Pin chat"
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleMuteChat(conv.id)}
                className={`hidden sm:flex w-10 h-10 rounded-full hover:bg-[#181818] items-center justify-center ${
                  conv.isMuted ? 'text-red-400' : 'text-[#A1A1A1]'
                }`}
                aria-label="Mute chat"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => startCall(friend.id, 'audio')}
            className="w-10 h-10 rounded-full bg-[#181818] flex items-center justify-center text-white hover:text-[#FFFC00]"
            aria-label="Audio call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => startCall(friend.id, 'video')}
            className="w-10 h-10 rounded-full bg-[#181818] flex items-center justify-center text-white hover:text-[#FFFC00]"
            aria-label="Video call"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Message Search Bar */}
      {showMsgSearch && (
        <div className="px-4 py-2 bg-[#101010] border-b border-[#292929] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#A1A1A1]" />
          <input
            type="text"
            value={msgSearch}
            onChange={(e) => setMsgSearch(e.target.value)}
            placeholder="Search in conversation..."
            className="flex-1 bg-transparent text-xs text-white focus:outline-none h-8"
            autoFocus
          />
          {msgSearch && (
            <button onClick={() => setMsgSearch('')} className="text-xs text-[#A1A1A1]">
              Clear
            </button>
          )}
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const repliedMsg = msg.replyToId
            ? state.messages.find((x) => x.id === msg.replyToId)
            : null;
          const isSnap = msg.type === 'snap_photo' || msg.type === 'snap_video';

          return (
            <div key={msg.id} className="group space-y-1">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-extrabold tracking-wide uppercase ${
                    isMe ? 'text-red-400' : 'text-sky-400'
                  }`}
                >
                  {isMe ? 'Me' : friend.displayName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#A1A1A1] tabular-nums">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {isMe ? ` · ${msg.status}` : ''}
                  </span>
                </div>
              </div>

              {/* Snapchat-style Vertical Bar Message Row */}
              <div
                className={`pl-3 border-l-2 py-1 space-y-1.5 ${
                  isMe ? 'border-red-500' : 'border-sky-400'
                }`}
              >
                {repliedMsg && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#181818] text-xs text-[#A1A1A1] truncate">
                    Replying to: {repliedMsg.text || 'Media'}
                  </div>
                )}

                {msg.isDeleted ? (
                  <p className="text-xs italic text-[#A1A1A1]">Message deleted</p>
                ) : isSnap ? (
                  <button
                    onClick={() => handleOpenSnap(msg)}
                    className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition ${
                      msg.snapOpened
                        ? 'bg-[#121212] border-[#292929] text-[#A1A1A1]'
                        : msg.type === 'snap_video'
                          ? 'bg-purple-500/15 border-purple-500 text-purple-300'
                          : 'bg-red-500/15 border-red-500 text-red-300'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-[3px] border-2 ${
                        msg.snapOpened
                          ? 'border-[#A1A1A1]'
                          : msg.type === 'snap_video'
                            ? 'bg-purple-500 border-purple-500'
                            : 'bg-red-500 border-red-500'
                      }`}
                    />
                    {msg.snapOpened ? 'Snap Opened · Tap to replay' : 'Tap to view Snap'}
                    {msg.filterName && (
                      <span className="text-[10px] opacity-75">· {msg.filterName}</span>
                    )}
                  </button>
                ) : msg.type === 'voice' ? (
                  <div className="inline-block px-3 py-2 rounded-2xl bg-[#141414] border border-[#292929]">
                    <VoiceMessagePlayer
                      mediaId={msg.mediaId}
                      mediaUrl={msg.mediaUrl}
                      duration={msg.duration}
                    />
                  </div>
                ) : msg.type === 'sticker' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#141414] border border-[#292929]">
                    <span className="text-4xl">{msg.stickerEmoji}</span>
                    {msg.stickerLabel && (
                      <span className="text-xs font-bold text-[#FFFC00]">{msg.stickerLabel}</span>
                    )}
                  </div>
                ) : msg.type === 'photo' || msg.type === 'video' ? (
                  <div className="max-w-xs rounded-2xl overflow-hidden border border-[#292929] bg-[#101010]">
                    <MediaPreview
                      mediaId={msg.mediaId}
                      mediaUrl={msg.mediaUrl}
                      mediaType={msg.type}
                      controls={msg.type === 'video'}
                      className="w-full max-h-64 object-cover"
                    />
                    {msg.text && <p className="p-2.5 text-xs text-white">{msg.text}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                )}

                {/* Existing Reactions + Hover Actions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => reactToMessage(msg.id, emoji)}
                      className={`px-2 py-0.5 rounded-lg text-xs border transition ${
                        users.includes(currentUser?.id || '')
                          ? 'bg-[#FFFC00]/20 border-[#FFFC00] text-white'
                          : 'bg-[#181818] border-[#292929] text-[#A1A1A1]'
                      }`}
                    >
                      {emoji} {users.length}
                    </button>
                  ))}

                  {!msg.isDeleted && (
                    <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                      {REACTION_EMOJIS.slice(0, 3).map((em) => (
                        <button
                          key={em}
                          onClick={() => reactToMessage(msg.id, em)}
                          className="w-6 h-6 rounded-md bg-[#181818] text-xs hover:scale-110 transition"
                        >
                          {em}
                        </button>
                      ))}
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="w-6 h-6 rounded-md bg-[#181818] text-[#A1A1A1] hover:text-white flex items-center justify-center"
                        title="Reply"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      {isMe && (
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="w-6 h-6 rounded-md bg-[#181818] text-[#A1A1A1] hover:text-red-400 flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {conv?.isTyping && (
          <div className="pl-3 border-l-2 border-sky-400 py-1">
            <span className="text-xs text-sky-400 font-semibold animate-pulse">
              {friend.displayName} is typing...
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Stickers / GIF Reactions Drawer */}
      {showStickers && (
        <div className="px-4 py-3 bg-[#101010] border-t border-[#292929] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {STICKER_PACK.map((stk) => (
            <button
              key={stk.label}
              onClick={() => {
                sendMessage(friend.id, {
                  type: 'sticker',
                  stickerEmoji: stk.emoji,
                  stickerLabel: stk.label,
                });
                setShowStickers(false);
              }}
              className="shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl bg-[#181818] border border-[#292929] hover:border-[#FFFC00]"
            >
              <span className="text-2xl">{stk.emoji}</span>
              <span className="text-[10px] font-bold text-[#A1A1A1]">{stk.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="p-3 bg-[#0A0A0A] border-t border-[#292929] pb-safe space-y-2 shrink-0">
        {replyTo && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#181818] text-xs text-[#A1A1A1]">
            <span className="truncate">Replying to: {replyTo.text || 'Media'}</span>
            <button onClick={() => setReplyTo(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {recordingVoice ? (
          <VoiceRecorderBar
            onSendVoice={(mediaId, durationSec) => {
              sendMessage(friend.id, {
                type: 'voice',
                mediaId,
                duration: durationSec,
              });
              setRecordingVoice(false);
            }}
            onCancel={() => setRecordingVoice(false)}
          />
        ) : (
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/camera')}
              className="w-10 h-10 rounded-full bg-[#181818] border border-[#292929] flex items-center justify-center text-[#FFFC00] shrink-0"
              aria-label="Open camera"
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Send a chat..."
              className="flex-1 h-10 px-4 rounded-full bg-[#181818] border border-[#292929] text-sm text-white placeholder:text-[#A1A1A1] focus:outline-none focus:border-[#FFFC00]"
            />

            <button
              type="button"
              onClick={() => setRecordingVoice(true)}
              className="w-10 h-10 rounded-full bg-[#181818] border border-[#292929] flex items-center justify-center text-white hover:text-[#FFFC00] shrink-0"
              aria-label="Record voice note"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowStickers((v) => !v)}
              className={`w-10 h-10 rounded-full bg-[#181818] border flex items-center justify-center shrink-0 ${
                showStickers ? 'border-[#FFFC00] text-[#FFFC00]' : 'border-[#292929] text-white'
              }`}
              aria-label="Stickers"
            >
              <Smile className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-10 h-10 rounded-full bg-[#181818] border border-[#292929] flex items-center justify-center text-white shrink-0"
              aria-label="Send photo or video"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {text.trim() && (
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-[#FFFC00] text-black flex items-center justify-center shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </div>

      {/* Ephemeral Snap Viewer Modal */}
      {activeSnapModal && (
        <div
          onClick={() => setActiveSnapModal(null)}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
        >
          <div className="relative w-full max-w-md h-[85vh] rounded-3xl overflow-hidden bg-[#101010] border border-[#292929]">
            <MediaPreview
              mediaId={activeSnapModal.mediaId}
              mediaUrl={activeSnapModal.mediaUrl}
              mediaType={activeSnapModal.type === 'snap_video' ? 'video' : 'photo'}
              className="w-full h-full object-cover"
            />
            {activeSnapModal.text && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-black/70 py-2.5 px-4 text-center text-base font-bold text-white">
                {activeSnapModal.text}
              </div>
            )}
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/70 border-2 border-[#FFFC00] flex items-center justify-center text-sm font-bold text-[#FFFC00] tabular-nums">
              {snapCountdown}
            </div>
            <div className="absolute bottom-4 inset-x-0 text-center text-xs font-semibold text-white/75">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
