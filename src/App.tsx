import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { CameraPage } from './pages/CameraPage';
import { ChatListPage } from './pages/ChatListPage';
import { ChatDetailPage } from './pages/ChatDetailPage';
import { StoriesPage } from './pages/StoriesPage';
import { SpotlightPage } from './pages/SpotlightPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MapPage } from './pages/MapPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AvatarEditorPage } from './pages/AvatarEditorPage';
import { CallsPage } from './pages/CallsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-xl font-extrabold text-[#FFFC00]">Something went wrong</h1>
          <p className="text-xs text-[#A1A1A1] mt-2">Tap below to reload Lumo.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#FFFC00] text-black text-xs font-bold"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<CameraPage />} />
              <Route path="/camera" element={<CameraPage />} />
              <Route path="/chat" element={<ChatListPage />} />
              <Route path="/chat/:username" element={<ChatDetailPage />} />
              <Route path="/stories" element={<StoriesPage />} />
              <Route path="/spotlight" element={<SpotlightPage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/avatar" element={<AvatarEditorPage />} />
              <Route path="/calls" element={<CallsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
