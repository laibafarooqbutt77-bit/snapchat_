import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AppSettings,
  AvatarConfig,
  CallRecord,
  ChatMessage,
  DiscoverItem,
  NotificationItem,
  PersistedAppState,
  SpotlightVideo,
  StoryItem,
  User,
} from '../types';
import { createInitialDemoState } from '../data/demoData';
import { loadAppState, saveAppState, clearAppState } from '../utils/storage';
import { clearAllMedia } from '../utils/idb';
import { applySnapExchangeToStreak } from '../utils/streaks';

export interface ToastMessage {
  id: string;
  text: string;
  tone?: 'default' | 'yellow' | 'error';
}

export interface ActiveCallSession {
  id: string;
  participantId: string;
  mode: 'audio' | 'video';
  direction: 'incoming' | 'outgoing';
  status: 'ringing' | 'connected';
  startedAt: number | null;
}

interface AppContextValue {
  state: PersistedAppState;
  currentUser: User | null;
  toasts: ToastMessage[];
  showToast: (text: string, tone?: ToastMessage['tone']) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  activeCall: ActiveCallSession | null;
  startCall: (participantId: string, mode: 'audio' | 'video') => void;
  simulateIncomingCall: (participantId: string, mode: 'audio' | 'video') => void;
  acceptCall: () => void;
  declineOrEndCall: () => void;

  // Auth & Profile
  login: (username: string, password?: string) => boolean;
  signup: (payload: {
    username: string;
    displayName: string;
    password: string;
    birthday: string;
    bio: string;
  }) => boolean;
  logout: () => void;
  completeOnboarding: () => void;
  updateProfile: (patch: Partial<Pick<User, 'displayName' | 'bio' | 'birthday' | 'profilePhotoUrl'>>) => void;
  updateAvatar: (avatar: AvatarConfig) => void;

  // Friends
  sendFriendRequest: (userId: string) => void;
  acceptFriendRequest: (userId: string) => void;
  declineFriendRequest: (userId: string) => void;
  removeFriend: (userId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;

  // Chat & Snaps
  sendMessage: (
    participantId: string,
    payload: Omit<ChatMessage, 'id' | 'conversationId' | 'senderId' | 'reactions' | 'status' | 'createdAt'>
  ) => void;
  sendSnapToFriends: (
    friendIds: string[],
    payload: {
      mediaType: 'photo' | 'video';
      mediaId?: string;
      mediaUrl?: string;
      caption?: string;
      filterName?: string;
      duration?: number;
    }
  ) => void;
  openSnap: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  togglePinChat: (conversationId: string) => void;
  toggleMuteChat: (conversationId: string) => void;
  markChatRead: (conversationId: string) => void;

  // Stories
  addStory: (payload: Omit<StoryItem, 'id' | 'userId' | 'createdAt' | 'expiresAt' | 'viewerIds' | 'reactions'>) => void;
  viewStory: (storyId: string) => void;
  reactToStory: (storyId: string, emoji: string) => void;
  replyToStory: (storyId: string, text: string) => void;
  deleteStory: (storyId: string) => void;

  // Spotlight & Discover
  toggleLikeSpotlight: (spotlightId: string) => void;
  toggleSaveSpotlight: (spotlightId: string) => void;
  addSpotlightComment: (spotlightId: string, text: string) => void;
  uploadSpotlight: (payload: {
    title: string;
    caption: string;
    musicTitle: string;
    mediaId?: string;
    posterUrl?: string;
    duration?: number;
  }) => void;
  toggleFollowCreator: (creatorId: string) => void;
  toggleDiscoverSubscribe: (discoverId: string) => void;

  // Filters & Search
  toggleFavoriteFilter: (filterId: string) => void;
  recordRecentFilter: (filterId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Notifications & Settings
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedAppState>(() => {
    const loaded = loadAppState();
    return loaded || createInitialDemoState();
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCallSession | null>(null);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'default') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const currentUser = state.currentUserId ? state.users[state.currentUserId] || null : null;

  const login = useCallback(
    (username: string, _password?: string) => {
      const normalized = username.trim().toLowerCase().replace(/^@/, '');
      const found = Object.values(state.users).find(
        (u) => u.username.toLowerCase() === normalized
      );
      if (!found) {
        showToast('Account not found. Try alex_rivera or create one!', 'error');
        return false;
      }
      setState((prev) => ({
        ...prev,
        currentUserId: found.id,
        hasCompletedOnboarding: true,
      }));
      showToast(`Welcome back, ${found.displayName}`, 'yellow');
      return true;
    },
    [state.users, showToast]
  );

  const signup = useCallback(
    (payload: {
      username: string;
      displayName: string;
      password: string;
      birthday: string;
      bio: string;
    }) => {
      const cleanUsername = payload.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!cleanUsername || !payload.displayName.trim()) {
        showToast('Please enter a valid username and display name.', 'error');
        return false;
      }
      const exists = Object.values(state.users).some(
        (u) => u.username.toLowerCase() === cleanUsername
      );
      if (exists) {
        showToast('Username is already taken.', 'error');
        return false;
      }
      const newId = `user_${Date.now()}`;
      const newUser: User = {
        id: newId,
        username: cleanUsername,
        displayName: payload.displayName.trim(),
        bio: payload.bio.trim() || 'New on Lumo ⚡',
        birthday: payload.birthday || '2002-01-01',
        snapScore: 100,
        isOnline: true,
        lastActive: 'Active now',
        location: {
          lat: 34.0195,
          lng: -118.4912,
          neighborhood: 'Santa Monica',
          xPercent: 50,
          yPercent: 50,
          statusText: 'Just joined',
        },
        avatar: {
          ...state.users.user_me.avatar,
          background: '#FFFC00',
        },
      };
      setState((prev) => ({
        ...prev,
        currentUserId: newId,
        hasCompletedOnboarding: true,
        users: {
          ...prev.users,
          [newId]: newUser,
        },
      }));
      showToast(`Account @${cleanUsername} created!`, 'yellow');
      return true;
    },
    [state.users, showToast]
  );

  const logout = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentUserId: null,
    }));
    showToast('Logged out safely');
  }, [showToast]);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<Pick<User, 'displayName' | 'bio' | 'birthday' | 'profilePhotoUrl'>>) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const user = prev.users[prev.currentUserId];
        if (!user) return prev;
        return {
          ...prev,
          users: {
            ...prev.users,
            [user.id]: { ...user, ...patch },
          },
        };
      });
      showToast('Profile updated', 'yellow');
    },
    [showToast]
  );

  const updateAvatar = useCallback(
    (avatar: AvatarConfig) => {
      setState((prev) => {
        if (!prev.currentUserId) return prev;
        const user = prev.users[prev.currentUserId];
        if (!user) return prev;
        return {
          ...prev,
          users: {
            ...prev.users,
            [user.id]: { ...user, avatar },
          },
        };
      });
      showToast('Bitmoji avatar saved!', 'yellow');
    },
    [showToast]
  );

  // Friends
  const sendFriendRequest = useCallback(
    (userId: string) => {
      setState((prev) => ({
        ...prev,
        friends: {
          ...prev.friends,
          [userId]: {
            userId,
            status: 'pending_outgoing',
            streakCount: 0,
            lastSnapFromMeDate: null,
            lastSnapFromThemDate: null,
            lastSnapTimestamp: null,
            streakHistory: [],
            mutualFriendsCount: prev.friends[userId]?.mutualFriendsCount ?? 2,
          },
        },
      }));
      showToast('Friend request sent');
    },
    [showToast]
  );

  const acceptFriendRequest = useCallback(
    (userId: string) => {
      setState((prev) => {
        const existing = prev.friends[userId];
        const target = prev.users[userId];
        const convExists = prev.conversations.some((c) => c.participantId === userId);
        const newNotif: NotificationItem = {
          id: `n_${Date.now()}`,
          type: 'friend_accepted',
          fromUserId: userId,
          title: `You & ${target?.displayName || 'Friend'} are now friends`,
          body: 'Send a snap to start a streak 🔥',
          link: `/chat/${target?.username || ''}`,
          isRead: false,
          createdAt: Date.now(),
        };
        return {
          ...prev,
          friends: {
            ...prev.friends,
            [userId]: {
              ...(existing || {
                userId,
                streakCount: 0,
                lastSnapFromMeDate: null,
                lastSnapFromThemDate: null,
                lastSnapTimestamp: null,
                streakHistory: [],
                mutualFriendsCount: 3,
              }),
              status: 'friend',
            },
          },
          conversations: convExists
            ? prev.conversations
            : [
                {
                  id: `conv_${userId}`,
                  participantId: userId,
                  isPinned: false,
                  isMuted: false,
                  unreadCount: 0,
                  lastMessageAt: Date.now(),
                },
                ...prev.conversations,
              ],
          notifications: [newNotif, ...prev.notifications],
        };
      });
      showToast('Friend request accepted!', 'yellow');
    },
    [showToast]
  );

  const declineFriendRequest = useCallback(
    (userId: string) => {
      setState((prev) => {
        const nextFriends = { ...prev.friends };
        delete nextFriends[userId];
        return { ...prev, friends: nextFriends };
      });
      showToast('Request removed');
    },
    [showToast]
  );

  const removeFriend = useCallback(
    (userId: string) => {
      setState((prev) => {
        const nextFriends = { ...prev.friends };
        delete nextFriends[userId];
        return { ...prev, friends: nextFriends };
      });
      showToast('Friend removed');
    },
    [showToast]
  );

  const blockUser = useCallback(
    (userId: string) => {
      setState((prev) => ({
        ...prev,
        blockedUserIds: prev.blockedUserIds.includes(userId)
          ? prev.blockedUserIds
          : [...prev.blockedUserIds, userId],
      }));
      showToast('User blocked');
    },
    [showToast]
  );

  const unblockUser = useCallback(
    (userId: string) => {
      setState((prev) => ({
        ...prev,
        blockedUserIds: prev.blockedUserIds.filter((id) => id !== userId),
      }));
      showToast('User unblocked');
    },
    [showToast]
  );

  // Chat & Snaps
  const sendMessage = useCallback(
    (
      participantId: string,
      payload: Omit<ChatMessage, 'id' | 'conversationId' | 'senderId' | 'reactions' | 'status' | 'createdAt'>
    ) => {
      const meId = state.currentUserId || 'user_me';
      const nowTs = Date.now();
      let targetConvId = '';

      setState((prev) => {
        let conv = prev.conversations.find((c) => c.participantId === participantId);
        targetConvId = conv ? conv.id : `conv_${participantId}`;

        const msg: ChatMessage = {
          id: `msg_${nowTs}_${Math.random().toString(36).slice(2, 6)}`,
          conversationId: targetConvId,
          senderId: meId,
          reactions: {},
          status: 'delivered',
          createdAt: nowTs,
          ...payload,
        };

        const updatedConvs = conv
          ? prev.conversations.map((c) =>
              c.id === targetConvId ? { ...c, lastMessageAt: nowTs, isTyping: false } : c
            )
          : [
              {
                id: targetConvId,
                participantId,
                isPinned: false,
                isMuted: false,
                unreadCount: 0,
                lastMessageAt: nowTs,
              },
              ...prev.conversations,
            ];

        // Increase snapScore
        const me = prev.users[meId];
        const nextUsers = me
          ? { ...prev.users, [meId]: { ...me, snapScore: me.snapScore + 1 } }
          : prev.users;

        return {
          ...prev,
          users: nextUsers,
          conversations: updatedConvs,
          messages: [...prev.messages, msg],
        };
      });

      // Realistic friend reply simulation for demo engagement
      if (payload.type === 'text' || payload.type === 'voice') {
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            conversations: prev.conversations.map((c) =>
              c.id === targetConvId ? { ...c, isTyping: true } : c
            ),
          }));
        }, 700);

        setTimeout(() => {
          const replies = [
            'Got it! 🔥',
            'Send a snap when you get there!',
            'Wait that is actually awesome 😄',
            'On my way right now!',
            'Love that ✨',
          ];
          const replyText = replies[Math.floor(Math.random() * replies.length)];
          const replyTs = Date.now();
          setState((prev) => ({
            ...prev,
            conversations: prev.conversations.map((c) =>
              c.id === targetConvId
                ? { ...c, isTyping: false, lastMessageAt: replyTs, unreadCount: c.unreadCount + 1 }
                : c
            ),
            messages: [
              ...prev.messages,
              {
                id: `msg_${replyTs}_r`,
                conversationId: targetConvId,
                senderId: participantId,
                type: 'text',
                text: replyText,
                reactions: {},
                status: 'delivered',
                createdAt: replyTs,
              },
            ],
          }));
        }, 2100);
      }
    },
    [state.currentUserId]
  );

  const sendSnapToFriends = useCallback(
    (
      friendIds: string[],
      payload: {
        mediaType: 'photo' | 'video';
        mediaId?: string;
        mediaUrl?: string;
        caption?: string;
        filterName?: string;
        duration?: number;
      }
    ) => {
      const meId = state.currentUserId || 'user_me';
      const nowTs = Date.now();

      setState((prev) => {
        let nextConvs = [...prev.conversations];
        const newMessages: ChatMessage[] = [];
        const nextFriends = { ...prev.friends };

        friendIds.forEach((fid, idx) => {
          let conv = nextConvs.find((c) => c.participantId === fid);
          const convId = conv ? conv.id : `conv_${fid}`;
          if (!conv) {
            nextConvs.unshift({
              id: convId,
              participantId: fid,
              isPinned: false,
              isMuted: false,
              unreadCount: 0,
              lastMessageAt: nowTs,
            });
          } else {
            nextConvs = nextConvs.map((c) =>
              c.id === convId ? { ...c, lastMessageAt: nowTs } : c
            );
          }

          newMessages.push({
            id: `snap_${nowTs}_${idx}`,
            conversationId: convId,
            senderId: meId,
            type: payload.mediaType === 'video' ? 'snap_video' : 'snap_photo',
            mediaId: payload.mediaId,
            mediaUrl: payload.mediaUrl,
            text: payload.caption,
            filterName: payload.filterName,
            duration: payload.duration || 5,
            reactions: {},
            status: 'delivered',
            snapOpened: false,
            createdAt: nowTs,
          });

          if (nextFriends[fid]) {
            nextFriends[fid] = applySnapExchangeToStreak(nextFriends[fid], 'me');
          }
        });

        const me = prev.users[meId];
        const nextUsers = me
          ? { ...prev.users, [meId]: { ...me, snapScore: me.snapScore + friendIds.length * 5 } }
          : prev.users;

        return {
          ...prev,
          users: nextUsers,
          friends: nextFriends,
          conversations: nextConvs,
          messages: [...prev.messages, ...newMessages],
        };
      });

      showToast(
        `Snap sent to ${friendIds.length} ${friendIds.length === 1 ? 'friend' : 'friends'}! ⚡`,
        'yellow'
      );
    },
    [state.currentUserId, showToast]
  );

  const openSnap = useCallback((messageId: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id === messageId ? { ...m, snapOpened: true, status: 'opened' } : m
      ),
    }));
  }, []);

  const deleteMessage = useCallback(
    (messageId: string) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, text: 'Message deleted' } : m
        ),
      }));
      showToast('Message deleted');
    },
    [showToast]
  );

  const reactToMessage = useCallback(
    (messageId: string, emoji: string) => {
      const meId = state.currentUserId || 'user_me';
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions[emoji] || [];
          const has = existing.includes(meId);
          const updatedList = has ? existing.filter((id) => id !== meId) : [...existing, meId];
          const nextReactions = { ...m.reactions };
          if (updatedList.length === 0) delete nextReactions[emoji];
          else nextReactions[emoji] = updatedList;
          return { ...m, reactions: nextReactions };
        }),
      }));
    },
    [state.currentUserId]
  );

  const togglePinChat = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c
      ),
    }));
  }, []);

  const toggleMuteChat = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId ? { ...c, isMuted: !c.isMuted } : c
      ),
    }));
  }, []);

  const markChatRead = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  }, []);

  // Stories
  const addStory = useCallback(
    (payload: Omit<StoryItem, 'id' | 'userId' | 'createdAt' | 'expiresAt' | 'viewerIds' | 'reactions'>) => {
      const meId = state.currentUserId || 'user_me';
      const ts = Date.now();
      const newStory: StoryItem = {
        ...payload,
        id: `story_${ts}`,
        userId: meId,
        createdAt: ts,
        expiresAt: ts + 24 * 3600 * 1000,
        viewerIds: [],
        reactions: [],
      };
      setState((prev) => {
        const me = prev.users[meId];
        return {
          ...prev,
          users: me
            ? { ...prev.users, [meId]: { ...me, snapScore: me.snapScore + 10 } }
            : prev.users,
          stories: [newStory, ...prev.stories],
        };
      });
      showToast('Added to My Story!', 'yellow');
    },
    [state.currentUserId, showToast]
  );

  const viewStory = useCallback(
    (storyId: string) => {
      const meId = state.currentUserId || 'user_me';
      setState((prev) => ({
        ...prev,
        stories: prev.stories.map((s) =>
          s.id === storyId && !s.viewerIds.includes(meId)
            ? { ...s, viewerIds: [...s.viewerIds, meId] }
            : s
        ),
      }));
    },
    [state.currentUserId]
  );

  const reactToStory = useCallback(
    (storyId: string, emoji: string) => {
      const meId = state.currentUserId || 'user_me';
      setState((prev) => ({
        ...prev,
        stories: prev.stories.map((s) =>
          s.id === storyId
            ? {
                ...s,
                reactions: [...s.reactions, { userId: meId, emoji, createdAt: Date.now() }],
              }
            : s
        ),
      }));
      showToast(`Sent ${emoji} reaction`);
    },
    [state.currentUserId, showToast]
  );

  const replyToStory = useCallback(
    (storyId: string, text: string) => {
      const story = state.stories.find((s) => s.id === storyId);
      if (!story || !text.trim()) return;
      sendMessage(story.userId, {
        type: 'text',
        text: `Replied to story: "${text.trim()}"`,
      });
      showToast('Reply sent to chat!', 'yellow');
    },
    [state.stories, sendMessage, showToast]
  );

  const deleteStory = useCallback(
    (storyId: string) => {
      setState((prev) => ({
        ...prev,
        stories: prev.stories.filter((s) => s.id !== storyId),
      }));
      showToast('Story deleted');
    },
    [showToast]
  );

  // Spotlight & Discover
  const toggleLikeSpotlight = useCallback((spotlightId: string) => {
    setState((prev) => ({
      ...prev,
      spotlights: prev.spotlights.map((sp) =>
        sp.id === spotlightId
          ? {
              ...sp,
              likedByMe: !sp.likedByMe,
              likes: sp.likedByMe ? sp.likes - 1 : sp.likes + 1,
            }
          : sp
      ),
    }));
  }, []);

  const toggleSaveSpotlight = useCallback(
    (spotlightId: string) => {
      setState((prev) => ({
        ...prev,
        spotlights: prev.spotlights.map((sp) =>
          sp.id === spotlightId ? { ...sp, savedByMe: !sp.savedByMe } : sp
        ),
      }));
      showToast('Updated saved Spotlights');
    },
    [showToast]
  );

  const addSpotlightComment = useCallback(
    (spotlightId: string, text: string) => {
      const meId = state.currentUserId || 'user_me';
      if (!text.trim()) return;
      setState((prev) => ({
        ...prev,
        spotlights: prev.spotlights.map((sp) =>
          sp.id === spotlightId
            ? {
                ...sp,
                comments: [
                  ...sp.comments,
                  {
                    id: `cmt_${Date.now()}`,
                    userId: meId,
                    text: text.trim(),
                    createdAt: Date.now(),
                  },
                ],
              }
            : sp
        ),
      }));
    },
    [state.currentUserId]
  );

  const uploadSpotlight = useCallback(
    (payload: {
      title: string;
      caption: string;
      musicTitle: string;
      mediaId?: string;
      posterUrl?: string;
      duration?: number;
    }) => {
      const meId = state.currentUserId || 'user_me';
      const me = state.users[meId];
      const newVideo: SpotlightVideo = {
        id: `sp_${Date.now()}`,
        creatorId: meId,
        title: payload.title || 'My Spotlight',
        caption: payload.caption || 'Fresh capture on Lumo ⚡',
        musicTitle: payload.musicTitle || 'Original Sound',
        musicArtist: me?.displayName || 'Creator',
        mediaId: payload.mediaId,
        posterUrl: payload.posterUrl || '/src/assets/images/story_rooftop_sunset_1795091148133.jpg',
        motionPreset: 'pulse',
        views: 1,
        likes: 0,
        likedByMe: false,
        savedByMe: false,
        comments: [],
        duration: payload.duration || 12,
        createdAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        spotlights: [newVideo, ...prev.spotlights],
      }));
      showToast('Published to Spotlight!', 'yellow');
    },
    [state.currentUserId, state.users, showToast]
  );

  const toggleFollowCreator = useCallback((creatorId: string) => {
    setState((prev) => {
      const exists = prev.followedCreatorIds.includes(creatorId);
      return {
        ...prev,
        followedCreatorIds: exists
          ? prev.followedCreatorIds.filter((id) => id !== creatorId)
          : [...prev.followedCreatorIds, creatorId],
      };
    });
  }, []);

  const toggleDiscoverSubscribe = useCallback((discoverId: string) => {
    setState((prev) => ({
      ...prev,
      discover: prev.discover.map((d) =>
        d.id === discoverId ? { ...d, isSubscribed: !d.isSubscribed } : d
      ),
    }));
  }, []);

  // Filters & Searches
  const toggleFavoriteFilter = useCallback((filterId: string) => {
    setState((prev) => {
      const exists = prev.favoriteFilterIds.includes(filterId);
      return {
        ...prev,
        favoriteFilterIds: exists
          ? prev.favoriteFilterIds.filter((id) => id !== filterId)
          : [...prev.favoriteFilterIds, filterId],
      };
    });
  }, []);

  const recordRecentFilter = useCallback((filterId: string) => {
    setState((prev) => ({
      ...prev,
      recentFilterIds: [filterId, ...prev.recentFilterIds.filter((id) => id !== filterId)].slice(0, 8),
    }));
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setState((prev) => ({
      ...prev,
      recentSearches: [q, ...prev.recentSearches.filter((x) => x !== q)].slice(0, 8),
    }));
  }, []);

  const clearRecentSearches = useCallback(() => {
    setState((prev) => ({ ...prev, recentSearches: [] }));
  }, []);

  // Notifications & Settings
  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
    }));
    showToast('All notifications marked read');
  }, [showToast]);

  const clearNotifications = useCallback(() => {
    setState((prev) => ({ ...prev, notifications: [] }));
    showToast('Notifications cleared');
  }, [showToast]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const resetAllData = useCallback(async () => {
    clearAppState();
    await clearAllMedia();
    const fresh = createInitialDemoState();
    setState(fresh);
    showToast('Local data reset to defaults', 'yellow');
  }, [showToast]);

  // Calling
  const startCall = useCallback((participantId: string, mode: 'audio' | 'video') => {
    const id = `call_${Date.now()}`;
    setActiveCall({
      id,
      participantId,
      mode,
      direction: 'outgoing',
      status: 'ringing',
      startedAt: null,
    });
  }, []);

  const simulateIncomingCall = useCallback((participantId: string, mode: 'audio' | 'video') => {
    const id = `call_${Date.now()}`;
    setActiveCall({
      id,
      participantId,
      mode,
      direction: 'incoming',
      status: 'ringing',
      startedAt: null,
    });
  }, []);

  const acceptCall = useCallback(() => {
    setActiveCall((prev) =>
      prev ? { ...prev, status: 'connected', startedAt: Date.now() } : null
    );
  }, []);

  const declineOrEndCall = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const durationSec = prev.startedAt
        ? Math.max(1, Math.floor((Date.now() - prev.startedAt) / 1000))
        : 0;
      const record: CallRecord = {
        id: prev.id,
        participantId: prev.participantId,
        mode: prev.mode,
        direction: prev.direction,
        status: prev.status === 'connected' ? 'ended' : prev.direction === 'incoming' ? 'declined' : 'missed',
        durationSec,
        createdAt: Date.now(),
      };
      setState((st) => ({
        ...st,
        callHistory: [record, ...st.callHistory],
      }));
      return null;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        currentUser,
        toasts,
        showToast,
        searchOpen,
        setSearchOpen,
        activeCall,
        startCall,
        simulateIncomingCall,
        acceptCall,
        declineOrEndCall,
        login,
        signup,
        logout,
        completeOnboarding,
        updateProfile,
        updateAvatar,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        blockUser,
        unblockUser,
        sendMessage,
        sendSnapToFriends,
        openSnap,
        deleteMessage,
        reactToMessage,
        togglePinChat,
        toggleMuteChat,
        markChatRead,
        addStory,
        viewStory,
        reactToStory,
        replyToStory,
        deleteStory,
        toggleLikeSpotlight,
        toggleSaveSpotlight,
        addSpotlightComment,
        uploadSpotlight,
        toggleFollowCreator,
        toggleDiscoverSubscribe,
        toggleFavoriteFilter,
        recordRecentFilter,
        addRecentSearch,
        clearRecentSearches,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        updateSettings,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
