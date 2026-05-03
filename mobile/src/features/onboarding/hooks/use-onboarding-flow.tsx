import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { ONBOARDING_STEPS } from "../onboarding-steps";
import {
  createInitialFormData,
  type OnboardingFormData,
  type OnboardingStepId,
} from "../onboarding-types";
import { validateStep } from "../onboarding-validation";

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
  updateField: <K extends keyof OnboardingFormData>(
    key: K,
    value: OnboardingFormData[K],
  ) => void;
  setSingleSelect: (field: NullableSelectField, id: string) => void;
  toggleMultiSelect: (field: MultiSelectField, id: string) => void;
  goNext: () => void;
  goBack: () => void;
  finishOnboarding: () => void;
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

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(createInitialFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const totalSteps = ONBOARDING_STEPS.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

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
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [currentStep, currentStepIndex, formData, totalSteps]);

  const finishOnboarding = useCallback(() => {
    if (!currentStep) return;
    const { isValid, errors } = validateStep(currentStep.id, formData);
    if (!isValid) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // MVP: local state only — persist to backend later
    router.replace("/(tabs)");
  }, [currentStep, formData, router]);

  const goBack = useCallback(() => {
    if (currentStepIndex <= 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFieldErrors({});
    setCurrentStepIndex((i) => i - 1);
  }, [currentStepIndex]);

  const value = useMemo<OnboardingFlowContextValue>(
    () => ({
      currentStepIndex,
      currentStepId: currentStep?.id ?? "welcome",
      formData,
      fieldErrors,
      updateField,
      setSingleSelect,
      toggleMultiSelect,
      goNext,
      goBack,
      finishOnboarding,
      isFirstStep,
      isLastStep,
      totalSteps,
    }),
    [
      currentStep?.id,
      currentStepIndex,
      fieldErrors,
      finishOnboarding,
      formData,
      goBack,
      goNext,
      isFirstStep,
      isLastStep,
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
