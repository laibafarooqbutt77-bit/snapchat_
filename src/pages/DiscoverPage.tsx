import React, { useMemo, useState } from 'react';
import { CloudSun, Search, Check, Plus, X, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DiscoverItem } from '../types';

const CATEGORIES = ['All', 'Auto', 'Lifestyle', 'Culture', 'Entertainment', 'Gaming'] as const;

export const DiscoverPage: React.FC = () => {
  const { state, toggleDiscoverSubscribe } = useApp();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [query, setQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState<DiscoverItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.discover.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.publisher.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [state.discover, category, query]);

  const subscriptions = state.discover.filter((d) => d.isSubscribed);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Discover</h1>
          <p className="text-xs text-[#A1A1A1]">Curated stories, creators &amp; trending culture</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#A1A1A1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter Discover..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#101010] border border-[#292929] text-xs text-white focus:outline-none focus:border-[#FFFC00]"
          />
        </div>
      </div>

      {/* Happening Now Banner (inspired by reference screenshot) */}
      <div className="p-4 rounded-3xl bg-[#101010] border border-[#292929] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#FFFC00]">Happening Now · Local Brief</p>
            <p className="text-sm font-bold text-white mt-0.5">
              Santa Monica · 68°F Golden Hour Clear Skies
            </p>
            <p className="text-xs text-[#A1A1A1]">
              Great visibility for sunset rooftop snaps and boardwalk Spotlight edits.
            </p>
          </div>
        </div>
      </div>

      {/* Subscriptions Row */}
      {subscriptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">Discover Subscriptions</h2>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {subscriptions.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveArticle(item)}
                className="w-40 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden relative bg-[#181818] border border-[#292929] text-left group"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[11px] font-bold text-[#FFFC00]">{item.publisher}</p>
                  <p className="text-xs font-bold text-white line-clamp-2 mt-0.5">{item.title}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              category === cat
                ? 'bg-[#FFFC00] text-black'
                : 'bg-[#101010] border border-[#292929] text-[#A1A1A1] hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Editorial Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl bg-[#101010] border border-[#292929] overflow-hidden flex flex-col hover:border-[#52525B] transition"
          >
            <button
              onClick={() => setActiveArticle(item)}
              className="relative aspect-[3/4] w-full overflow-hidden text-left group"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs font-semibold text-[#FFFC00]">
                  {item.publisher} · {item.category}
                </p>
                <h3 className="text-base font-extrabold text-white mt-1 leading-snug">
                  {item.title}
                </h3>
              </div>
            </button>
            <div className="p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#A1A1A1] tabular-nums">
                <Eye className="w-3.5 h-3.5" />
                <span>{item.views}</span>
                <span>·</span>
                <span>{item.timeAgo}</span>
              </div>
              <button
                onClick={() => toggleDiscoverSubscribe(item.id)}
                className={`h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                  item.isSubscribed
                    ? 'bg-[#181818] border border-[#292929] text-white'
                    : 'bg-[#FFFC00] text-black'
                }`}
              >
                {item.isSubscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#FFFC00]" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Subscribe
                  </>
                )}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Article / Edition Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#101010] border border-[#292929] rounded-3xl overflow-hidden max-h-[88vh] flex flex-col">
            <div className="relative h-64 shrink-0">
              <img
                src={activeArticle.imageUrl}
                alt={activeArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-transparent to-black/40" />
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              <p className="text-xs font-bold text-[#FFFC00]">
                {activeArticle.publisher} · {activeArticle.category} · {activeArticle.timeAgo}
              </p>
              <h2 className="text-xl font-extrabold text-white">{activeArticle.title}</h2>
              <p className="text-sm font-medium text-[#E4E4E7]">{activeArticle.subtitle}</p>
              <p className="text-sm text-[#A1A1A1] leading-relaxed">{activeArticle.articleBody}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
