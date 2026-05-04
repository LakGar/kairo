import AntDesign from "@expo/vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ONBOARDING_STEPS } from "../onboarding-steps";
import { useOnboardingFlow } from "../hooks/use-onboarding-flow";
import { onboardingColors } from "../onboarding-tokens";

import { OnboardingNavigation } from "./onboarding-navigation";
import { OnboardingStepBody } from "./onboarding-step-body";
import { OnboardingStepHeroIllustration } from "./onboarding-step-hero-illustration";
import { OnboardingWelcomeDots } from "./onboarding-welcome-dots";
import { OnboardingWelcomeHero } from "./onboarding-welcome-hero";

export function OnboardingShell() {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(1)).current;
  const {
    currentStepIndex,
    goBack,
    goNext,
    finishOnboarding,
    finishSubmitting,
    finishError,
    isFirstStep,
    isLastStep,
    totalSteps,
  } = useOnboardingFlow();

  const step = useMemo(
    () => ONBOARDING_STEPS[currentStepIndex],
    [currentStepIndex],
  );

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [currentStepIndex, opacity]);

  if (!step) {
    return null;
  }

  const isProfile = step.kind === "profile";
  const isWelcome = step.kind === "welcome";
  const primaryLabel = isLastStep
    ? finishSubmitting
      ? "Saving…"
      : "Get started"
    : "Next";
  const onPrimary = isLastStep ? () => void finishOnboarding() : goNext;

  const footerPad = Math.max(insets.bottom, 20);

  const welcomeBody = (
    <>
      <View style={styles.welcomeHeader}>
        <View style={styles.headerSpacer} />
        <Text style={styles.welcomeLogo}>Kairo.</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.welcomeScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity }}>
          <OnboardingWelcomeHero />
          <Text style={styles.welcomeTitle}>{step.title}</Text>
          <Text style={styles.welcomeSubtitle}>{step.subtitle}</Text>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPad }]}>
        <OnboardingWelcomeDots
          currentIndex={currentStepIndex}
          total={totalSteps}
        />
        {isLastStep && finishError ? (
          <Text style={styles.finishError}>{finishError}</Text>
        ) : null}
        <OnboardingNavigation
          primaryLabel={primaryLabel}
          onPrimary={onPrimary}
          primaryDisabled={isLastStep && finishSubmitting}
        />
      </View>
    </>
  );

  const defaultBody = (
    <>
      <View style={styles.header}>
        {!isFirstStep ? (
          <Pressable
            onPress={goBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backIcon,
              pressed && styles.backIconPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AntDesign
              name="left"
              size={20}
              color={onboardingColors.textPrimary}
            />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={styles.logo}>Kairo.</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity }}>
          {step.heroIllustration ? (
            <View style={styles.heroSlot}>
              <OnboardingStepHeroIllustration variant={step.heroIllustration} />
            </View>
          ) : null}
          {step.kind !== "info" ? (
            <Text style={styles.stepEyebrow}>{step.eyebrow}</Text>
          ) : null}
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          {step.kind !== "info" ? (
            <View style={styles.stepBody}>
              <OnboardingStepBody step={step} />
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPad }]}>
        <OnboardingWelcomeDots
          currentIndex={currentStepIndex}
          total={totalSteps}
        />
        {isLastStep && finishError ? (
          <Text style={styles.finishError}>{finishError}</Text>
        ) : null}
        <OnboardingNavigation
          primaryLabel={primaryLabel}
          onPrimary={onPrimary}
          primaryDisabled={isLastStep && finishSubmitting}
          secondaryHint={
            isLastStep
              ? "You can change preferences anytime in settings."
              : undefined
          }
        />
      </View>
    </>
  );

  const body = isWelcome ? welcomeBody : defaultBody;

  return (
    <View style={styles.screenRoot}>
      <LinearGradient
        colors={[onboardingColors.gradientTop, onboardingColors.gradientBottom]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <StatusBar style="dark" />
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        {isProfile ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={8}
          >
            {body}
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.flex}>{body}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: onboardingColors.gradientBottom,
  },
  flex: {
    flex: 1,
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  welcomeLogo: {
    flex: 1,
    textAlign: "center",
    color: onboardingColors.textPrimary,
    fontSize: 24,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.7,
  },
  welcomeScrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    flexGrow: 1,
  },
  welcomeTitle: {
    color: onboardingColors.textPrimary,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.2,
    marginTop: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    color: onboardingColors.textSecondary,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: "Inter_400Regular",
    marginTop: 14,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerSpacer: {
    width: 40,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: onboardingColors.surface,
    borderWidth: 1,
    borderColor: onboardingColors.hairline,
  },
  backIconPressed: {
    opacity: 0.88,
  },
  logo: {
    flex: 1,
    color: onboardingColors.textPrimary,
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 28,
    flexGrow: 1,
  },
  heroSlot: {
    marginBottom: 4,
  },
  /** Shared with welcome / follow: calm, centered headline stack. */
  stepEyebrow: {
    textAlign: "center",
    color: onboardingColors.textMuted,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.85,
    marginBottom: 10,
  },
  stepTitle: {
    textAlign: "center",
    color: onboardingColors.textPrimary,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.2,
    marginBottom: 12,
  },
  stepSubtitle: {
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 340,
    color: onboardingColors.textSecondary,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: "Inter_400Regular",
    marginBottom: 22,
  },
  stepBody: {
    flex: 1,
    marginTop: 2,
  },
  finishError: {
    textAlign: "center",
    color: onboardingColors.danger,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 6,
    backgroundColor: "transparent",
  },
});
