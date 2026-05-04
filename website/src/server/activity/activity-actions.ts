/**
 * Stable `ActivityLog.action` strings — keep in sync with services and seeds.
 * Neutral language only (no wagering/gambling framing in product copy).
 */
export const ActivityAction = {
  EVENT_CREATED: "EVENT_CREATED",
  EVENT_UPDATED: "EVENT_UPDATED",
  EVENT_PUBLISHED: "EVENT_PUBLISHED",
  EVENT_CANCELLED: "EVENT_CANCELLED",
  EVENT_JOINED: "EVENT_JOINED",
  TEAM_CREATED: "TEAM_CREATED",
  TEAM_JOINED: "TEAM_JOINED",
  TEAM_LEFT: "TEAM_LEFT",
  MATCH_CREATED: "MATCH_CREATED",
  MATCH_SCORE_UPDATED: "MATCH_SCORE_UPDATED",
  MATCH_WINNER_MARKED: "MATCH_WINNER_MARKED",
  /** Official match result confirmed (organizer-decides or post-dispute); orthogonal to proof review. */
  MATCH_RESULT_CONFIRMED: "MATCH_RESULT_CONFIRMED",
  PROOF_PROMPT_CREATED: "PROOF_PROMPT_CREATED",
  PROOF_SUBMITTED: "PROOF_SUBMITTED",
  PROOF_APPROVED: "PROOF_APPROVED",
  PROOF_REJECTED: "PROOF_REJECTED",
  STAKE_CREATED: "STAKE_CREATED",
  STAKE_COMPLETED: "STAKE_COMPLETED",
  STAKE_FAILED: "STAKE_FAILED",
} as const;

export type ActivityActionType =
  (typeof ActivityAction)[keyof typeof ActivityAction];
