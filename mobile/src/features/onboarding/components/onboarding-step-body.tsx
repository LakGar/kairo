import { StyleSheet, Text, View } from "react-native";

import {
  type NullableSelectField,
  useOnboardingFlow,
} from "../hooks/use-onboarding-flow";
import { getOptionLabel, ONBOARDING_STEPS } from "../onboarding-steps";
import type { OnboardingStepConfig } from "../onboarding-types";

import { OnboardingOptionCard } from "./onboarding-option-card";
import { OnboardingReviewCard } from "./onboarding-review-card";
import { OnboardingTextInput } from "./onboarding-text-input";
import { onboardingColors } from "../onboarding-tokens";

function stepErrorMessage(
  step: OnboardingStepConfig,
  fieldErrors: Record<string, string>,
): string | undefined {
  if (step.field && fieldErrors[step.field as string]) {
    return fieldErrors[step.field as string];
  }
  if (step.multiField && fieldErrors[step.multiField]) {
    return fieldErrors[step.multiField];
  }
  if (step.kind === "profile") {
    return (
      fieldErrors.displayName ||
      fieldErrors.username ||
      fieldErrors.shortBio
    );
  }
  return undefined;
}

function formatIds(
  step: OnboardingStepConfig | undefined,
  ids: string[],
): string {
  if (!step?.options?.length || ids.length === 0) return "—";
  return ids.map((id) => getOptionLabel(step, id)).join(", ");
}

export function OnboardingStepBody({ step }: { step: OnboardingStepConfig }) {
  const {
    formData,
    fieldErrors,
    setSingleSelect,
    toggleMultiSelect,
    updateField,
  } = useOnboardingFlow();

  const bannerError = stepErrorMessage(step, fieldErrors);

  if (step.kind === "welcome") {
    return null;
  }

  if (step.kind === "single" && step.field && step.options) {
    const field = step.field as NullableSelectField;
    const selected = formData[field] as string | null;
    return (
      <View style={styles.options}>
        {step.options.map((opt) => (
          <OnboardingOptionCard
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={selected === opt.id}
            onPress={() => setSingleSelect(field, opt.id)}
          />
        ))}
        {bannerError ? (
          <Text style={styles.bannerError}>{bannerError}</Text>
        ) : null}
      </View>
    );
  }

  if (step.kind === "multi" && step.multiField && step.options) {
    const field = step.multiField;
    const selected = formData[field];
    return (
      <View style={styles.options}>
        {step.options.map((opt) => (
          <OnboardingOptionCard
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={selected.includes(opt.id)}
            onPress={() => toggleMultiSelect(field, opt.id)}
          />
        ))}
        {bannerError ? (
          <Text style={styles.bannerError}>{bannerError}</Text>
        ) : null}
      </View>
    );
  }

  if (step.kind === "profile") {
    return (
      <View style={styles.profile}>
        <OnboardingTextInput
          label="Display name"
          value={formData.displayName}
          onChangeText={(t) => updateField("displayName", t)}
          placeholder="How should people greet you?"
          error={fieldErrors.displayName}
        />
        <OnboardingTextInput
          label="Username"
          value={formData.username}
          onChangeText={(t) =>
            updateField("username", t.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          placeholder="your_handle"
          autoCapitalize="none"
          keyboardType="ascii-capable"
          error={fieldErrors.username}
        />
        <OnboardingTextInput
          label="Short bio (optional)"
          value={formData.shortBio}
          onChangeText={(t) => updateField("shortBio", t)}
          placeholder="One line about what you are chasing."
          multiline
        />
      </View>
    );
  }

  if (step.kind === "review") {
    const primary = ONBOARDING_STEPS.find((s) => s.id === "primary-goal");
    const accountability = ONBOARDING_STEPS.find(
      (s) => s.id === "accountability-style",
    );
    const participation = ONBOARDING_STEPS.find((s) => s.id === "participation");
    const activities = ONBOARDING_STEPS.find((s) => s.id === "activities");
    const events = ONBOARDING_STEPS.find((s) => s.id === "event-types");
    const stakes = ONBOARDING_STEPS.find((s) => s.id === "stakes");
    const proof = ONBOARDING_STEPS.find((s) => s.id === "proof");
    const social = ONBOARDING_STEPS.find((s) => s.id === "social-circle");
    const notifications = ONBOARDING_STEPS.find((s) => s.id === "notifications");
    const location = ONBOARDING_STEPS.find((s) => s.id === "location");

    return (
      <View style={styles.review}>
        <OnboardingReviewCard
          title="Primary goal"
          body={
            formData.primaryGoal && primary
              ? getOptionLabel(primary, formData.primaryGoal)
              : "—"
          }
        />
        <OnboardingReviewCard
          title="Accountability"
          body={
            formData.accountabilityStyle && accountability
              ? getOptionLabel(accountability, formData.accountabilityStyle)
              : "—"
          }
        />
        <OnboardingReviewCard
          title="Participation"
          body={formatIds(participation, formData.participationModes)}
        />
        <OnboardingReviewCard
          title="Activities"
          body={formatIds(activities, formData.activityInterests)}
        />
        <OnboardingReviewCard
          title="Event formats"
          body={formatIds(events, formData.preferredEventTypes)}
        />
        <OnboardingReviewCard
          title="Stakes"
          body={
            formData.stakePreference && stakes
              ? getOptionLabel(stakes, formData.stakePreference)
              : "—"
          }
        />
        <OnboardingReviewCard
          title="Proof"
          body={
            formData.proofPreference && proof
              ? getOptionLabel(proof, formData.proofPreference)
              : "—"
          }
        />
        <OnboardingReviewCard
          title="Social visibility"
          body={
            formData.socialCirclePreference && social
              ? getOptionLabel(social, formData.socialCirclePreference)
              : "—"
          }
        />
        <OnboardingReviewCard
          title="Notifications"
          body={
            formData.notificationPreference && notifications
              ? getOptionLabel(notifications, formData.notificationPreference)
              : "—"
          }
        />
        <OnboardingReviewCard
          title="Location"
          body={
            formData.locationPreference && location
              ? getOptionLabel(location, formData.locationPreference)
              : "—"
          }
        />
        <OnboardingReviewCard
          title="Profile"
          body={`${formData.displayName.trim()} · @${formData.username.trim()}${
            formData.shortBio.trim()
              ? `\n\n${formData.shortBio.trim()}`
              : ""
          }`}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  options: {
    gap: 12,
  },
  profile: {
    gap: 18,
  },
  review: {
    gap: 12,
  },
  bannerError: {
    marginTop: 4,
    color: onboardingColors.danger,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
});
