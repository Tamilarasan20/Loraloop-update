// ─── Postiz API Client ───
// Wraps all Postiz Public API calls via the local Next.js proxy at /api/postiz/*

import type {
  CreatePostPayload,
  Channel,
  ScheduledPost,
  PostAnalytics,
  ChannelAnalytics,
  UploadResponse,
  TeamMember,
  TeamInvite,
  AutomationRule,
  ContentDraft,
  QueueSlot,
  PaginatedResponse,
} from "./postiz-types";

const API_BASE = "/api/postiz"; // Proxied through Next.js API route

// ─── Helpers ───

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Unknown error");
    throw new PostizApiError(res.status, errorBody, endpoint);
  }

  // Handle 204 No Content
  if (res.status === 204) return {} as T;

  return res.json();
}

export class PostizApiError extends Error {
  constructor(
    public status: number,
    public body: string,
    public endpoint: string
  ) {
    super(`Postiz API error ${status} on ${endpoint}: ${body}`);
    this.name = "PostizApiError";
  }
}

// ─── Posts ───

export async function createPost(payload: CreatePostPayload): Promise<{ id: string }> {
  return request("/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPosts(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ScheduledPost>> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return request(`/posts${qs ? `?${qs}` : ""}`);
}

export async function getPostById(postId: string): Promise<ScheduledPost> {
  return request(`/posts/${postId}`);
}

export async function updatePost(
  postId: string,
  payload: Partial<CreatePostPayload>
): Promise<ScheduledPost> {
  return request(`/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePost(postId: string): Promise<void> {
  return request(`/posts/${postId}`, { method: "DELETE" });
}

// ─── Channels / Integrations ───

export async function getChannels(): Promise<Channel[]> {
  return request("/channels");
}

export async function getChannelById(channelId: string): Promise<Channel> {
  return request(`/channels/${channelId}`);
}

// ─── Media Upload ───

export async function uploadMedia(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — browser sets multipart boundary automatically
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "Upload failed");
    throw new PostizApiError(res.status, errorBody, "/upload");
  }

  return res.json();
}

// ─── Analytics ───

export async function getPostAnalytics(postId: string): Promise<PostAnalytics> {
  return request(`/analytics/posts/${postId}`);
}

export async function getChannelAnalytics(
  channelId: string,
  params?: { from?: string; to?: string }
): Promise<ChannelAnalytics> {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  const qs = query.toString();
  return request(`/analytics/channels/${channelId}${qs ? `?${qs}` : ""}`);
}

export async function getOverviewAnalytics(params?: {
  from?: string;
  to?: string;
}): Promise<ChannelAnalytics[]> {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  const qs = query.toString();
  return request(`/analytics/overview${qs ? `?${qs}` : ""}`);
}

// ─── Team ───

export async function getTeamMembers(): Promise<TeamMember[]> {
  return request("/team/members");
}

export async function inviteTeamMember(invite: TeamInvite): Promise<{ id: string }> {
  return request("/team/invite", {
    method: "POST",
    body: JSON.stringify(invite),
  });
}

export async function updateTeamMemberRole(
  memberId: string,
  role: TeamInvite["role"]
): Promise<TeamMember> {
  return request(`/team/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function removeTeamMember(memberId: string): Promise<void> {
  return request(`/team/members/${memberId}`, { method: "DELETE" });
}

// ─── Automation ───

export async function getAutomationRules(): Promise<AutomationRule[]> {
  return request("/automation/rules");
}

export async function createAutomationRule(
  rule: Omit<AutomationRule, "id" | "createdAt">
): Promise<AutomationRule> {
  return request("/automation/rules", {
    method: "POST",
    body: JSON.stringify(rule),
  });
}

export async function updateAutomationRule(
  ruleId: string,
  updates: Partial<AutomationRule>
): Promise<AutomationRule> {
  return request(`/automation/rules/${ruleId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteAutomationRule(ruleId: string): Promise<void> {
  return request(`/automation/rules/${ruleId}`, { method: "DELETE" });
}

// ─── Content Queue ───

export async function getQueueSlots(): Promise<QueueSlot[]> {
  return request("/queue/slots");
}

export async function updateQueueSlots(slots: QueueSlot[]): Promise<QueueSlot[]> {
  return request("/queue/slots", {
    method: "PUT",
    body: JSON.stringify({ slots }),
  });
}

// ─── Drafts ───

export async function getDrafts(): Promise<ContentDraft[]> {
  return request("/drafts");
}

export async function createDraft(
  draft: Omit<ContentDraft, "id" | "createdAt" | "updatedAt">
): Promise<ContentDraft> {
  return request("/drafts", {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function updateDraft(
  draftId: string,
  updates: Partial<ContentDraft>
): Promise<ContentDraft> {
  return request(`/drafts/${draftId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteDraft(draftId: string): Promise<void> {
  return request(`/drafts/${draftId}`, { method: "DELETE" });
}

// ─── Re-export types for convenience ───
export type {
  CreatePostPayload,
  Channel,
  ScheduledPost,
  PostAnalytics,
  ChannelAnalytics,
  UploadResponse,
  TeamMember,
  AutomationRule,
  ContentDraft,
  QueueSlot,
  PlatformType,
  PostStatus,
} from "./postiz-types";
