export {
  createKairoApi,
  createKairoApiFromEnv,
  getDevFallbackKairoUserId,
  resolveActingUserId,
  type KairoApi,
} from "./kairo-client";
export { postAuthBootstrap, type AuthBootstrapResponse, type AuthBootstrapProfileDto } from "./auth-api";
export {
  clearBootstrappedUserId,
  getBootstrappedUserIdSync,
  loadBootstrappedContext,
  saveBootstrappedContext,
  setBootstrappedUserIdSync,
  type StoredBootstrap,
} from "./bootstrap-user-id";
export { getApiBaseUrl, requireApiBaseUrl } from "./config";
export { getLinkedKairoUserId } from "./linked-kairo-user-id";
export {
  KairoApiConfigurationError,
  KairoApiError,
  type ApiEnvelope,
  type ApiEventPublic,
  type ApiHomeAction,
  type ApiHomeActivityItem,
  type ApiHomeEventSummary,
  type ApiHomeProofInboxItem,
  type ApiHomeStats,
  type ApiMeEventsPayload,
  type ApiLeaveTeamResult,
  type ApiMatchPublic,
  type ApiProofMediaUploadInstructions,
  type ApiProofPrompt,
  type ApiBillingPurchase,
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
  AuthBootstrapRequestInput,
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
