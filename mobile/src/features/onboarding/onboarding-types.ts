export type OnboardingFormData = {
  primaryGoal: string | null;
  accountabilityStyle: string | null;
  participationModes: string[];
  activityInterests: string[];
  preferredEventTypes: string[];
  stakePreference: string | null;
  proofPreference: string | null;
  socialCirclePreference: string | null;
  notificationPreference: string | null;
  locationPreference: string | null;
  displayName: string;
  username: string;
  shortBio: string;
};

export type OnboardingStepId =
  | "welcome"
  | "primary-goal"
  | "accountability-style"
  | "participation"
  | "activities"
  | "event-types"
  | "stakes"
  | "proof"
  | "social-circle"
  | "notifications"
  | "location"
  | "profile"
  | "review";

export type OnboardingStepKind =
  | "welcome"
  | "single"
  | "multi"
  | "profile"
  | "review";

export type OnboardingOption = {
  id: string;
  label: string;
  description?: string;
};

export type OnboardingStepConfig = {
  id: OnboardingStepId;
  kind: OnboardingStepKind;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Single-select bound field */
  field?: keyof OnboardingFormData;
  /** Multi-select bound field */
  multiField?: keyof Pick<
    OnboardingFormData,
    | "participationModes"
    | "activityInterests"
    | "preferredEventTypes"
  >;
  options?: OnboardingOption[];
  minSelections?: number;
};

export type ValidateStepResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

export function createInitialFormData(): OnboardingFormData {
  return {
    primaryGoal: null,
    accountabilityStyle: null,
    participationModes: [],
    activityInterests: [],
    preferredEventTypes: [],
    stakePreference: null,
    proofPreference: null,
    socialCirclePreference: null,
    notificationPreference: null,
    locationPreference: null,
    displayName: "",
    username: "",
    shortBio: "",
  };
}
