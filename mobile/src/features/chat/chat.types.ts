export type ChatCategory =
  | "all"
  | "events"
  | "teams"
  | "proof"
  | "dms"
  | "announcements";

export type ChatThread = {
  id: string;
  title: string;
  category: Exclude<ChatCategory, "all">;
  lastMessage: string;
  time: string;
  unreadCount: number;
  /** TODO: replace mock remote URLs with CDN / event covers / profile photos */
  avatarUrl?: string;
  eventLabel?: string;
  /** Active / online indicator (DMs); uses success token sparingly */
  isOnline?: boolean;
};
