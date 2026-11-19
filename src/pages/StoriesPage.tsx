import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  Eye,
  Send,
  Pause,
  Play,
  Trash2,
  Camera,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';
import { MediaPreview } from '../components/common/MediaPreview';
import { StoryItem } from '../types';
import { saveMediaBlob } from '../utils/idb';

const STORY_REACTIONS = ['🔥', '😍', '😂', '👏', '🫶', '⚡'];

export const StoriesPage: React.FC = () => {
  const {
    state,
    currentUser,
    addStory,
    viewStory,
    reactToStory,
    replyToStory,
    deleteStory,
    showToast,
  } = useApp();
  const navigate = useNavigate();

  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [storyIdx, setStoryIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showViewers, setShowViewers] = useState(false);

  const uploadRef = useRef<HTMLInputElement | null>(null);

  const activeStories = useMemo(() => {
    const nowTs = Date.now();
    return state.stories.filter(
      (s) => s.expiresAt > nowTs && !state.blockedUserIds.includes(s.userId)
    );
  }, [state.stories, state.blockedUserIds]);

  const myStories = useMemo(
    () => activeStories.filter((s) => s.userId === currentUser?.id),
    [activeStories, currentUser?.id]
  );

  // Group friend stories by user
  const friendStoryGroups = useMemo(() => {
    const groups = new Map<string, StoryItem[]>();
    activeStories.forEach((s) => {
      if (s.userId === currentUser?.id) return;
      const list = groups.get(s.userId) || [];
      list.push(s);
      groups.set(s.userId, list);
    });
    return Array.from(groups.entries()).map(([userId, items]) => {
      const user = state.users[userId];
      const hasUnseen = items.some((it) => !it.viewerIds.includes(currentUser?.id || ''));
      return { userId, user, items, hasUnseen };
    });
  }, [activeStories, currentUser?.id, state.users]);

  const viewerStories = useMemo(() => {
    if (!viewerUserId) return [];
    return activeStories.filter((s) => s.userId === viewerUserId);
  }, [activeStories, viewerUserId]);

  const currentStory = viewerStories[storyIdx];
  const viewerOwner = viewerUserId ? state.users[viewerUserId] : null;

  // Story timer loop
  useEffect(() => {
    if (!viewerUserId || !currentStory) return;
    viewStory(currentStory.id);
    setProgress(0);
  }, [viewerUserId, currentStory?.id]);

  useEffect(() => {
    if (!viewerUserId || !currentStory || paused) return;
    const stepMs = 50;
    const durationMs = 5000;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p + (stepMs / durationMs) * 100 >= 100) {
          if (storyIdx < viewerStories.length - 1) {
            setStoryIdx((i) => i + 1);
          } else {
            // Move to next friend group or close
            const allGroups = [
              ...(myStories.length > 0 && currentUser ? [currentUser.id] : []),
              ...friendStoryGroups.map((g) => g.userId),
            ];
            const curPos = allGroups.indexOf(viewerUserId);
            if (curPos >= 0 && curPos < allGroups.length - 1) {
              setViewerUserId(allGroups[curPos + 1]);
              setStoryIdx(0);
            } else {
              setViewerUserId(null);
            }
          }
          return 0;
        }
        return p + (stepMs / durationMs) * 100;
      });
    }, stepMs);
    return () => clearInterval(timer);
  }, [viewerUserId, currentStory, paused, storyIdx, viewerStories.length, friendStoryGroups, myStories.length, currentUser]);

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      showToast('Select a valid photo or video.', 'error');
      return;
    }
    const mediaId = `story_upload_${Date.now()}`;
    await saveMediaBlob(mediaId, file);
    addStory({
      mediaType: isVideo ? 'video' : 'photo',
      mediaId,
      caption: 'Fresh story drop ⚡',
      privacy: state.settings.whoCanViewStory === 'everyone' ? 'everyone' : 'friends',
    });
    e.target.value = '';
  };

  const handlePrev = () => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (storyIdx < viewerStories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else {
      setViewerUserId(null);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStory || !replyText.trim()) return;
    replyToStory(currentStory.id, replyText);
    setReplyText('');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Stories</h1>
          <p className="text-xs text-[#A1A1A1]">24-hour moments from friends &amp; subscriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => uploadRef.current?.click()}
            className="h-10 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-xs font-semibold text-white flex items-center gap-1.5 hover:border-[#FFFC00]"
          >
            <Plus className="w-4 h-4 text-[#FFFC00]" />
            Upload Story
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleUploadStory}
            className="hidden"
          />
          <button
            onClick={() => navigate('/camera')}
            className="h-10 px-3.5 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            Camera Story
          </button>
        </div>
      </div>

      {/* Circular Friends Story Row */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Friends</h2>
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
          {/* My Story */}
          {currentUser && (
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative">
                <button
                  onClick={() => {
                    if (myStories.length > 0) {
                      setViewerUserId(currentUser.id);
                      setStoryIdx(0);
                    } else {
                      uploadRef.current?.click();
                    }
                  }}
                  className={`p-[3px] rounded-full ${
                    myStories.length > 0 ? 'bg-[#FFFC00]' : 'bg-[#292929]'
                  }`}
                >
                  <div className="p-0.5 rounded-full bg-black">
                    <BitmojiAvatar avatar={currentUser.avatar} size={60} className="rounded-full" />
                  </div>
                </button>
                <button
                  onClick={() => uploadRef.current?.click()}
                  aria-label="Add to My Story"
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#FFFC00] text-black border-2 border-black flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
              <span className="text-xs font-semibold text-white">My Story</span>
            </div>
          )}

          {/* Friend Circles */}
          {friendStoryGroups.map(({ userId, user, hasUnseen }) => {
            if (!user) return null;
            return (
              <button
                key={userId}
                onClick={() => {
                  setViewerUserId(userId);
                  setStoryIdx(0);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div
                  className={`p-[3px] rounded-full transition-transform group-hover:scale-105 ${
                    hasUnseen
                      ? 'bg-gradient-to-tr from-[#FFFC00] via-purple-500 to-sky-400'
                      : 'bg-[#292929]'
                  }`}
                >
                  <div className="p-0.5 rounded-full bg-black">
                    <BitmojiAvatar avatar={user.avatar} size={60} className="rounded-full" />
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold max-w-[70px] truncate ${
                    hasUnseen ? 'text-white' : 'text-[#A1A1A1]'
                  }`}
                >
                  {user.displayName.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Subscriptions Strip */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">Subscriptions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {state.discover.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate('/discover')}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#181818] border border-[#292929] text-left group"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-[11px] font-bold text-[#FFFC00]">{item.publisher}</p>
                <p className="text-xs font-bold text-white line-clamp-2 mt-0.5">{item.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* For You Story Grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white">For You</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {friendStoryGroups.map(({ userId, user, items }) => {
            const first = items[0];
            if (!user || !first) return null;
            return (
              <button
                key={userId}
                onClick={() => {
                  setViewerUserId(userId);
                  setStoryIdx(0);
                }}
                className="relative aspect-[9/14] rounded-3xl overflow-hidden bg-[#181818] border border-[#292929] text-left group"
              >
                <MediaPreview
                  mediaId={first.mediaId}
                  mediaUrl={first.mediaUrl}
                  mediaType={first.mediaType}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <BitmojiAvatar avatar={user.avatar} size={32} className="rounded-full border border-white/40" />
                  <span className="text-xs font-bold text-white drop-shadow">{user.displayName}</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-bold text-white line-clamp-2">
                    {first.caption || `${user.displayName}'s Story`}
                  </p>
                  <p className="text-[11px] text-[#A1A1A1] mt-1">
                    {items.length} {items.length === 1 ? 'snap' : 'snaps'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* FULL-SCREEN STORY VIEWER */}
      {viewerUserId && currentStory && viewerOwner && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center sm:p-4">
          <div className="relative w-full h-full sm:max-w-md sm:h-[88vh] sm:rounded-3xl overflow-hidden bg-[#101010] border border-[#292929]">
            <MediaPreview
              mediaId={currentStory.mediaId}
              mediaUrl={currentStory.mediaUrl}
              mediaType={currentStory.mediaType}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

            {/* Tap Zones for Prev / Next */}
            <div className="absolute inset-y-20 inset-x-0 flex z-10">
              <button
                onClick={handlePrev}
                className="w-1/3 h-full focus:outline-none"
                aria-label="Previous story"
              />
              <button
                onClick={() => setPaused((p) => !p)}
                className="w-1/3 h-full focus:outline-none"
                aria-label="Pause or resume story"
              />
              <button
                onClick={handleNext}
                className="w-1/3 h-full focus:outline-none"
                aria-label="Next story"
              />
            </div>

            {/* Segmented Progress Bars */}
            <div className="absolute top-3 left-3 right-3 z-20 space-y-2.5">
              <div className="flex items-center gap-1">
                {viewerStories.map((st, idx) => (
                  <div key={st.id} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full bg-[#FFFC00] transition-all duration-75"
                      style={{
                        width:
                          idx < storyIdx ? '100%' : idx === storyIdx ? `${progress}%` : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BitmojiAvatar avatar={viewerOwner.avatar} size={36} className="rounded-full" />
                  <div>
                    <p className="text-xs font-bold text-white">{viewerOwner.displayName}</p>
                    <p className="text-[11px] text-white/75 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      {currentStory.privacy}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPaused((p) => !p)}
                    className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                    aria-label={paused ? 'Resume' : 'Pause'}
                  >
                    {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  {viewerOwner.id === currentUser?.id && (
                    <button
                      onClick={() => {
                        deleteStory(currentStory.id);
                        setViewerUserId(null);
                      }}
                      className="w-9 h-9 rounded-full bg-black/50 text-red-400 flex items-center justify-center"
                      aria-label="Delete story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setViewerUserId(null)}
                    className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                    aria-label="Close story viewer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Caption */}
            {currentStory.caption && (
              <div className="absolute bottom-28 inset-x-4 z-20 text-center pointer-events-none">
                <span className="inline-block px-3.5 py-2 rounded-xl bg-black/65 backdrop-blur-md text-sm font-bold text-white">
                  {currentStory.caption}
                </span>
              </div>
            )}

            {/* Desktop Nav Chevrons */}
            <button
              onClick={handlePrev}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 text-white items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/50 text-white items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Reply & Reactions OR Views */}
            <div className="absolute bottom-3 left-3 right-3 z-20 space-y-2.5">
              {viewerOwner.id === currentUser?.id ? (
                <div className="bg-black/70 backdrop-blur-md border border-white/15 rounded-2xl p-3">
                  <button
                    onClick={() => setShowViewers((v) => !v)}
                    className="w-full flex items-center justify-between text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#FFFC00]" />
                      {currentStory.viewerIds.length} Views
                    </span>
                    <span className="text-[#A1A1A1]">{showViewers ? 'Hide' : 'Viewers'}</span>
                  </button>
                  {showViewers && currentStory.viewerIds.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-2">
                      {currentStory.viewerIds.map((vid) => {
                        const vu = state.users[vid];
                        return vu ? (
                          <span key={vid} className="text-xs text-white">
                            {vu.displayName}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2">
                    {STORY_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => reactToStory(currentStory.id, emoji)}
                        className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-lg hover:scale-110 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleSendReply} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${viewerOwner.displayName}...`}
                      className="flex-1 h-10 px-4 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs text-white placeholder:text-white/60 focus:outline-none focus:border-[#FFFC00]"
                    />
                    <button
                      type="submit"
                      className="w-10 h-10 rounded-full bg-[#FFFC00] text-black flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
