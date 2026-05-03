import type { ChatThread } from "@/src/features/chat/chat.types";

/**
 * TODO: replace mock remote avatars with CDN / event covers / profile photos.
 * Placeholders are Unsplash URLs for local UI only.
 */
export const MOCK_CHAT_THREADS: ChatThread[] = [
  {
    id: "thread-pickleball",
    title: "Kairo Pickleball Night",
    category: "events",
    lastMessage: "Match 2 starts in 10. Captains check in.",
    time: "6:20 PM",
    unreadCount: 3,
    eventLabel: "Tonight",
    avatarUrl:
      "https://images.unsplash.com/photo-1622163642999-2023e6f4c05f?w=200&h=200&fit=crop&q=80",
  },
  {
    id: "thread-team-alpha",
    title: "Team Alpha",
    category: "teams",
    lastMessage: "Who's submitting the final score?",
    time: "5:58 PM",
    unreadCount: 1,
    eventLabel: "League",
    avatarUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop&q=80",
  },
  {
    id: "thread-maya-proof",
    title: "Maya Proof Review",
    category: "proof",
    lastMessage: "Can you verify this run proof?",
    time: "4:12 PM",
    unreadCount: 2,
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80",
  },
  {
    id: "thread-founder-run",
    title: "Founder Basketball Run",
    category: "events",
    lastMessage: "Court confirmed for Thursday.",
    time: "Yesterday",
    unreadCount: 0,
    eventLabel: "Thu pickup",
    avatarUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop&q=80",
  },
  {
    id: "thread-alex-dm",
    title: "Alex Chen",
    category: "dms",
    lastMessage: "I'm down for the next run.",
    time: "Yesterday",
    unreadCount: 0,
    isOnline: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
  },
  {
    id: "thread-organizer",
    title: "Organizer Updates",
    category: "announcements",
    lastMessage: "Please arrive 15 minutes early.",
    time: "Mon",
    unreadCount: 1,
    avatarUrl:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200&h=200&fit=crop&q=80",
  },
];

export const MOCK_PROOF_PRIORITY = {
  headline: "2 proof threads need review",
  lines: ["Maya's run proof", "Team Alpha score confirmation"] as const,
};
