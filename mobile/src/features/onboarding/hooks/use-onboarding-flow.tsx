import type { ProfileOnboardingCompleteRequestInput } from "@kairo/shared";
import * as Haptics from "expo-haptics";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { createKairoApiFromEnv } from "@/src/api";
import { KairoApiError } from "@/src/api/types";

import { ONBOARDING_STEPS } from "../onboarding-steps";
import {
  createInitialFormData,
  type OnboardingFormData,
  type OnboardingStepId,
} from "../onboarding-types";
import { validateStep } from "../onboarding-validation";

const PROFILE_STEP_ID: OnboardingStepId = "profile";

export type MultiSelectField =
  | "participationModes"
  | "activityInterests"
  | "preferredEventTypes";

export type NullableSelectField =
  | "primaryGoal"
  | "accountabilityStyle"
  | "stakePreference"
  | "proofPreference"
  | "socialCirclePreference"
  | "notificationPreference"
  | "locationPreference";

type OnboardingFlowContextValue = {
  currentStepIndex: number;
  currentStepId: OnboardingStepId;
  formData: OnboardingFormData;
  fieldErrors: Record<string, string>;
  finishSubmitting: boolean;
  finishError: string | null;
  updateField: <K extends keyof OnboardingFormData>(
    key: K,
    value: OnboardingFormData[K],
  ) => void;
  setSingleSelect: (field: NullableSelectField, id: string) => void;
  toggleMultiSelect: (field: MultiSelectField, id: string) => void;
  goNext: () => void;
  goBack: () => void;
  finishOnboarding: () => Promise<void>;
  jumpToStepId: (id: OnboardingStepId) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
};

const OnboardingFlowContext = createContext<OnboardingFlowContextValue | null>(
  null,
);

function clearFieldError(
  setter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  key: string,
) {
  setter((prev) => {
    if (!(key in prev)) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
}

function buildOnboardingPayload(formData: OnboardingFormData): ProfileOnboardingCompleteRequestInput {
  return {
    displayName: formData.displayName.trim(),
    username: formData.username.trim(),
    shortBio: formData.shortBio.trim(),
    primaryGoal: formData.primaryGoal,
    accountabilityStyle: formData.accountabilityStyle,
    participationModes: formData.participationModes,
    activityInterests: formData.activityInterests,
    preferredEventTypes: formData.preferredEventTypes,
    stakePreference: formData.stakePreference,
    proofPreference: formData.proofPreference,
    socialCirclePreference: formData.socialCirclePreference,
    notificationPreference: formData.notificationPreference,
    locationPreference: formData.locationPreference,
  };
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(createInitialFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [finishSubmitting, setFinishSubmitting] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const totalSteps = ONBOARDING_STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const jumpToStepId = useCallback((id: OnboardingStepId) => {
    const i = ONBOARDING_STEPS.findIndex((s) => s.id === id);
    if (i >= 0) {
      setCurrentStepIndex(i);
      setFieldErrors({});
      setFinishError(null);
    }
  }, []);

  const updateField = useCallback(
    <K extends keyof OnboardingFormData>(key: K, value: OnboardingFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      clearFieldError(setFieldErrors, key as string);
    },
    [],
  );

  const setSingleSelect = useCallback((field: NullableSelectField, id: string) => {
    setFormData((prev) => ({ ...prev, [field]: id }));
    clearFieldError(setFieldErrors, field);
  }, []);

  const toggleMultiSelect = useCallback((field: MultiSelectField, id: string) => {
    setFormData((prev) => {
      const current = prev[field];
      const has = current.includes(id);
      const next = has ? current.filter((x) => x !== id) : [...current, id];
      return { ...prev, [field]: next };
    });
    clearFieldError(setFieldErrors, field);
  }, []);

  const goNext = useCallback(() => {
    if (!currentStep) return;
    const { isValid, errors } = validateStep(currentStep.id, formData);
    if (!isValid) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFinishError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [currentStep, currentStepIndex, formData, totalSteps]);

  const finishOnboarding = useCallback(async () => {
    if (!currentStep) return;
    const { isValid, errors } = validateStep(currentStep.id, formData);
    if (!isValid) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFinishError(null);
    setFinishSubmitting(true);
    try {
      const api = createKairoApiFromEnv();
      await api.completeOnboarding(buildOnboardingPayload(formData));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/(home)/dashboard" as Href);
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof KairoApiError ? e.message : "Could not save. Try again.";
      setFinishError(msg);
      if (e instanceof KairoApiError && e.code === "USERNAME_CONFLICT") {
        setFieldErrors((prev) => ({
          ...prev,
          username: msg,
        }));
        jumpToStepId(PROFILE_STEP_ID);
      }
    } finally {
      setFinishSubmitting(false);
    }
  }, [currentStep, formData, jumpToStepId, router]);

  const goBack = useCallback(() => {
    if (currentStepIndex <= 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFieldErrors({});
    setFinishError(null);
    setCurrentStepIndex((i) => i - 1);
  }, [currentStepIndex]);

  const value = useMemo<OnboardingFlowContextValue>(
    () => ({
      currentStepIndex,
      currentStepId: currentStep?.id ?? "welcome",
      formData,
      fieldErrors,
      finishSubmitting,
      finishError,
      updateField,
      setSingleSelect,
      toggleMultiSelect,
      goNext,
      goBack,
      finishOnboarding,
      jumpToStepId,
      isFirstStep,
      isLastStep,
      totalSteps,
    }),
    [
      currentStep?.id,
      currentStepIndex,
      fieldErrors,
      finishError,
      finishOnboarding,
      finishSubmitting,
      formData,
      goBack,
      goNext,
      isFirstStep,
      isLastStep,
      jumpToStepId,
      setSingleSelect,
      toggleMultiSelect,
      totalSteps,
      updateField,
    ],
  );

  return (
    <OnboardingFlowContext.Provider value={value}>
      {children}
    </OnboardingFlowContext.Provider>
  );
}

export function useOnboardingFlow(): OnboardingFlowContextValue {
  const ctx = useContext(OnboardingFlowContext);
  if (!ctx) {
    throw new Error("useOnboardingFlow must be used within OnboardingProvider");
  }
  return ctx;
}
