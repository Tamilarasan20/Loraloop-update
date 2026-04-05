/**
 * Postiz OAuth / Connect helper
 * 
 * When the self-hosted Postiz backend is running at localhost:4007,
 * clicking "Connect" on any platform will open the Postiz integrations
 * page where the user can authorize their social media accounts.
 * 
 * The Postiz backend handles the full OAuth flow for each platform.
 */

const POSTIZ_BASE_URL = process.env.NEXT_PUBLIC_POSTIZ_URL || "http://localhost:4007";

/**
 * Platform type → Postiz provider key mapping
 */
const PROVIDER_MAP: Record<string, string> = {
  x: "x",
  twitter: "x",
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
  youtube: "youtube",
  tiktok: "tiktok",
  threads: "threads",
  pinterest: "pinterest",
  reddit: "reddit",
  discord: "discord",
  slack: "slack",
  mastodon: "mastodon",
  dribbble: "dribbble",
  google_business: "google",
};

/**
 * Open the Postiz social provider connection flow.
 * This redirects to the self-hosted Postiz instance which handles OAuth.
 */
export function connectPlatform(platformType: string): void {
  const provider = PROVIDER_MAP[platformType] || platformType;
  const connectUrl = `${POSTIZ_BASE_URL}/integrations/social/${provider}`;
  window.open(connectUrl, "_blank", "width=600,height=700,popup=yes");
}

/**
 * Open the Postiz integrations settings page
 */
export function openIntegrationsSettings(): void {
  window.open(`${POSTIZ_BASE_URL}/integrations`, "_blank");
}

/**
 * Check if the Postiz backend is reachable
 */
export async function checkPostizHealth(): Promise<boolean> {
  try {
    const response = await fetch("/api/postiz/health", {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
