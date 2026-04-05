// ─── Postiz Public API TypeScript Definitions ───
// Based on https://docs.postiz.com/public-api

// ─── Platform Types ───
export type PlatformType =
  | "x"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "youtube"
  | "pinterest"
  | "threads"
  | "bluesky"
  | "mastodon"
  | "reddit"
  | "medium"
  | "devto"
  | "hashnode"
  | "dribbble"
  | "slack"
  | "discord"
  | "telegram";

// ─── Post Types ───
export type PostType = "now" | "schedule" | "draft";

export interface PostImage {
  id: string;
  path: string;
}

export interface PostValue {
  content: string;
  image: PostImage[];
}

// Platform-specific settings
export interface XSettings {
  __type: "x";
  who_can_reply_post?: "everyone" | "following" | "mentioned";
}

export interface LinkedInSettings {
  __type: "linkedin";
  visibility?: "PUBLIC" | "CONNECTIONS";
}

export interface InstagramSettings {
  __type: "instagram";
  post_type?: "post" | "reel" | "story";
}

export interface TikTokSettings {
  __type: "tiktok";
  privacy_level?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  allow_comment?: boolean;
  allow_duet?: boolean;
  allow_stitch?: boolean;
}

export type PlatformSettings =
  | XSettings
  | LinkedInSettings
  | InstagramSettings
  | TikTokSettings
  | { __type: string; [key: string]: unknown };

export interface PostIntegration {
  id: string;
}

export interface PostEntry {
  integration: PostIntegration;
  value: PostValue[];
  settings: PlatformSettings;
  group?: string;
}

export interface CreatePostPayload {
  type: PostType;
  date: string; // ISO 8601
  shortLink: boolean;
  tags: string[];
  posts: PostEntry[];
}

// ─── Channel / Integration ───
export interface Channel {
  id: string;
  name: string;
  identifier: string;
  type: PlatformType;
  picture?: string;
  disabled: boolean;
  profile?: string;
  customInstanceDetails?: string;
  inBetweenSteps: boolean;
  refreshNeeded: boolean;
}

// ─── Posts Response ───
export type PostStatus = "draft" | "scheduled" | "published" | "error" | "queue";

export interface ScheduledPost {
  id: string;
  content: string;
  releaseURL?: string;
  status: PostStatus;
  publishDate: string;
  integration: Channel;
  group: string;
  submittedForOrderId?: string;
  approvedSubmitForOrder?: string;
}

// ─── Analytics ───
export interface PostAnalytics {
  postId: string;
  impressions: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  reach: number;
  date: string;
}

export interface ChannelAnalytics {
  channelId: string;
  channelName: string;
  platform: PlatformType;
  totalPosts: number;
  totalImpressions: number;
  totalEngagements: number;
  engagementRate: number;
  followerCount: number;
  followerGrowth: number;
}

// ─── Team ───
export type TeamRole = "ADMIN" | "USER" | "SUPERADMIN";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  picture?: string;
  lastActive?: string;
}

export interface TeamInvite {
  email: string;
  role: TeamRole;
}

// ─── Automation ───
export type AutomationTrigger =
  | "post_published"
  | "engagement_threshold"
  | "scheduled_time"
  | "new_follower"
  | "mention";

export type AutomationAction =
  | "auto_like"
  | "auto_comment"
  | "auto_repost"
  | "send_notification"
  | "add_to_queue";

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  triggerConfig: Record<string, unknown>;
  action: AutomationAction;
  actionConfig: Record<string, unknown>;
  platforms: PlatformType[];
  createdAt: string;
}

// ─── Content Queue ───
export interface QueueSlot {
  id: string;
  dayOfWeek: number; // 0=Sun, 6=Sat
  time: string; // HH:mm
  timezone: string;
  enabled: boolean;
}

export interface ContentDraft {
  id: string;
  title: string;
  content: string;
  images: PostImage[];
  platforms: PlatformType[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ───
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Upload ───
export interface UploadResponse {
  id: string;
  path: string;
  originalName: string;
  size: number;
  mimeType: string;
}
