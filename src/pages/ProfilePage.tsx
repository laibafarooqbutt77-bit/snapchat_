import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Edit3,
  QrCode,
  Settings,
  Sparkles,
  Flame,
  MessageCircle,
  Phone,
  Video,
  X,
  Copy,
  Camera,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';
import { MediaPreview } from '../components/common/MediaPreview';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const { state, currentUser, updateProfile, startCall, showToast } = useApp();

  const targetUser = useMemo(() => {
    if (!username) return currentUser;
    return (
      Object.values(state.users).find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      ) || currentUser
    );
  }, [username, state.users, currentUser]);

  const isMe = targetUser?.id === currentUser?.id;

  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [tab, setTab] = useState<'stories' | 'spotlights'>('stories');

  const [editName, setEditName] = useState(targetUser?.displayName || '');
  const [editBio, setEditBio] = useState(targetUser?.bio || '');
  const [editBirthday, setEditBirthday] = useState(targetUser?.birthday || '');
  const photoRef = useRef<HTMLInputElement | null>(null);

  if (!targetUser) return null;

  const friendsCount = Object.values(state.friends).filter(
    (f) => f.status === 'friend' && !state.blockedUserIds.includes(f.userId)
  ).length;

  const relation = state.friends[targetUser.id];
  const userStories = state.stories.filter((s) => s.userId === targetUser.id);
  const userSpotlights = state.spotlights.filter((s) => s.creatorId === targetUser.id);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName: editName.trim() || targetUser.displayName,
      bio: editBio.trim(),
      birthday: editBirthday,
    });
    setEditOpen(false);
  };

  const handleProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateProfile({ profilePhotoUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Profile Hero Card */}
      <div className="rounded-3xl bg-[#101010] border border-[#292929] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (isMe ? navigate('/avatar') : undefined)}
              className="relative group"
              title={isMe ? 'Customize Bitmoji' : undefined}
            >
              <BitmojiAvatar
                avatar={targetUser.avatar}
                size={88}
                className="rounded-3xl border-2 border-[#FFFC00]"
              />
              {isMe && (
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FFFC00] text-black flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              )}
            </button>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {targetUser.displayName}
              </h1>
              <p className="text-xs font-semibold text-[#A1A1A1]">
                @{targetUser.username} · {targetUser.snapScore.toLocaleString()} Snap Score
              </p>
              <p className="text-xs text-white/90 mt-2 max-w-md leading-relaxed">
                {targetUser.bio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQrOpen(true)}
              className="w-10 h-10 rounded-xl bg-[#181818] border border-[#292929] text-white flex items-center justify-center hover:border-[#FFFC00]"
              aria-label="Share Snapcode"
            >
              <QrCode className="w-4 h-4" />
            </button>
            {isMe ? (
              <>
                <button
                  onClick={() => {
                    setEditName(targetUser.displayName);
                    setEditBio(targetUser.bio);
                    setEditBirthday(targetUser.birthday);
                    setEditOpen(true);
                  }}
                  className="h-10 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-xs font-bold text-white flex items-center gap-1.5 hover:border-[#FFFC00]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-10 h-10 rounded-xl bg-[#181818] border border-[#292929] text-white flex items-center justify-center hover:border-[#FFFC00]"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/chat/${targetUser.username}`)}
                  className="h-10 px-3.5 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                <button
                  onClick={() => startCall(targetUser.id, 'audio')}
                  className="w-10 h-10 rounded-xl bg-[#181818] border border-[#292929] text-white flex items-center justify-center"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCall(targetUser.id, 'video')}
                  className="w-10 h-10 rounded-xl bg-[#181818] border border-[#292929] text-white flex items-center justify-center"
                >
                  <Video className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#292929]">
          <div className="p-3 rounded-2xl bg-[#181818]">
            <p className="text-[11px] text-[#A1A1A1]">Snap Score</p>
            <p className="text-lg font-extrabold text-[#FFFC00] tabular-nums">
              {targetUser.snapScore.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#181818]">
            <p className="text-[11px] text-[#A1A1A1]">{isMe ? 'Friends' : 'Snapstreak'}</p>
            <p className="text-lg font-extrabold text-white tabular-nums flex items-center gap-1">
              {isMe ? friendsCount : relation?.streakCount || 0}
              {!isMe && (relation?.streakCount || 0) > 0 && (
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              )}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#181818]">
            <p className="text-[11px] text-[#A1A1A1]">Neighborhood</p>
            <p className="text-sm font-bold text-white truncate mt-1">
              {targetUser.location.neighborhood}
            </p>
          </div>
        </div>

        {isMe && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/avatar')}
              className="h-10 px-4 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Customize Bitmoji
            </button>
            <button
              onClick={() => photoRef.current?.click()}
              className="h-10 px-4 rounded-xl bg-[#181818] border border-[#292929] text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              Upload Profile Photo
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePhoto}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Stories & Spotlight Posts Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('stories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              tab === 'stories'
                ? 'bg-[#FFFC00] text-black'
                : 'bg-[#101010] border border-[#292929] text-[#A1A1A1]'
            }`}
          >
            Stories ({userStories.length})
          </button>
          <button
            onClick={() => setTab('spotlights')}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              tab === 'spotlights'
                ? 'bg-[#FFFC00] text-black'
                : 'bg-[#101010] border border-[#292929] text-[#A1A1A1]'
            }`}
          >
            Spotlight ({userSpotlights.length})
          </button>
        </div>

        {tab === 'stories' ? (
          userStories.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#101010] border border-[#292929] text-center text-xs text-[#A1A1A1]">
              No active stories right now. Capture one from the Camera!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userStories.map((st) => (
                <button
                  key={st.id}
                  onClick={() => navigate('/stories')}
                  className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-[#181818] border border-[#292929]"
                >
                  <MediaPreview
                    mediaId={st.mediaId}
                    mediaUrl={st.mediaUrl}
                    mediaType={st.mediaType}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 text-xs font-bold text-white text-left line-clamp-2">
                    {st.caption || 'Story'}
                  </p>
                </button>
              ))}
            </div>
          )
        ) : userSpotlights.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#101010] border border-[#292929] text-center text-xs text-[#A1A1A1]">
            No Spotlight posts yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userSpotlights.map((sp) => (
              <button
                key={sp.id}
                onClick={() => navigate('/spotlight')}
                className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-[#181818] border border-[#292929]"
              >
                {sp.posterUrl && (
                  <img
                    src={sp.posterUrl}
                    alt={sp.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 text-xs font-bold text-white text-left">
                  {sp.title}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md bg-[#101010] border border-[#292929] rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center text-[#A1A1A1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-[#A1A1A1] mb-1">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1A1] mb-1">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full p-3.5 rounded-xl bg-[#181818] border border-[#292929] text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1A1] mb-1">Birthday</label>
              <input
                type="date"
                value={editBirthday}
                onChange={(e) => setEditBirthday(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#FFFC00] text-black font-bold text-sm"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Snapcode QR Share Modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#101010] border border-[#292929] rounded-3xl p-6 text-center space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setQrOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center text-[#A1A1A1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mx-auto w-48 h-48 rounded-3xl bg-[#FFFC00] p-4 flex flex-col items-center justify-center relative">
              <BitmojiAvatar avatar={targetUser.avatar} size={96} className="rounded-2xl" />
              <div className="mt-2 grid grid-cols-7 gap-1 opacity-75">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-black" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-base font-extrabold text-white">{targetUser.displayName}</p>
              <p className="text-xs text-[#A1A1A1]">@{targetUser.username}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/profile/${targetUser.username}`);
                showToast('Profile link copied!', 'yellow');
              }}
              className="w-full h-11 rounded-xl bg-[#FFFC00] text-black font-bold text-xs flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Profile Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
