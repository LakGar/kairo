import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useFonts,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import { isClerkAPIResponseError, useAuth } from "@clerk/expo";
import { useSignIn } from "@clerk/expo/legacy";

type FormErrors = {
  email?: string;
  password?: string;
  code?: string;
  general?: string;
};

type FactorLike = {
  strategy: string;
  emailAddressId?: string;
  phoneNumberId?: string;
};

type PickedSecondFactor =
  | { strategy: "email_code"; emailAddressId: string }
  | { strategy: "phone_code"; phoneNumberId: string }
  | { strategy: "totp"; hasBackupOption: boolean }
  | { strategy: "backup_code" };

function pickSecondFactor(
  factors: FactorLike[] | null | undefined,
): PickedSecondFactor | null {
  const list = factors ?? [];
  const email = list.find(
    (f) => f.strategy === "email_code" && f.emailAddressId,
  );
  if (email?.emailAddressId) {
    return { strategy: "email_code", emailAddressId: email.emailAddressId };
  }
  const phone = list.find(
    (f) => f.strategy === "phone_code" && f.phoneNumberId,
  );
  if (phone?.phoneNumberId) {
    return { strategy: "phone_code", phoneNumberId: phone.phoneNumberId };
  }
  if (list.some((f) => f.strategy === "totp")) {
    const hasBackupOption = list.some((f) => f.strategy === "backup_code");
    return { strategy: "totp", hasBackupOption };
  }
  if (list.some((f) => f.strategy === "backup_code")) {
    return { strategy: "backup_code" };
  }
  return null;
}

const SignIn = () => {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondFactor, setSecondFactor] = useState<PickedSecondFactor | null>(
    null,
  );
  const [secondFactorCode, setSecondFactorCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const activateSession = async (sessionId: string | null) => {
    if (!sessionId || !setActive) return;
    await setActive({ session: sessionId });
    router.replace("/(tabs)");
  };

  const beginSecondFactor = async (picked: PickedSecondFactor) => {
    if (!signIn) return;
    if (picked.strategy === "email_code") {
      await signIn.prepareSecondFactor({
        strategy: "email_code",
        emailAddressId: picked.emailAddressId,
      });
    } else if (picked.strategy === "phone_code") {
      await signIn.prepareSecondFactor({
        strategy: "phone_code",
        phoneNumberId: picked.phoneNumberId,
      });
    }
    setSecondFactor(picked);
    setSecondFactorCode("");
    setUseBackupCode(false);
  };

  const handleSignIn = async () => {
    setErrors({});
    setSecondFactor(null);
    setSecondFactorCode("");
    setUseBackupCode(false);

    if (!validateForm()) return;
    if (!signInLoaded || !signIn) {
      setErrors({ general: "Authentication is not ready yet. Try again." });
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await activateSession(result.createdSessionId);
        return;
      }

      const needsExtraStep =
        result.status === "needs_second_factor" ||
        result.status === "needs_client_trust";

      if (needsExtraStep) {
        const factors =
          result.supportedSecondFactors ?? signIn.supportedSecondFactors;
        const picked = pickSecondFactor(factors as FactorLike[]);
        if (!picked) {
          setErrors({
            general:
              "This account needs an extra sign-in step (for example MFA) that this screen cannot run yet. Change strategies in Clerk or use the Clerk Account Portal.",
          });
          return;
        }
        await beginSecondFactor(picked);
        return;
      }

      if (result.status === "needs_new_password") {
        setErrors({
          general:
            "You must update your password before signing in. Reset your password from Clerk’s account page or your team’s web app.",
        });
        return;
      }

      if (result.status === "needs_first_factor") {
        setErrors({
          general:
            "Additional sign-in verification is required. Try another identifier or contact support.",
        });
        return;
      }

      setErrors({
        general: `Sign-in could not finish (status: ${result.status ?? "unknown"}). Try again or use another sign-in method.`,
      });
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const msg = err.errors[0]?.message;
        setErrors({
          general: msg ?? "Could not sign you in. Check your email and password.",
        });
      } else {
        setErrors({
          general: "Could not sign you in. Check your email and password.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendSecondFactor = async () => {
    if (!signInLoaded || !signIn || !secondFactor) return;
    if (secondFactor.strategy !== "email_code" && secondFactor.strategy !== "phone_code") {
      return;
    }
    setErrors({});
    try {
      setIsSubmitting(true);
      if (secondFactor.strategy === "email_code") {
        await signIn.prepareSecondFactor({
          strategy: "email_code",
          emailAddressId: secondFactor.emailAddressId,
        });
      } else {
        await signIn.prepareSecondFactor({
          strategy: "phone_code",
          phoneNumberId: secondFactor.phoneNumberId,
        });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        setErrors({ general: err.errors[0]?.message ?? "Could not resend code." });
      } else {
        setErrors({ general: "Could not resend code." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecondFactorSubmit = async () => {
    setErrors({});
    const trimmed = secondFactorCode.trim();
    if (!trimmed) {
      setErrors({ code: "Enter the verification code." });
      return;
    }
    if (!signInLoaded || !signIn || !secondFactor) return;

    const attemptStrategy =
      secondFactor.strategy === "totp" && useBackupCode
        ? "backup_code"
        : secondFactor.strategy === "backup_code"
          ? "backup_code"
          : secondFactor.strategy;

    try {
      setIsSubmitting(true);
      const attempt = await signIn.attemptSecondFactor({
        strategy: attemptStrategy,
        code: trimmed,
      });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        setSecondFactor(null);
        await activateSession(attempt.createdSessionId);
        return;
      }

      await signIn.reload();
      if (signIn.status === "complete" && signIn.createdSessionId) {
        setSecondFactor(null);
        await activateSession(signIn.createdSessionId);
        return;
      }

      setErrors({
        general: "That code did not work. Try again or request a new code.",
      });
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const msg = err.errors[0]?.message;
        setErrors({
          general: msg ?? "Invalid code. Try again.",
        });
      } else {
        setErrors({ general: "Invalid code. Try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSecondFactor = () => {
    setSecondFactor(null);
    setSecondFactorCode("");
    setUseBackupCode(false);
    setErrors({});
  };

  if (authLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  if (!fontsLoaded || !signInLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#FF6A2A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/auth-bg.jpeg")}
            style={styles.image}
            resizeMode="cover"
          />

          <LinearGradient
            colors={[
              "rgba(0,0,0,0.2)",
              "rgba(0,0,0,0.55)",
              "rgba(11,15,20,0.98)",
            ]}
            locations={[0, 0.45, 1]}
            style={styles.gradient}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <AntDesign name="left" size={18} color="#F8FAFC" />
            </Pressable>

            <Text style={styles.logo}>Kairo.</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>
                {secondFactor ? "Extra verification" : "Welcome back"}
              </Text>

              <Text style={styles.title}>
                {secondFactor ? "CHECK YOUR INBOX OR APP." : "SIGN IN TO KAIRO."}
              </Text>

              <Text style={styles.subTitle}>
                {secondFactor
                  ? secondFactor.strategy === "email_code"
                    ? "We sent a code to your email. Enter it to finish signing in on this device."
                    : secondFactor.strategy === "phone_code"
                      ? "We sent a code by SMS. Enter it to finish signing in."
                      : secondFactor.strategy === "backup_code" ||
                          (secondFactor.strategy === "totp" && useBackupCode)
                        ? "Enter one of your backup codes."
                        : "Enter the 6-digit code from your authenticator app."
                  : "Check your commitments, submit proof, and keep your circle updated."}
              </Text>

              {errors.general ? (
                <View style={styles.generalErrorBox}>
                  <Text style={styles.generalErrorText}>{errors.general}</Text>
                </View>
              ) : null}

              {secondFactor ? (
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      {secondFactor.strategy === "backup_code" ||
                      (secondFactor.strategy === "totp" && useBackupCode)
                        ? "Backup code"
                        : "Verification code"}
                    </Text>
                    <TextInput
                      value={secondFactorCode}
                      onChangeText={(text) => {
                        setSecondFactorCode(text);
                        setErrors((prev) => ({ ...prev, code: undefined }));
                      }}
                      placeholder={
                        secondFactor.strategy === "totp" && !useBackupCode
                          ? "6-digit code"
                          : "Enter code"
                      }
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[styles.input, errors.code && styles.inputError]}
                    />
                    {errors.code ? (
                      <Text style={styles.errorText}>{errors.code}</Text>
                    ) : null}
                  </View>

                  {secondFactor.strategy === "totp" &&
                  secondFactor.hasBackupOption ? (
                    <Pressable
                      onPress={() => {
                        setUseBackupCode((v) => !v);
                        setSecondFactorCode("");
                        setErrors((prev) => ({ ...prev, code: undefined }));
                      }}
                      style={styles.backupToggle}
                    >
                      <Text style={styles.backupToggleText}>
                        {useBackupCode
                          ? "Use authenticator code instead"
                          : "Use a backup code instead"}
                      </Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={handleSecondFactorSubmit}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      isSubmitting && styles.buttonDisabled,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0B0F14" />
                    ) : (
                      <Text style={styles.buttonText}>Verify & sign in</Text>
                    )}
                  </Pressable>

                  {secondFactor.strategy === "email_code" ||
                  secondFactor.strategy === "phone_code" ? (
                    <Pressable
                      onPress={handleResendSecondFactor}
                      disabled={isSubmitting}
                      style={styles.textButtonWrap}
                    >
                      <Text style={styles.textButton}>Resend code</Text>
                    </Pressable>
                  ) : null}

                  <Pressable
                    onPress={cancelSecondFactor}
                    disabled={isSubmitting}
                    style={styles.textButtonWrap}
                  >
                    <Text style={styles.textButtonMuted}>Back to email & password</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.form}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[styles.input, errors.email && styles.inputError]}
                    />
                    {errors.email ? (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    ) : null}
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.input,
                        errors.password && styles.inputError,
                      ]}
                    />
                    {errors.password ? (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={handleSignIn}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.button,
                      pressed && styles.buttonPressed,
                      isSubmitting && styles.buttonDisabled,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0B0F14" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </Pressable>
                </View>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Need an account?</Text>
                <Pressable onPress={() => router.push("/sign-up")}>
                  <Text style={styles.footerLink}> Create one</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },

  loading: {
    flex: 1,
    backgroundColor: "#0B0F14",
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },

  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 62,
    paddingBottom: 36,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    color: "#F8FAFC",
    fontSize: 26,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.8,
  },

  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 80,
  },

  card: {
    width: "100%",
    borderRadius: 28,
  },

  eyebrow: {
    color: "#FF6A2A",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  title: {
    color: "#F8FAFC",
    fontSize: 34,
    lineHeight: 40,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.7,
    marginBottom: 12,
  },

  subTitle: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 23,
    fontFamily: "Inter_400Regular",
    marginBottom: 24,
  },

  generalErrorBox: {
    backgroundColor: "rgba(239,68,68,0.13)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.36)",
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
  },

  generalErrorText: {
    color: "#FCA5A5",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_600SemiBold",
  },

  form: {
    gap: 15,
  },

  field: {
    gap: 8,
  },

  label: {
    color: "#E5E7EB",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 16,
    color: "white",
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },

  inputError: {
    borderColor: "rgba(239,68,68,0.5)",
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_500Medium",
  },

  button: {
    width: "100%",
    height: 58,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
    marginTop: 6,
  },

  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#0B0F14",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },

  footer: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  footerText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  footerLink: {
    color: "#F8FAFC",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },

  backupToggle: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },

  backupToggleText: {
    color: "#FF6A2A",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  textButtonWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },

  textButton: {
    color: "#F8FAFC",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },

  textButtonMuted: {
    color: "#94A3B8",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
