import AntDesign from "@expo/vector-icons/AntDesign";
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
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingStepBody } from "./onboarding-step-body";
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
  const primaryLabel = isLastStep ? "Finish setup" : "Next";
  const onPrimary = isLastStep ? finishOnboarding : goNext;

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
          <OnboardingWelcomeDots currentIndex={currentStepIndex} total={totalSteps} />
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          styles.footerWelcome,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <OnboardingNavigation
          primaryLabel={primaryLabel}
          onPrimary={onPrimary}
          primaryVisual="gradientPill"
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
      </View>
      <OnboardingProgress currentIndex={currentStepIndex} total={totalSteps} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity }}>
          <Text style={styles.eyebrow}>{step.eyebrow}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <View style={styles.stepBody}>
            <OnboardingStepBody step={step} />
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <OnboardingNavigation
          primaryLabel={primaryLabel}
          onPrimary={onPrimary}
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: onboardingColors.background,
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
    fontSize: 32,
    lineHeight: 40,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.4,
    marginTop: 4,
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
  footerWelcome: {
    borderTopWidth: 0,
    paddingTop: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 60,
    gap: 8,
  },
  headerSpacer: {
    width: 36,
  },
  backIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: onboardingColors.surface,
  },
  backIconPressed: {
    opacity: 0.85,
  },
  logo: {
    flex: 1,
    color: onboardingColors.textPrimary,
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.6,
    textAlign: "center",
    position: "absolute",
    left: 20,
    top: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  eyebrow: {
    color: onboardingColors.accent,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: onboardingColors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.2,
    marginBottom: 12,
  },
  subtitle: {
    color: onboardingColors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },
  stepBody: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: onboardingColors.background,
  },
});
