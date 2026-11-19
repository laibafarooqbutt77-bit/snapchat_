import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  LocateFixed,
  Ghost,
  MessageCircle,
  Users,
  X,
  Navigation,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BitmojiAvatar } from '../components/avatar/BitmojiAvatar';
import { User } from '../types';

export const MapPage: React.FC = () => {
  const { state, currentUser, updateSettings, showToast } = useApp();
  const navigate = useNavigate();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFriendsDrawer, setShowFriendsDrawer] = useState(false);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);

  const friendsOnMap = Object.values(state.friends)
    .filter((f) => f.status === 'friend' && !state.blockedUserIds.includes(f.userId))
    .map((f) => state.users[f.userId])
    .filter(Boolean);

  const handleRequestRealLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported in this browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveCoords({
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        });
        updateSettings({ ghostMode: false });
        showToast('Updated your map pin', 'yellow');
      },
      () => {
        showToast('Location permission denied. Using demo Santa Monica pin.', 'error');
      }
    );
  };

  return (
    <div className="relative h-full w-full bg-[#090C10] overflow-hidden select-none">
      {/* Top Map Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto px-3.5 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-[#292929]">
          <p className="text-xs font-extrabold text-white">Santa Monica · Westside</p>
          <p className="text-[11px] text-[#A1A1A1]">
            {state.settings.ghostMode
              ? 'Ghost Mode On — Location Hidden'
              : liveCoords
                ? `Live (${liveCoords.lat}, ${liveCoords.lng})`
                : 'Demo Map · 6 Friends Nearby'}
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => updateSettings({ ghostMode: !state.settings.ghostMode })}
            className={`h-10 px-3 rounded-2xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 transition ${
              state.settings.ghostMode
                ? 'bg-[#FFFC00] text-black border-[#FFFC00]'
                : 'bg-black/80 text-white border-[#292929]'
            }`}
          >
            <Ghost className="w-4 h-4" />
            Ghost Mode
          </button>
        </div>
      </div>

      {/* Interactive Vector City Map Canvas */}
      <div
        className="w-full h-full relative transition-transform duration-200 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Land */}
          <rect width="1000" height="1000" fill="#131820" />
          {/* Pacific Ocean Coastline */}
          <path d="M0 0 L280 0 L340 420 L420 750 L490 1000 L0 1000 Z" fill="#0B2239" />
          {/* Sandy Beach Strip */}
          <path
            d="M275 0 L335 420 L415 750 L485 1000 L515 1000 L445 750 L365 420 L305 0 Z"
            fill="#2B261D"
          />
          {/* Parks & Greens */}
          <rect x="440" y="180" width="120" height="80" rx="18" fill="#132A1F" />
          <rect x="650" y="470" width="170" height="110" rx="22" fill="#132A1F" />
          <rect x="430" y="720" width="110" height="90" rx="18" fill="#132A1F" />

          {/* Urban Grid & Highways */}
          <g stroke="#222933" strokeWidth="6" fill="none">
            <line x1="320" y1="220" x2="960" y2="120" />
            <line x1="340" y1="360" x2="960" y2="260" />
            <line x1="370" y1="500" x2="960" y2="410" />
            <line x1="410" y1="650" x2="960" y2="570" />
            <line x1="460" y1="810" x2="960" y2="750" />
            <line x1="420" y1="40" x2="540" y2="960" />
            <line x1="590" y1="40" x2="720" y2="960" />
            <line x1="760" y1="40" x2="890" y2="960" />
          </g>
          {/* I-10 / I-405 Freeways */}
          <g stroke="#334155" strokeWidth="10" fill="none">
            <path d="M360 460 Q580 410 980 490" />
            <path d="M720 0 Q760 450 850 1000" />
          </g>

          {/* Neighborhood Labels */}
          <g fill="#64748B" fontSize="20" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
            <text x="540" y="150">BRENTWOOD</text>
            <text x="770" y="210">WESTWOOD</text>
            <text x="410" y="450" fill="#94A3B8">Santa Monica</text>
            <text x="640" y="640">Mar Vista</text>
            <text x="420" y="830">VENICE</text>
            <text x="110" y="540" fill="#38BDF8" opacity="0.6">Pacific Ocean</text>
          </g>
        </svg>

        {/* Current User Location Marker */}
        {currentUser && (
          <button
            onClick={() => setSelectedUser(currentUser)}
            style={{
              left: `${currentUser.location.xPercent}%`,
              top: `${currentUser.location.yPercent}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
          >
            <div
              className={`p-1 rounded-full border-2 shadow-2xl transition-transform group-hover:scale-110 ${
                state.settings.ghostMode
                  ? 'bg-[#181818] border-[#A1A1A1] opacity-60'
                  : 'bg-[#FFFC00] border-black'
              }`}
            >
              <BitmojiAvatar avatar={currentUser.avatar} size={46} className="rounded-full" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded-md bg-black/85 border border-[#FFFC00] text-[10px] font-bold text-[#FFFC00] whitespace-nowrap">
              {state.settings.ghostMode ? 'Ghost Mode' : 'You'}
            </span>
          </button>
        )}

        {/* Friend Bitmoji Markers */}
        {friendsOnMap.map((friend) => (
          <button
            key={friend.id}
            onClick={() => setSelectedUser(friend)}
            style={{
              left: `${friend.location.xPercent}%`,
              top: `${friend.location.yPercent}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
          >
            {friend.location.statusText && (
              <span className="mb-1 px-2 py-0.5 rounded-lg bg-white text-black text-[10px] font-bold shadow-md whitespace-nowrap">
                {friend.location.statusText}
              </span>
            )}
            <div className="p-0.5 rounded-full bg-emerald-400 border-2 border-black shadow-xl group-hover:scale-110 transition-transform">
              <BitmojiAvatar avatar={friend.avatar} size={44} className="rounded-full" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded-md bg-black/85 border border-[#292929] text-[10px] font-bold text-white whitespace-nowrap">
              {friend.displayName.split(' ')[0]} · {friend.lastActive}
            </span>
          </button>
        ))}
      </div>

      {/* Right Zoom & Recenter Controls */}
      <div className="absolute right-3 top-24 z-20 flex flex-col gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.2).toFixed(1))))}
          className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-[#292929] text-white flex items-center justify-center hover:border-[#FFFC00]"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
          className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-[#292929] text-white flex items-center justify-center hover:border-[#FFFC00]"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-[#292929] text-[#FFFC00] flex items-center justify-center hover:border-[#FFFC00]"
          aria-label="Recenter map"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Map Buttons (matching reference screenshot) */}
      <div className="absolute bottom-5 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <button
          onClick={handleRequestRealLocation}
          className="pointer-events-auto flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 rounded-full bg-black/85 border-2 border-[#FFFC00] flex items-center justify-center shadow-xl">
            {currentUser ? (
              <BitmojiAvatar avatar={currentUser.avatar} size={46} className="rounded-full" />
            ) : (
              <Navigation className="w-5 h-5 text-[#FFFC00]" />
            )}
          </div>
          <span className="px-2 py-0.5 rounded-md bg-black/85 text-[10px] font-bold text-white border border-[#292929]">
            My Bitmoji
          </span>
        </button>

        <button
          onClick={() => setShowFriendsDrawer(true)}
          className="pointer-events-auto flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 rounded-full bg-black/85 border-2 border-emerald-400 flex items-center justify-center shadow-xl text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <span className="px-2 py-0.5 rounded-md bg-black/85 text-[10px] font-bold text-white border border-[#292929]">
            Friends ({friendsOnMap.length})
          </span>
        </button>
      </div>

      {/* Selected Friend Location Card */}
      {selectedUser && (
        <div className="absolute bottom-24 left-4 right-4 max-w-md mx-auto z-30 p-4 rounded-3xl bg-[#101010]/95 backdrop-blur-md border border-[#292929] shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BitmojiAvatar avatar={selectedUser.avatar} size={50} className="rounded-full" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{selectedUser.displayName}</p>
              <p className="text-xs text-[#A1A1A1] truncate">
                {selectedUser.location.neighborhood} · {selectedUser.lastActive}
              </p>
              {selectedUser.location.statusText && (
                <p className="text-xs text-[#FFFC00] mt-0.5 truncate">
                  {selectedUser.location.statusText}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectedUser.id !== currentUser?.id && (
              <button
                onClick={() => navigate(`/chat/${selectedUser.username}`)}
                className="h-9 px-3 rounded-xl bg-[#FFFC00] text-black text-xs font-bold flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat
              </button>
            )}
            <button
              onClick={() => setSelectedUser(null)}
              className="w-9 h-9 rounded-full bg-[#181818] text-[#A1A1A1] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Friends Nearby Drawer */}
      {showFriendsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#101010] border border-[#292929] rounded-3xl p-5 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Friends on Map</h3>
              <button
                onClick={() => setShowFriendsDrawer(false)}
                className="w-8 h-8 rounded-full bg-[#181818] flex items-center justify-center text-[#A1A1A1]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {friendsOnMap.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedUser(f);
                    setShowFriendsDrawer(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#181818] hover:border hover:border-[#FFFC00] text-left"
                >
                  <div className="flex items-center gap-3">
                    <BitmojiAvatar avatar={f.avatar} size={40} className="rounded-full" />
                    <div>
                      <p className="text-sm font-bold text-white">{f.displayName}</p>
                      <p className="text-xs text-[#A1A1A1]">
                        {f.location.neighborhood} · {f.lastActive}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">Locate</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
