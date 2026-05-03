import type { OnboardingFormData, OnboardingStepId, ValidateStepResult } from "./onboarding-types";

const USERNAME_RE = /^[a-z0-9_]+$/;

export function validateStep(
  stepId: OnboardingStepId,
  formData: OnboardingFormData,
): ValidateStepResult {
  const errors: Record<string, string> = {};

  switch (stepId) {
    case "welcome":
    case "review":
      return { isValid: true, errors: {} };

    case "primary-goal":
      if (!formData.primaryGoal) {
        errors.primaryGoal = "Choose a primary goal to continue.";
      }
      break;

    case "accountability-style":
      if (!formData.accountabilityStyle) {
        errors.accountabilityStyle = "Choose how accountability should feel.";
      }
      break;

    case "participation":
      if (formData.participationModes.length < 1) {
        errors.participationModes = "Select at least one way you want to participate.";
      }
      break;

    case "activities":
      if (formData.activityInterests.length < 1) {
        errors.activityInterests = "Pick at least one activity you are interested in.";
      }
      break;

    case "event-types":
      if (formData.preferredEventTypes.length < 1) {
        errors.preferredEventTypes = "Select at least one event format.";
      }
      break;

    case "stakes":
      if (!formData.stakePreference) {
        errors.stakePreference = "Choose a stakes preference.";
      }
      break;

    case "proof":
      if (!formData.proofPreference) {
        errors.proofPreference = "Choose how you want proof to work.";
      }
      break;

    case "social-circle":
      if (!formData.socialCirclePreference) {
        errors.socialCirclePreference = "Choose who should see your commitments.";
      }
      break;

    case "notifications":
      if (!formData.notificationPreference) {
        errors.notificationPreference = "Choose a notification level.";
      }
      break;

    case "location":
      if (!formData.locationPreference) {
        errors.locationPreference = "Choose a location preference.";
      }
      break;

    case "profile": {
      const name = formData.displayName.trim();
      const user = formData.username.trim().toLowerCase();

      if (!name) {
        errors.displayName = "Display name is required.";
      }

      if (!user) {
        errors.username = "Username is required.";
      } else if (user.length < 3) {
        errors.username = "Username must be at least 3 characters.";
      } else if (!USERNAME_RE.test(user)) {
        errors.username =
          "Use lowercase letters, numbers, and underscores only.";
      }
      break;
    }

    default:
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
