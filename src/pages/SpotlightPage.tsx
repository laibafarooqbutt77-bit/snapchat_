import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music,
  Play,
  Pause,
  Plus,
  X,
  Send,
  Eye,
  UserPlus,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';
import { MediaPreview } from '../components/common/MediaPreview';
import { saveMediaBlob } from '../utils/idb';

export const SpotlightPage: React.FC = () => {
  const {
    state,
    toggleLikeSpotlight,
    toggleSaveSpotlight,
    addSpotlightComment,
    uploadSpotlight,
    toggleFollowCreator,
    sendMessage,
    showToast,
  } = useApp();
  const navigate = useNavigate();

  const [pausedMap, setPausedMap] = useState<Record<string, boolean>>({});
  const [commentDrawerId, setCommentDrawerId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [shareSpotlightId, setShareSpotlightId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Upload form
  const [upTitle, setUpTitle] = useState('');
  const [upCaption, setUpCaption] = useState('');
  const [upMusic, setUpMusic] = useState('Original Sound');
  const [upFile, setUpFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const activeCommentVideo = state.spotlights.find((s) => s.id === commentDrawerId);

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const handlePublishSpotlight = async (e: React.FormEvent) => {
    e.preventDefault();
    let mediaId: string | undefined;
    if (upFile) {
      mediaId = `sp_media_${Date.now()}`;
      await saveMediaBlob(mediaId, upFile);
    }
    uploadSpotlight({
      title: upTitle || 'Fresh Spotlight',
      caption: upCaption || 'Captured on Lumo ⚡',
      musicTitle: upMusic || 'Original Sound',
      mediaId,
    });
    setUpTitle('');
    setUpCaption('');
    setUpFile(null);
    setUploadOpen(false);
  };

  const friendsList = Object.values(state.friends)
    .filter((f) => f.status === 'friend')
    .map((f) => state.users[f.userId])
    .filter(Boolean);

  return (
    <div className="relative h-full w-full bg-black flex flex-col items-center overflow-hidden">
      {/* Top Floating Upload Button */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          onClick={() => setUploadOpen(true)}
          className="h-10 px-3.5 rounded-full bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1.5 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Post Video
        </button>
      </div>

      {/* Vertical Snap Scroll Container */}
      <div className="w-full max-w-[460px] h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {state.spotlights.map((sp) => {
          const creator = state.users[sp.creatorId];
          const isPaused = Boolean(pausedMap[sp.id]);
          const isFollowing = state.followedCreatorIds.includes(sp.creatorId);

          return (
            <section
              key={sp.id}
              className="relative w-full h-full snap-start shrink-0 overflow-hidden bg-[#0A0A0A] lg:border-x lg:border-[#292929]"
            >
              {/* Video or Animated Motion Frame */}
              <div
                onClick={() =>
                  setPausedMap((prev) => ({ ...prev, [sp.id]: !prev[sp.id] }))
                }
                className="w-full h-full cursor-pointer relative overflow-hidden"
              >
                {sp.mediaId ? (
                  <MediaPreview
                    mediaId={sp.mediaId}
                    mediaType="video"
                    autoPlay={!isPaused}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={sp.posterUrl}
                    alt={sp.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-in-out ${
                      isPaused ? 'scale-100' : 'scale-110'
                    }`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/30" />

                {isPaused && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 rounded-full bg-black/70 border border-white/20 flex items-center justify-center">
                      <Play className="w-7 h-7 text-[#FFFC00] fill-[#FFFC00] ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right-Side Interaction Rail */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4">
                <button
                  onClick={() => toggleLikeSpotlight(sp.id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center group-active:scale-125 transition">
                    <Heart
                      className={`w-5 h-5 ${
                        sp.likedByMe ? 'text-red-500 fill-red-500' : 'text-white'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-white tabular-nums">
                    {formatCount(sp.likes)}
                  </span>
                </button>

                <button
                  onClick={() => setCommentDrawerId(sp.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-white tabular-nums">
                    {sp.comments.length}
                  </span>
                </button>

                <button
                  onClick={() => toggleSaveSpotlight(sp.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center">
                    <Bookmark
                      className={`w-5 h-5 ${
                        sp.savedByMe ? 'text-[#FFFC00] fill-[#FFFC00]' : 'text-white'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-white">Save</span>
                </button>

                <button
                  onClick={() => setShareSpotlightId(sp.id)}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Share</span>
                </button>

                <button
                  onClick={() =>
                    setPausedMap((prev) => ({ ...prev, [sp.id]: !prev[sp.id] }))
                  }
                  className="w-10 h-10 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-[#FFFC00]"
                  aria-label={isPaused ? 'Play' : 'Pause'}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              </div>

              {/* Bottom Creator Info, Caption & Music */}
              <div className="absolute bottom-5 left-4 right-16 z-20 space-y-2.5">
                {creator && (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => navigate(`/profile/${creator.username}`)}
                      className="flex items-center gap-2.5"
                    >
                      <BitmojiAvatar
                        avatar={creator.avatar}
                        size={40}
                        className="rounded-full border-2 border-[#FFFC00]"
                      />
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{creator.displayName}</p>
                        <p className="text-[11px] text-white/75 flex items-center gap-1 tabular-nums">
                          <Eye className="w-3 h-3" />
                          {formatCount(sp.views)} views
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => toggleFollowCreator(creator.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition ${
                        isFollowing
                          ? 'bg-white/20 text-white'
                          : 'bg-[#FFFC00] text-black'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="w-3 h-3" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          Follow
                        </>
                      )}
                    </button>
                  </div>
                )}

                <p className="text-xs text-white/95 leading-relaxed line-clamp-2">{sp.caption}</p>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#FFFC00]">
                  <Music className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {sp.musicTitle} · {sp.musicArtist}
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Comments Drawer */}
      {activeCommentVideo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#101010] border border-[#292929] rounded-t-3xl sm:rounded-3xl p-5 max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">
                Comments ({activeCommentVideo.comments.length})
              </h3>
              <button
                onClick={() => setCommentDrawerId(null)}
                className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center text-[#A1A1A1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {activeCommentVideo.comments.length === 0 ? (
                <p className="text-xs text-[#A1A1A1] text-center py-6">
                  Be the first to comment on this Spotlight!
                </p>
              ) : (
                activeCommentVideo.comments.map((c) => {
                  const u = state.users[c.userId];
                  return (
                    <div key={c.id} className="flex items-start gap-2.5">
                      {u && <BitmojiAvatar avatar={u.avatar} size={32} className="rounded-full" />}
                      <div className="flex-1 bg-[#181818] rounded-2xl px-3 py-2">
                        <p className="text-xs font-bold text-white">{u?.displayName || 'User'}</p>
                        <p className="text-xs text-white/90 mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!commentText.trim()) return;
                addSpotlightComment(activeCommentVideo.id, commentText);
                setCommentText('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 h-10 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-xs text-white focus:outline-none focus:border-[#FFFC00]"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-[#FFFC00] text-black flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Spotlight Modal */}
      {shareSpotlightId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#101010] border border-[#292929] rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Send Spotlight to Friend</h3>
              <button
                onClick={() => setShareSpotlightId(null)}
                className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center text-[#A1A1A1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {friendsList.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    const sp = state.spotlights.find((x) => x.id === shareSpotlightId);
                    sendMessage(f.id, {
                      type: 'text',
                      text: `Check out this Spotlight: "${sp?.title}" 🎬`,
                    });
                    showToast(`Shared with ${f.displayName}!`, 'yellow');
                    setShareSpotlightId(null);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#181818] hover:border hover:border-[#FFFC00]"
                >
                  <div className="flex items-center gap-2.5">
                    <BitmojiAvatar avatar={f.avatar} size={36} className="rounded-full" />
                    <span className="text-xs font-bold text-white">{f.displayName}</span>
                  </div>
                  <Send className="w-4 h-4 text-[#FFFC00]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Spotlight Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handlePublishSpotlight}
            className="w-full max-w-md bg-[#101010] border border-[#292929] rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Post to Spotlight</h3>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center text-[#A1A1A1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={upTitle}
              onChange={(e) => setUpTitle(e.target.value)}
              placeholder="Video title"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-sm text-white focus:outline-none focus:border-[#FFFC00]"
            />
            <textarea
              value={upCaption}
              onChange={(e) => setUpCaption(e.target.value)}
              placeholder="Caption & hashtags..."
              rows={2}
              className="w-full p-3.5 rounded-xl bg-[#181818] border border-[#292929] text-sm text-white focus:outline-none focus:border-[#FFFC00]"
            />
            <input
              type="text"
              value={upMusic}
              onChange={(e) => setUpMusic(e.target.value)}
              placeholder="Track name"
              className="w-full h-11 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-sm text-white focus:outline-none focus:border-[#FFFC00]"
            />
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-11 rounded-xl bg-[#181818] border border-dashed border-[#52525B] text-xs font-semibold text-white hover:border-[#FFFC00]"
              >
                {upFile ? `Selected: ${upFile.name}` : 'Select Video File (Optional)'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                onChange={(e) => setUpFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#FFFC00] text-black font-bold text-sm"
            >
              Publish to Spotlight
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
