export {
  createKairoApi,
  createKairoApiFromEnv,
  type KairoApi,
} from "./kairo-client";
export { getApiBaseUrl, getDevUserId, requireApiBaseUrl } from "./config";
export {
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEnvelope,
  type ApiEventPublic,
  type ApiMyEventsPayload,
  type ApiLeaveTeamResult,
  type ApiMatchPublic,
  type ApiProofPrompt,
  type ApiProofReviewResult,
  type ApiProofSubmission,
  type ApiStake,
  type ApiTeamCore,
  type ApiTeamMember,
  type ApiTeamPublic,
  type ApiUserSnippet,
  type JsonDateString,
} from "./types";

export type {
  CreateEventInput,
  CreateManualMatchInput,
  CreateProofPromptInput,
  CreateStakeInput,
  CreateTeamInput,
  JoinEventInput,
  JoinTeamInput,
  MarkMatchWinnerInput,
  SubmitProofInput,
  UpdateEventInput,
  UpdateMatchScoreInput,
} from "@kairo/shared";
