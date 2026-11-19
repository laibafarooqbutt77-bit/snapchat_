export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'diamond';
export type EyeShape = 'almond' | 'round' | 'wide' | 'relaxed' | 'big';
export type EyebrowStyle = 'natural' | 'arched' | 'thick' | 'straight';
export type NoseStyle = 'classic' | 'button' | 'narrow' | 'wide';
export type LipStyle = 'natural' | 'full' | 'thin' | 'smile';
export type FacialExpression =
  | 'smiling'
  | 'laughing'
  | 'cool'
  | 'surprised'
  | 'thinking'
  | 'crying'
  | 'sleeping'
  | 'wink';
export type FacialHair = 'none' | 'stubble' | 'beard' | 'mustache' | 'goatee';
export type HairStyle =
  | 'shortfade'
  | 'curly'
  | 'afro'
  | 'longwave'
  | 'bob'
  | 'ponytail'
  | 'messy'
  | 'braids'
  | 'parted'
  | 'buzz'
  | 'bun'
  | 'sleek';
export type TopStyle = 'tshirt' | 'hoodie' | 'jacket' | 'sweater' | 'collared' | 'tank';
export type BottomStyle = 'jeans' | 'pants' | 'shorts';
export type ShoeStyle = 'sneakers' | 'boots' | 'slides';
export type EyewearStyle = 'none' | 'sunglasses' | 'round_glasses' | 'square_glasses' | 'tinted';
export type HeadwearStyle = 'none' | 'cap' | 'beanie' | 'bucket_hat' | 'headband';
export type JewelryStyle = 'none' | 'chain' | 'earrings' | 'both';
export type AccessoryStyle = 'none' | 'headphones' | 'watch' | 'bag';
export type AvatarPose =
  | 'standing'
  | 'sitting'
  | 'laughing'
  | 'smiling'
  | 'crying'
  | 'surprised'
  | 'cool'
  | 'thinking'
  | 'sleeping'
  | 'dancing';

export interface AvatarConfig {
  faceShape: FaceShape;
  skinColor: string;
  eyeShape: EyeShape;
  eyeColor: string;
  eyebrows: EyebrowStyle;
  nose: NoseStyle;
  lips: LipStyle;
  expression: FacialExpression;
  ears: 'normal' | 'pierced';
  facialHair: FacialHair;
  hairStyle: HairStyle;
  hairColor: string;
  hairHighlight: string;
  topStyle: TopStyle;
  topColor: string;
  bottomStyle: BottomStyle;
  bottomColor: string;
  shoesStyle: ShoeStyle;
  eyewear: EyewearStyle;
  headwear: HeadwearStyle;
  jewelry: JewelryStyle;
  accessory: AccessoryStyle;
  pose: AvatarPose;
  background: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  birthday: string;
  snapScore: number;
  avatar: AvatarConfig;
  profilePhotoUrl?: string;
  isOnline: boolean;
  lastActive: string;
  location: {
    lat: number;
    lng: number;
    neighborhood: string;
    xPercent: number;
    yPercent: number;
    statusText?: string;
  };
  passwordHash?: string;
}

export type FriendStatus = 'friend' | 'pending_incoming' | 'pending_outgoing' | 'suggested';

export interface StreakHistoryEntry {
  date: string;
  count: number;
}

export interface FriendRelation {
  userId: string;
  status: FriendStatus;
  streakCount: number;
  lastSnapFromMeDate: string | null;
  lastSnapFromThemDate: string | null;
  lastSnapTimestamp: number | null;
  streakHistory: StreakHistoryEntry[];
  mutualFriendsCount: number;
}

export type MessageType =
  | 'text'
  | 'snap_photo'
  | 'snap_video'
  | 'photo'
  | 'video'
  | 'voice'
  | 'sticker'
  | 'call_log';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaId?: string;
  mediaUrl?: string;
  duration?: number; // seconds for voice or snap timer
  stickerEmoji?: string;
  stickerLabel?: string;
  filterName?: string;
  replyToId?: string;
  reactions: Record<string, string[]>; // emoji -> userIds
  status: 'sent' | 'delivered' | 'seen' | 'opened';
  snapOpened?: boolean;
  isDeleted?: boolean;
  createdAt: number;
}

export interface Conversation {
  id: string;
  participantId: string;
  isPinned: boolean;
  isMuted: boolean;
  unreadCount: number;
  lastMessageAt: number;
  isTyping?: boolean;
}

export interface StorySticker {
  id: string;
  content: string;
  x: number;
  y: number;
  scale: number;
}

export interface StoryItem {
  id: string;
  userId: string;
  mediaType: 'photo' | 'video';
  mediaId?: string;
  mediaUrl?: string;
  filterId?: string;
  caption?: string;
  stickers?: StorySticker[];
  privacy: 'friends' | 'everyone' | 'close_friends';
  createdAt: number;
  expiresAt: number;
  viewerIds: string[];
  reactions: { userId: string; emoji: string; createdAt: number }[];
}

export interface SpotlightComment {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface SpotlightVideo {
  id: string;
  creatorId: string;
  title: string;
  caption: string;
  musicTitle: string;
  musicArtist: string;
  posterUrl?: string;
  mediaId?: string;
  mediaUrl?: string;
  motionPreset: 'pulse' | 'pan' | 'kenburns' | 'neon';
  views: number;
  likes: number;
  likedByMe: boolean;
  savedByMe: boolean;
  comments: SpotlightComment[];
  duration: number;
  createdAt: number;
}

export interface DiscoverItem {
  id: string;
  category: 'Entertainment' | 'Lifestyle' | 'Gaming' | 'Auto' | 'Culture';
  publisher: string;
  title: string;
  subtitle: string;
  articleBody: string;
  imageUrl: string;
  views: string;
  timeAgo: string;
  isSubscribed: boolean;
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'incoming_snap'
  | 'new_chat'
  | 'story_reply'
  | 'story_reaction'
  | 'streak_warning'
  | 'call_missed'
  | 'spotlight_like';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  fromUserId: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: number;
}

export interface CallRecord {
  id: string;
  participantId: string;
  mode: 'audio' | 'video';
  direction: 'incoming' | 'outgoing';
  status: 'missed' | 'ended' | 'declined';
  durationSec: number;
  createdAt: number;
}

export interface AppSettings {
  ghostMode: boolean;
  whoCanContact: 'everyone' | 'friends';
  whoCanViewStory: 'everyone' | 'friends' | 'custom';
  cameraGrid: boolean;
  mirrorFrontCam: boolean;
  defaultSnapTimer: number;
  notificationsEnabled: boolean;
  soundEffects: boolean;
  accentStyle: 'yellow' | 'high_contrast';
}

export interface FilterPreset {
  id: string;
  name: string;
  category: 'basic' | 'advanced' | 'lens';
  cssFilter: string;
  canvasMode?:
    | 'none'
    | 'neon'
    | 'vhs'
    | 'glitch'
    | 'rgb_split'
    | 'cartoon'
    | 'sketch'
    | 'pixel'
    | 'dream'
    | 'rainbow'
    | 'color_shift'
    | 'retro';
  lensType?:
    | 'dog_ears'
    | 'cat_ears'
    | 'bunny_ears'
    | 'funny_face'
    | 'big_eyes'
    | 'small_face'
    | 'sunglasses'
    | 'face_decor'
    | 'makeup'
    | 'cyber_mask'
    | 'crown';
  badgeColor: string;
  description: string;
}

export interface PersistedAppState {
  version: number;
  currentUserId: string | null;
  hasCompletedOnboarding: boolean;
  rememberSession: boolean;
  users: Record<string, User>;
  friends: Record<string, FriendRelation>;
  blockedUserIds: string[];
  conversations: Conversation[];
  messages: ChatMessage[];
  stories: StoryItem[];
  spotlights: SpotlightVideo[];
  followedCreatorIds: string[];
  discover: DiscoverItem[];
  notifications: NotificationItem[];
  callHistory: CallRecord[];
  settings: AppSettings;
  favoriteFilterIds: string[];
  recentFilterIds: string[];
  recentSearches: string[];
}
