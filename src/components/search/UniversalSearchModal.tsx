import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, Flame, Sparkles, Compass, MessageCircle, Video } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BitmojiAvatar } from '../avatar/BitmojiAvatar';
import { FILTER_PRESETS } from '../../data/filters';

export const UniversalSearchModal: React.FC = () => {
  const {
    state,
    currentUser,
    searchOpen,
    setSearchOpen,
    addRecentSearch,
    clearRecentSearches,
  } = useApp();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'friends' | 'stories' | 'spotlight' | 'discover' | 'filters'>('all');
  const navigate = useNavigate();

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    const users = Object.values(state.users).filter(
      (u) =>
        u.id !== currentUser?.id &&
        (u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
    );
    const stories = state.stories.filter(
      (s) =>
        (s.caption || '').toLowerCase().includes(q) ||
        (state.users[s.userId]?.displayName || '').toLowerCase().includes(q)
    );
    const spotlights = state.spotlights.filter(
      (sp) =>
        sp.title.toLowerCase().includes(q) ||
        sp.caption.toLowerCase().includes(q) ||
        sp.musicTitle.toLowerCase().includes(q)
    );
    const discover = state.discover.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.publisher.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
    const filters = FILTER_PRESETS.filter(
      (f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
    return { users, stories, spotlights, discover, filters };
  }, [q, state.users, state.stories, state.spotlights, state.discover, currentUser?.id]);

  if (!searchOpen) return null;

  const goTo = (path: string, searchLabel?: string) => {
    if (searchLabel) addRecentSearch(searchLabel);
    setSearchOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center p-4 sm:pt-12">
      <div className="w-full max-w-2xl bg-[#101010] border border-[#292929] rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#292929]">
          <Search className="w-5 h-5 text-[#FFFC00] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends, chats, stories, Spotlight, lenses..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-[#A1A1A1] focus:outline-none h-10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full hover:bg-[#181818] text-[#A1A1A1]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchOpen(false)}
            className="px-3 h-9 rounded-lg bg-[#181818] text-xs font-semibold text-white hover:bg-[#292929]"
          >
            Close
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#292929] overflow-x-auto no-scrollbar">
          {(
            [
              ['all', 'All'],
              ['friends', 'Friends'],
              ['stories', 'Stories'],
              ['spotlight', 'Spotlight'],
              ['discover', 'Discover'],
              ['filters', 'Lenses'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                tab === id
                  ? 'bg-[#FFFC00] text-black'
                  : 'bg-[#181818] text-[#A1A1A1] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!q && state.recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#A1A1A1]">Recent Searches</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-[#A1A1A1] hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {state.recentSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181818] border border-[#292929] text-xs text-white hover:border-[#FFFC00]"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#A1A1A1]" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(tab === 'all' || tab === 'friends') && results.users.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#A1A1A1] mb-2">Friends &amp; People</h3>
              <div className="space-y-1.5">
                {results.users.slice(0, 5).map((u) => {
                  const rel = state.friends[u.id];
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-[#181818] hover:bg-[#202020] transition"
                    >
                      <button
                        onClick={() => goTo(`/profile/${u.username}`, u.displayName)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        <BitmojiAvatar avatar={u.avatar} size={42} className="rounded-full" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{u.displayName}</p>
                          <p className="text-xs text-[#A1A1A1] truncate">
                            @{u.username}
                            {rel && rel.streakCount > 0 ? ` · ${rel.streakCount}🔥` : ''}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => goTo(`/chat/${u.username}`, u.displayName)}
                        className="min-h-[40px] px-3 rounded-xl bg-[#101010] border border-[#292929] text-xs font-semibold text-white hover:border-[#FFFC00] flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                        Chat
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(tab === 'all' || tab === 'spotlight') && results.spotlights.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#A1A1A1] mb-2">Spotlight Videos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.spotlights.slice(0, 4).map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => goTo('/spotlight', sp.title)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#181818] hover:bg-[#202020] text-left"
                  >
                    <div className="w-12 h-14 rounded-xl overflow-hidden bg-black shrink-0 flex items-center justify-center">
                      {sp.posterUrl ? (
                        <img src={sp.posterUrl} alt={sp.title} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-5 h-5 text-[#FFFC00]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{sp.title}</p>
                      <p className="text-xs text-[#A1A1A1] truncate">{sp.musicTitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(tab === 'all' || tab === 'discover') && results.discover.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#A1A1A1] mb-2">Discover</h3>
              <div className="space-y-2">
                {results.discover.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => goTo('/discover', d.title)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[#181818] hover:bg-[#202020] text-left"
                  >
                    <Compass className="w-5 h-5 text-[#FFFC00] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{d.title}</p>
                      <p className="text-xs text-[#A1A1A1] truncate">
                        {d.publisher} · {d.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(tab === 'all' || tab === 'filters') && results.filters.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#A1A1A1] mb-2">Camera Filters &amp; Lenses</h3>
              <div className="flex flex-wrap gap-2">
                {results.filters.slice(0, 8).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => goTo(`/camera?filter=${f.id}`, f.name)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#181818] border border-[#292929] hover:border-[#FFFC00] text-xs font-semibold text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FFFC00]" />
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(tab === 'all' || tab === 'stories') && results.stories.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#A1A1A1] mb-2">Stories</h3>
              <div className="space-y-1.5">
                {results.stories.slice(0, 3).map((st) => {
                  const u = state.users[st.userId];
                  return (
                    <button
                      key={st.id}
                      onClick={() => goTo('/stories', u?.displayName)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-[#181818] hover:bg-[#202020] text-left"
                    >
                      <Flame className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {u?.displayName || 'Friend'}&apos;s Story
                        </p>
                        <p className="text-xs text-[#A1A1A1] truncate">{st.caption || '24h Story'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
