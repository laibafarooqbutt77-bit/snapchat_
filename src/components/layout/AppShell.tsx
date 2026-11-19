import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Camera,
  MessageSquare,
  Users,
  Play,
  MapPin,
  Compass,
  Bell,
  Phone,
  Settings,
  Sparkles,
  Search,
  UserPlus,
  Flame,
  Menu,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BitmojiAvatar } from '../avatar/BitmojiAvatar';
import { LumoLogo } from '../common/LumoLogo';
import { AuthOnboardingScreen } from '../auth/AuthOnboardingScreen';
import { UniversalSearchModal } from '../search/UniversalSearchModal';
import { ActiveCallOverlay } from '../calls/ActiveCallOverlay';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, currentUser, toasts, setSearchOpen } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 750);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <div className="animate-bounce">
          <LumoLogo size={72} />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">Lumo</h1>
        <div className="mt-4 w-28 h-1 rounded-full bg-[#181818] overflow-hidden">
          <div className="h-full bg-[#FFFC00] animate-pulse w-2/3 rounded-full" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthOnboardingScreen />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  const unreadChats = state.conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const unreadNotifs = state.notifications.filter((n) => !n.isRead).length;
  const pendingRequests = Object.values(state.friends).filter(
    (f) => f.status === 'pending_incoming'
  ).length;

  const isImmersiveRoute =
    location.pathname === '/' ||
    location.pathname === '/camera' ||
    location.pathname === '/spotlight' ||
    location.pathname.startsWith('/chat/');

  const desktopNav = [
    { path: '/camera', label: 'Camera', icon: Camera, badge: 0 },
    { path: '/chat', label: 'Chats', icon: MessageSquare, badge: unreadChats },
    { path: '/stories', label: 'Stories', icon: Users, badge: 0 },
    { path: '/spotlight', label: 'Spotlight', icon: Play, badge: 0 },
    { path: '/discover', label: 'Discover', icon: Compass, badge: 0 },
    { path: '/map', label: 'Snap Map', icon: MapPin, badge: 0 },
    { path: '/friends', label: 'Friends', icon: UserPlus, badge: pendingRequests },
    { path: '/avatar', label: 'Bitmoji', icon: Sparkles, badge: 0 },
    { path: '/calls', label: 'Calls', icon: Phone, badge: 0 },
    { path: '/notifications', label: 'Activity', icon: Bell, badge: unreadNotifs },
    { path: '/settings', label: 'Settings', icon: Settings, badge: 0 },
  ];

  const mobileBottomTabs = [
    { path: '/map', label: 'Map', icon: MapPin, activeColor: 'text-emerald-400', dot: 'bg-emerald-400' },
    { path: '/chat', label: 'Chat', icon: MessageSquare, activeColor: 'text-sky-400', dot: 'bg-sky-400', badge: unreadChats },
    { path: '/camera', label: 'Camera', icon: Camera, activeColor: 'text-[#FFFC00]', dot: 'bg-[#FFFC00]' },
    { path: '/stories', label: 'Stories', icon: Users, activeColor: 'text-purple-400', dot: 'bg-purple-400' },
    { path: '/spotlight', label: 'Spotlight', icon: Play, activeColor: 'text-red-400', dot: 'bg-red-400' },
  ];

  const isPathActive = (path: string) => {
    if (path === '/camera' && (location.pathname === '/' || location.pathname === '/camera')) {
      return true;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Online friends & active streaks for desktop right sidebar
  const friendsList = Object.values(state.friends)
    .filter((f) => f.status === 'friend' && !state.blockedUserIds.includes(f.userId))
    .map((rel) => ({ rel, user: state.users[rel.userId] }))
    .filter((x) => Boolean(x.user));

  const getPageTitle = () => {
    if (location.pathname === '/' || location.pathname === '/camera') return 'Camera';
    if (location.pathname.startsWith('/chat')) return 'Chat';
    if (location.pathname.startsWith('/stories')) return 'Stories';
    if (location.pathname.startsWith('/spotlight')) return 'Spotlight';
    if (location.pathname.startsWith('/discover')) return 'Discover';
    if (location.pathname.startsWith('/map')) return 'Snap Map';
    if (location.pathname.startsWith('/friends')) return 'Friends';
    if (location.pathname.startsWith('/profile')) return 'Profile';
    if (location.pathname.startsWith('/avatar')) return 'Bitmoji Studio';
    if (location.pathname.startsWith('/calls')) return 'Calls';
    if (location.pathname.startsWith('/notifications')) return 'Notifications';
    if (location.pathname.startsWith('/settings')) return 'Settings';
    return 'Lumo';
  };

  return (
    <div className="min-h-screen h-screen bg-black text-white flex overflow-hidden">
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#292929] bg-[#080808] p-4 justify-between">
        <div className="space-y-4 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between px-2 py-1">
            <Link to="/" className="shrink-0">
              <LumoLogo size={36} withWordmark />
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              className="min-h-[40px] min-w-[40px] rounded-xl bg-[#181818] border border-[#292929] flex items-center justify-center text-[#A1A1A1] hover:text-white hover:border-[#FFFC00] transition"
              aria-label="Universal Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {desktopNav.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    active
                      ? 'bg-[#FFFC00] text-black'
                      : 'text-[#A1A1A1] hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </span>
                  {item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                        active ? 'bg-black text-[#FFFC00]' : 'bg-[#FFFC00] text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logged-in User Footer Card */}
        <Link
          to="/profile"
          className="mt-3 flex items-center gap-3 p-2.5 rounded-2xl bg-[#121212] border border-[#292929] hover:border-[#FFFC00] transition"
        >
          <BitmojiAvatar avatar={currentUser.avatar} size={40} className="rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{currentUser.displayName}</p>
            <p className="text-xs text-[#A1A1A1] truncate tabular-nums">
              @{currentUser.username} · {currentUser.snapScore.toLocaleString()}
            </p>
          </div>
        </Link>
      </aside>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-black">
        {/* Mobile Top Bar (hidden on full-screen camera/spotlight or individual chat to match native feel) */}
        {!isImmersiveRoute && (
          <header className="lg:hidden sticky top-0 z-30 h-14 px-3 bg-black/90 backdrop-blur-md border-b border-[#292929] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full"
                aria-label="My Profile"
              >
                <BitmojiAvatar avatar={currentUser.avatar} size={36} className="rounded-full border border-[#292929]" />
              </Link>
              <button
                onClick={() => setSearchOpen(true)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-[#181818] flex items-center justify-center text-white"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            <h1 className="text-base font-bold tracking-tight text-white truncate">
              {getPageTitle()}
            </h1>

            <div className="flex items-center gap-1.5">
              <Link
                to="/notifications"
                className="relative min-w-[40px] min-h-[40px] rounded-full bg-[#181818] flex items-center justify-center text-white"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FFFC00]" />
                )}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-[#181818] flex items-center justify-center text-white"
                aria-label="More navigation"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        {/* Route Outlet Area */}
        <main className={`flex-1 min-h-0 overflow-y-auto ${!location.pathname.startsWith('/chat/') ? 'pb-16 lg:pb-0' : ''}`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        {!location.pathname.startsWith('/chat/') && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 pb-safe bg-black/95 backdrop-blur-md border-t border-[#292929] grid grid-cols-5 items-center px-2">
            {mobileBottomTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isPathActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className="relative flex flex-col items-center justify-center min-h-[48px] gap-1"
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform ${
                        active ? `${tab.activeColor} scale-110` : 'text-[#A1A1A1]'
                      }`}
                    />
                    {tab.badge && tab.badge > 0 ? (
                      <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full bg-[#FFFC00] text-black text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {tab.badge}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-tight ${
                      active ? 'text-white' : 'text-[#A1A1A1]'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {active && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Desktop Right Activity & Friends Sidebar */}
      <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-[#292929] bg-[#080808] p-4 space-y-6 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-[#A1A1A1]">Online &amp; Streaks</h2>
            <Link to="/friends" className="text-xs font-semibold text-[#FFFC00] hover:underline">
              See all
            </Link>
          </div>
          <div className="space-y-2">
            {friendsList.slice(0, 6).map(({ rel, user }) => (
              <button
                key={user.id}
                onClick={() => navigate(`/chat/${user.username}`)}
                className="w-full flex items-center justify-between p-2 rounded-2xl bg-[#121212] hover:bg-[#1A1A1A] border border-transparent hover:border-[#292929] transition text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BitmojiAvatar avatar={user.avatar} size={36} className="rounded-full" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[11px] text-[#A1A1A1] truncate">
                      {user.isOnline ? 'Active now' : user.lastActive}
                    </p>
                  </div>
                </div>
                {rel.streakCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#FFFC00] tabular-nums shrink-0">
                    {rel.streakCount}
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-flame" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-[#A1A1A1]">Quick Shortcuts</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/avatar"
              className="p-3 rounded-2xl bg-[#141414] border border-[#292929] hover:border-[#FFFC00] transition"
            >
              <Sparkles className="w-4 h-4 text-[#FFFC00] mb-1.5" />
              <p className="text-xs font-bold text-white">Bitmoji</p>
              <p className="text-[11px] text-[#A1A1A1]">Customize look</p>
            </Link>
            <Link
              to="/discover"
              className="p-3 rounded-2xl bg-[#141414] border border-[#292929] hover:border-[#FFFC00] transition"
            >
              <Compass className="w-4 h-4 text-sky-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Discover</p>
              <p className="text-[11px] text-[#A1A1A1]">Trending feeds</p>
            </Link>
            <Link
              to="/calls"
              className="p-3 rounded-2xl bg-[#141414] border border-[#292929] hover:border-[#FFFC00] transition"
            >
              <Phone className="w-4 h-4 text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Calls</p>
              <p className="text-[11px] text-[#A1A1A1]">Audio &amp; Video</p>
            </Link>
            <Link
              to="/map"
              className="p-3 rounded-2xl bg-[#141414] border border-[#292929] hover:border-[#FFFC00] transition"
            >
              <MapPin className="w-4 h-4 text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Snap Map</p>
              <p className="text-[11px] text-[#A1A1A1]">
                {state.settings.ghostMode ? 'Ghost Mode' : 'Live map'}
              </p>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Full Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md lg:hidden flex flex-col p-5">
          <div className="flex items-center justify-between mb-6">
            <LumoLogo size={36} withWordmark />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="min-w-[44px] min-h-[44px] rounded-full bg-[#181818] flex items-center justify-center text-white"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 overflow-y-auto">
            {desktopNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-[#141414] border border-[#292929] text-sm font-semibold text-white"
                >
                  <Icon className="w-5 h-5 text-[#FFFC00]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-[#141414] border border-[#292929] text-sm font-semibold text-white"
            >
              <BitmojiAvatar avatar={currentUser.avatar} size={24} className="rounded-full" />
              <span>My Profile</span>
            </Link>
          </div>
        </div>
      )}

      <UniversalSearchModal />
      <ActiveCallOverlay />
      <ToastStack toasts={toasts} />
    </div>
  );
};

const ToastStack: React.FC<{ toasts: { id: string; text: string; tone?: string }[] }> = ({
  toasts,
}) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none px-4 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold text-center shadow-2xl border ${
            t.tone === 'yellow'
              ? 'bg-[#FFFC00] text-black border-[#FFFC00]'
              : t.tone === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-[#181818] text-white border-[#292929]'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
};
