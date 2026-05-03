import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, StyleSheet, Text, View } from "react-native";

import { onboardingColors } from "../onboarding-tokens";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W * 0.86, 340);
const CARD_H = 120;

function CardFace({ variant }: { variant: "back" | "mid" | "front" }) {
  const lines =
    variant === "front" ? 3 : variant === "mid" ? 4 : 3;
  return (
    <View style={styles.cardFaceRoot}>
      <View style={styles.cardInner}>
        {Array.from({ length: lines }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.fakeLine,
              { width: variant === "front" && i === 0 ? "72%" : "88%" },
            ]}
          />
        ))}
      </View>
      {variant === "front" ? (
        <View style={styles.pill}>
          <Text style={styles.pillText}>Proof-first</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Stacked “listing cards” hero for the welcome step (dark UI, reference-style depth).
 */
export function OnboardingWelcomeHero() {
  return (
    <View style={styles.wrap} accessibilityLabel="Illustration of stacked event cards">
      <View
        style={[
          styles.card,
          styles.cardBack,
          { width: CARD_W, height: CARD_H, transform: [{ rotate: "5deg" }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0.02)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <CardFace variant="back" />
      </View>
      <View
        style={[
          styles.card,
          styles.cardMid,
          { width: CARD_W, height: CARD_H, transform: [{ rotate: "-4deg" }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.03)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <CardFace variant="mid" />
      </View>
      <View
        style={[
          styles.card,
          styles.cardFront,
          { width: CARD_W, height: CARD_H, transform: [{ rotate: "-2deg" }] },
        ]}
      >
        <LinearGradient
          colors={["rgba(248,250,252,0.14)", "rgba(148,163,184,0.08)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <CardFace variant="front" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: 268,
    marginTop: 8,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  card: {
    position: "absolute",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    backgroundColor: onboardingColors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBack: {
    bottom: 6,
    zIndex: 1,
  },
  cardMid: {
    bottom: 44,
    zIndex: 2,
  },
  cardFront: {
    bottom: 86,
    zIndex: 3,
  },
  cardFaceRoot: {
    flex: 1,
  },
  cardInner: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    gap: 10,
  },
  fakeLine: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  pill: {
    position: "absolute",
    right: 14,
    bottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#0B0F14",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pillText: {
    color: onboardingColors.textPrimary,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
});
